import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  I18nManager,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { saveLanguage } from '../i18n';
import { auth, db } from './firebaseConfig';

interface UserData {
  nom: string;
  prenom: string;
  age: number;
  poids: number;
  taille: number;
  poidsAvantGrossesse: number;
  semaineGrossesse: number;
  dateAccouchement: string;
  email: string;
}

export default function Profile() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  
  const [notifications, setNotifications] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPoids, setEditPoids] = useState('');
  const [editTaille, setEditTaille] = useState('');

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData({
          ...data,
          email: auth.currentUser?.email || '',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('profile.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('profile.error'), t('profile.cannotLogout'));
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    if (!userData) return;
    setEditNom(userData.nom);
    setEditPrenom(userData.prenom);
    setEditAge(userData.age.toString());
    setEditPoids(userData.poids.toString());
    setEditTaille(userData.taille.toString());
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    if (!editNom.trim() || !editPrenom.trim() || !editAge || !editPoids || !editTaille) {
      Alert.alert(t('profile.error'), t('profile.fillAllFields'));
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        nom: editNom,
        prenom: editPrenom,
        age: parseInt(editAge),
        poids: parseFloat(editPoids),
        taille: parseFloat(editTaille),
      });
      setEditModalVisible(false);
      Alert.alert(t('profile.success'), t('profile.profileUpdated'));
    } catch (error) {
      Alert.alert(t('profile.error'), t('profile.cannotUpdate'));
    }
  };

  const handleLanguageSelect = async (lang: string) => {
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
    
    
    await saveLanguage(lang);
    
    i18n.changeLanguage(lang);
    const isRTL = lang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      Alert.alert(
        t('profile.success'),
        'Veuillez redémarrer l\'application pour appliquer la direction du texte.',
        [{ text: 'OK' }]
      );
    }
  };

  const calculateIMC = () => {
    if (!userData) return 0;
    const heightInMeters = userData.taille / 100;
    return (userData.poids / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const calculateWeightGain = () => {
    if (!userData) return 0;
    return (userData.poids - userData.poidsAvantGrossesse).toFixed(1);
  };

  const getDaysUntilDue = () => {
    if (!userData) return 0;
    const parts = userData.dateAccouchement.split('/');
    if (parts.length !== 3) return 0;
    const dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!fontsLoaded || !userData) return null;

  const menuItems = [
    {
      icon: 'person-outline',
      title: t('profile.editProfile'),
      subtitle: t('profile.personalInfo'),
      color: '#C4ABDC',
      onPress: handleEditProfile,
    },
    {
      icon: 'language-outline',
      title: t('profile.language'),
      subtitle: selectedLanguage === 'fr' ? t('profile.french') : selectedLanguage === 'ar' ? t('profile.arabic') : t('profile.english'),
      color: '#9B88D3',
      onPress: () => setLanguageModalVisible(true),
    },
    {
      icon: 'notifications-outline',
      title: t('profile.notifications'),
      subtitle: notifications ? t('profile.enabled') : t('profile.disabled'),
      color: '#FFB5E8',
      hasSwitch: true,
      switchValue: notifications,
      onSwitchChange: setNotifications,
    },
    {
      icon: 'document-text-outline',
      title: t('profile.termsOfUse'),
      subtitle: t('profile.privacyPolicy'),
      color: '#BBA0E8',
      onPress: () => Alert.alert(t('profile.termsOfUse'), t('profile.privacyPolicy')),
    },
    {
      icon: 'help-circle-outline',
      title: t('profile.helpSupport'),
      subtitle: t('profile.needHelp'),
      color: '#9B88D3',
      onPress: () => Alert.alert(t('profile.helpSupport'), 'support@santefem.com'),
    },
    {
      icon: 'information-circle-outline',
      title: t('profile.about'),
      subtitle: t('profile.version'),
      color: '#C4ABDC',
      onPress: () => Alert.alert('SantéFem', t('profile.version')),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                  start={[0, 0]}
                  end={[1, 1]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {userData.prenom.charAt(0).toUpperCase()}{userData.nom.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.profileName}>
                {userData.prenom} {userData.nom}
              </Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>

              <View style={styles.profileStats}>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>S{userData.semaineGrossesse}</Text>
                  <Text style={styles.profileStatLabel}>{t('profile.week')}</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{getDaysUntilDue()}j</Text>
                  <Text style={styles.profileStatLabel}>{t('profile.remaining')}</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{calculateIMC()}</Text>
                  <Text style={styles.profileStatLabel}>IMC</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCards}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardIcon}>
                  <Ionicons name="body-outline" size={24} color="#C4ABDC" />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>{t('profile.currentWeight')}</Text>
                  <Text style={styles.infoCardValue}>{userData.poids} kg</Text>
                  <Text style={styles.infoCardSubtext}>
                    +{calculateWeightGain()} kg {t('profile.sinceStart')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoCardIcon}>
                  <Ionicons name="calendar-outline" size={24} color="#FFB5E8" />
                </View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>{t('profile.dueDate')}</Text>
                  <Text style={styles.infoCardValue}>{userData.dateAccouchement}</Text>
                  <Text style={styles.infoCardSubtext}>
                    {getDaysUntilDue()} {t('profile.daysRemaining')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={item.hasSwitch ? 1 : 0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '33' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                  {item.hasSwitch ? (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onSwitchChange}
                      trackColor={{ false: '#5D3A7D', true: '#C4ABDC' }}
                      thumbColor="#FFFFFF"
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9B88D3" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <View style={styles.logoutIcon}>
                <Ionicons name="log-out-outline" size={22} color="#FF9AA2" />
              </View>
              <Text style={styles.logoutText}>{t('profile.logout')}</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              {t('profile.memberSince')} {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </ScrollView>

        {/* Modal d'édition */}
        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('profile.editProfileTitle')}</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#C4ABDC" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>{t('profile.lastName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.lastName')}
                  placeholderTextColor="#9B88D3"
                  value={editNom}
                  onChangeText={setEditNom}
                />

                <Text style={styles.inputLabel}>{t('profile.firstName')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.firstName')}
                  placeholderTextColor="#9B88D3"
                  value={editPrenom}
                  onChangeText={setEditPrenom}
                />

                <Text style={styles.inputLabel}>{t('profile.age')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.age')}
                  placeholderTextColor="#9B88D3"
                  keyboardType="numeric"
                  value={editAge}
                  onChangeText={setEditAge}
                />

                <Text style={styles.inputLabel}>{t('profile.currentWeightKg')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 65"
                  placeholderTextColor="#9B88D3"
                  keyboardType="decimal-pad"
                  value={editPoids}
                  onChangeText={setEditPoids}
                />

                <Text style={styles.inputLabel}>{t('profile.heightCm')} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 165"
                  placeholderTextColor="#9B88D3"
                  keyboardType="numeric"
                  value={editTaille}
                  onChangeText={setEditTaille}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <LinearGradient
                    colors={['#BBA0E8', '#9B88D3', '#876BB8']}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>{t('profile.save')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de sélection de langue */}
        <Modal visible={languageModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.languageModalContent}>
              <Text style={styles.languageModalTitle}>{t('profile.selectLanguage')}</Text>
              
              <TouchableOpacity
                style={[styles.languageOption, selectedLanguage === 'fr' && styles.languageOptionActive]}
                onPress={() => handleLanguageSelect('fr')}
                activeOpacity={0.7}
              >
                <View style={styles.languageFlag}>
                  <Text style={styles.languageFlagText}>🇫🇷</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{t('profile.french')}</Text>
                  <Text style={styles.languageNative}>French</Text>
                </View>
                {selectedLanguage === 'fr' && (
                  <Ionicons name="checkmark-circle" size={24} color="#C4ABDC" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.languageOption, selectedLanguage === 'ar' && styles.languageOptionActive]}
                onPress={() => handleLanguageSelect('ar')}
                activeOpacity={0.7}
              >
                <View style={styles.languageFlag}>
                  <Text style={styles.languageFlagText}>🇩🇿</Text>
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{t('profile.arabic')}</Text>
                  <Text style={styles.languageNative}>Arabic</Text>
                </View>
                {selectedLanguage === 'ar' && (
                  <Ionicons name="checkmark-circle" size={24} color="#C4ABDC" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLanguageModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('profile.cancel')}</Text>
              </TouchableOpacity>
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
  profileCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(196,171,220,0.3)' },
  avatarText: { fontSize: 36, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#C4ABDC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#2A1A35' },
  profileName: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#9B88D3', fontFamily: 'Poppins_400Regular', marginBottom: 20 },
  profileStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, width: '100%' },
  profileStatItem: { flex: 1, alignItems: 'center' },
  profileStatValue: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  profileStatLabel: { fontSize: 11, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 4 },
  profileStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(196,171,220,0.3)' },
  infoCards: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  infoCard: { flex: 1, backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.2)' },
  infoCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(196,171,220,0.2)', justifyContent: 'center', alignItems: 'center' },
  infoCardContent: { flex: 1 },
  infoCardLabel: { fontSize: 11, color: '#9B88D3', fontFamily: 'Poppins_400Regular', marginBottom: 4 },
  infoCardValue: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  infoCardSubtext: { fontSize: 10, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.08)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,171,220,0.15)' },
  menuIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,154,162,0.15)', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,154,162,0.3)', gap: 10 },
  logoutIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,154,162,0.2)', justifyContent: 'center', alignItems: 'center' },
  logoutText: { fontSize: 16, color: '#FF9AA2', fontFamily: 'Poppins_700Bold' },
  footerText: { textAlign: 'center', fontSize: 12, color: '#876BB8', fontFamily: 'Poppins_400Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#2A1A35', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, maxHeight: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  modalTitle: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', flex: 1 },
  modalScroll: { paddingHorizontal: 24, paddingBottom: 40 },
  inputLabel: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', borderWidth: 1, borderColor: 'rgba(196,171,220,0.3)' },
  saveButton: { borderRadius: 12, overflow: 'hidden', marginTop: 32, marginBottom: 40 },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  languageModalContent: { backgroundColor: '#2A1A35', borderRadius: 24, padding: 24, marginHorizontal: 24, marginVertical: 'auto' },
  languageModalTitle: { fontSize: 22, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 24, textAlign: 'center' },
  languageOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(196,171,220,0.08)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  languageOptionActive: { backgroundColor: 'rgba(196,171,220,0.15)', borderColor: '#C4ABDC' },
  languageFlag: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(196,171,220,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  languageFlagText: { fontSize: 28 },
  languageInfo: { flex: 1 },
  languageName: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  languageNative: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular' },
  cancelButton: { backgroundColor: 'rgba(196,171,220,0.15)', borderRadius: 12, padding: 16, marginTop: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 15, color: '#C4ABDC', fontFamily: 'Poppins_600SemiBold' },
});