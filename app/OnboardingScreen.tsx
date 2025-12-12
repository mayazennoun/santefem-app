import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { auth, db } from './firebaseConfig';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [age, setAge] = useState('');
  const [poids, setPoids] = useState('');
  const [taille, setTaille] = useState('');
  const [semaineGrossesse, setSemaineGrossesse] = useState('');
  const [poidsAvantGrossesse, setPoidsAvantGrossesse] = useState('');
  const [dateAccouchement, setDateAccouchement] = useState('');

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  if (!fontsLoaded) return null;

  const calculateTrimester = (week: number) => (week <= 13 ? 1 : week <= 27 ? 2 : 3);

  // Tableau de poids corrigé → cohérent médicalement
  const babyWeights: { [key: number]: number } = {
    8: 0.01,
    10: 0.04,
    12: 0.1,
    14: 0.15,
    16: 0.2,
    18: 0.25,
    20: 0.3,
    22: 0.43,
    24: 0.6,
    26: 0.76,
    28: 1.0,
    30: 1.3,
    32: 1.7,
    34: 2.1,
    36: 2.6,
    38: 3.0,
    40: 3.4
  };

  const calculateBabyWeight = (week: number) => {
    const weeks = Object.keys(babyWeights).map(Number).sort((a, b) => a - b);

    // Si semaine est avant la 1ʳᵉ valeur connue
    if (week <= weeks[0]) return babyWeights[weeks[0]];

    // Interpolation
    for (let i = 0; i < weeks.length - 1; i++) {
      if (week >= weeks[i] && week <= weeks[i + 1]) {
        const w1 = weeks[i];
        const w2 = weeks[i + 1];
        const v1 = babyWeights[w1];
        const v2 = babyWeights[w2];
        return +(v1 + ((week - w1) / (w2 - w1)) * (v2 - v1)).toFixed(2);
      }
    }

    // Si semaine dépasse 40
    return babyWeights[weeks[weeks.length - 1]];
  };

  const handleNext = () => {
    if (step === 1 && (!nom || !prenom || !age))
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs');

    if (step === 2 && (!poids || !taille || !poidsAvantGrossesse))
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs');

    setStep(step + 1);
  };

  const handleFinish = async () => {
    if (!semaineGrossesse || !dateAccouchement)
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs');

    const weekNum = parseInt(semaineGrossesse);
    if (weekNum < 1 || weekNum > 42)
      return Alert.alert('Erreur', 'La semaine de grossesse doit être entre 1 et 42');

    if (!auth.currentUser)
      return Alert.alert('Erreur', 'Utilisateur non connecté');

    const userData = {
      nom,
      prenom,
      age: parseInt(age),
      poids: parseFloat(poids),
      taille: parseFloat(taille),
      poidsAvantGrossesse: parseFloat(poidsAvantGrossesse),
      semaineGrossesse: weekNum,
      dateAccouchement,
      trimestre: calculateTrimester(weekNum),
      poidsBebe: calculateBabyWeight(weekNum),
      dateInscription: new Date()
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), userData);
      Alert.alert('Succès', 'Profil créé avec succès !');
      router.replace('/home');
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Impossible de sauvegarder les données');
    }
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="person-outline" size={40} color="#C4ABDC" />
      </View>

      <Text style={styles.stepTitle}>Informations personnelles</Text>
      <Text style={styles.stepSubtitle}>Commençons par vous connaître</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom</Text>
        <TextInput style={styles.input} placeholder="Votre nom" placeholderTextColor="#9B88D3" value={nom} onChangeText={setNom} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.input} placeholder="Votre prénom" placeholderTextColor="#9B88D3" value={prenom} onChangeText={setPrenom} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Âge</Text>
        <TextInput style={styles.input} placeholder="Votre âge" placeholderTextColor="#9B88D3" keyboardType="numeric" value={age} onChangeText={setAge} />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="fitness-outline" size={40} color="#C4ABDC" />
      </View>

      <Text style={styles.stepTitle}>Informations physiques</Text>
      <Text style={styles.stepSubtitle}>Pour un suivi personnalisé</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Poids actuel</Text>
        <TextInput style={styles.input} placeholder="Ex: 65" placeholderTextColor="#9B88D3" keyboardType="decimal-pad" value={poids} onChangeText={setPoids} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Taille (cm)</Text>
        <TextInput style={styles.input} placeholder="Ex: 165" placeholderTextColor="#9B88D3" keyboardType="numeric" value={taille} onChangeText={setTaille} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Poids avant grossesse</Text>
        <TextInput style={styles.input} placeholder="Ex: 60" placeholderTextColor="#9B88D3" keyboardType="decimal-pad" value={poidsAvantGrossesse} onChangeText={setPoidsAvantGrossesse} />
      </View>
    </View>
  );

  const renderStep3 = () => {
    const validWeek = semaineGrossesse && Number(semaineGrossesse) >= 1 && Number(semaineGrossesse) <= 42;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="body-outline" size={40} color="#C4ABDC" />
        </View>

        <Text style={styles.stepTitle}>Informations de grossesse</Text>
        <Text style={styles.stepSubtitle}>Dernière étape</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Semaine de grossesse</Text>
          <TextInput style={styles.input} placeholder="Ex: 24" placeholderTextColor="#9B88D3" keyboardType="numeric" value={semaineGrossesse} onChangeText={setSemaineGrossesse} />
          <Text style={styles.helperText}>Entre 1 et 42 semaines</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date prévue d'accouchement</Text>
          <TextInput style={styles.input} placeholder="JJ/MM/AAAA" placeholderTextColor="#9B88D3" value={dateAccouchement} onChangeText={setDateAccouchement} />
        </View>

        {validWeek && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Aperçu</Text>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Trimestre</Text>
              <Text style={styles.previewValue}>{calculateTrimester(Number(semaineGrossesse))}</Text>
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Poids bébé estimé</Text>
              <Text style={styles.previewValue}>{calculateBabyWeight(Number(semaineGrossesse))} kg</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 60 : 120}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Étape {step}/3</Text>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttonContainer}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color="#C4ABDC" />
                <Text style={styles.backButtonText}>Retour</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.nextButton} onPress={step === 3 ? handleFinish : handleNext}>
              <LinearGradient colors={['#C4ABDC', '#9B88D3', '#876BB8']} style={styles.nextButtonGradient}>
                <Text style={styles.nextButtonText}>{step === 3 ? 'Terminer' : 'Suivant'}</Text>
                <Ionicons name={step === 3 ? 'checkmark' : 'arrow-forward'} size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B0E20' },
  gradient: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 30, paddingTop: 60, paddingBottom: 170 },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: 'rgba(196, 171, 220, 0.2)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#C4ABDC', borderRadius: 3 },
  progressText: { color: '#C4ABDC', fontSize: 14, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
  stepContainer: { flex: 1 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(196, 171, 220, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(196, 171, 220, 0.3)'
  },
  stepTitle: { fontSize: 26, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', textAlign: 'center', marginBottom: 8 },
  stepSubtitle: { fontSize: 15, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 32 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, color: '#C4ABDC', fontFamily: 'Poppins_600SemiBold', marginBottom: 3, paddingLeft: 8 },
  input: {
    backgroundColor: 'rgba(196, 171, 220, 0.1)',
    borderRadius: 80,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: 'rgba(196, 171, 220, 0.3)'
  },
  helperText: { fontSize: 12, color: '#9B88D3', fontFamily: 'Poppins_400Regular', marginTop: 7, paddingLeft: 8 },
  previewCard: {
    backgroundColor: 'rgba(196, 171, 220, 0.15)',
    borderRadius: 16,
    padding: 20,
    marginTop: -5,
    borderWidth: 1,
    borderColor: 'rgba(196, 171, 220, 0.3)'
  },
  previewTitle: { fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_700Bold', marginBottom: 3 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontSize: 14, color: '#C4ABDC', fontFamily: 'Poppins_400Regular' },
  previewValue: { fontSize: 14, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    position: 'absolute',
    bottom: 80,
    left: 24,
    right: 24
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#C4ABDC',
    gap: 8
  },
  backButtonText: { color: '#C4ABDC', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  nextButton: { flex: 1, borderRadius: 80, overflow: 'hidden' },
  nextButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' }
});
