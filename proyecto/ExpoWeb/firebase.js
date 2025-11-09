// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJf8JG0nRXbf3YBAnFV7wHzPNjvbWtoW8",
  authDomain: "rappifarma-ed018.firebaseapp.com",
  projectId: "rappifarma-ed018",
  storageBucket: "rappifarma-ed018.appspot.com", 
  messagingSenderId: "511156364914",
  appId: "1:511156364914:android:0d87f7588b6638c59cc4eb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
