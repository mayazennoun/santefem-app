import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth } from './firebaseConfig';

type FocusedInput = 'email' | 'password' | 'confirm' | 'name' | null;

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<FocusedInput>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [fontsLoaded]);

  const handleSignup = useCallback(async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });

      Alert.alert('Succès', `Compte créé pour ${fullName}`, [
        { text: 'OK', onPress: () => router.push('/OnboardingScreen') }
      ]);
    } catch (error: any) {
      let errorMessage = 'Erreur lors de la création du compte';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Cet email est déjà utilisé';
      else if (error.code === 'auth/invalid-email') errorMessage = 'Format d\'email invalide';
      else if (error.code === 'auth/weak-password') errorMessage = 'Le mot de passe est trop faible';
      else if (error.code === 'auth/network-request-failed') errorMessage = 'Erreur de connexion. Vérifiez votre internet';
      Alert.alert('Erreur', errorMessage);
    }
  }, [fullName, email, password, confirmPassword, router]);

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);
  const toggleConfirmVisibility = useCallback(() => setShowConfirm(prev => !prev), []);
  const goToLogin = useCallback(() => router.push('/login'), [router]);
  const goBack = useCallback(() => router.back(), [router]);

  const handleFocus = (field: FocusedInput) => setFocusedInput(field);
  const handleBlur = () => setFocusedInput(null);
  const inputStyle = (field: FocusedInput) => [styles.inputWrapper, focusedInput === field && styles.inputFocused];

  if (!fontsLoaded) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#9B88D3" /></View>;

  return (
    <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <MaterialIcons name="arrow-back" size={20} color="#C4ABDC" />
          </TouchableOpacity>

          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <Image source={require('../assets/images/FINAL2-.png')} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.appTitle}>SantéFem</Text>
            <Text style={styles.subtitle}>Bienvenue parmi nous</Text>
          </Animated.View>

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={inputStyle('name')}>
              <MaterialIcons name="person" size={18} color="#C4ABDC" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Nom complet"
                placeholderTextColor="#CBBFE5"
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => handleFocus('name')}
                onBlur={handleBlur}
              />
            </View>

            <View style={inputStyle('email')}>
              <MaterialIcons name="email" size={18} color="#C4ABDC" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Adresse e-mail"
                placeholderTextColor="#CBBFE5"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleFocus('email')}
                onBlur={handleBlur}
              />
            </View>

            <View style={inputStyle('password')}>
              <MaterialIcons name="lock" size={18} color="#C4ABDC" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#CBBFE5"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => handleFocus('password')}
                onBlur={handleBlur}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={{ marginLeft: 6 }}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={18} color="#C4ABDC" />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordNote}>Minimum 8 caractères</Text>

            <View style={inputStyle('confirm')}>
              <MaterialIcons name="lock" size={18} color="#C4ABDC" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#CBBFE5"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => handleFocus('confirm')}
                onBlur={handleBlur}
              />
              <TouchableOpacity onPress={toggleConfirmVisibility} style={{ marginLeft: 6 }}>
                <MaterialIcons name={showConfirm ? 'visibility' : 'visibility-off'} size={18} color="#C4ABDC" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
              <LinearGradient colors={['#BBA0E8', '#9B88D3', '#876BB8']} start={[0,0]} end={[1,1]} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>S'inscrire</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              En vous inscrivant, vous acceptez nos <Text style={styles.termsLink}>Conditions d'utilisation</Text>
            </Text>

            <TouchableOpacity style={styles.loginButton} onPress={goToLogin}>
              <Text style={styles.loginButtonText}>Déjà un compte ? Se connecter</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1B0E20' },

  backButton: { position: 'absolute', top: 50, left: 12, zIndex: 10 },

  logoContainer: { marginBottom: -30, alignItems: 'center' },
  logo: { width: 150, height: 150 },
  appTitle: { fontSize: 26, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 16 },

  formContainer: { width: '100%', maxWidth: 400 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 14, backgroundColor: '#2A1A35', borderRadius: 80, marginBottom: 20, borderWidth: 1, borderColor: '#5D3A7D' },
  inputFocused: { borderColor: '#BBA0E8' },
  input: { flex: 1, fontSize: 15, color: '#FFFFFF', fontFamily: 'Poppins_400Regular' },
  passwordNote: { fontSize: 11, marginBottom: 10, marginLeft: 12, color: '#C4ABDC' },

  button: { width: '100%', borderRadius: 80, marginBottom: 16, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 15, borderRadius: 80, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontFamily: 'Poppins_700Bold', color: '#FFF' },

  termsText: { fontSize: 12, color: '#CBBFE5', textAlign: 'center', marginBottom: 16 },
  termsLink: { color: '#9B88D3', textDecorationLine: 'underline' },

  loginButton: { width: '100%', paddingVertical: 14, borderRadius: 80, borderWidth: 2, borderColor: '#BBA0E8', alignItems: 'center', marginBottom: 32 },
  loginButtonText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#876BB8' },
});