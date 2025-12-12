import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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

export default function Appointments() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'appointments'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Appointment[];
      setAppointments(data);
    });

    return () => unsubscribe();
  }, []);

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
      resetForm();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le rendez-vous');
    }
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

  const upcomingAppointments = appointments.filter(a => !a.completed);
  const completedAppointments = appointments.filter(a => a.completed);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rendez-vous</Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={28} color="#C4ABDC" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
                <Text style={styles.statLabel}>À venir</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{completedAppointments.length}</Text>
                <Text style={styles.statLabel}>Complétés</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>À venir</Text>
            {upcomingAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={60} color="#5D3A7D" />
                <Text style={styles.emptyText}>Aucun rendez-vous</Text>
                <Text style={styles.emptySubtext}>Ajoutez votre premier RDV</Text>
              </View>
            ) : (
              upcomingAppointments.map(appointment => (
                <View key={appointment.id} style={styles.appointmentCard}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleToggleCompleted(appointment.id, appointment.completed)}
                  >
                    <View style={styles.checkbox}>
                      {appointment.completed && <Ionicons name="checkmark" size={18} color="#C4ABDC" />}
                    </View>
                  </TouchableOpacity>

                  <View style={[styles.appointmentIconContainer, { backgroundColor: getTypeColor(appointment.type) + '33' }]}>
                    <Ionicons name={getTypeIcon(appointment.type) as any} size={24} color={getTypeColor(appointment.type)} />
                  </View>

                  <View style={styles.appointmentContent}>
                    <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                    <View style={styles.appointmentRow}>
                      <Ionicons name="calendar-outline" size={14} color="#9B88D3" />
                      <Text style={styles.appointmentDetail}>{appointment.date} à {appointment.time}</Text>
                    </View>
                    <View style={styles.appointmentRow}>
                      <Ionicons name="person-outline" size={14} color="#9B88D3" />
                      <Text style={styles.appointmentDetail}>{appointment.doctor}</Text>
                    </View>
                    {appointment.location && (
                      <View style={styles.appointmentRow}>
                        <Ionicons name="location-outline" size={14} color="#9B88D3" />
                        <Text style={styles.appointmentDetail}>{appointment.location}</Text>
                      </View>
                    )}
                    {appointment.reminder && (
                      <View style={styles.reminderBadge}>
                        <Ionicons name="notifications-outline" size={12} color="#876BB8" />
                        <Text style={styles.reminderText}>Rappel activé</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.appointmentActions}>
                    <TouchableOpacity onPress={() => handleEditAppointment(appointment)} style={styles.actionButton}>
                      <Ionicons name="create-outline" size={20} color="#C4ABDC" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteAppointment(appointment.id)} style={styles.actionButton}>
                      <Ionicons name="trash-outline" size={20} color="#FF9AA2" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {completedAppointments.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Complétés</Text>
                {completedAppointments.map(appointment => (
                  <View key={appointment.id} style={[styles.appointmentCard, styles.completedCard]}>
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => handleToggleCompleted(appointment.id, appointment.completed)}
                    >
                      <View style={[styles.checkbox, styles.checkboxCompleted]}>
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>

                    <View style={[styles.appointmentIconContainer, { backgroundColor: getTypeColor(appointment.type) + '33' }]}>
                      <Ionicons name={getTypeIcon(appointment.type) as any} size={24} color={getTypeColor(appointment.type)} />
                    </View>

                    <View style={styles.appointmentContent}>
                      <Text style={[styles.appointmentTitle, styles.completedTitle]}>{appointment.title}</Text>
                      <Text style={styles.appointmentDetail}>{appointment.date}</Text>
                    </View>

                    <TouchableOpacity onPress={() => handleDeleteAppointment(appointment.id)} style={styles.actionButton}>
                      <Ionicons name="trash-outline" size={20} color="#FF9AA2" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
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
                      style={[styles.typeButton, type === t && styles.typeButtonActive]}
                      onPress={() => setType(t)}
                    >
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
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  statValue: { fontSize: 32, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 14, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 4 },
  sectionTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  appointmentCard: { flexDirection: 'row', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)', alignItems: 'flex-start' },
  completedCard: { opacity: 0.6 },
  checkboxContainer: { marginRight: 12, paddingTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C4ABDC', justifyContent: 'center', alignItems: 'center' },
  checkboxCompleted: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  appointmentIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  appointmentContent: { flex: 1 },
  appointmentTitle: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  completedTitle: { textDecorationLine: 'line-through' },
  appointmentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  appointmentDetail: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_400Regular' },
  reminderBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8, gap: 4 },
  reminderText: { color: '#876BB8', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  appointmentActions: { gap: 8, paddingTop: 2 },
  actionButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  typeButtonActive: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  typeText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
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