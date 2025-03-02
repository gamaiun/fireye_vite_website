import { initializeApp } from "./node_modules/firebase/app/dist/index.mjs";
import { getFirestore } from "./node_modules/firebase/firestore/dist/index.mjs";
import { getStorage } from "./node_modules/firebase/storage/dist/index.mjs";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXmpwAy7bdxh4JZYx4zOLz0je459WLREk",
  authDomain: "fireye-91940.firebaseapp.com",
  projectId: "fireye-91940",
  storageBucket: "fireye-91940.firebasestorage.app",
  messagingSenderId: "930523613502",
  appId: "1:930523613502:web:95cf7c6757a135453e446f",
  measurementId: "G-1SFE69CPLY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
