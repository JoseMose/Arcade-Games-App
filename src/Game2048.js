import { useEffect, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Game2048.css';
import { useNavigate } from 'react-router-dom';

function Game2048({ db }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameKey, setGameKey] = useState(0);
  const navigate = useNavigate();

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
    class Game2048Scene extends Phaser.Scene {
      constructor() {
        super('2048');
        this.size = 4;
        this.board = [];
        this.score = 0;
  // Offsets & tileSize will be computed in create() once canvas size is known
  this.tileSize = 0;
  this.offsetX = 0;
  this.offsetY = 0;
  this.canvasSize = 0;
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
  // Compute sizing dynamically based on actual canvas size
  this.canvasSize = this.sys.game.config.width; // square
  // Leave some vertical room for the score text on top (only if larger screens)
  const topPadding = this.canvasSize > 480 ? 80 : 50; // add a bit more gap above board on small screens
  // Tile size chosen so board fits with small gaps; use (size * tileSize + gap*(size+1)) ~= canvasSize - side padding
  // We'll model gap as 12px and side padding as 0 horizontally (centered)
  const gap = 12;
  this.tileSize = Math.floor((this.canvasSize - gap * (this.size + 1)) / this.size);
  const boardPixel = this.tileSize * this.size + gap * (this.size + 1);
  this.offsetX = Math.floor((this.canvasSize - boardPixel) / 2) + gap; // inner left after initial gap
  this.offsetY = topPadding; // push board down for score text visibility
        this.gap = gap;

        // Best score persistence
        const storedBest = parseInt(localStorage.getItem('best2048Score') || '0', 10);
        this.bestScore = isNaN(storedBest) ? 0 : storedBest;

        this.initBoard();
        this.drawBoard();
        this.input.keyboard.on('keydown', this.handleInput, this);
  this.scoreText = this.add.text(this.canvasSize / 2, 20, 'Score: 0', {
          fontSize: '32px',
          color: '#ffffff',
          fontFamily: '"Press Start 2P", Arial, sans-serif',
          stroke: '#222', // Optional: add a dark outline
          strokeThickness: 4
        }).setOrigin(0.5);
  this.bestScoreText = this.add.text(this.canvasSize / 2, 44, 'Best: ' + this.bestScore, {
          fontSize: '20px',
          color: '#ffeeff',
          fontFamily: '"Press Start 2P", Arial, sans-serif',
          stroke: '#222',
          strokeThickness: 3
        }).setOrigin(0.5);

        // --- Swipe support for mobile ---
        let startX = null, startY = null;
        this.input.on('pointerdown', pointer => {
          startX = pointer.x;
          startY = pointer.y;
        });
        this.input.on('pointerup', pointer => {
          if (startX === null || startY === null) return;
          const dx = pointer.x - startX;
          const dy = pointer.y - startY;
          if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30) this.handleInput({ code: 'ArrowRight' });
            else if (dx < -30) this.handleInput({ code: 'ArrowLeft' });
          } else {
            if (dy > 30) this.handleInput({ code: 'ArrowDown' });
            else if (dy < -30) this.handleInput({ code: 'ArrowUp' });
          }
          startX = null;
          startY = null;
        });
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
        const numberFontSize = Math.max(14, Math.min(64, Math.floor(this.tileSize * 0.42)));
        for (let r = 0; r < this.size; r++) {
          this.tiles[r] = [];
          this.numbers[r] = [];
          for (let c = 0; c < this.size; c++) {
            const value = this.board[r][c];
            const safeValue = typeof value === 'number' ? value : 0;
            const color = this.tileColors[safeValue] || 0x3c3a32;
            const x = this.offsetX + c * this.tileSize;
            const y = this.offsetY + r * this.tileSize;
            const rect = this.add.rectangle(x, y, this.tileSize - this.gap, this.tileSize - this.gap, color).setOrigin(0);
            this.tiles[r][c] = rect;
            if (safeValue) {
              const num = this.add.text(
                x + (this.tileSize - this.gap) / 2,
                y + (this.tileSize - this.gap) / 2,
                safeValue,
                {
                  fontSize: numberFontSize + 'px',
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
          if (moveResult.mergedTargets && moveResult.mergedTargets.length) {
            this.pulseMergedTiles(moveResult.mergedTargets);
          }
          this.inputLocked = false;
          if (this.isGameOver()) {
            if (!this.gameOverText) {
              this.gameOverText = this.add.text(this.canvasSize / 2, this.canvasSize - 30, 'Game Over!', {
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
      pulseMergedTiles(mergedTargets) {
        mergedTargets.forEach(t => {
          const rect = this.tiles?.[t.r]?.[t.c];
          const txt = this.numbers?.[t.r]?.[t.c];
            if (!rect || !txt) return;
            // Lighten rectangle color temporarily
            const original = rect.fillColor;
            const lighten = (hex) => {
              const r = Math.min(255, ((hex >> 16) & 255) + 48);
              const g = Math.min(255, ((hex >> 8) & 255) + 48);
              const b = Math.min(255, (hex & 255) + 48);
              return (r << 16) | (g << 8) | b;
            };
            rect.setFillStyle(lighten(original));
            this.time.delayedCall(140, () => rect.setFillStyle(original));
            // Pulse the number text
            txt.setScale(0.8);
            this.tweens.add({
              targets: txt,
              scale: 1.3,
              duration: 130,
              yoyo: true,
              ease: 'Cubic.easeOut'
            });
        });
      }
      async animateMoves(moves) {
        const anims = [];
        const numberFontSize = Math.max(14, Math.min(64, Math.floor(this.tileSize * 0.42)));
        moves.forEach(move => {
          const { from, to, value, merged } = move;
          const fromX = this.offsetX + from[1] * this.tileSize + (this.tileSize - this.gap) / 2;
          const fromY = this.offsetY + from[0] * this.tileSize + (this.tileSize - this.gap) / 2;
          const toX = this.offsetX + to[1] * this.tileSize + (this.tileSize - this.gap) / 2;
          const toY = this.offsetY + to[0] * this.tileSize + (this.tileSize - this.gap) / 2;
          const tempText = this.add.text(fromX, fromY, value, {
            fontSize: numberFontSize + 'px',
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
  let mergedTargets = [];
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
      mergedTargets.push({ r: tr, c: tc, value: board[tr][tc] });
                if (this.score > this.bestScore) {
                  this.bestScore = this.score;
                  localStorage.setItem('best2048Score', String(this.bestScore));
                  if (this.bestScoreText) this.bestScoreText.setText('Best: ' + this.bestScore);
                }
              moved = true;
              break;
            } else {
              break;
            }
          }
        });
    return { moved, moves, mergedTargets };
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

    const isMobile = window.innerWidth < 700;
    const canvasSize = isMobile ? Math.floor(window.innerWidth * 0.96) : 500;
    const config = {
      type: Phaser.AUTO,
      width: canvasSize,
      height: canvasSize,
      parent: 'game2048-board',
      scene: [Game2048Scene],
      transparent: true // Allow underlying gradient to show through
    };
    const game = new Phaser.Game(config);

    // Handle window resize: if width category or size changes significantly, recreate game
    const handleResize = () => {
      const nowIsMobile = window.innerWidth < 700;
      const targetSize = nowIsMobile ? Math.floor(window.innerWidth * 0.96) : 500;
      // If size differs by > 40px trigger re-mount
      if (Math.abs(targetSize - game.config.width) > 40) {
        setGameKey(k => k + 1);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      game.destroy(true);
      window.removeEventListener('resize', handleResize);
    };
  }, [gameKey, updateLeaderboard]);

  return (
    <div className="game2048-main">
      <div className="game2048-row">
        <div className="game2048-center">
          <div id="game2048-board"></div>
          <div className="game2048-btn-row">
            <button className="game2048-reset-btn" onClick={handleReset}>Reset</button>
            <button className="game2048-reset-btn" onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
        <div className="game2048-leaderboard">
          <h2>Leaderboard</h2>
          <ol>
            {leaderboard.length === 0 && <li>No scores yet</li>}
            {leaderboard.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Game2048;