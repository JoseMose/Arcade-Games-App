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
    const config = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
      },
      backgroundColor: '#000000',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 500 } }
      },
      scene: [FlappyBird]
    };
    const game = new Phaser.Game(config);
    game.db = db;

    const handleResize = () => {
      game.scale.refresh();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      game.destroy(true);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: window.innerWidth < 900 ? 'column' : 'row',
      alignItems: 'flex-start',
      gap: 20,
      width: '100vw',
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: 'calc(60px + env(safe-area-inset-top,0)) 12px 48px'
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
            aspectRatio: '4 / 3',
            position: 'relative'
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