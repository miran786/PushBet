// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmk62bWxYcO0q7xkIbBYZ-VTAJUxvvQF8",
    authDomain: "pushbet-34cbc.firebaseapp.com",
    projectId: "pushbet-34cbc",
    storageBucket: "pushbet-34cbc.firebasestorage.app",
    messagingSenderId: "858630057756",
    appId: "1:858630057756:web:1a395086f4ec07cad9d4d9",
    measurementId: "G-SWKTFEZXXV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
