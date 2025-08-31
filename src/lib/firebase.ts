//src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7a3-2kQbyqEmapznH_VA5aFwL40xmOGE",
  authDomain: "nexora-info.firebaseapp.com",
  projectId: "nexora-info",
  storageBucket: "nexora-info.firebasestorage.app",
  messagingSenderId: "316590445260",
  appId: "1:316590445260:web:0bf3ba26f867ba4182a869",
  measurementId: "G-3NBGYT0DK5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
