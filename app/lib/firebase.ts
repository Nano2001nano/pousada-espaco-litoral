import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4RVOpeyrQnMSenCTy5FHh6AmTzQJcQyA",
  authDomain: "pousada-sistema-e513b.firebaseapp.com",
  projectId: "pousada-sistema-e513b",
  storageBucket: "pousada-sistema-e513b.firebasestorage.app",
  messagingSenderId: "56674103713",
  appId: "1:56674103713:web:270f363a1e3d51ccf29be0"
};

// Validação no console
if (typeof window !== "undefined") {
  console.log("🔥 Projeto Firebase conectado:", firebaseConfig.projectId);
}

// Inicializa o app do Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta o banco Firestore padrão
export const db = getFirestore(app);