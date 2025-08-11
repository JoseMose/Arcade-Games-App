import React from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Game2048 from './Game2048';
import Game2 from './Game2';  // Import the Phaser game component
import PrivacyPolicy from './Privacy'; // Import Privacy Policy component
import Contact from './Contact'; // Import Contact component
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

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

      <Link to="/game2">
        <button className="arcade-btn">Play Phaser Game</button>
      </Link>

      <div className="arcade-footer">Enjoy classic games with a modern twist!</div>

      <div className="corner-links">
      <Link to="/contact">
    <button className="corner-link-btn">Contact Us</button>
  </Link>

        <Link to="/privacy">
          <button className="corner-link-btn">Privacy Policy</button>
        </Link>
      </div>
    </div>
  );
}


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/2048" element={<Game2048 db={db} />} />
        <Route path="/game2" element={<Game2 db={db} />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;