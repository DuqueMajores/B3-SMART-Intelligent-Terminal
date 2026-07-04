import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA4qvbTakDVsFEkHmswMWxajjhyvY1hymQ",
  authDomain: "b3-smart-intelligent-terminal.firebaseapp.com",
  projectId: "b3-smart-intelligent-terminal",
  storageBucket: "b3-smart-intelligent-terminal.firebasestorage.app",
  messagingSenderId: "730277351271",
  appId: "1:730277351271:web:1fe62bf27e85d8a81929c2",
  measurementId: "G-PNMJPW6HS5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase connected successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firebase is offline. Check your configuration or network.");
    } else {
      console.log("Firebase connection initiated.");
    }
  }
}
testConnection();
