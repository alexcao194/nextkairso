
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { runtimeEnv } from "../config/env";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  Auth,
  User as FirebaseUser,
} from "firebase/auth";

function buildFirebaseConfig() {
  const rt = runtimeEnv();
  return {
    apiKey: rt.firebaseApiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAMf5IWMDzIyl2-OiNEyPymJrL-EHnRC-k",
    authDomain: rt.firebaseAuthDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "leaf-smallbites.firebaseapp.com",
    projectId: rt.firebaseProjectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "leaf-smallbites",
    storageBucket: rt.firebaseStorageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "leaf-smallbites.firebasestorage.app",
    messagingSenderId: rt.firebaseMessagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "626351558175",
    appId: rt.firebaseAppId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:626351558175:web:927d11969bfb033037cf2a",
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    return getApps().length > 0 ? getApp() : initializeApp(buildFirebaseConfig());
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(buildFirebaseConfig());
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export async function firebaseSignInWithEmail(email: string, pass: string): Promise<string> {
  const authInstance = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(authInstance, email.trim(), pass);
  const idToken = await cred.user.getIdToken();
  return idToken;
}

export async function firebaseSignUpWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  const authInstance = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(authInstance, email.trim(), pass);
  try {
    await sendEmailVerification(cred.user);
  } catch (err) {
    console.warn("Email verification could not be sent:", err);
  }
  return cred.user;
}

export async function firebaseSignInWithGoogle(): Promise<string> {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  const cred = await signInWithPopup(authInstance, provider);
  const idToken = await cred.user.getIdToken();
  return idToken;
}

export async function firebaseSendPasswordReset(email: string): Promise<void> {
  const authInstance = getFirebaseAuth();
  await sendPasswordResetEmail(authInstance, email.trim());
}

export async function firebaseSignOut(): Promise<void> {
  try {
    const authInstance = getFirebaseAuth();
    await fbSignOut(authInstance);
  } catch (err) {
    console.warn("Firebase sign out error:", err);
  }
}
