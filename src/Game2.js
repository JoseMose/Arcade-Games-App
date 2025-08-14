import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // <-- Add this import
import './Game2.css';

function Game2({ db }) {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameKey, setGameKey] = useState(0);
  const navigate = useNavigate(); // <-- Add this line

  // Fetch leaderboard from Firestore
  const fetchLeaderboard = useCallback(async () => {
    try {
      const q = query(collection(db, 'leaderboardEnemyGame'), orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const scores = [];
      querySnapshot.forEach(doc => {
        scores.push(doc.data()); // Push the whole data object
      });
      setLeaderboard(scores);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }, [db]);

  // Add score to Firestore and refresh leaderboard
 const updateLeaderboard = useCallback(async (newScore) => {
  if (newScore <= 0) return;

  try {
    const leaderboardRef = collection(db, 'leaderboardEnemyGame');
    const top10Query = query(leaderboardRef, orderBy('score', 'desc'), limit(10));
    const top10Snapshot = await getDocs(top10Query);

    const scores = [];
    top10Snapshot.forEach(doc => {
      scores.push({ id: doc.id, score: doc.data().score });
    });

    // If less than 10 scores, add new score
    if (scores.length < 10) {
      await addDoc(leaderboardRef, { score: newScore });
      await fetchLeaderboard();
      return;
    }

    const lowestTopScore = scores[scores.length - 1].score;

    if (newScore > lowestTopScore) {
      // Add the new score
      await addDoc(leaderboardRef, { score: newScore });

      // Get all scores, ordered by score DESC
      const allScoresQuery = query(leaderboardRef, orderBy('score', 'desc'));
      const allScoresSnapshot = await getDocs(allScoresQuery);

      const allScores = [];
      allScoresSnapshot.forEach(doc => {
        allScores.push({ id: doc.id, score: doc.data().score });
      });

      // Keep only the top 10, delete the rest
      const scoresToDelete = allScores.slice(10);
      for (const s of scoresToDelete) {
        await deleteDoc(doc(db, 'leaderboardEnemyGame', s.id));
      }

      await fetchLeaderboard();
    } else {
      // Always refresh leaderboard, even if score not high enough
      await fetchLeaderboard();
    }

  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}, [db, fetchLeaderboard]);
  const handleReset = () => {
    setGameKey(k => k + 1);
    fetchLeaderboard();
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!gameRef.current) return;

    // Define the Phaser scene class, pass updateLeaderboard via constructor
    class EnemyGameScene extends Phaser.Scene {
      constructor(updateLeaderboardCallback) {
        super('enemyGame');
        this.score = 0;
        this.updateLeaderboard = updateLeaderboardCallback;
      }

      preload() {
        // (same as before: load your base64 images)
        this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABJ0lEQVR4nO3XsQmCQBRF0dk0qkSk2Gk3YD0AtpASm9gH0B2kBJr2A9ANpASa9g/3G+0t7m2t5y5c8DgQIECBAgAABAgQIECBAgAABAj4E7Q/wmXuA4XIxL+jw3g2k7uKfZ0q4F2+5k5Qk4j6tE0N+gqQG6p8p7k0aE2u9Z0r7hAz5a2sQoQIECBAgAABAgQIECBAgAABAgQ2K8A6aM9mWcA2qv0x0wQIECBAgAABAgQIECBAgAABAgQIECBwH8wB3j3rX6I9NJwAAAABJRU5ErkJggg==');
        this.load.image('coin', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAdVBMVEUAAAD///////////////////////////////8AAAD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABvT1rUAAAAKXRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAiIyQl8y8kAAAAF0lEQVQY02NgQANGAAQYBgYmBgYGBgYGBgYGBgYBwAAK3gC4mHnQZQAAAAAElFTkSuQmCC');
        this.load.image('enemy', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAXVBMVEUAAAD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABm2n8uAAAAKXRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAiIyQl2y1pAAAAF0lEQVQY02NgQANGAAQYBgYmBgYGBgYGBgYGBgYBwAAANbACe3+2ZQAAAAASUVORK5CYII=');
      }

      create() {
        this.cameras.main.setBackgroundColor('#07203a');
        this.player = this.physics.add.image(400, 300, 'player').setOrigin(0.5).setScale(2);
        this.player.setCollideWorldBounds(true);

        this.coins = this.physics.add.group();
        this.enemies = this.physics.add.group();

        this.score = 0;
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', {
          fontFamily: "'Press Start 2P'",
          fontSize: 20,
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 3,
        });

        this.cleanEnemy = (enemy) => {
          if (enemy.strengthText) {
            enemy.strengthText.destroy();
            enemy.strengthText = null;
          }
          enemy.destroy();
        };

        this.spawnCoin = () => {
          const x = Phaser.Math.Between(50, 750);
          const y = Phaser.Math.Between(50, 550);
          const coin = this.coins.create(x, y, 'coin').setScale(1.5);
          coin.setCollideWorldBounds(true);
        };

        this.spawnEnemy = () => {
          const playerScore = this.score;
          const minStrength = playerScore + 1;
          const maxStrength = Math.max(minStrength + 30, 150);

          const x = Phaser.Math.Between(50, 750);
          const y = Phaser.Math.Between(50, 550);
          const enemy = this.enemies.create(x, y, 'enemy').setScale(1.5);
          enemy.setBounce(1);
          enemy.setCollideWorldBounds(true);
          enemy.setVelocity(Phaser.Math.Between(-100, 100), Phaser.Math.Between(-100, 100));

          const strength = Phaser.Math.Between(minStrength, maxStrength);
          enemy.setData('strength', strength);

          if (enemy.strengthText) enemy.strengthText.destroy();
          enemy.strengthText = this.add.text(enemy.x, enemy.y - 20, strength, {
            fontFamily: "'Press Start 2P'",
            fontSize: '14px',
            fill: '#ff0044',
            stroke: '#000',
            strokeThickness: 3,
          }).setOrigin(0.5);

          enemy.update = () => {
            if (enemy.strengthText) {
              enemy.strengthText.setPosition(enemy.x, enemy.y - 20);
            }
          };
        };

        for (let i = 0; i < 10; i++) this.spawnCoin();
        for (let i = 0; i < 3; i++) this.spawnEnemy();

        this.physics.add.overlap(this.player, this.coins, (player, coin) => {
          coin.disableBody(true, true);
          this.score += 10;
          this.scoreText.setText('SCORE: ' + this.score);
        });

        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
          const enemyStrength = enemy.getData('strength');
          if (this.score > enemyStrength) {
            this.cleanEnemy(enemy);
            this.score += 5;
            this.scoreText.setText('SCORE: ' + this.score);
          } else {
            if (this.updateLeaderboard) {
              this.updateLeaderboard(this.score);
            }
            // alert(`Game Over! Enemy strength ${enemyStrength} >= your score ${this.score}`);
            this.scene.restart();
            this.score = 0;
            this.scoreText.setText('SCORE: 0');
          }
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.time.addEvent({ delay: 3000, callback: this.spawnCoin, callbackScope: this, loop: true });

        const spawnEnemyEvent = () => {
          this.spawnEnemy();
          const nextDelay = Phaser.Math.Between(2000, 3000);
          this.time.addEvent({ delay: nextDelay, callback: spawnEnemyEvent, callbackScope: this, loop: false });
        };
        spawnEnemyEvent();
      }

      update() {
        this.player.setVelocity(0);
        if (this.cursors.left.isDown) this.player.setVelocityX(-200);
        else if (this.cursors.right.isDown) this.player.setVelocityX(200);
        if (this.cursors.up.isDown) this.player.setVelocityY(-200);
        else if (this.cursors.down.isDown) this.player.setVelocityY(200);

        this.enemies.getChildren().forEach(enemy => {
          if (enemy.update) enemy.update();
        });
      }
    }

    // Create scene instance passing updateLeaderboard callback
    const enemyScene = new EnemyGameScene(updateLeaderboard);

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
      scene: [enemyScene],
      backgroundColor: '#07203a',
    };

    if (gameInstance.current) {
      gameInstance.current.destroy(true);
      gameInstance.current = null;
    }

    gameInstance.current = new Phaser.Game(config);

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [gameKey, updateLeaderboard]);

  return (
    <div className="game2-container">
      <div>
        <div ref={gameRef} key={gameKey} style={{ width: 800, height: 600 }} />
        <button className="game2-reset-btn" onClick={handleReset}>Reset</button>
        <button className="game2-reset-btn" onClick={() => navigate('/')}>Back to Home</button>
      </div>
      <div className="game2-leaderboard">
        <h2>Leaderboard</h2>
        <ol>
          {leaderboard.length === 0 && <li>No scores yet</li>}
          {leaderboard.map((entry, idx) => (
            <li key={idx}>{entry.score}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default Game2;