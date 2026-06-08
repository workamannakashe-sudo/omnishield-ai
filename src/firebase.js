import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, update } from 'firebase/database';

// Default public Firebase project configuration for the hackathon.
// Users can replace this config with their own credentials.
const firebaseConfig = {
  apiKey: "AIzaSyDummyApiKeyForOmniShieldDemo2026",
  authDomain: "omnishield-ai-demo.firebaseapp.com",
  databaseURL: "https://omnishield-ai-demo-default-rtdb-default-rtdb.firebaseio.com",
  projectId: "omnishield-ai-demo",
  storageBucket: "omnishield-ai-demo.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

let app = null;
let db = null;
let firebaseActive = false;
const statusListeners = new Set();

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  
  // Listen to connection status
  const connectedRef = ref(db, '.info/connected');
  onValue(connectedRef, (snap) => {
    const isConnected = snap.val() === true;
    firebaseActive = isConnected;
    statusListeners.forEach(listener => listener(isConnected));
  }, (err) => {
    console.warn("Firebase connection failed. Falling back to local synchronization.", err);
    firebaseActive = false;
    statusListeners.forEach(listener => listener(false));
  });
} catch (e) {
  console.warn("Firebase failed to initialize. Falling back to local synchronization.", e);
  firebaseActive = false;
}

export function subscribeFirebaseStatus(callback) {
  statusListeners.add(callback);
  callback(firebaseActive);
  return () => statusListeners.delete(callback);
}

export function isFirebaseConnected() {
  return firebaseActive;
}

// Write state helper (with error handling and fallback)
export async function writeDbState(path, data) {
  if (!db || !firebaseActive) return false;
  try {
    const stateRef = ref(db, path);
    await set(stateRef, data);
    return true;
  } catch (error) {
    console.error("Firebase write error:", error);
    return false;
  }
}

// Update partial state helper
export async function updateDbState(path, updates) {
  if (!db || !firebaseActive) return false;
  try {
    const stateRef = ref(db, path);
    await update(stateRef, updates);
    return true;
  } catch (error) {
    console.error("Firebase update error:", error);
    return false;
  }
}

// Subscribe to state helper
export function subscribeDbState(path, callback) {
  if (!db) {
    callback(null);
    return () => {};
  }
  
  const stateRef = ref(db, path);
  const listener = onValue(stateRef, (snapshot) => {
    callback(snapshot.val());
  }, (error) => {
    console.warn(`Firebase read error on path ${path}:`, error);
  });
  
  return () => off(stateRef, 'value', listener);
}
