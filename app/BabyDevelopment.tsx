import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from './firebaseConfig';

const { width } = Dimensions.get('window');

interface WeekData {
  week: number;
  size: string;
  weight: number;
  description: string;
  developments: string[];
  motherSymptoms: string[];
  tips: string[];
}

export default function BabyDevelopment() {
  const { t, } = useTranslation();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(24);
  const [currentData, setCurrentData] = useState<WeekData | null>(null);
  const [realBabyWeight, setRealBabyWeight] = useState<number>(0);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  
  const getWeeklyData = (week: number): WeekData => {
    return {
      week,
      size: "", 
      weight: 0, 
      description: t(`babyDevelopment.week${week}.description`),
      developments: [
        t(`babyDevelopment.week${week}.dev1`),
        t(`babyDevelopment.week${week}.dev2`),
        t(`babyDevelopment.week${week}.dev3`)
      ],
      motherSymptoms: [
        t(`babyDevelopment.week${week}.symptom1`),
        t(`babyDevelopment.week${week}.symptom2`),
        t(`babyDevelopment.week${week}.symptom3`)
      ],
      tips: [
        t(`babyDevelopment.week${week}.tip1`),
        t(`babyDevelopment.week${week}.tip2`),
        t(`babyDevelopment.week${week}.tip3`)
      ]
    };
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentWeek(Number(data.semaineGrossesse) || 24);
        setRealBabyWeight(Number(data.poidsBebe) || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const availableWeeks = [8, 12, 16, 20, 24, 28, 32, 36, 40];
    let closestWeek = availableWeeks[0];
    
    for (const week of availableWeeks) {
      if (currentWeek >= week) {
        closestWeek = week;
      } else {
        break;
      }
    }
    
    setCurrentData(getWeeklyData(closestWeek));
  }, [currentWeek, t]);

  const handleWeekSelect = (week: number) => {
    setCurrentWeek(week);
  };

  const availableWeeks = [8, 12, 16, 20, 24, 28, 32, 36, 40];
  const trimester = Math.ceil(currentWeek / 13);
  const progress = (currentWeek / 40) * 100;

  if (!fontsLoaded || !currentData) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('babyDevelopment.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.weekNumber}>{t('babyDevelopment.week')} {currentWeek}</Text>
                <View style={styles.trimesterBadge}>
                  <Text style={styles.trimesterText}>{trimester}{t('babyDevelopment.trimester')}</Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}% {t('babyDevelopment.ofPregnancy')}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekSelector}>
              {availableWeeks.map(week => (
                <TouchableOpacity
                  key={week}
                  style={[styles.weekButton, currentWeek === week && styles.weekButtonActive]}
                  onPress={() => handleWeekSelect(week)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.weekButtonText, currentWeek === week && styles.weekButtonTextActive]}>
                    {t('babyDevelopment.weekShort')}{week}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.babyCard}>
              <View style={styles.babyImageContainer}>
                <Image source={require('../assets/images/baby.png')} style={styles.babyImage} />
              </View>
              <View style={styles.babyInfo}>
                <Text style={styles.babyDescription}>{currentData.description}</Text>
                <View style={styles.measurementsRow}>
                  <View style={styles.measurement}>
                    <Ionicons name="resize-outline" size={20} color="#C4ABDC" />
                    <Text style={styles.measurementValue}>{currentData.size}</Text>
                    <Text style={styles.measurementLabel}>{t('babyDevelopment.size')}</Text>
                  </View>
                  <View style={styles.measurementDivider} />
                  <View style={styles.measurement}>
                    <Ionicons name="barbell-outline" size={20} color="#C4ABDC" />
                    <Text style={styles.measurementValue}>{realBabyWeight.toFixed(2)} kg</Text>
                    <Text style={styles.measurementLabel}>{t('babyDevelopment.weight')}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="sparkles-outline" size={20} color="#C4ABDC" />
                </View>
                <Text style={styles.sectionTitle}>{t('babyDevelopment.babyDevelopment')}</Text>
              </View>
              <View style={styles.listCard}>
                {currentData.developments.map((dev, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.listBullet} />
                    <Text style={styles.listText}>{dev}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="heart-outline" size={20} color="#FFB5E8" />
                </View>
                <Text style={styles.sectionTitle}>{t('babyDevelopment.commonSymptoms')}</Text>
              </View>
              <View style={styles.listCard}>
                {currentData.motherSymptoms.map((symptom, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={[styles.listBullet, { backgroundColor: '#FFB5E8' }]} />
                    <Text style={styles.listText}>{symptom}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="bulb-outline" size={20} color="#9B88D3" />
                </View>
                <Text style={styles.sectionTitle}>{t('babyDevelopment.weeklyTips')}</Text>
              </View>
              <View style={styles.listCard}>
                {currentData.tips.map((tip, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={[styles.listBullet, { backgroundColor: '#9B88D3' }]} />
                    <Text style={styles.listText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={[styles.navButton, currentWeek <= 8 && styles.navButtonDisabled]}
                onPress={() => {
                  const idx = availableWeeks.indexOf(currentWeek);
                  if (idx > 0) handleWeekSelect(availableWeeks[idx - 1]);
                }}
                disabled={currentWeek <= 8}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color={currentWeek <= 8 ? '#5D3A7D' : '#C4ABDC'} />
                <Text style={[styles.navButtonText, currentWeek <= 8 && styles.navButtonTextDisabled]}>
                  {t('babyDevelopment.previousWeek')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, currentWeek >= 40 && styles.navButtonDisabled]}
                onPress={() => {
                  const idx = availableWeeks.indexOf(currentWeek);
                  if (idx < availableWeeks.length - 1) handleWeekSelect(availableWeeks[idx + 1]);
                }}
                disabled={currentWeek >= 40}
                activeOpacity={0.7}
              >
                <Text style={[styles.navButtonText, currentWeek >= 40 && styles.navButtonTextDisabled]}>
                  {t('babyDevelopment.nextWeek')}
                </Text>
                <Ionicons name="chevron-forward" size={24} color={currentWeek >= 40 ? '#5D3A7D' : '#C4ABDC'} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  progressCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weekNumber: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  trimesterBadge: { backgroundColor: 'rgba(196,171,220,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  trimesterText: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  progressBarContainer: { height: 8, backgroundColor: 'rgba(196,171,220,0.2)', borderRadius: 4, marginBottom: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#C4ABDC', borderRadius: 4 },
  progressText: { color: '#9B88D3', fontSize: 13, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  weekSelector: { marginBottom: 24, maxHeight: 60 },
  weekButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  weekButtonActive: { backgroundColor: '#C4ABDC' },
  weekButtonText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  weekButtonTextActive: { color: '#1B0E20' },
  babyCard: { backgroundColor: 'rgba(196,171,220,0.15)', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(196,171,220,0.25)' },
  babyImageContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(196,171,220,0.2)', alignSelf: 'center', marginBottom: 20, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  babyImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  babyInfo: { alignItems: 'center' },
  babyDescription: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_600SemiBold', textAlign: 'center', marginBottom: 20 },
  measurementsRow: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  measurement: { alignItems: 'center' },
  measurementValue: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 8 },
  measurementLabel: { color: '#C4ABDC', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 4 },
  measurementDivider: { width: 1, height: 40, backgroundColor: 'rgba(196,171,220,0.3)' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  listCard: { backgroundColor: 'rgba(196,171,220,0.08)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingRight: 8 },
  listBullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4ABDC', marginTop: 6, marginRight: 12, flexShrink: 0 },
  listText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Poppins_400Regular', lineHeight: 20, flex: 1 },
  navigationButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(196,171,220,0.15)', borderRadius: 12, paddingVertical: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  navButtonDisabled: { opacity: 0.4 },
  navButtonText: { color: '#C4ABDC', fontSize: 11, fontFamily: 'Poppins_600SemiBold' },
  navButtonTextDisabled: { color: '#5D3A7D' },
});