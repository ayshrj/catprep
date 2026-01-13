import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;

function initAdminApp() {
  if (cachedApp) return cachedApp;

  if (getApps().length) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set");
  }

  const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, "base64").toString("utf-8"));

  cachedApp = initializeApp({
    credential: cert(serviceAccount),
  });

  return cachedApp;
}

export function getAdminDb() {
  if (cachedDb) return cachedDb;

  try {
    const app = initAdminApp();
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (error) {
    console.error("Firebase Admin initialization failed", error);
    return null;
  }
}

export function getAdminAuth() {
  if (cachedAuth) return cachedAuth;

  try {
    const app = initAdminApp();
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (error) {
    console.error("Firebase Admin Auth initialization failed", error);
    return null;
  }
}
