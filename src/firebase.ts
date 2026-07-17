import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0500973317",
  appId: "1:488625840153:web:c6247afab80c1a6a0a8a88",
  apiKey: "AIzaSyA8Jeglx7NEhBTGPOCfddKMIMUaQCTCbhw",
  authDomain: "gen-lang-client-0500973317.firebaseapp.com",
  storageBucket: "gen-lang-client-0500973317.firebasestorage.app",
  messagingSenderId: "488625840153"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-22fc86ec-15fc-41e4-be12-fc6b5b45f489");
export const auth = getAuth(app);
