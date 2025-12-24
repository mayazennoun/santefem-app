import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from './firebaseConfig';

const { width } = Dimensions.get('window');

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
  route: "/BabyTracking" | "/MyHealth" | "/Appointments" | "/Activities" | "/Journal" | "/Community" | "/WeightTracking" | "/ShoppingList";
}

interface QuickStat {
  labelKey: string;
  value: number | string;
  unit: string;
}

export default function Home() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [weekNumber, setWeekNumber] = useState<number>(0);
  const [babyWeight, setBabyWeight] = useState<number>(0);
  const [nextAppointment, setNextAppointment] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(`${data.nom} ${data.prenom}`);
        setWeekNumber(Number(data.semaineGrossesse) || 0);
        setBabyWeight(Number(data.poidsBebe) || 0);
        setNextAppointment(data.nextAppointment || t('home.noAppointment'));
      }
    });

    return () => unsubscribe();
  }, [t]);

  if (!fontsLoaded) return null;

  const progress = (weekNumber / 40) * 100;
  const trimesterNum = Math.ceil(weekNumber / 13);

  const features: Feature[] = [
    { icon: "body-outline", titleKey: "home.babyTracking", subtitleKey: "home.babyTrackingSubtitle", route: "/BabyTracking" },
    { icon: "heart-outline", titleKey: "home.myHealth", subtitleKey: "home.myHealthSubtitle", route: "/MyHealth" },
    { icon: "calendar-outline", titleKey: "home.appointments", subtitleKey: "home.appointmentsSubtitle", route: "/Appointments" },
    { icon: "fitness-outline", titleKey: "home.activities", subtitleKey: "home.activitiesSubtitle", route: "/Activities" },
    { icon: "scale-outline", titleKey: "home.weightTracking", subtitleKey: "home.weightTrackingSubtitle", route: "/WeightTracking" },
    { icon: "cart-outline", titleKey: "home.shoppingList", subtitleKey: "home.shoppingListSubtitle", route: "/ShoppingList" },
    { icon: "book-outline", titleKey: "home.journal", subtitleKey: "home.journalSubtitle", route: "/Journal" },
    { icon: "chatbubbles-outline", titleKey: "home.community", subtitleKey: "home.communitySubtitle", route: "/Community" }
  ];

  const quickStats: QuickStat[] = [
    { labelKey: "home.weekLabel", value: weekNumber, unit: "/40" },
    { labelKey: "home.babyWeight", value: babyWeight.toFixed(1), unit: "kg" },
    { labelKey: "home.trimester", value: trimesterNum, unit: "" }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content"/>
      <LinearGradient colors={['#1B0E20','#2A1A35','#1B0E20']} style={styles.gradient}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{t('home.greeting')}</Text>
                <Text style={styles.userName}>{userName} ✨</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={22} color="#C4ABDC" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/Profile')}>
                  <Ionicons name="person-outline" size={22} color="#C4ABDC" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.weekText}>{t('home.week')} {weekNumber}</Text>
                  <Text style={styles.trimesterText}>{trimesterNum}{i18n.language === 'ar' ? ' ' : 'ème'} {t('home.trimester')}</Text>
                </View>
                <View style={styles.percentageBadge}>
                  <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>

              <View style={styles.statsContainer}>
                {quickStats.map((stat, idx) => (
                  <View key={idx} style={styles.statItem}>
                    <Text style={styles.statValue}>{stat.value}{stat.unit}</Text>
                    <Text style={styles.statLabel}>{t(stat.labelKey)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.babyCard} onPress={() => router.push('/BabyDevelopment')} activeOpacity={0.8}>
              <View style={styles.babyCardContent}>
                <View style={styles.babyCardLeft}>
                  <View style={styles.babyIcon}>
                    <Ionicons name="body-outline" size={24} color="#FFFFFF"/>
                  </View>
                  <Text style={styles.babyCardTitle}>{t('home.babyThisWeek')}</Text>
                  <Text style={styles.babyCardSubtitle}>
                    {t('home.babySize')}{'\n'}
                    {t('home.babyHearing')}
                  </Text>
                </View>
                <View style={styles.babyImageContainer}>
                  <Image source={require('../assets/images/baby.png')} style={styles.babyImage} />
                </View>
                <Ionicons name="chevron-forward" size={24} color="#C4ABDC"/>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appointmentBanner} onPress={() => router.push('/Appointments')} activeOpacity={0.8}>
              <View style={styles.appointmentContent}>
                <View style={styles.appointmentIcon}>
                  <Ionicons name="calendar-outline" size={22} color="#1B0E20"/>
                </View>
                <View>
                  <Text style={styles.appointmentLabel}>{t('home.nextAppointment')}</Text>
                  <Text style={styles.appointmentDate}>{nextAppointment}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#1B0E20"/>
            </TouchableOpacity>

            <Text style={styles.featuresTitle}>{t('home.yourTools')}</Text>
          </View>

          <View style={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <TouchableOpacity key={idx} style={styles.featureCard} onPress={() => router.push(feature.route)} activeOpacity={0.8}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={26} color="#C4ABDC"/>
                </View>
                <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                <Text style={styles.featureSubtitle}>{t(feature.subtitleKey)}</Text>
              </TouchableOpacity>
            ))}
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
  greeting:{color:'#C4ABDC',fontSize:16,fontFamily:'Poppins_400Regular'},
  userName:{color:'#FFFFFF',fontSize:28,fontFamily:'Poppins_700Bold'},
  headerIcons:{flexDirection:'row',gap:12},
  iconButton:{width:48,height:48,borderRadius:24,backgroundColor:'rgba(196,171,220,0.15)',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'rgba(196,171,220,0.3)'},
  progressCard:{backgroundColor:'rgba(196,171,220,0.1)',borderRadius:24,padding:24,borderWidth:1,borderColor:'rgba(196,171,220,0.2)',marginBottom:24},
  progressHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  weekText:{color:'#FFFFFF',fontSize:24,fontFamily:'Poppins_700Bold'},
  trimesterText:{color:'#C4ABDC',fontSize:14,fontFamily:'Poppins_400Regular'},
  percentageBadge:{backgroundColor:'rgba(196,171,220,0.2)',borderRadius:16,paddingHorizontal:16,paddingVertical:8},
  percentageText:{color:'#FFFFFF',fontSize:16,fontFamily:'Poppins_700Bold'},
  progressBarContainer:{height:8,backgroundColor:'rgba(196,171,220,0.2)',borderRadius:4,marginBottom:20},
  progressBarFill:{height:'100%',backgroundColor:'#C4ABDC',borderRadius:4},
  statsContainer:{flexDirection:'row',justifyContent:'space-between'},
  statItem:{alignItems:'center'},
  statValue:{color:'#FFFFFF',fontSize:20,fontFamily:'Poppins_700Bold'},
  statLabel:{color:'#C4ABDC',fontSize:12,fontFamily:'Poppins_400Regular'},
  babyCard:{backgroundColor:'rgba(196,171,220,0.15)',borderRadius:20,padding:20,marginBottom:24,borderWidth:1,borderColor:'rgba(196,171,220,0.25)'},
  babyCardContent:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  babyCardLeft:{flex:1},
  babyIcon:{backgroundColor:'rgba(196,171,220,0.3)',borderRadius:12,width:48,height:48,justifyContent:'center',alignItems:'center',marginBottom:12},
  babyCardTitle:{color:'#FFFFFF',fontSize:18,fontFamily:'Poppins_700Bold'},
  babyCardSubtitle:{color:'#C4ABDC',fontSize:14,lineHeight:20,fontFamily:'Poppins_400Regular'},
  babyImageContainer:{width:80,height:80,borderRadius:40,overflow:'hidden',marginLeft:12,backgroundColor:'rgba(196,171,220,0.2)',justifyContent:'center',alignItems:'center'},
  babyImage:{width:'100%',height:'100%',resizeMode:'cover'},
  appointmentBanner:{backgroundColor:'#C4ABDC',borderRadius:16,padding:18,marginBottom:32,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  appointmentContent:{flexDirection:'row',alignItems:'center',flex:1},
  appointmentIcon:{backgroundColor:'rgba(27,14,32,0.2)',borderRadius:12,width:44,height:44,justifyContent:'center',alignItems:'center',marginRight:14},
  appointmentLabel: {color: '#1B0E20',fontSize: 12,fontFamily: 'Poppins_400Regular',marginBottom: 2,},
  appointmentDate: { color: '#1B0E20',fontSize: 13,fontFamily: 'Poppins_600SemiBold',lineHeight: 18,},
  featuresTitle:{color:'#FFFFFF',fontSize:22,fontFamily:'Poppins_700Bold'},
  featuresGrid:{paddingHorizontal:24,paddingBottom:40,flexDirection:'row',flexWrap:'wrap',gap:16},
  featureCard:{width:(width-64)/2,backgroundColor:'rgba(196,171,220,0.08)',borderRadius:20,padding:20,borderWidth:1,borderColor:'rgba(196,171,220,0.2)',minHeight:140},
  featureIconContainer:{backgroundColor:'#F5F0FF',borderRadius:14,width:52,height:52,justifyContent:'center',alignItems:'center',marginBottom:14},
  featureTitle:{color:'#FFFFFF',fontSize:16,fontFamily:'Poppins_700Bold'},
  featureSubtitle:{color:'#C4ABDC',fontSize:12,lineHeight:16,fontFamily:'Poppins_400Regular'},
});