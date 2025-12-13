import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from './firebaseConfig';

const { width } = Dimensions.get('window');
const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  doctor: string;
  location: string;
  type: string;
  notes: string;
  reminder: boolean;
  completed: boolean;
  createdAt: Date;
}

export default function Calendar() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [doctor, setDoctor] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [reminder, setReminder] = useState(true);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const dueDateStr = docSnap.data().dateAccouchement;
        if (dueDateStr) {
          const parts = dueDateStr.split('/');
          if (parts.length === 3) {
            const parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            setDueDate(parsedDate);
          }
        }
      }
    });

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'appointments'),
      orderBy('date', 'asc')
    );

    const unsubAppointments = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Appointment[];
      setAppointments(data);
    });

    return () => {
      unsubUser();
      unsubAppointments();
    };
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getAppointmentsForDate = (day: number) => {
    const dateStr = `${String(day).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getSelectedDateAppointments = () => {
    const dateStr = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && 
           currentDate.getMonth() === selectedDate.getMonth() && 
           currentDate.getFullYear() === selectedDate.getFullYear();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const handleSaveAppointment = async () => {
    if (!auth.currentUser) return;

    if (!title.trim() || !date.trim() || !time.trim() || !doctor.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
      return;
    }

    const appointmentData = {
      title,
      date,
      time,
      doctor,
      location,
      type,
      notes,
      reminder,
      completed: false,
      createdAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'appointments', editingId), appointmentData);
        Alert.alert('Succès', 'Rendez-vous modifié');
      } else {
        await addDoc(collection(db, 'users', auth.currentUser.uid, 'appointments'), appointmentData);
        Alert.alert('Succès', 'Rendez-vous ajouté');
      }
      
      
      await updateNextAppointment();
      
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le rendez-vous');
    }
  };

  const updateNextAppointment = async () => {
    if (!auth.currentUser) return;
    
    try {
      
      const upcomingAppts = appointments.filter(a => !a.completed);
      
      if (upcomingAppts.length === 0) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          nextAppointment: 'Aucun rendez-vous prévu'
        });
        return;
      }
      
      
      const sortedAppts = upcomingAppts.sort((a, b) => {
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      const nextAppt = sortedAppts[0];
      const nextApptText = `${nextAppt.title} - ${nextAppt.date} à ${nextAppt.time}`;
      
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        nextAppointment: nextApptText
      });
    } catch (error) {
      console.error('Erreur mise à jour nextAppointment:', error);
    }
  };

  const parseDate = (dateStr: string) => {
    
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  };

  const handleDeleteAppointment = (id: string) => {
    Alert.alert('Confirmation', 'Supprimer ce rendez-vous ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'appointments', id));
            Alert.alert('Succès', 'Rendez-vous supprimé');
            setTimeout(() => updateNextAppointment(), 500);
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const handleToggleCompleted = async (id: string, currentStatus: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'appointments', id), {
        completed: !currentStatus,
      });
      
      setTimeout(() => updateNextAppointment(), 500);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingId(appointment.id);
    setTitle(appointment.title);
    setDate(appointment.date);
    setTime(appointment.time);
    setDoctor(appointment.doctor);
    setLocation(appointment.location);
    setType(appointment.type);
    setNotes(appointment.notes);
    setReminder(appointment.reminder);
    setModalVisible(true);
  };

  const handleQuickAdd = () => {
    const dateStr = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;
    resetForm();
    setDate(dateStr);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDate('');
    setTime('');
    setDoctor('');
    setLocation('');
    setType('consultation');
    setNotes('');
    setReminder(true);
  };

  const getDaysUntilDue = () => {
    if (!dueDate) return null;
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'échographie': return 'scan-outline';
      case 'consultation': return 'medical-outline';
      case 'analyse': return 'flask-outline';
      default: return 'calendar-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'échographie': return '#C4ABDC';
      case 'consultation': return '#9B88D3';
      case 'analyse': return '#FFB5E8';
      default: return '#876BB8';
    }
  };

  const days = getDaysInMonth(currentDate);
  const selectedDateAppointments = getSelectedDateAppointments();
  const daysUntilDue = getDaysUntilDue();

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendrier</Text>
          <TouchableOpacity onPress={handleQuickAdd} style={styles.addButton}>
            <Ionicons name="add" size={28} color="#C4ABDC" />
          </TouchableOpacity>
        </View>

        {daysUntilDue !== null && daysUntilDue >= 0 && (
          <View style={styles.countdownCard}>
            <View style={styles.countdownIcon}>
              <Ionicons name="heart-outline" size={24} color="#FFB5E8" />
            </View>
            <View style={styles.countdownInfo}>
              <Text style={styles.countdownNumber}>{daysUntilDue}</Text>
              <Text style={styles.countdownLabel}>jours avant l'accouchement</Text>
            </View>
          </View>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.monthButton}>
                  <Ionicons name="chevron-back" size={24} color="#C4ABDC" />
                </TouchableOpacity>
                <Text style={styles.monthYear}>
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
                  <Ionicons name="chevron-forward" size={24} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <View style={styles.daysHeader}>
                {DAYS.map((day, idx) => (
                  <Text key={idx} style={styles.dayName}>{day}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {days.map((day, idx) => {
                  if (day === null) {
                    return <View key={idx} style={styles.emptyDay} />;
                  }

                  const dayAppointments = getAppointmentsForDate(day);
                  const hasAppointments = dayAppointments.length > 0;
                  const isTodayDate = isToday(day);
                  const isSelectedDate = isSelected(day);

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dayCell,
                        isTodayDate && styles.todayCell,
                        isSelectedDate && styles.selectedCell,
                      ]}
                      onPress={() => handleDateSelect(day)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dayNumber,
                        isTodayDate && styles.todayNumber,
                        isSelectedDate && styles.selectedNumber,
                      ]}>
                        {day}
                      </Text>
                      {hasAppointments && (
                        <View style={styles.appointmentDots}>
                          {dayAppointments.slice(0, 3).map((apt, i) => (
                            <View 
                              key={i} 
                              style={[styles.appointmentDot, { backgroundColor: getTypeColor(apt.type) }]} 
                            />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.selectedDateHeader}>
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateDay}>
                  {selectedDate.getDate()}
                </Text>
                <View>
                  <Text style={styles.selectedDateMonth}>
                    {MONTHS[selectedDate.getMonth()]}
                  </Text>
                  <Text style={styles.selectedDateYear}>
                    {selectedDate.getFullYear()}
                  </Text>
                </View>
              </View>
              <View style={styles.selectedDateStats}>
                <Text style={styles.selectedDateCount}>
                  {selectedDateAppointments.length}
                </Text>
                <Text style={styles.selectedDateCountLabel}>RDV</Text>
              </View>
            </View>

            {selectedDateAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={50} color="#5D3A7D" />
                <Text style={styles.emptyText}>Aucun rendez-vous</Text>
                <TouchableOpacity style={styles.addQuickButton} onPress={handleQuickAdd}>
                  <Text style={styles.addQuickButtonText}>Ajouter un RDV</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedDateAppointments.map(appointment => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <View style={[styles.appointmentColor, { backgroundColor: getTypeColor(appointment.type) }]} />
                  
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentHeader}>
                      <View style={[styles.appointmentIcon, { backgroundColor: getTypeColor(appointment.type) + '33' }]}>
                        <Ionicons name={getTypeIcon(appointment.type) as any} size={20} color={getTypeColor(appointment.type)} />
                      </View>
                      <View style={styles.appointmentHeaderText}>
                        <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                        <Text style={styles.appointmentTime}>
                          <Ionicons name="time-outline" size={14} color="#9B88D3" /> {appointment.time}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => handleToggleCompleted(appointment.id, appointment.completed)}
                      >
                        <View style={[styles.checkbox, appointment.completed && styles.checkboxCompleted]}>
                          {appointment.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.appointmentDetails}>
                      <View style={styles.appointmentDetail}>
                        <Ionicons name="person-outline" size={14} color="#9B88D3" />
                        <Text style={styles.appointmentDetailText}>{appointment.doctor}</Text>
                      </View>
                      {appointment.location && (
                        <View style={styles.appointmentDetail}>
                          <Ionicons name="location-outline" size={14} color="#9B88D3" />
                          <Text style={styles.appointmentDetailText}>{appointment.location}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.appointmentActions}>
                      <TouchableOpacity
                        style={styles.appointmentActionButton}
                        onPress={() => handleEditAppointment(appointment)}
                      >
                        <Ionicons name="create-outline" size={18} color="#C4ABDC" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.appointmentActionButton}
                        onPress={() => handleDeleteAppointment(appointment.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FF9AA2" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Modifier' : 'Nouveau rendez-vous'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Titre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Échographie du 2ème trimestre"
                  placeholderTextColor="#9B88D3"
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={styles.inputLabel}>Type de rendez-vous *</Text>
                <View style={styles.typeSelector}>
                  {['consultation', 'échographie', 'analyse'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeButton, type === t && { backgroundColor: getTypeColor(t) }]}
                      onPress={() => setType(t)}
                    >
                      <Ionicons name={getTypeIcon(t) as any} size={18} color={type === t ? '#1B0E20' : getTypeColor(t)} />
                      <Text style={[styles.typeText, type === t && styles.typeTextActive]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="JJ/MM/AAAA"
                  placeholderTextColor="#9B88D3"
                  value={date}
                  onChangeText={setDate}
                />

                <Text style={styles.inputLabel}>Heure *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor="#9B88D3"
                  value={time}
                  onChangeText={setTime}
                />

                <Text style={styles.inputLabel}>Médecin *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dr. Nom"
                  placeholderTextColor="#9B88D3"
                  value={doctor}
                  onChangeText={setDoctor}
                />

                <Text style={styles.inputLabel}>Lieu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse du cabinet"
                  placeholderTextColor="#9B88D3"
                  value={location}
                  onChangeText={setLocation}
                />

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Notes supplémentaires..."
                  placeholderTextColor="#9B88D3"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity style={styles.reminderToggle} onPress={() => setReminder(!reminder)}>
                  <View style={styles.reminderToggleLeft}>
                    <Ionicons name="notifications-outline" size={20} color="#C4ABDC" />
                    <Text style={styles.reminderToggleText}>Activer le rappel</Text>
                  </View>
                  <View style={[styles.toggle, reminder && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, reminder && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAppointment}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>{editingId ? 'Modifier' : 'Enregistrer'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B0E20' },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  countdownCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,181,232,0.15)', borderRadius: 16, padding: 16, marginHorizontal: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,181,232,0.3)' },
  countdownIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,181,232,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  countdownInfo: { flex: 1 },
  countdownNumber: { fontSize: 32, color: '#FFB5E8', fontFamily: 'Poppins_700Bold' },
  countdownLabel: { fontSize: 14, color: '#FFB5E8', fontFamily: 'Poppins_400Regular' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  calendarCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthButton: { padding: 8 },
  monthYear: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  dayName: { width: (width - 80) / 7, textAlign: 'center', color: '#9B88D3', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyDay: { width: (width - 80) / 7, height: 48 },
  dayCell: { width: (width - 80) / 7, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 4 },
  todayCell: { backgroundColor: 'rgba(196,171,220,0.2)' },
  selectedCell: { backgroundColor: '#C4ABDC' },
  dayNumber: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  todayNumber: { color: '#C4ABDC', fontFamily: 'Poppins_700Bold' },
  selectedNumber: { color: '#1B0E20', fontFamily: 'Poppins_700Bold' },
  appointmentDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  appointmentDot: { width: 4, height: 4, borderRadius: 2 },
  selectedDateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  selectedDateInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedDateDay: { fontSize: 40, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  selectedDateMonth: { fontSize: 16, color: '#C4ABDC', fontFamily: 'Poppins_600SemiBold' },
  selectedDateYear: { fontSize: 13, color: '#9B88D3', fontFamily: 'Poppins_400Regular' },
  selectedDateStats: { alignItems: 'center' },
  selectedDateCount: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  selectedDateCountLabel: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginTop: 12, marginBottom: 16 },
  addQuickButton: { backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  addQuickButtonText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  appointmentCard: { flexDirection: 'row', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  appointmentColor: { width: 4 },
  appointmentContent: { flex: 1, padding: 16 },
  appointmentHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  appointmentIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  appointmentHeaderText: { flex: 1 },
  appointmentTitle: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', marginBottom: 4 },
  appointmentTime: { fontSize: 13, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  checkboxContainer: { padding: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C4ABDC', justifyContent: 'center', alignItems: 'center' },
  checkboxCompleted: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  appointmentDetails: { marginBottom: 12, gap: 6 },
  appointmentDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appointmentDetailText: { fontSize: 13, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  appointmentActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(196,171,220,0.2)', paddingTop: 12 },
  appointmentActionButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  typeButton: { flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', gap: 6, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  typeText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
  typeTextActive: { color: '#1B0E20' },
  reminderToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  reminderToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reminderToggleText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'rgba(196,171,220,0.3)', padding: 2, justifyContent: 'center' },
  toggleActive: { backgroundColor: '#C4ABDC' },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});