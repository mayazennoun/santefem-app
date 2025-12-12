import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
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

const weeklyData: { [key: number]: WeekData } = {
  8: {
    week: 8,
    size: "1,6 cm",
    weight: 0.001,
    description: "Votre bébé est de la taille d'un haricot",
    developments: ["Formation des doigts et orteils", "Le cœur bat à 150 battements/min", "Les organes principaux se développent"],
    motherSymptoms: ["Nausées matinales", "Fatigue intense", "Sensibilité des seins"],
    tips: ["Repos fréquent", "Hydratation importante", "Éviter les odeurs fortes"]
  },
  12: {
    week: 12,
    size: "5,4 cm",
    weight: 0.014,
    description: "Votre bébé est de la taille d'une prune",
    developments: ["Les ongles commencent à pousser", "Les réflexes se développent", "Peut bouger ses doigts"],
    motherSymptoms: ["Nausées en diminution", "Augmentation de l'énergie", "Ventre commence à s'arrondir"],
    tips: ["Première échographie", "Commencer les exercices doux", "Alimentation équilibrée"]
  },
  16: {
    week: 16,
    size: "11,6 cm",
    weight: 0.1,
    description: "Votre bébé est de la taille d'un avocat",
    developments: ["Peut faire des grimaces", "Les yeux bougent", "Entend les sons"],
    motherSymptoms: ["Regain d'énergie", "Peau plus lumineuse", "Premiers mouvements possibles"],
    tips: ["Parlez à votre bébé", "Massages du ventre", "Activité physique modérée"]
  },
  20: {
    week: 20,
    size: "16,5 cm",
    weight: 0.3,
    description: "Votre bébé est de la taille d'une banane",
    developments: ["Vernix protège la peau", "Cheveux et sourcils poussent", "Cycles de sommeil réguliers"],
    motherSymptoms: ["Mouvements du bébé ressentis", "Ligne brune sur le ventre", "Augmentation de l'appétit"],
    tips: ["Échographie morphologique", "Position de sommeil sur le côté", "Crème anti-vergetures"]
  },
  24: {
    week: 24,
    size: "30 cm",
    weight: 0.6,
    description: "Votre bébé est de la taille d'un épi de maïs",
    developments: ["Empreintes digitales formées", "Poumons en développement", "Reconnaît votre voix"],
    motherSymptoms: ["Contractions de Braxton Hicks", "Douleurs lombaires", "Sommeil difficile"],
    tips: ["Exercices de respiration", "Soutien lombaire", "Cours de préparation"]
  },
  28: {
    week: 28,
    size: "37,5 cm",
    weight: 1.0,
    description: "Votre bébé est de la taille d'une aubergine",
    developments: ["Ouvre et ferme les yeux", "Respire le liquide amniotique", "Réagit à la lumière"],
    motherSymptoms: ["Essoufflement", "Brûlures d'estomac", "Jambes lourdes"],
    tips: ["Surveillez les mouvements", "Repos fréquent", "Suivi médical régulier"]
  },
  32: {
    week: 32,
    size: "42,5 cm",
    weight: 1.7,
    description: "Votre bébé est de la taille d'un chou",
    developments: ["Prend du poids rapidement", "Se positionne tête en bas", "Système immunitaire actif"],
    motherSymptoms: ["Fatigue accrue", "Envies fréquentes d'uriner", "Contractions plus fréquentes"],
    tips: ["Préparez la valise", "Cours de préparation", "Repos maximal"]
  },
  36: {
    week: 36,
    size: "47 cm",
    weight: 2.6,
    description: "Votre bébé est de la taille d'une papaye",
    developments: ["Poumons presque matures", "Tête engagée dans le bassin", "Accumule de la graisse"],
    motherSymptoms: ["Difficultés respiratoires", "Contractions régulières", "Impatience croissante"],
    tips: ["Consultations hebdomadaires", "Surveillez les signes de travail", "Finalisez la chambre"]
  },
  40: {
    week: 40,
    size: "51 cm",
    weight: 3.4,
    description: "Votre bébé est prêt à naître",
    developments: ["Totalement développé", "Prêt pour la vie extra-utérine", "Méconium dans l'intestin"],
    motherSymptoms: ["Contractions régulières", "Perte du bouchon muqueux", "Rupture de la poche possible"],
    tips: ["Restez calme", "Comptez les contractions", "Direction maternité si besoin"]
  }
};

export default function BabyDevelopment() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(24);
  const [currentData, setCurrentData] = useState<WeekData | null>(null);
  const [realBabyWeight, setRealBabyWeight] = useState<number>(0);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

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
    const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
    let closestWeek = availableWeeks[0];
    
    for (const week of availableWeeks) {
      if (currentWeek >= week) {
        closestWeek = week;
      } else {
        break;
      }
    }
    
    setCurrentData(weeklyData[closestWeek]);
  }, [currentWeek]);

  const handleWeekSelect = (week: number) => {
    setCurrentWeek(week);
  };

  const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
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
          <Text style={styles.headerTitle}>Développement</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.weekNumber}>Semaine {currentWeek}</Text>
                <View style={styles.trimesterBadge}>
                  <Text style={styles.trimesterText}>{trimester}er trimestre</Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}% de la grossesse</Text>
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
                    S{week}
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
                    <Text style={styles.measurementLabel}>Taille</Text>
                  </View>
                  <View style={styles.measurementDivider} />
                  <View style={styles.measurement}>
                    <Ionicons name="barbell-outline" size={20} color="#C4ABDC" />
                    <Text style={styles.measurementValue}>{realBabyWeight.toFixed(2)} kg</Text>
                    <Text style={styles.measurementLabel}>Poids</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="sparkles-outline" size={20} color="#C4ABDC" />
                </View>
                <Text style={styles.sectionTitle}>Développement du bébé</Text>
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
                <Text style={styles.sectionTitle}>Symptômes courants</Text>
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
                <Text style={styles.sectionTitle}>Conseils de la semaine</Text>
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
                  Semaine précédente
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
                  Semaine suivante
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