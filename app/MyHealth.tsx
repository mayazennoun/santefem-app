import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

interface HealthRecord {
  id: string;
  date: Date;
  type: 'symptom' | 'contraction' | 'mood' | 'pressure';
  symptomType?: string;
  intensity?: number;
  duration?: number;
  frequency?: string;
  systolic?: number;
  diastolic?: number;
  moodType?: string;
  notes?: string;
}

export default function MyHealth() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'symptom' | 'contraction' | 'mood' | 'pressure'>('symptom');
  
  const [symptomType, setSymptomType] = useState('');
  const [intensity, setIntensity] = useState(3);
  const [duration, setDuration] = useState('');
  const [frequency, setFrequency] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [moodType, setMoodType] = useState('');
  const [notes, setNotes] = useState('');

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'health_records'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() || new Date(),
      })) as HealthRecord[];
      setRecords(data);
    });

    return () => unsubscribe();
  }, []);

  const handleAddRecord = async () => {
    if (!auth.currentUser) return;

    const baseRecord: Record<string, any> = {
      type: selectedType,
      createdAt: new Date(),
      date: new Date(),
    };

    let recordData: Record<string, any> = { ...baseRecord };

    if (selectedType === 'symptom') {
      if (!symptomType.trim()) {
        Alert.alert(t('common.error'), t('myHealth.enterSymptom'));
        return;
      }
      recordData = { ...recordData, symptomType, intensity, notes };
    } else if (selectedType === 'contraction') {
      if (!duration || !frequency) {
        Alert.alert(t('common.error'), t('myHealth.enterDurationFrequency'));
        return;
      }
      recordData = { ...recordData, duration: parseInt(duration), frequency, notes };
    } else if (selectedType === 'mood') {
      if (!moodType.trim()) {
        Alert.alert(t('common.error'), t('myHealth.enterMood'));
        return;
      }
      recordData = { ...recordData, moodType, notes };
    } else if (selectedType === 'pressure') {
      if (!systolic || !diastolic) {
        Alert.alert(t('common.error'), t('myHealth.enterPressure'));
        return;
      }
      recordData = { ...recordData, systolic: parseInt(systolic), diastolic: parseInt(diastolic), notes };
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'health_records'), recordData);
      resetForm();
      setModalVisible(false);
      Alert.alert(t('common.success'), t('myHealth.recordAdded'));
    } catch (error) {
      Alert.alert(t('common.error'), t('myHealth.cannotAdd'));
    }
  };

  const resetForm = () => {
    setSymptomType('');
    setIntensity(3);
    setDuration('');
    setFrequency('');
    setSystolic('');
    setDiastolic('');
    setMoodType('');
    setNotes('');
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'symptom': return 'medical-outline';
      case 'contraction': return 'pulse-outline';
      case 'mood': return 'happy-outline';
      case 'pressure': return 'heart-outline';
      default: return 'ellipse-outline';
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'symptom': return '#FFB5E8';
      case 'contraction': return '#C4ABDC';
      case 'mood': return '#9B88D3';
      case 'pressure': return '#FF9AA2';
      default: return '#C4ABDC';
    }
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getModalTitle = () => {
    switch (selectedType) {
      case 'symptom': return t('myHealth.addSymptom');
      case 'contraction': return t('myHealth.addContraction');
      case 'mood': return t('myHealth.addMood');
      case 'pressure': return t('myHealth.addPressure');
      default: return '';
    }
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
          <Text style={styles.headerTitle}>{t('myHealth.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.quickActionsGrid}>
              {[
                { type: 'symptom' as const, icon: 'medical-outline', labelKey: 'myHealth.symptom', color: '#FFB5E8' },
                { type: 'contraction' as const, icon: 'pulse-outline', labelKey: 'myHealth.contraction', color: '#C4ABDC' },
                { type: 'mood' as const, icon: 'happy-outline', labelKey: 'myHealth.mood', color: '#9B88D3' },
                { type: 'pressure' as const, icon: 'heart-outline', labelKey: 'myHealth.pressure', color: '#FF9AA2' },
              ].map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickActionCard}
                  onPress={() => {
                    setSelectedType(action.type);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '33' }]}>
                    <Ionicons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text style={styles.actionLabel}>{t(action.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('myHealth.history')}</Text>
              <Text style={styles.sectionCount}>{records.length}</Text>
            </View>

            {records.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={60} color="#5D3A7D" />
                <Text style={styles.emptyText}>{t('myHealth.noRecords')}</Text>
                <Text style={styles.emptySubtext}>{t('myHealth.addFirstRecord')}</Text>
              </View>
            ) : (
              records.map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={[styles.recordIconContainer, { backgroundColor: getRecordColor(record.type) + '33' }]}>
                    <Ionicons name={getRecordIcon(record.type) as any} size={24} color={getRecordColor(record.type)} />
                  </View>
                  <View style={styles.recordContent}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordType}>
                        {record.type === 'symptom' && record.symptomType}
                        {record.type === 'contraction' && t('myHealth.contraction')}
                        {record.type === 'mood' && record.moodType}
                        {record.type === 'pressure' && `${record.systolic}/${record.diastolic} mmHg`}
                      </Text>
                      <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    </View>
                    {record.intensity && (
                      <View style={styles.intensityRow}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name={i < record.intensity! ? 'star' : 'star-outline'}
                            size={14}
                            color="#C4ABDC"
                          />
                        ))}
                      </View>
                    )}
                    {record.duration && (
                      <Text style={styles.recordDetail}>{t('myHealth.duration')}: {record.duration} min - {record.frequency}</Text>
                    )}
                    {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
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
                <Text style={styles.modalTitle}>{getModalTitle()}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedType === 'symptom' && (
                  <>
                    <Text style={styles.inputLabel}>{t('myHealth.symptomType')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('myHealth.exampleSymptom')}
                      placeholderTextColor="#9B88D3"
                      value={symptomType}
                      onChangeText={setSymptomType}
                    />
                    <Text style={styles.inputLabel}>{t('myHealth.intensity')}</Text>
                    <View style={styles.intensitySelector}>
                      {[1, 2, 3, 4, 5].map(level => (
                        <TouchableOpacity
                          key={level}
                          style={[styles.intensityButton, intensity === level && styles.intensityButtonActive]}
                          onPress={() => setIntensity(level)}
                        >
                          <Text style={[styles.intensityText, intensity === level && styles.intensityTextActive]}>
                            {level}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {selectedType === 'contraction' && (
                  <>
                    <Text style={styles.inputLabel}>{t('myHealth.duration')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('myHealth.exampleDuration')}
                      placeholderTextColor="#9B88D3"
                      keyboardType="numeric"
                      value={duration}
                      onChangeText={setDuration}
                    />
                    <Text style={styles.inputLabel}>{t('myHealth.frequency')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('myHealth.exampleFrequency')}
                      placeholderTextColor="#9B88D3"
                      value={frequency}
                      onChangeText={setFrequency}
                    />
                  </>
                )}

                {selectedType === 'mood' && (
                  <>
                    <Text style={styles.inputLabel}>{t('myHealth.yourMood')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('myHealth.exampleMood')}
                      placeholderTextColor="#9B88D3"
                      value={moodType}
                      onChangeText={setMoodType}
                    />
                  </>
                )}

                {selectedType === 'pressure' && (
                  <>
                    <Text style={styles.inputLabel}>{t('myHealth.systolic')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('myHealth.exampleSystolic')}
                      placeholderTextColor="#9B88D3"
                      keyboardType="numeric"
                      value={systolic}
                      onChangeText={setSystolic}
                    />
                    <Text style={styles.inputLabel}>{t('myHealth.diastolic')}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={t('myHealth.exampleDiastolic')}
                      placeholderTextColor="#9B88D3"
                      keyboardType="numeric"
                      value={diastolic}
                      onChangeText={setDiastolic}
                    />
                  </>
                )}

                <Text style={styles.inputLabel}>{t('myHealth.notes')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t('myHealth.additionalDetails')}
                  placeholderTextColor="#9B88D3"
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleAddRecord}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  quickActionCard: { width: (width - 64) / 2, backgroundColor: 'rgba(196,171,220,0.08)', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  actionIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionLabel: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  sectionCount: { fontSize: 16, color: '#C4ABDC', fontFamily: 'Poppins_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Poppins_600SemiBold', marginTop: 16 },
  emptySubtext: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', marginTop: 8 },
  recordCard: { flexDirection: 'row', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  recordIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordContent: { flex: 1 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recordType: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  recordDate: { color: '#9B88D3', fontSize: 12, fontFamily: 'Poppins_400Regular' },
  intensityRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  recordDetail: { color: '#C4ABDC', fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  recordNotes: { color: '#9B88D3', fontSize: 12, fontFamily: 'Poppins_400Regular', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  textArea: { height: 100, textAlignVertical: 'top' },
  intensitySelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  intensityButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(196,171,220,0.1)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  intensityButtonActive: { backgroundColor: '#C4ABDC', borderColor: '#C4ABDC' },
  intensityText: { color: '#C4ABDC', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  intensityTextActive: { color: '#1B0E20' },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
});