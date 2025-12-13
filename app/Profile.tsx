import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('fr');

  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPoids, setEditPoids] = useState('');
  const [editTaille, setEditTaille] = useState('');

  const unsubscribeRef = useRef<null | (() => void)>(null);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);

    // Crée le document si inexistant
    getDoc(userRef).then(docSnap => {
      if (!docSnap.exists()) {
        setDoc(userRef, {
          nom: '',
          prenom: '',
          age: 0,
          poids: 0,
          taille: 0,
          poidsAvantGrossesse: 0,
          semaineGrossesse: 0,
          dateAccouchement: '',
          email: currentUser.email || '',
        });
      }
    });

    // Écoute sécurisée
    unsubscribeRef.current = onSnapshot(
      userRef,
      docSnap => {
        if (docSnap.exists() && currentUser) {
          const data = docSnap.data() as UserData;
          setUserData({ ...data, email: currentUser.email || '' });
        }
      },
      error => console.error('Firestore snapshot error:', error)
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
              }
              await signOut(auth);
              router.replace('/login');
            } catch {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
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
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
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
      Alert.alert('Succès', 'Profil mis à jour');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    }
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
    Alert.alert(
      'Changement de langue',
      `La langue ${lang === 'fr' ? 'Français' : lang === 'ar' ? 'العربية' : 'English'} sera disponible dans une prochaine mise à jour.`,
      [{ text: 'OK' }]
    );
  };

  const calculateIMC = () => {
    if (!userData || userData.taille === 0) return 0;
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
    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!fontsLoaded || !userData) return null;

  const menuItems = [
    { icon: 'person-outline', title: 'Modifier le profil', subtitle: 'Informations personnelles', color: '#C4ABDC', onPress: handleEditProfile },
    { icon: 'language-outline', title: 'Langue', subtitle: selectedLanguage === 'fr' ? 'Français' : selectedLanguage === 'ar' ? 'العربية' : 'English', color: '#9B88D3', onPress: () => setLanguageModalVisible(true) },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: notifications ? 'Activées' : 'Désactivées', color: '#FFB5E8', hasSwitch: true, switchValue: notifications, onSwitchChange: setNotifications },
    { icon: 'moon-outline', title: 'Mode sombre', subtitle: darkMode ? 'Activé (Bientôt disponible)' : 'Désactivé', color: '#876BB8', hasSwitch: true, switchValue: darkMode, onSwitchChange: (val: boolean) => { setDarkMode(val); Alert.alert('Info', 'Le mode sombre sera disponible dans une prochaine mise à jour'); } },
    { icon: 'document-text-outline', title: 'Conditions d\'utilisation', subtitle: 'Politique de confidentialité', color: '#BBA0E8', onPress: () => Alert.alert('Info', 'Conditions d\'utilisation') },
    { icon: 'help-circle-outline', title: 'Aide & Support', subtitle: 'Besoin d\'aide ?', color: '#9B88D3', onPress: () => Alert.alert('Support', 'Contactez-nous : support@santefem.com') },
    { icon: 'information-circle-outline', title: 'À propos', subtitle: 'Version 1.0.0', color: '#C4ABDC', onPress: () => Alert.alert('SantéFem', 'Version 1.0.0\n\nVotre compagnon santé au quotidien') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#C4ABDC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Carte profil et stats */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <LinearGradient colors={['#BBA0E8', '#9B88D3', '#876BB8']} start={[0, 0]} end={[1, 1]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{userData.prenom.charAt(0).toUpperCase()}{userData.nom.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
                <TouchableOpacity style={styles.editAvatarButton}><Ionicons name="camera" size={18} color="#FFFFFF" /></TouchableOpacity>
              </View>
              <Text style={styles.profileName}>{userData.prenom} {userData.nom}</Text>
              <Text style={styles.profileEmail}>{userData.email}</Text>

              <View style={styles.profileStats}>
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>S{userData.semaineGrossesse}</Text>
                  <Text style={styles.profileStatLabel}>Semaine</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{getDaysUntilDue()}j</Text>
                  <Text style={styles.profileStatLabel}>Restants</Text>
                </View>
                <View style={styles.profileStatDivider} />
                <View style={styles.profileStatItem}>
                  <Text style={styles.profileStatValue}>{calculateIMC()}</Text>
                  <Text style={styles.profileStatLabel}>IMC</Text>
                </View>
              </View>
            </View>

            {/* Info cards */}
            <View style={styles.infoCards}>
              <View style={styles.infoCard}>
                <View style={styles.infoCardIcon}><Ionicons name="body-outline" size={24} color="#C4ABDC" /></View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>Poids actuel</Text>
                  <Text style={styles.infoCardValue}>{userData.poids} kg</Text>
                  <Text style={styles.infoCardSubtext}>+{calculateWeightGain()} kg depuis le début</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoCardIcon}><Ionicons name="calendar-outline" size={24} color="#FFB5E8" /></View>
                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardLabel}>Date prévue</Text>
                  <Text style={styles.infoCardValue}>{userData.dateAccouchement}</Text>
                  <Text style={styles.infoCardSubtext}>{getDaysUntilDue()} jours restants</Text>
                </View>
              </View>
            </View>

            {/* Paramètres */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Paramètres</Text>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={item.hasSwitch ? 1 : 0.7}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '33' }]}><Ionicons name={item.icon as any} size={22} color={item.color} /></View>
                  <View style={styles.menuContent}><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuSubtitle}>{item.subtitle}</Text></View>
                  {item.hasSwitch ? <Switch value={item.switchValue} onValueChange={item.onSwitchChange} trackColor={{ false: '#5D3A7D', true: '#C4ABDC' }} thumbColor="#FFFFFF" /> : <Ionicons name="chevron-forward" size={20} color="#9B88D3" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Déconnexion */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={22} color="#FF9AA2" /></View>
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>Membre depuis {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</Text>
          </View>
        </ScrollView>

        {/* Modals */}
        {/* Edit Profile Modal */}
        <Modal visible={editModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier le profil</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><Ionicons name="close" size={28} color="#C4ABDC" /></TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Nom *</Text>
                <TextInput style={styles.input} placeholder="Votre nom" placeholderTextColor="#9B88D3" value={editNom} onChangeText={setEditNom} />
                <Text style={styles.inputLabel}>Prénom *</Text>
                <TextInput style={styles.input} placeholder="Votre prénom" placeholderTextColor="#9B88D3" value={editPrenom} onChangeText={setEditPrenom} />
                <Text style={styles.inputLabel}>Âge *</Text>
                <TextInput style={styles.input} placeholder="Votre âge" placeholderTextColor="#9B88D3" keyboardType="numeric" value={editAge} onChangeText={setEditAge} />
                <Text style={styles.inputLabel}>Poids actuel (kg) *</Text>
                <TextInput style={styles.input} placeholder="Ex: 65" placeholderTextColor="#9B88D3" keyboardType="decimal-pad" value={editPoids} onChangeText={setEditPoids} />
                <Text style={styles.inputLabel}>Taille (cm) *</Text>
                <TextInput style={styles.input} placeholder="Ex: 165" placeholderTextColor="#9B88D3" keyboardType="numeric" value={editTaille} onChangeText={setEditTaille} />
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <LinearGradient colors={['#BBA0E8', '#9B88D3', '#876BB8']} start={[0,0]} end={[1,1]} style={styles.saveButtonGradient}>
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Language Modal */}
        <Modal visible={languageModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.languageModalContent}>
              <Text style={styles.languageModalTitle}>Choisir la langue</Text>
              {['fr','ar','en'].map(lang => (
                <TouchableOpacity key={lang} style={[styles.languageOption, selectedLanguage === lang && styles.languageOptionActive]} onPress={() => handleLanguageSelect(lang)} activeOpacity={0.7}>
                  <View style={styles.languageFlag}><Text style={styles.languageFlagText}>{lang==='fr'?'🇫🇷':lang==='ar'?'🇩🇿':'🇬🇧'}</Text></View>
                  <View style={styles.languageInfo}><Text style={styles.languageName}>{lang==='fr'?'Français':lang==='ar'?'العربية':'English'}</Text><Text style={styles.languageNative}>{lang==='fr'?'French':lang==='ar'?'Arabic':'English'}</Text></View>
                  {selectedLanguage === lang && <Ionicons name="checkmark-circle" size={24} color="#C4ABDC" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLanguageModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

// --- Styles conservés de votre version initiale ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B0E20' },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(196,171,220,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  scrollView: { flex: 1 },
  content: { paddingBottom: 40 },
  profileCard: { backgroundColor: 'rgba(196,171,220,0.1)', margin: 20, borderRadius: 20, padding: 20, alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  editAvatarButton: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#9B88D3', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', marginTop: 12 },
  profileEmail: { fontSize: 14, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginBottom: 12 },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 12 },
  profileStatItem: { alignItems: 'center' },
  profileStatValue: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  profileStatLabel: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  profileStatDivider: { width: 1, backgroundColor: '#C4ABDC33', marginHorizontal: 12 },
  infoCards: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  infoCard: { backgroundColor: 'rgba(196,171,220,0.1)', borderRadius: 15, flex: 1, marginHorizontal: 5, padding: 15, flexDirection: 'row', alignItems: 'center' },
  infoCardIcon: { marginRight: 12 },
  infoCardContent: { flex: 1 },
  infoCardLabel: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  infoCardValue: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  infoCardSubtext: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  section: { marginTop: 30, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  menuSubtitle: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  logoutIcon: { marginRight: 8 },
  logoutText: { fontSize: 16, color: '#FF9AA2', fontFamily: 'Poppins_600SemiBold' },
  footerText: { textAlign: 'center', fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 20 },
  modalOverlay: { flex:1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', maxHeight: '90%', backgroundColor: '#1B0E20', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  modalScroll: { maxHeight: '80%' },
  inputLabel: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#5D3A7D', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, color: '#FFFFFF', fontFamily: 'Poppins_400Regular', marginTop: 5 },
  saveButton: { marginTop: 20, borderRadius: 10 },
  saveButtonGradient: { padding: 12, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
  languageModalContent: { width: '80%', backgroundColor: '#1B0E20', borderRadius: 20, padding: 20 },
  languageModalTitle: { fontSize: 18, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 20, textAlign: 'center' },
  languageOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, marginBottom: 8 },
  languageOptionActive: { backgroundColor: '#C4ABDC33' },
  languageFlag: { marginRight: 10 },
  languageFlagText: { fontSize: 18 },
  languageInfo: { flex: 1 },
  languageName: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold' },
  languageNative: { fontSize: 12, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  cancelButton: { marginTop: 10, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, color: '#FF9AA2', fontFamily: 'Poppins_600SemiBold' }
});
