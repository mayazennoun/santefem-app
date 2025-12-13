import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, useFonts } from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

type FocusedInput = 'email' | 'password' | null;
const { width, height } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/home');
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  }, [email, password, router]);

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);
  const navigateToSignup = useCallback(() => router.push('/signup'), [router]);
  const handleEmailFocus = useCallback(() => setFocusedInput('email'), []);
  const handlePasswordFocus = useCallback(() => setFocusedInput('password'), []);
  const handleBlur = useCallback(() => setFocusedInput(null), []);

  const emailInputStyle = [styles.inputWrapper, focusedInput === 'email' && styles.inputFocused];
  const passwordInputStyle = [styles.inputWrapper, focusedInput === 'password' && styles.inputFocused];

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BBA0E8" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1B0E20', '#2A1A35', '#1B0E20']} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <View style={styles.container}>
          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
            <Image source={require('../assets/images/FINAL2-.png')} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.appTitle}>SantéFem</Text>
            <Text style={styles.subtitle}>Votre compagnon santé au quotidien</Text>
          </Animated.View>

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            {/* Champ E-mail */}
            <View style={emailInputStyle}>
              <MaterialIcons name="email" size={22} color="#C4ABDC" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Adresse e-mail"
                placeholderTextColor="#CBBFE5"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={handleEmailChange} 
                onFocus={handleEmailFocus}
                onBlur={handleBlur}
              />
            </View>

            
            <View style={passwordInputStyle}>
              <MaterialIcons name="lock" size={22} color="#C4ABDC" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#CBBFE5"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={handlePasswordChange} 
                onFocus={handlePasswordFocus}
                onBlur={handleBlur}
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={{ marginLeft: 8 }}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={22} color="#C4ABDC" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <LinearGradient colors={['#BBA0E8', '#9B88D3', '#876BB8']} start={[0, 0]} end={[1, 1]} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Se connecter</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={navigateToSignup}>
              <Text style={styles.signupButtonText}>Créer un compte</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>
              En vous connectant, vous acceptez nos <Text style={styles.footerLink}>Conditions d'utilisation</Text>
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logo: { width: 150, height: 150, marginBottom: -20 },
  appTitle: { fontSize: 28, color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#C4ABDC', fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 16 },
  formContainer: { width: '100%', maxWidth: 400 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 3, paddingHorizontal: 16, backgroundColor: '#2A1A35', borderRadius: 80, marginBottom: 15, borderWidth: 1, borderColor: '#5D3A7D' },
  inputFocused: { borderColor: '#BBA0E8' },
  input: { flex: 1, fontSize: 16, color: '#FFFFFF', fontFamily: 'Poppins_400Regular' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 12 },
  forgotPasswordText: { color: '#BBA0E8', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  button: { width: '100%', borderRadius: 80, marginBottom: 12, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 15, borderRadius: 80, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Poppins_700Bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  divider: { flex: 1, height: 1, backgroundColor: '#5D3A7D' },
  dividerText: { marginHorizontal: 16, color: '#CBBFE5', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  signupButton: { width: '100%', paddingVertical: 14, borderRadius: 80, borderWidth: 2, borderColor: '#BBA0E8', backgroundColor: 'transparent', alignItems: 'center' },
  signupButtonText: { color: '#BBA0E8', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  footer: { marginTop: 20, paddingHorizontal: 20 },
  footerText: { fontSize: 13, color: '#CBBFE5', textAlign: 'center', fontFamily: 'Poppins_400Regular', lineHeight: 18 },
  footerLink: { color: '#BBA0E8', fontFamily: 'Poppins_600SemiBold', textDecorationLine: 'underline' },
});