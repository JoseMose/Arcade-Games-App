import './App.css';
import React from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Game2048 from './Game2048';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "arcade-game-app.firebaseapp.com",
  databaseURL: "https://arcade-game-app-default-rtdb.firebaseio.com",
  projectId: "arcade-game-app",
  storageBucket: "arcade-game-app.firebasestorage.app",
  messagingSenderId: "974397063956",
  appId: "YOUR_APP_ID",
  measurementId: "G-499446879"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function Home() {
  return (
    <div className="arcade-home">
      <div className="arcade-title">🎮 Arcade Home 🎮</div>
      <Link to="/2048">
        <button className="arcade-btn">Play 2048</button>
      </Link>
      <div className="arcade-footer">Enjoy classic games with a modern twist!</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/2048" element={<Game2048 db={db} />} />
      </Routes>
    </Router>
  );
}

export default App;