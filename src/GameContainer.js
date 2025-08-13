// src/components/GameContainer.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Phaser from 'phaser';
import FlappyBird from './FlappyBird';
import FlappyLeaderboard from './flappyLeaderboard';
import { db } from './firebase';
import './Game2048.css'

export default function GameContainer() {
  // Function to reset the Phaser game
  const handleReset = () => {
    window.location.reload(); // Simple way to reset the game
  };

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      backgroundColor: '#000000',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 500 } }
      },
      scene: [FlappyBird],
      parent: 'phaser-container'
    };

    const game = new Phaser.Game(config);
    game.db = db; // Attach db to the game instance for access in FlappyBird

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div id="phaser-container"></div>
        <div>
          <button className="game2048-reset-btn" onClick={handleReset}>Reset</button>
          <Link to="/" className='game2048-reset-btn'>Back to Home</Link>
        </div>
      </div>
      <FlappyLeaderboard db={db} />
    </div>
  );
}