// src/components/GameContainer.jsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Phaser from 'phaser';
import FlappyBird from './FlappyBird';
import FlappyLeaderboard from './flappyLeaderboard';
import { db } from './firebase';
import './GameContainer.css'

export default function GameContainer() {

  // Function to reset the Phaser game
  const handleReset = () => {
    window.location.reload();
  };

  useEffect(() => {
    // Responsive game size for mobile and desktop
    const isMobile = window.innerWidth < 600;
    const width = isMobile ? window.innerWidth * 0.98 : 800;
    const height = isMobile ? window.innerHeight * 0.55 : 600;

    const config = {
      type: Phaser.AUTO,
      width: Math.round(width),
      height: Math.round(height),
      backgroundColor: '#000000',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 500 } }
      },
      scene: [FlappyBird],
      parent: 'phaser-container'
    };

    const game = new Phaser.Game(config);
    game.db = db;

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 20,
      width: '100vw',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 800
      }}>
        <div
          id="phaser-container"
          style={{
            width: '100%',
            maxWidth: 800,
            minWidth: 260,
            height: 'auto'
          }}
        ></div>
        <div>
          <button className="game2048-reset-btn" onClick={handleReset}>Reset</button>
          <Link to="/" className='game2048-reset-btn'>Back to Home</Link>
        </div>
      </div>
      <FlappyLeaderboard db={db} />
    </div>
  );
}