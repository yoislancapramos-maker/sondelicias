// ===== CONFIGURACIÓN FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB1s2_96CD-4ZK1de7lC07x0yUAaHOkxZc",
  authDomain: "sondelicias-46725.firebaseapp.com",
  projectId: "sondelicias-46725",
  storageBucket: "sondelicias-46725.firebasestorage.app",
  messagingSenderId: "64314402862",
  appId: "1:64314402862:web:c164ee097dc3d8096ed7bf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };