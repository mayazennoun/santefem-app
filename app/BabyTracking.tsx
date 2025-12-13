import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
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

interface Measurement {
  id: string;
  date: Date;
  week: number;
  weight: number;
  height: number;
  headCircumference: number;
  abdominalCircumference: number;
  femurlength: number;
  notes: string;
  ultrasound: boolean;
  createdAt: Date;
}

interface KickCount {
  id: string;
  date: Date;
  time: string;
  count: number;
  duration: number;
  notes: string;
  createdAt: Date;
}

export default function BabyTracking() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [kickCounts, setKickCounts] = useState<KickCount[]>([]);
  const [selectedTab, setSelectedTab] = useState<'growth' | 'kicks'>('growth');
  const [modalVisible, setModalVisible] = useState(false);
  const [kickModalVisible, setKickModalVisible] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(24);
  const [currentWeight, setCurrentWeight] = useState(0);

  // Form states for measurements
  const [week, setWeek] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [headCircumference, setHeadCircumference] = useState('');
  const [abdominalCircumference, setAbdominalCircumference] = useState('');
  const [femurLength, setFemurLength] = useState('');
  const [notes, setNotes] = useState('');
  const [ultrasound, setUltrasound] = useState(false);

  
  const [kickTime, setKickTime] = useState('');
  const [kickCount, setKickCount] = useState('');
  const [kickDuration, setKickDuration] = useState('');
  const [kickNotes, setKickNotes] = useState('');

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubUser = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentWeek(Number(data.semaineGrossesse) || 24);
        setCurrentWeight(Number(data.poidsBebe) || 0);
      }
    });

    
    const qMeasurements = query(
      collection(db, 'users', auth.currentUser.uid, 'baby_measurements'),
      orderBy('createdAt', 'desc')
    );

    const unsubMeasurements = onSnapshot(qMeasurements, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Measurement[];
      setMeasurements(data);
    });

    
    const qKicks = query(
      collection(db, 'users', auth.currentUser.uid, 'kick_counts'),
      orderBy('createdAt', 'desc')
    );

    const unsubKicks = onSnapshot(qKicks, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as KickCount[];
      setKickCounts(data);
    });

    return () => {
      unsubUser();
      unsubMeasurements();
      unsubKicks();
    };
  }, []);

  const handleAddMeasurement = async () => {
    if (!auth.currentUser) return;

    if (!week || !weight) {
      Alert.alert('Erreur', 'Veuillez remplir au moins la semaine et le poids');
      return;
    }

    const measurementData = {
      week: parseInt(week),
      weight: parseFloat(weight),
      height: height ? parseFloat(height) : 0,
      headCircumference: headCircumference ? parseFloat(headCircumference) : 0,
      abdominalCircumference: abdominalCircumference ? parseFloat(abdominalCircumference) : 0,
      femurlength: femurLength ? parseFloat(femurLength) : 0,
      notes,
      ultrasound,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'baby_measurements'), measurementData);
      resetMeasurementForm();
      setModalVisible(false);
      Alert.alert('Succès', 'Mesure ajoutée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la mesure');
    }
  };

  const handleAddKick = async () => {
    if (!auth.currentUser) return;

    if (!kickTime || !kickCount) {
      Alert.alert('Erreur', 'Veuillez remplir l\'heure et le nombre de coups');
      return;
    }

    const kickData = {
      time: kickTime,
      count: parseInt(kickCount),
      duration: kickDuration ? parseInt(kickDuration) : 0,
      notes: kickNotes,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'kick_counts'), kickData);
      resetKickForm();
      setKickModalVisible(false);
      Alert.alert('Succès', 'Mouvements enregistrés');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer');
    }
  };

  const handleDeleteMeasurement = (id: string) => {
    Alert.alert('Confirmation', 'Supprimer cette mesure ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'baby_measurements', id));
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const handleDeleteKick = (id: string) => {
    Alert.alert('Confirmation', 'Supprimer cet enregistrement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', auth.currentUser!.uid, 'kick_counts', id));
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer');
          }
        },
      },
    ]);
  };

  const resetMeasurementForm = () => {
    setWeek('');
    setWeight('');
    setHeight('');
    setHeadCircumference('');
    setAbdominalCircumference('');
    setFemurLength('');
    setNotes('');
    setUltrasound(false);
  };

  const resetKickForm = () => {
    setKickTime('');
    setKickCount('');
    setKickDuration('');
    setKickNotes('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getAverageKicksPerDay = () => {
    if (kickCounts.length === 0) return 0;
    const total = kickCounts.reduce((sum, k) => sum + k.count, 0);
    const uniqueDates = new Set(kickCounts.map(k => k.date.toDateString())).size;
    return Math.round(total / uniqueDates);
  };

  const getTodayKicks = () => {
    const today = new Date().toDateString();
    return kickCounts
      .filter(k => k.date.toDateString() === today)
      .reduce((sum, k) => sum + k.count, 0);
  };

  const getWeightGrowth = () => {
    if (measurements.length < 2) return 0;
    const sorted = [...measurements].sort((a, b) => a.week - b.week);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return ((last.weight - first.weight) / first.weight * 100).toFixed(1);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suivi Bébé</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="body-outline" size={24} color="#C4ABDC" />
            <Text style={styles.statValue}>{currentWeight.toFixed(2)} kg</Text>
            <Text style={styles.statLabel}>Poids estimé S{currentWeek}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="pulse-outline" size={24} color="#FFB5E8" />
            <Text style={styles.statValue}>{getTodayKicks()}</Text>
            <Text style={styles.statLabel}>Coups aujourd'hui</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={24} color="#9B88D3" />
            <Text style={styles.statValue}>{getWeightGrowth()}%</Text>
            <Text style={styles.statLabel}>Croissance</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'growth' && styles.tabActive]}
            onPress={() => setSelectedTab('growth')}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics-outline" size={20} color={selectedTab === 'growth' ? '#1B0E20' : '#C4ABDC'} />
            <Text style={[styles.tabText, selectedTab === 'growth' && styles.tabTextActive]}>Croissance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'kicks' && styles.tabActive]}
            onPress={() => setSelectedTab('kicks')}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={20} color={selectedTab === 'kicks' ? '#1B0E20' : '#C4ABDC'} />
            <Text style={[styles.tabText, selectedTab === 'kicks' && styles.tabTextActive]}>Mouvements</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {selectedTab === 'growth' ? (
              <>
                {measurements.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="analytics-outline" size={60} color="#5D3A7D" />
                    <Text style={styles.emptyText}>Aucune mesure</Text>
                    <Text style={styles.emptySubtext}>Ajoutez les mesures de vos échographies</Text>
                  </View>
                ) : (
                  measurements.map(measurement => (
                    <View key={measurement.id} style={styles.measurementCard}>
                      <View style={styles.measurementHeader}>
                        <View style={styles.measurementHeaderLeft}>
                          <View style={[styles.measurementIcon, { backgroundColor: measurement.ultrasound ? '#C4ABDC33' : '#9B88D333' }]}>
                            <Ionicons 
                              name={measurement.ultrasound ? "scan-outline" : "body-outline"} 
                              size={24} 
                              color={measurement.ultrasound ? '#C4ABDC' : '#9B88D3'} 
                            />
                          </View>
                          <View>
                            <Text style={styles.measurementWeek}>Semaine {measurement.week}</Text>
                            <Text style={styles.measurementDate}>{formatDate(measurement.date)}</Text>
                          </View>
                        </View>
                        {measurement.ultrasound && (
                          <View style={styles.ultrasoundBadge}>
                            <Text style={styles.ultrasoundBadgeText}>Échographie</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.measurementsGrid}>
                        {measurement.weight > 0 && (
                          <View style={styles.measurementItem}>
                            <Ionicons name="barbell-outline" size={18} color="#C4ABDC" />
                            <Text style={styles.measurementLabel}>Poids</Text>
                            <Text style={styles.measurementValue}>{measurement.weight} kg</Text>
                          </View>
                        )}
                        {measurement.height > 0 && (
                          <View style={styles.measurementItem}>
                            <Ionicons name="resize-outline" size={18} color="#FFB5E8" />
                            <Text style={styles.measurementLabel}>Taille</Text>
                            <Text style={styles.measurementValue}>{measurement.height} cm</Text>
                          </View>
                        )}
                        {measurement.headCircumference > 0 && (
                          <View style={styles.measurementItem}>
                            <Ionicons name="ellipse-outline" size={18} color="#9B88D3" />
                            <Text style={styles.measurementLabel}>Périmètre crânien</Text>
                            <Text style={styles.measurementValue}>{measurement.headCircumference} cm</Text>
                          </View>
                        )}
                        {measurement.abdominalCircumference > 0 && (
                          <View style={styles.measurementItem}>
                            <Ionicons name="radio-button-off-outline" size={18} color="#876BB8" />
                            <Text style={styles.measurementLabel}>Périmètre abdominal</Text>
                            <Text style={styles.measurementValue}>{measurement.abdominalCircumference} cm</Text>
                          </View>
                        )}
                        {measurement.femurlength > 0 && (
                          <View style={styles.measurementItem}>
                            <Ionicons name="remove-outline" size={18} color="#BBA0E8" />
                            <Text style={styles.measurementLabel}>Longueur fémur</Text>
                            <Text style={styles.measurementValue}>{measurement.femurlength} cm</Text>
                          </View>
                        )}
                      </View>

                      {measurement.notes && (
                        <View style={styles.notesSection}>
                          <Text style={styles.notesLabel}>Notes:</Text>
                          <Text style={styles.notesText}>{measurement.notes}</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteMeasurement(measurement.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FF9AA2" />
                        <Text style={styles.deleteButtonText}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            ) : (
              <>
                {kickCounts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={60} color="#5D3A7D" />
                    <Text style={styles.emptyText}>Aucun mouvement</Text>
                    <Text style={styles.emptySubtext}>Commencez à compter les coups de pieds</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.kickStatsCard}>
                      <Text style={styles.kickStatsTitle}>📊 Statistiques</Text>
                      <View style={styles.kickStatsRow}>
                        <View style={styles.kickStatItem}>
                          <Text style={styles.kickStatValue}>{getAverageKicksPerDay()}</Text>
                          <Text style={styles.kickStatLabel}>Moyenne/jour</Text>
                        </View>
                        <View style={styles.kickStatDivider} />
                        <View style={styles.kickStatItem}>
                          <Text style={styles.kickStatValue}>{kickCounts.length}</Text>
                          <Text style={styles.kickStatLabel}>Sessions</Text>
                        </View>
                      </View>
                    </View>

                    {kickCounts.map(kick => (
                      <View key={kick.id} style={styles.kickCard}>
                        <View style={styles.kickHeader}>
                          <View style={styles.kickIcon}>
                            <Ionicons name="heart" size={24} color="#FFB5E8" />
                          </View>
                          <View style={styles.kickHeaderInfo}>
                            <Text style={styles.kickCount}>{kick.count} coups</Text>
                            <Text style={styles.kickTime}>{formatDate(kick.date)} • {kick.time}</Text>
                          </View>
                          <TouchableOpacity onPress={() => handleDeleteKick(kick.id)}>
                            <Ionicons name="trash-outline" size={20} color="#FF9AA2" />
                          </TouchableOpacity>
                        </View>
                        {kick.duration > 0 && (
                          <View style={styles.kickDetail}>
                            <Ionicons name="time-outline" size={16} color="#9B88D3" />
                            <Text style={styles.kickDetailText}>Durée: {kick.duration} min</Text>
                          </View>
                        )}
                        {kick.notes && (
                          <Text style={styles.kickNotes}>{kick.notes}</Text>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => selectedTab === 'growth' ? setModalVisible(true) : setKickModalVisible(true)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#BBA0E8', '#9B88D3', '#876BB8']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Modal Mesures */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle mesure</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Semaine de grossesse *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 24"
                  placeholderTextColor="#9B88D3"
                  keyboardType="numeric"
                  value={week}
                  onChangeText={setWeek}
                />

                <Text style={styles.inputLabel}>Poids estimé (kg) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 0.6"
                  placeholderTextColor="#9B88D3"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />

                <Text style={styles.inputLabel}>Taille (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30"
                  placeholderTextColor="#9B88D3"
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={setHeight}
                />

                <Text style={styles.inputLabel}>Périmètre crânien (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 22"
                  placeholderTextColor="#9B88D3"
                  keyboardType="decimal-pad"
                  value={headCircumference}
                  onChangeText={setHeadCircumference}
                />

                <Text style={styles.inputLabel}>Périmètre abdominal (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 20"
                  placeholderTextColor="#9B88D3"
                  keyboardType="decimal-pad"
                  value={abdominalCircumference}
                  onChangeText={setAbdominalCircumference}
                />

                <Text style={styles.inputLabel}>Longueur du fémur (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 4.5"
                  placeholderTextColor="#9B88D3"
                  keyboardType="decimal-pad"
                  value={femurLength}
                  onChangeText={setFemurLength}
                />

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Observations du médecin..."
                  placeholderTextColor="#9B88D3"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity style={styles.ultrasoundToggle} onPress={() => setUltrasound(!ultrasound)}>
                  <View style={styles.ultrasoundToggleLeft}>
                    <Ionicons name="scan-outline" size={20} color="#C4ABDC" />
                    <Text style={styles.ultrasoundToggleText}>Échographie</Text>
                  </View>
                  <View style={[styles.toggle, ultrasound && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, ultrasound && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddMeasurement}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal Coups */}
        <Modal visible={kickModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Compter les mouvements</Text>
                <TouchableOpacity onPress={() => setKickModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Heure *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor="#9B88D3"
                  value={kickTime}
                  onChangeText={setKickTime}
                />

                <Text style={styles.inputLabel}>Nombre de coups *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10"
                  placeholderTextColor="#9B88D3"
                  keyboardType="numeric"
                  value={kickCount}
                  onChangeText={setKickCount}
                />

                <Text style={styles.inputLabel}>Durée (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 30"
                  placeholderTextColor="#9B88D3"
                  keyboardType="numeric"
                  value={kickDuration}
                  onChangeText={setKickDuration}
                />

                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Remarques..."
                  placeholderTextColor="#9B88D3"
                  multiline
                  numberOfLines={4}
                  value={kickNotes}
                  onChangeText={setKickNotes}
                />

                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color="#9B88D3" />
                  <Text style={styles.infoText}>
                    💡 Comptez 10 mouvements en moins de 2 heures. Si vous remarquez une diminution, consultez votre médecin.
                  </Text>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddKick}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
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
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  statValue: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 4, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', gap: 8, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  tabActive: { backgroundColor: '#C4ABDC' },
  tabText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  tabTextActive: { color: '#1B0E20' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 100 },
emptyState: { alignItems: 'center', paddingVertical: 60 },
emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8, textAlign: 'center' },
measurementCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
measurementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
measurementHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
measurementIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
measurementWeek: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
measurementDate: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular', marginTop: 2 },
ultrasoundBadge: { backgroundColor: 'rgba(196,171,220,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
ultrasoundBadgeText: { color: '#C4ABDC', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
measurementsGrid: { gap: 12, marginBottom: 16 },
measurementItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.08)', padding: 12, borderRadius: 12, gap: 10 },
measurementLabel: { flex: 1, fontSize: 13, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
measurementValue: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
notesSection: { backgroundColor: 'rgba(196,171,220,0.08)', padding: 12, borderRadius: 12, marginBottom: 12 },
notesLabel: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_600SemiBold', marginBottom: 6 },
notesText: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', lineHeight: 20 },
deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(196,171,220,0.2)', marginTop: 4 },
deleteButtonText: { color: '#FF9AA2', fontSize: 13, fontFamily: 'Poppins_600SemiBold' },
kickStatsCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
kickStatsTitle: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 16 },
kickStatsRow: { flexDirection: 'row', alignItems: 'center' },
kickStatItem: { flex: 1, alignItems: 'center' },
kickStatValue: { fontSize: 32, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
kickStatLabel: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 4 },
kickStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(196,171,220,0.3)' },
kickCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
kickHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
kickIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,181,232,0.2)', justifyContent: 'center', alignItems: 'center' },
kickHeaderInfo: { flex: 1 },
kickCount: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
kickTime: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular', marginTop: 2 },
kickDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
kickDetailText: { fontSize: 13, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
kickNotes: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', fontStyle: 'italic', backgroundColor: 'rgba(196,171,220,0.08)', padding: 10, borderRadius: 10 },
fab: { position: 'absolute', right: 24, bottom: 24, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '85%' },
modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
textArea: { height: 100, textAlignVertical: 'top' },
ultrasoundToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, marginTop: 24, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
ultrasoundToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
ultrasoundToggleText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: 'rgba(196,171,220,0.3)', padding: 2, justifyContent: 'center' },
toggleActive: { backgroundColor: '#C4ABDC' },
toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
toggleThumbActive: { alignSelf: 'flex-end' },
infoCard: { flexDirection: 'row', backgroundColor: 'rgba(155,136,211,0.15)', borderRadius: 12, padding: 14, marginTop: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(155,136,211,0.3)' },
infoText: { flex: 1, color: '#C4ABDC', fontSize: 12, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});