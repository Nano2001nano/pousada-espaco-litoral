import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Configurações de autenticação e conexão com o Firebase.
 * Chaves públicas do projeto 'pousada-sistema-e513b' utilizadas
 * para comunicação direta do cliente/servidor com o Firestore.
 */
const firebaseConfig = {
  apiKey: "AIzaSyB4RVOpeyrQnMSenCTy5FHh6AmTzQJcQyA",
  authDomain: "pousada-sistema-e513b.firebaseapp.com",
  projectId: "pousada-sistema-e513b",
  storageBucket: "pousada-sistema-e513b.firebasestorage.app",
  messagingSenderId: "56674103713",
  appId: "1:56674103713:web:270f363a1e3d51ccf29be0"
};

/**
 * Log de diagnóstico no navegador (lado do cliente) para
 * confirmar a inicialização correta sem interferir no SSR do Next.js.
 */
if (typeof window !== "undefined") {
  console.log("🔥 Projeto Firebase conectado:", firebaseConfig.projectId);
}

/**
 * Padrão Singleton para Inicialização do Firebase:
 * Garante que apenas uma instância da aplicação Firebase seja criada,
 * prevenindo erros de reinicialização duplicada durante o Fast Refresh do Next.js.
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Instância exportada do Cloud Firestore.
 * Utilizada em todo o sistema para operações de leitura, escrita e escuta em tempo real.
 */
export const db = getFirestore(app);