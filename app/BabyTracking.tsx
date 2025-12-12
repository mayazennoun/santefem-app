import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { auth, db } from './firebaseConfig';

const { width } = Dimensions.get('window');

interface DevelopmentCard {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

interface Tip {
  text: string;
}

// Exemple de données de développement pour quelques semaines
const weeklyData: Record<number, { development: DevelopmentCard[] }> = {
  1: {
    development: [
      { icon: 'body-outline', title: 'Mouvements', subtitle: 'Très faibles, difficiles à ressentir' },
      { icon: 'ear-outline', title: 'Audition', subtitle: 'Bébé commence à percevoir les sons' },
      { icon: 'nutrition-outline', title: 'Taille', subtitle: 'Taille d\'une graine de pavot' },
    ]
  },
  2: {
    development: [
      { icon: 'body-outline', title: 'Mouvements', subtitle: 'Encore très légers' },
      { icon: 'ear-outline', title: 'Audition', subtitle: 'Début de l\'écoute des sons environnants' },
      { icon: 'nutrition-outline', title: 'Taille', subtitle: 'Taille d\'un petit grain de raisin' },
    ]
  },
  3: {
    development: [
      { icon: 'body-outline', title: 'Mouvements', subtitle: 'Légers mais progressifs' },
      { icon: 'ear-outline', title: 'Audition', subtitle: 'Peut entendre les battements du cœur' },
      { icon: 'nutrition-outline', title: 'Taille', subtitle: 'Taille d\'une petite myrtille' },
    ]
  },
  // Ajouter jusqu'à la semaine 40
};

// Liste de 30 conseils généraux
const allTips: Tip[] = [
  { text: 'Hydratez-vous régulièrement' },
  { text: 'Mangez équilibré' },
  { text: 'Marchez 30 min par jour' },
  { text: 'Faites des exercices légers de respiration' },
  { text: 'Prenez vos vitamines prénatales' },
  { text: 'Évitez le stress excessif' },
  { text: 'Notez vos ressentis dans un journal' },
  { text: 'Dormez suffisamment' },
  { text: 'Discutez avec votre partenaire de vos émotions' },
  { text: 'Faites des étirements doux' },
  { text: 'Préparez votre sac pour la maternité' },
  { text: 'Faites des activités relaxantes' },
  { text: 'Évitez les boissons excitantes' },
  { text: 'Lisez ou parlez à votre bébé' },
  { text: 'Prévoyez des rendez-vous médicaux réguliers' },
  { text: 'Hydratez votre peau pour éviter les démangeaisons' },
  { text: 'Planifiez vos repas équilibrés' },
  { text: 'Pratiquez la méditation ou la pleine conscience' },
  { text: 'Évitez les aliments ultra-transformés' },
  { text: 'Faites du yoga prénatal léger' },
  { text: 'Écoutez de la musique douce' },
  { text: 'Soyez attentif à vos signes de fatigue' },
  { text: 'Partagez vos inquiétudes avec un proche' },
  { text: 'Prévoyez des moments de détente' },
  { text: 'Consultez vos documents médicaux régulièrement' },
  { text: 'Bougez régulièrement pour stimuler la circulation' },
  { text: 'Faites attention à votre posture' },
  { text: 'Notez vos envies et habitudes alimentaires' },
  { text: 'Créez un espace calme chez vous' },
  { text: 'Informez-vous sur le développement du bébé' },
];

// Fonction pour sélectionner 10 conseils selon la semaine
function getTipsForWeek(weekNumber: number): Tip[] {
  const startIndex = ((weekNumber - 1) * 10) % allTips.length; 
  return allTips.slice(startIndex, startIndex + 10);
}

export default function BabyTracking() {
  const router = useRouter();

  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [babyWeight, setBabyWeight] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(`${data.nom} ${data.prenom}`);
        setWeekNumber(Number(data.semaineGrossesse) || 1);
        setBabyWeight(Number(data.poidsBebe) || 0);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!fontsLoaded) return null;

  const progress = (weekNumber / 40) * 100;
  const currentWeekData = weeklyData[weekNumber] || weeklyData[1];
  const tipsToShow = getTipsForWeek(weekNumber);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content"/>
      <LinearGradient colors={['#1B0E20','#2A1A35','#1B0E20']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.userName}>{userName} ✨</Text>
              <Ionicons name="chevron-back" size={28} color="#C4ABDC" onPress={() => router.back()} />
            </View>

            {/* Card principale suivi bébé */}
            <View style={styles.babyCard}>
              <View style={styles.babyCardContent}>
                <View style={styles.babyCardLeft}>
                  <Text style={styles.babyCardTitle}>Semaine {weekNumber}</Text>
                  <Text style={styles.babyCardSubtitle}>Poids estimé: {babyWeight.toFixed(1)} kg</Text>
                  <Text style={styles.babyCardSubtitle}>Développement et taille approximative</Text>
                </View>
                <View style={styles.babyImageContainer}>
                  <Image source={require('../assets/images/baby.png')} style={styles.babyImage} />
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}% de la grossesse</Text>
            </View>

            {/* Cards développement dynamiques */}
            <Text style={styles.sectionTitle}>Développement cette semaine</Text>
            <View style={styles.developmentGrid}>
              {currentWeekData.development.map((card, idx) => (
                <View key={idx} style={styles.devCard}>
                  <View style={styles.devIcon}>
                    <Ionicons name={card.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.devTitle}>{card.title}</Text>
                  <Text style={styles.devSubtitle}>{card.subtitle}</Text>
                </View>
              ))}
            </View>

            {/* Section conseils généraux */}
            <Text style={styles.sectionTitle}>Pour vous</Text>
            <View style={styles.tipsContainer}>
              {tipsToShow.map((tip, idx) => (
                <View key={idx} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              ))}
            </View>

          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#1B0E20'},
  gradient:{flex:1},
  scrollView:{flex:1},
  header:{paddingHorizontal:24,paddingTop:60,paddingBottom:20},
  headerTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:24},
  userName:{color:'#FFFFFF',fontSize:28,fontFamily:'Poppins_700Bold'},

  babyCard:{backgroundColor:'rgba(196,171,220,0.15)',borderRadius:20,padding:20,marginBottom:24,borderWidth:1,borderColor:'rgba(196,171,220,0.25)'},
  babyCardContent:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  babyCardLeft:{flex:1},
  babyCardTitle:{color:'#FFFFFF',fontSize:20,fontFamily:'Poppins_700Bold',marginBottom:4},
  babyCardSubtitle:{color:'#C4ABDC',fontSize:14,lineHeight:20,fontFamily:'Poppins_400Regular'},
  babyImageContainer:{width:80,height:80,borderRadius:40,overflow:'hidden',marginLeft:12,backgroundColor:'rgba(196,171,220,0.2)',justifyContent:'center',alignItems:'center'},
  babyImage:{width:'100%',height:'100%',resizeMode:'cover'},
  progressBarContainer:{height:8,backgroundColor:'rgba(196,171,220,0.2)',borderRadius:4,marginTop:16},
  progressBarFill:{height:'100%',backgroundColor:'#C4ABDC',borderRadius:4},
  progressText:{color:'#C4ABDC',fontSize:14,fontFamily:'Poppins_400Regular',marginTop:6},

  sectionTitle:{color:'#FFFFFF',fontSize:18,fontFamily:'Poppins_700Bold',marginBottom:12,marginTop:24},
  developmentGrid:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:12},
  devCard:{width:(width-72)/2,backgroundColor:'rgba(196,171,220,0.15)',borderRadius:16,padding:16,marginBottom:12},
  devIcon:{backgroundColor:'rgba(196,171,220,0.3)',borderRadius:12,width:40,height:40,justifyContent:'center',alignItems:'center',marginBottom:8},
  devTitle:{color:'#FFFFFF',fontSize:16,fontFamily:'Poppins_700Bold',marginBottom:4},
  devSubtitle:{color:'#C4ABDC',fontSize:12,lineHeight:16,fontFamily:'Poppins_400Regular'},

  tipsContainer:{paddingHorizontal:8},
  tipItem:{flexDirection:'row',alignItems:'flex-start',marginBottom:6},
  tipBullet:{color:'#C4ABDC',fontSize:16,marginRight:6,lineHeight:20},
  tipText:{color:'#FFFFFF',fontSize:14,lineHeight:20,fontFamily:'Poppins_400Regular',flex:1},
});
