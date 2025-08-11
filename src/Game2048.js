import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Game2048.css';
import { Link } from 'react-router-dom';

function Game2048({ db }) {
  const gameRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameKey, setGameKey] = useState(0);

  // Fetch leaderboard from Firestore
  const fetchLeaderboard = useCallback(async () => {
    const q = query(collection(db, 'leaderboard2048'), orderBy('score', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    const scores = [];
    querySnapshot.forEach(doc => {
      scores.push(doc.data().score);
    });
    setLeaderboard(scores);
  }, [db]);

  // Add score to Firestore and refresh leaderboard
  const updateLeaderboard = useCallback(async (score) => {
  if (score > 0) {
    // Add new score
    await addDoc(collection(db, 'leaderboard2048'), { score });
    await fetchLeaderboard();

    // Cleanup: keep only top 10 scores
    try {
      const qAll = query(collection(db, 'leaderboard2048'), orderBy('score', 'desc'));
      const allSnapshot = await getDocs(qAll);
      if (allSnapshot.size > 10) {
        const docsToDelete = allSnapshot.docs.slice(10); // docs after top 10
        for (const docSnap of docsToDelete) {
          await deleteDoc(doc(db, 'leaderboard2048', docSnap.id));
        }
      }
    } catch (error) {
      console.error('Error cleaning up leaderboard:', error);
    }
  }
}, [db, fetchLeaderboard]);

  // Reset handler (just increments gameKey to remount Phaser)
  const handleReset = () => {
    setGameKey(k => k + 1);
    fetchLeaderboard();
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!gameRef.current) return;

    class Game2048Scene extends Phaser.Scene {
      constructor() {
        super('2048');
        this.size = 4;
        this.board = [];
        this.score = 0;
        this.tileSize = 100;
        this.offsetX = 150;
        this.offsetY = 100;
        this.tileColors = {
          0: 0xbbada0,
          2: 0xeee4da,
          4: 0xede0c8,
          8: 0xf2b179,
          16: 0xf59563,
          32: 0xf67c5f,
          64: 0xf65e3b,
          128: 0xedcf72,
          256: 0xedcc61,
          512: 0xedc850,
          1024: 0xedc53f,
          2048: 0xedc22e
        };
        this.inputLocked = false;
      }
      create() {
        this.initBoard();
        this.drawBoard();
        this.input.keyboard.on('keydown', this.handleInput, this);
        this.scoreText = this.add.text(400, 50, 'Score: 0', {
          fontSize: '32px',
          color: '#222',
          fontFamily: '"Press Start 2P", Arial, sans-serif'
        }).setOrigin(0.5);
      }
      async resetGame() {
        if (this.score > 0) {
          await updateLeaderboard(this.score);
        }
        this.initBoard();
        this.drawBoard();
        if (this.scoreText) this.scoreText.setText('Score: 0');
        if (this.gameOverText) {
          this.gameOverText.destroy();
          this.gameOverText = null;
        }
        this.input.keyboard.off('keydown', this.handleInput, this);
        this.input.keyboard.on('keydown', this.handleInput, this);
      }
      initBoard() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.addRandomTile();
        this.addRandomTile();
        this.score = 0;
      }
      addRandomTile() {
        const empty = [];
        for (let r = 0; r < this.size; r++) {
          for (let c = 0; c < this.size; c++) {
            if (this.board[r][c] === 0) empty.push([r, c]);
          }
        }
        if (empty.length === 0) return;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
        // Animate new tile
        if (this.tiles && this.tiles[r] && this.tiles[r][c]) {
          this.tiles[r][c].setAlpha(0);
          this.tweens.add({
            targets: this.tiles[r][c],
            alpha: 1,
            duration: 200
          });
        }
        if (this.numbers && this.numbers[r] && this.numbers[r][c]) {
          this.numbers[r][c].setAlpha(0);
          this.tweens.add({
            targets: this.numbers[r][c],
            alpha: 1,
            duration: 200
          });
        }
      }
      drawBoard(animatedMoves = []) {
        if (this.tiles) this.tiles.forEach(row => row.forEach(tile => tile && tile.destroy()));
        if (this.numbers) this.numbers.forEach(row => row.forEach(num => num && num.destroy()));
        this.tiles = [];
        this.numbers = [];
        for (let r = 0; r < this.size; r++) {
          this.tiles[r] = [];
          this.numbers[r] = [];
          for (let c = 0; c < this.size; c++) {
            const value = this.board[r][c];
            const color = this.tileColors[value] || 0x3c3a32;
            const x = this.offsetX + c * this.tileSize;
            const y = this.offsetY + r * this.tileSize;
            const rect = this.add.rectangle(x, y, this.tileSize - 10, this.tileSize - 10, color).setOrigin(0);
            this.tiles[r][c] = rect;
            if (value) {
              const num = this.add.text(
                x + (this.tileSize - 10) / 2,
                y + (this.tileSize - 10) / 2,
                value,
                {
                  fontSize: '32px',
                  color: '#222',
                  fontFamily: '"Press Start 2P", Arial, sans-serif'
                }
              ).setOrigin(0.5);
              this.numbers[r][c] = num;
            } else {
              this.numbers[r][c] = null;
            }
          }
        }
        if (this.scoreText) this.scoreText.setText('Score: ' + this.score);
      }
      async handleInput(event) {
        if (this.inputLocked) return;
        let moveResult = null;
        switch (event.code) {
          case 'ArrowUp': moveResult = this.move('up'); break;
          case 'ArrowDown': moveResult = this.move('down'); break;
          case 'ArrowLeft': moveResult = this.move('left'); break;
          case 'ArrowRight': moveResult = this.move('right'); break;
          default: return;
        }
        if (moveResult && moveResult.moved) {
          this.inputLocked = true;
          await this.animateMoves(moveResult.moves);
          this.addRandomTile();
          this.drawBoard();
          this.inputLocked = false;
          if (this.isGameOver()) {
            if (!this.gameOverText) {
              this.gameOverText = this.add.text(400, 570, 'Game Over!', {
                fontSize: '40px',
                color: '#b00',
                fontFamily: '"Press Start 2P", Arial, sans-serif'
              }).setOrigin(0.5);
            }
            this.input.keyboard.off('keydown', this.handleInput, this);
            await updateLeaderboard(this.score);
          }
        }
      }
      async animateMoves(moves) {
        const anims = [];
        moves.forEach(move => {
          const { from, to, value, merged } = move;
          const fromX = this.offsetX + from[1] * this.tileSize + (this.tileSize - 10) / 2;
          const fromY = this.offsetY + from[0] * this.tileSize + (this.tileSize - 10) / 2;
          const toX = this.offsetX + to[1] * this.tileSize + (this.tileSize - 10) / 2;
          const toY = this.offsetY + to[0] * this.tileSize + (this.tileSize - 10) / 2;
          const tempText = this.add.text(fromX, fromY, value, {
            fontSize: '32px',
            color: '#222',
            fontFamily: '"Press Start 2P", Arial, sans-serif'
          }).setOrigin(0.5);
          anims.push(new Promise(resolve => {
            this.tweens.add({
              targets: tempText,
              x: toX,
              y: toY,
              scale: merged ? 1.2 : 1,
              duration: 180,
              ease: 'Cubic.easeInOut',
              onComplete: () => {
                if (merged) {
                  this.tweens.add({
                    targets: tempText,
                    scale: 1,
                    duration: 80,
                    onComplete: () => tempText.destroy()
                  });
                } else {
                  tempText.destroy();
                }
                resolve();
              }
            });
          }));
        });
        await Promise.all(anims);
      }
      move(direction) {
        let moved = false;
        let moves = [];
        let size = this.size;
        let board = this.board;
        // eslint-disable-next-line no-unused-vars
        let merged = Array.from({ length: size }, () => Array(size).fill(false));
        let traverse, dr, dc;
        if (direction === 'up') {
          dr = -1; dc = 0;
          traverse = (cb) => { for (let c = 0; c < size; c++) for (let r = 1; r < size; r++) cb(r, c); };
        } else if (direction === 'down') {
          dr = 1; dc = 0;
          traverse = (cb) => { for (let c = 0; c < size; c++) for (let r = size - 2; r >= 0; r--) cb(r, c); };
        } else if (direction === 'left') {
          dr = 0; dc = -1;
          traverse = (cb) => { for (let r = 0; r < size; r++) for (let c = 1; c < size; c++) cb(r, c); };
        } else if (direction === 'right') {
          dr = 0; dc = 1;
          traverse = (cb) => { for (let r = 0; r < size; r++) for (let c = size - 2; c >= 0; c--) cb(r, c); };
        }
        traverse((r, c) => {
          if (board[r][c] === 0) return;
          let nr = r, nc = c;
          while (true) {
            let tr = nr + dr, tc = nc + dc;
            if (tr < 0 || tr >= size || tc < 0 || tc >= size) break;
            if (board[tr][tc] === 0) {
              board[tr][tc] = board[nr][nc];
              board[nr][nc] = 0;
              moves.push({ from: [nr, nc], to: [tr, tc], value: board[tr][tc], merged: false });
              nr = tr; nc = tc;
              moved = true;
            } else if (board[tr][tc] === board[nr][nc] && !merged[tr][tc]) {
              board[tr][tc] *= 2;
              this.score += board[tr][tc];
              board[nr][nc] = 0;
              merged[tr][tc] = true;
              moves.push({ from: [nr, nc], to: [tr, tc], value: board[tr][tc] / 2, merged: true });
              moved = true;
              break;
            } else {
              break;
            }
          }
        });
        return { moved, moves };
      }
      isGameOver() {
        for (let r = 0; r < this.size; r++) {
          for (let c = 0; c < this.size; c++) {
            if (this.board[r][c] === 0) return false;
            for (let [dr, dc] of [[0, 1], [1, 0]]) {
              let nr = r + dr, nc = c + dc;
              if (nr < this.size && nc < this.size && this.board[r][c] === this.board[nr][nc]) return false;
            }
          }
        }
        return true;
      }
    }

    const config = {
      type: Phaser.AUTO,
      width: 600,
      height: 650,
      backgroundColor: '#faf8ef',
      scene: [Game2048Scene],
      parent: gameRef.current
    };
    const game = new Phaser.Game(config);
    return () => {
      game.destroy(true);
    };
  }, [gameKey, updateLeaderboard]);

  return (
    <div className="game2048-container">
      <div>
        <div ref={gameRef} key={gameKey} style={{ width: 600, height: 650 }} />
        <button className="game2048-reset-btn" onClick={handleReset}>Reset</button>
        <Link to="/" className='game2048-reset-btn'>Back to Home</Link>
      </div>
      <div className="game2048-leaderboard">
        <h2>Leaderboard</h2>
        <ol>
          {leaderboard.length === 0 && <li>No scores yet</li>}
          {leaderboard.map((score, idx) => (
            <li key={idx}>{score}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default Game2048;