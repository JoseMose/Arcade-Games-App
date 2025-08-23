import { collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';

export async function submitFlappyScore(db, name, score) {
  // Just create a new score document. Pruning now handled server-side (or ignored).
  await addDoc(collection(db, 'leaderboardFlappy'), { name, score });
}

export async function getFlappyTopScores(db, n = 10) {
  const q = query(collection(db, 'leaderboardFlappy'), orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.slice(0, n).map(doc => doc.data());
}

// Client-side deletion removed to comply with Firestore rules (no delete). Use a Cloud Function for pruning if needed.