import { initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBe2258L1JWAeclL-Htmx_zTzbAqkMm_UE',
  authDomain: 'santefem-9ae74.firebaseapp.com',
  projectId: 'santefem-9ae74',
  storageBucket: 'santefem-9ae74.appspot.com',
  messagingSenderId: '590326820096',
  appId: '1:590326820096:web:2094e70c7e192da2b1d7e5',
};

const app = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
