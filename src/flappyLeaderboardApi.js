import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function submitFlappyScore(db, name, score) {
  await addDoc(collection(db, 'leaderboardFlappy'), { name, score });
  await cleanupFlappyLeaderboard(db); // Ensure cleanup runs after each new score
}

export async function getFlappyTopScores(db, n = 10) {
  const q = query(collection(db, 'leaderboardFlappy'), orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.slice(0, n).map(doc => doc.data());
}

export async function cleanupFlappyLeaderboard(db) {
  const q = query(collection(db, 'leaderboardFlappy'), orderBy('score', 'desc'));
  const querySnapshot = await getDocs(q);
  const docs = querySnapshot.docs;
  // Keep only the top 10, delete the rest
  const docsToDelete = docs.slice(10);
  for (const docSnap of docsToDelete) {
    await deleteDoc(doc(db, 'leaderboardFlappy', docSnap.id));
  }
}