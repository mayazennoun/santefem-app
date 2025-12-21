import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
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
import { LineChart } from 'react-native-chart-kit';
import { auth, db } from './firebaseConfig';

const { width } = Dimensions.get('window');

interface WeightRecord {
  id: string;
  weight: number;
  date: Date;
  createdAt: Date;
}

export default function WeightTracking() {
  const router = useRouter();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [poidsAvantGrossesse, setPoidsAvantGrossesse] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(0);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPoidsAvantGrossesse(Number(data.poidsAvantGrossesse) || 0);
        setCurrentWeight(Number(data.poids) || 0);
      }
    });

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'weight_records'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        weight: doc.data().weight,
        date: doc.data().createdAt?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as WeightRecord[];
      setRecords(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAddWeight = async () => {
    if (!auth.currentUser) return;

    const weight = parseFloat(newWeight);
    if (!weight || weight <= 0 || weight > 200) {
      Alert.alert('Erreur', 'Veuillez entrer un poids valide');
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'weight_records'), {
        weight,
        createdAt: new Date(),
      });

      setNewWeight('');
      setModalVisible(false);
      Alert.alert('Succès', 'Pesée enregistrée');
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'ajouter la pesée");
    }
  };

  const calculateGain = () => {
    return currentWeight > 0 ? (currentWeight - poidsAvantGrossesse).toFixed(1) : '0.0';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const formatDateShort = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  const chartData = {
    labels: [
      'Début',
      ...records.slice(-5).map(r => formatDateShort(r.date))
    ],
    datasets: [
      {
        data: [
          poidsAvantGrossesse,
          ...records.slice(-5).map(r => r.weight)
        ],
        color: (opacity = 1) => `rgba(196, 171, 220, ${opacity})`,
        strokeWidth: 3,
      },
    ],
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
          <Text style={styles.headerTitle}>Suivi du Poids</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#C4ABDC" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="trending-up-outline" size={28} color="#C4ABDC" />
                <Text style={styles.statValue}>+{calculateGain()} kg</Text>
                <Text style={styles.statLabel}>Prise de poids</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="fitness-outline" size={28} color="#9B88D3" />
                <Text style={styles.statValue}>{currentWeight} kg</Text>
                <Text style={styles.statLabel}>Poids actuel</Text>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Évolution</Text>
              {records.length > 0 ? (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={chartData}
                    width={width - 80}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#2A1A35',
                      backgroundGradientFrom: '#2A1A35',
                      backgroundGradientTo: '#1B0E20',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(196, 171, 220, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(196, 171, 220, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '8',
                        strokeWidth: '3',
                        stroke: '#C4ABDC',
                        fill: '#FFFFFF',
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '5,5',
                        stroke: 'rgba(196,171,220,0.2)',
                        strokeWidth: 1,
                      },
                      propsForLabels: {
                        fontSize: 12,
                        fontFamily: 'Poppins_400Regular',
                      },
                    }}
                    bezier
                    style={{
                      marginVertical: 8,
                      borderRadius: 16,
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    withDots={true}
                    withShadow={true}
                    fromZero={false}
                    segments={4}
                  />
                </View>
              ) : (
                <View style={styles.emptyChart}>
                  <Ionicons name="analytics-outline" size={50} color="#5D3A7D" />
                  <Text style={styles.emptyChartText}>Ajoutez des pesées pour voir l'évolution</Text>
                </View>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historique</Text>
              <Text style={styles.sectionCount}>{records.length}</Text>
            </View>

            {records.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="scale-outline" size={60} color="#5D3A7D" />
                <Text style={styles.emptyText}>Aucune pesée enregistrée</Text>
                <Text style={styles.emptySubtext}>Ajoutez votre première pesée</Text>
              </View>
            ) : (
              records
                .slice()
                .reverse()
                .map(record => {
                  const gain = (record.weight - poidsAvantGrossesse).toFixed(1);
                  return (
                    <View key={record.id} style={styles.recordCard}>
                      <View style={styles.recordIcon}>
                        <Ionicons name="scale-outline" size={24} color="#C4ABDC" />
                      </View>
                      <View style={styles.recordContent}>
                        <Text style={styles.recordWeight}>{record.weight} kg</Text>
                        <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                      </View>
                      <View style={styles.recordGain}>
                        <Text style={styles.gainText}>
                          {Number(gain) > 0 ? '+' : ''}
                          {gain} kg
                        </Text>
                      </View>
                    </View>
                  );
                })
            )}
          </View>
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle pesée</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Poids actuel (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 68.5"
                    placeholderTextColor="#9B88D3"
                    keyboardType="decimal-pad"
                    value={newWeight}
                    onChangeText={setNewWeight}
                  />
                </View>

                <View style={styles.infoCard}>
                  <Ionicons name="information-circle-outline" size={20} color="#C4ABDC" />
                  <Text style={styles.infoText}>
                    Votre poids avant grossesse : {poidsAvantGrossesse} kg
                  </Text>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddWeight}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196,171,220,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(196,171,220,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.2)',
  },
  statValue: { color: '#FFFFFF', fontSize: 24, fontFamily: 'Poppins_700Bold', marginTop: 8 },
  statLabel: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4, textAlign: 'center' },
  chartCard: {
    backgroundColor: 'rgba(196,171,220,0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.2)',
  },
  chartTitle: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_700Bold', marginBottom: 16 },
  chartWrapper: {
    backgroundColor: '#2A1A35',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  emptyChart: { alignItems: 'center', paddingVertical: 40 },
  emptyChartText: { color: '#9B88D3', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 12, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  sectionCount: { fontSize: 16, color: '#C4ABDC', fontFamily: 'Poppins_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.2)',
  },
  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(196,171,220,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordContent: { flex: 1 },
  recordWeight: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_700Bold' },
  recordDate: { color: '#9B88D3', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  recordGain: {
    backgroundColor: 'rgba(196,171,220,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gainText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#2A1A35',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalBody: { paddingHorizontal: 24 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(196,171,220,0.3)',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196,171,220,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_400Regular', flex: 1 },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});