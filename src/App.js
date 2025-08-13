import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Game2048 from './Game2048';
import Game2 from './Game2';
import GameContainer from './GameContainer';
import './App.css';
import { db } from './firebase';

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
      <Link to="/flappy">
        <button className="arcade-btn">Play Future Bird</button>
      </Link>
      <div className="arcade-footer">Enjoy classic games with a modern twist!</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home db={db} />} />
        <Route path="/2048" element={<Game2048 db={db} />} />
        <Route path="/game2" element={<Game2 db={db} />} />
        <Route path="/flappy" element={<GameContainer db={db} />} />
      </Routes>
    </Router>
  );
}

export default App;