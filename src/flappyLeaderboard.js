import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

function FlappyLeaderboard({ db }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const q = query(collection(db, 'leaderboardFlappy'), orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      setLeaderboard(querySnapshot.docs.map(doc => doc.data()));
    }
    fetchLeaderboard();
  }, [db]);

  return (
    <div className="flappy-leaderboard">
      <h2>Leaderboard</h2>
      <ol>
        {leaderboard.length === 0 && <li>No scores yet</li>}
        {leaderboard.map((entry, idx) => (
          <li key={idx}>{entry.name}: {entry.score}</li>
        ))}
      </ol>
    </div>
  );
}

export default FlappyLeaderboard;