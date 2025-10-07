
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBJ5yuhC0LGg07SdSsZLMxWTmuHqdQowDU",
  authDomain: "ayuda-app-dc476.firebaseapp.com",
  projectId: "ayuda-app-dc476",
  storageBucket: "ayuda-app-dc476.firebasestorage.app",
  messagingSenderId: "460989291693",
  appId: "1:460989291693:web:b36522c9f23dca870bfa24"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);