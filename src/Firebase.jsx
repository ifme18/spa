// Import the functions you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAdIcl23rMbfgerMSgvtRhBkaY_2lmcKxA",
    authDomain: "university-feeding-program.firebaseapp.com",
    projectId: "university-feeding-program",
    storageBucket: "university-feeding-program.firebasestorage.app",
    messagingSenderId: "1078989844749",
    appId: "1:1078989844749:web:48b4df37935f2b7c54c044",
    measurementId: "G-15GY8PJ7JJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
