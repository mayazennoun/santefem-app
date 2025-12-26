# 🤰 SantéFem - Application de Suivi de Grossesse

<div align="center">

![SantéFem Logo](assets/images/FINAL2-.png)

**Votre compagnon santé au quotidien**

[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-51-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![i18n](https://img.shields.io/badge/i18n-Multilingue-26A69A?style=for-the-badge)](https://react.i18next.com/)

</div>

---

## 📱 À Propos

**SantéFem** est une application mobile complète de suivi de grossesse conçue pour accompagner les futures mamans tout au long de leur parcours. Développée avec React Native et TypeScript, elle offre une expérience utilisateur fluide et intuitive en français et en arabe.

### ✨ Fonctionnalités Principales

- 🍼 **Suivi du Bébé** : Croissance, mouvements, échographies
- 💊 **Ma Santé** : Symptômes, contractions, humeur, tension artérielle
- 📅 **Calendrier** : Gestion des rendez-vous médicaux
- 🏃‍♀️ **Activités** : Exercices et nutrition adaptés
- ⚖️ **Suivi du Poids** : Graphiques d'évolution
- 🛒 **Liste de Courses** : Préparation bébé, maman, maison
- 📖 **Journal Intime** : Souvenirs et émotions
- 👥 **Communauté** : Partage et conseils entre futures mamans
- 📊 **Développement Bébé** : Informations hebdomadaires détaillées

---

## 🛠️ Technologies Utilisées

### Frontend
- **React Native** - Framework mobile
- **TypeScript** - Typage statique
- **Expo** - Plateforme de développement
- **React Navigation** - Navigation
- **Expo Router** - Routing basé sur les fichiers

### Backend & Services
- **Firebase Authentication** - Authentification utilisateurs
- **Cloud Firestore** - Base de données NoSQL en temps réel
- **Firebase Storage** - Stockage des médias

### UI/UX
- **React Native Chart Kit** - Graphiques
- **Linear Gradient** - Dégradés
- **Ionicons** - Icônes
- **Google Fonts (Poppins)** - Typographie

### Internationalisation
- **react-i18next** - Gestion multilingue (Français/Arabe)

---

## 📂 Structure du Projet

```
SantéFem/
├── app/                          # Écrans de l'application
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── home.tsx              # Écran d'accueil
│   │   ├── profile.tsx           # Profil utilisateur
│   │   └── ...
│   ├── Activities.tsx            # Gestion des activités
│   ├── Appointments.tsx          # Rendez-vous médicaux
│   ├── BabyDevelopment.tsx       # Développement hebdomadaire
│   ├── BabyTracking.tsx          # Suivi bébé
│   ├── Community.tsx             # Communauté
│   ├── Journal.tsx               # Journal intime
│   ├── MyHealth.tsx              # Santé et symptômes
│   ├── OnboardingScreen.tsx      # Configuration initiale
│   ├── ShoppingList.tsx          # Liste de courses
│   ├── WeightTracking.tsx        # Suivi du poids
│   ├── login.tsx                 # Connexion
│   ├── signup.tsx                # Inscription
│   └── firebaseConfig.ts         # Configuration Firebase
│
├── locales/                      # Traductions
│   ├── fr.json                   # Français
│   └── ar.json                   # Arabe
│
├── i18n.ts                       # Configuration i18n
├── assets/                       # Images et ressources
└── package.json                  # Dépendances
```

---

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- npm ou yarn
- Expo CLI
- Compte Firebase

### Étapes d'Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/santefem.git
cd santefem
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configuration Firebase**

Créez un fichier `firebaseConfig.ts` dans le dossier `app/` :

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

4. **Lancer l'application**
```bash
npx expo start
```

5. **Scanner le QR code**
- iOS : Utilisez l'app Expo Go
- Android : Utilisez l'app Expo Go

---

---

## 🌍 Multilingue

L'application supporte actuellement :
- 🇫🇷 **Français**
- 🇸🇦 **العربية (Arabe)**

### Ajouter une Nouvelle Langue

1. Créez un fichier `locales/xx.json`
2. Copiez la structure de `fr.json`
3. Traduisez toutes les clés
4. Ajoutez la langue dans `i18n.ts`

---

## 🔐 Authentification

L'application utilise Firebase Authentication avec :
- ✉️ Connexion par email/mot de passe
- 🔒 Réinitialisation de mot de passe
- 👤 Création de compte

---

## 💾 Structure de la Base de Données

### Collections Firestore

```
users/
├── {userId}/
│   ├── nom: string
│   ├── prenom: string
│   ├── age: number
│   ├── semaineGrossesse: number
│   ├── poids: number
│   ├── taille: number
│   ├── poidsAvantGrossesse: number
│   ├── poidsBebe: number
│   ├── dateAccouchement: string
│   └── ...
│
├── activities/
│   ├── {activityId}/
│   │   ├── type: 'exercise' | 'nutrition'
│   │   ├── exerciseType?: string
│   │   ├── duration?: number
│   │   ├── mealType?: string
│   │   ├── foods?: string[]
│   │   ├── calories?: number
│   │   └── createdAt: timestamp
│
├── appointments/
│   ├── {appointmentId}/
│   │   ├── title: string
│   │   ├── type: string
│   │   ├── date: string
│   │   ├── time: string
│   │   ├── doctor: string
│   │   └── location?: string
│
├── baby_measurements/
│   ├── {measurementId}/
│   │   ├── week: number
│   │   ├── weight: number
│   │   ├── height?: number
│   │   ├── headCircumference?: number
│   │   └── createdAt: timestamp
│
├── health_records/
│   ├── {recordId}/
│   │   ├── type: 'symptom' | 'contraction' | 'mood' | 'pressure'
│   │   ├── value: string
│   │   └── createdAt: timestamp
│
├── journal_entries/
│   ├── {entryId}/
│   │   ├── title: string
│   │   ├── content: string
│   │   ├── mood: string
│   │   ├── category: string
│   │   └── createdAt: timestamp
│
├── shopping_items/
│   ├── {itemId}/
│   │   ├── name: string
│   │   ├── category: 'baby' | 'mom' | 'house' | 'other'
│   │   ├── purchased: boolean
│   │   └── createdAt: timestamp
│
└── weight_records/
    ├── {recordId}/
    │   ├── weight: number
    │   └── createdAt: timestamp

community_posts/
├── {postId}/
│   ├── userId: string
│   ├── userName: string
│   ├── title: string
│   ├── content: string
│   ├── category: string
│   ├── week: number
│   ├── likes: number
│   ├── likedBy: string[]
│   ├── commentsCount: number
│   ├── isAnonymous: boolean
│   └── createdAt: timestamp
│
└── comments/
    ├── {commentId}/
    │   ├── userId: string
    │   ├── userName: string
    │   ├── content: string
    │   ├── isAnonymous: boolean
    │   └── createdAt: timestamp
```

---

## 🎨 Thème et Design

### Palette de Couleurs
```css
--primary: #1B0E20
--secondary: #2A1A35
--accent: #C4ABDC
--accent-light: #BBA0E8
--accent-medium: #9B88D3
--accent-dark: #876BB8
--pink: #FFB5E8
--dark-purple: #5D3A7D
```

### Typographie
- **Police** : Poppins (Regular, SemiBold, Bold)
- **Tailles** : 12px - 32px

---

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage
```

---

## 📦 Build & Déploiement

### Build Android (APK)
```bash
eas build --platform android
```

### Build iOS (IPA)
```bash
eas build --platform ios
```

### Déploiement
```bash
eas submit --platform android
eas submit --platform ios
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 Roadmap

- [ ] Notifications push pour les rendez-vous
- [ ] Export des données en PDF
- [ ] Mode sombre
- [ ] Widget pour l'écran d'accueil
- [ ] Intégration avec Apple Health / Google Fit
- [ ] Chat en temps réel avec des sages-femmes
- [ ] Bibliothèque d'exercices vidéo
- [ ] Suivi de l'allaitement post-partum

---

## 🐛 Bugs Connus

Consultez les [Issues](https://github.com/votre-username/santefem/issues) pour voir la liste des bugs connus et des fonctionnalités demandées.

---

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Votre Nom**
- GitHub: [@mayazennoun ](https://github.com/mayazennoun )
- Email: zennounmaya@gmail.com

---

## 🙏 Remerciements

- Toutes les futures mamans qui ont testé l'application

<div align="center">

**Fait avec ❤️ pour les futures mamans**

⭐ N'oubliez pas de laisser une étoile si ce projet vous a aidé !

</div>