import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "arcade-game-app.firebaseapp.com",
  databaseURL: "https://arcade-game-app-default-rtdb.firebaseio.com",
  projectId: "arcade-game-app",
  storageBucket: "arcade-game-app.appspot.com",
  messagingSenderId: "974397063956",
  appId: "YOUR_APP_ID",
  measurementId: "G-499446879"
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const leaderboardCollection = collection(db, 'leaderboard2048');
