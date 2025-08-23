import Phaser from 'phaser';
import backgroundImg from './assets/background.png';
import robotBirdImg from './assets/robotBird.png';
import spikeTop from './assets/spikeTop.png';
import spikeBottom from './assets/spikeBottom.png';
import goldCoin from './assets/goldCoin.png';
import { submitFlappyScore } from './flappyLeaderboardApi';

export default class FlappyBird extends Phaser.Scene {
  constructor() {
    super({ key: 'FlappyBird' });
  this.score = 0;
  this.gameOver = false;
  this.started = false;
  this.startTime = 0;
  this.runSummaryText = null;
  }

  preload() {
    this.load.image('background', backgroundImg);
    this.load.image('bird', robotBirdImg);
    this.load.image('spikeTop', spikeTop);
    this.load.image('spikeBottom', spikeBottom);
    this.load.image('goldCoin', goldCoin);
  }

  create() {
  this.score = 0;
  this.gameOver = false;
  this.started = false;
  this.startTime = 0;
  this.runSummaryText = null;

  const W = this.scale.width;
  const H = this.scale.height;

  // Background centered & scaled to fill (simple stretch)
  const bg = this.add.image(W / 2, H / 2, 'background');
  bg.setDisplaySize(W, H);

  const topOffset = Math.max(32, H * 0.05);
  this.scoreText = this.add.text(W / 2, topOffset, 'Score: 0', {
      fontSize: Math.round(H * 0.053) + 'px',
      color: '#fff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
  this.scoreText.setDepth(10);

  // Start prompt
  this.startText = this.add.text(W / 2, H * 0.55, 'Tap to Start', {
    fontSize: Math.round(H * 0.07) + 'px',
    color: '#ffffff',
    fontFamily: 'Arial',
    stroke: '#000',
    strokeThickness: 6
  }).setOrigin(0.5);
  this.startText.setDepth(10);

  this.bird = this.physics.add.sprite(W * 0.28, H * 0.5, 'bird');
    // Normalize scale: ~8% canvas height
    const tex = this.textures.get('bird').getSourceImage();
    if (tex && tex.height) {
      const desired = H * 0.08;
      this.bird.setScale(desired / tex.height);
    } else {
      this.bird.setScale(0.2);
    }
    this.bird.setCollideWorldBounds(true);
    // Start with gravity off until first tap to avoid immediate fall + game over
    this.bird.body.allowGravity = false;
    this.bird.setDepth(5);

    // Set explicit world bounds (sometimes FIT scaling without bounds can cause unexpected values)
    this.physics.world.setBounds(0, 0, W, H);

  this._resizeBirdBody();

  this.input.on('pointerdown', () => {
      if (this.gameOver) {
    // Allow quick restart by tapping after game over
    this.scene.restart();
        return;
      }
      if (!this.started) {
        this.started = true;
        this.startTime = this.time.now;
        this.bird.body.allowGravity = true;
        this.startText.setVisible(false);
      }
  // Flap: scale jump strength with current difficulty so game stays controllable at higher speeds
  this.bird.setVelocityY(this._flapVelocity());
    });

  this.spikes = this.physics.add.group();
  this.coins = this.physics.add.group();
  // Dynamic spawn control instead of fixed timer (harder ramp)
  this.lastSpawn = 0;

    this.physics.add.collider(this.bird, this.spikes, () => {
      this.handleGameOver();
    });

    this.physics.add.overlap(this.bird, this.coins, this.handleScore, null, this);

  // Remove old Game Over button UI – we'll show a summary instead.
  }

  spawnSpikesAndCoin() {
    if (this.gameOver || !this.started) return; // Do not spawn until game started

  const W = this.scale.width;
  const H = this.scale.height;
  // Difficulty scaling
  const diff = this._difficulty();
  const finalGap = diff.gap;
  const spikeWidth = Math.max(18, Math.min(32, W * 0.03));
  const minGapY = 100 * (H / 600) + finalGap / 2;
  const maxGapY = (H - 100 * (H / 600)) - finalGap / 2;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);

  const topSpikeHeight = Math.round(gapY - finalGap / 2);
  const bottomSpikeHeight = H - finalGap - topSpikeHeight;

    if (topSpikeHeight > 0) {
  const topSpike = this.spikes.create(W + spikeWidth, 0, 'spikeTop')
        .setOrigin(0.5, 0)
        .setDisplaySize(spikeWidth, topSpikeHeight);
  topSpike.body.setVelocityX(-diff.speed);
      topSpike.body.allowGravity = false;
      topSpike.body.immovable = true;
    }

    if (bottomSpikeHeight > 0) {
  const bottomSpike = this.spikes.create(W + spikeWidth, H, 'spikeBottom')
        .setOrigin(0.5, 1)
        .setDisplaySize(spikeWidth, bottomSpikeHeight);
  bottomSpike.body.setVelocityX(-diff.speed);
      bottomSpike.body.allowGravity = false;
      bottomSpike.body.immovable = true;
    }

  const coin = this.coins.create(W + spikeWidth, gapY, 'goldCoin')
      .setOrigin(0.5)
      .setScale(0.08);
  coin.body.setVelocityX(-diff.speed);
    coin.body.allowGravity = false;
    coin.body.immovable = true;
    coin.body.setSize(coin.displayWidth, 600);
    coin.body.setOffset(0, -300);
    coin.scored = false;
  }

  async handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.bird.setVelocityY(0);
    this.bird.body.allowGravity = false;
    // Show run summary text
    const W = this.scale.width;
    const H = this.scale.height;
    const summary = `Run Over\nScore: ${this.score}`;
    if (this.runSummaryText) {
      this.runSummaryText.setText(summary).setVisible(true);
    } else {
      this.runSummaryText = this.add.text(W / 2, H * 0.5, summary, {
        fontSize: Math.round(H * 0.075) + 'px',
        color: '#fff',
        fontFamily: 'Arial',
        backgroundColor: '#000',
        padding: { x: 24, y: 24 },
        align: 'center',
        stroke: '#ff00ff',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(30);
    }

    // Only submit score if the game instance exists
    if (this.sys && this.sys.game && this.sys.game.db) {
      try {
        await submitFlappyScore(this.sys.game.db, "Player", this.score);
      } catch (e) {
        // Log silently in production; avoids crashing game due to leaderboard issues
        console.warn('Score submit failed', e);
      }
    }
  }

  handleScore(bird, coin) {
    if (!coin.scored && !this.gameOver) {
      this.score += 1;
      this.scoreText.setText('Score: ' + this.score);
      coin.scored = true;
      coin.destroy();
    }
  }

  update() {
  this._resizeBirdBody();

  if (this.bird.body.velocity.y < -20) {
      this.bird.angle = -20;
    } else if (this.bird.body.velocity.y > 20) {
      this.bird.angle = 30;
    } else {
      this.bird.angle = 0;
    }

  // Removed instant top-bound game over; allow some headroom

    const H = this.scale.height;
    if (this.started && !this.gameOver) {
      // Dynamic spawning loop
      const diff = this._difficulty();
      if (this.time.now - this.lastSpawn >= diff.spawnInterval) {
        this.spawnSpikesAndCoin();
        this.lastSpawn = this.time.now;
      }
      const elapsed = this.time.now - this.startTime;
      const grace = 500; // ms grace period after start
  if (this.bird.y >= H - this.bird.displayHeight / 2 && elapsed > grace) {
        this.bird.setVelocityY(0);
        this.bird.body.allowGravity = false;
        this.bird.y = H - this.bird.displayHeight / 2;
        this.bird.angle = 90;
        this.handleGameOver();
      }
      if (this.bird.y < -this.bird.displayHeight && elapsed > grace) {
        this.handleGameOver();
      }
    }
  }
}

FlappyBird.prototype._resizeBirdBody = function () {
  if (!this.bird || !this.bird.body) return;
  this.bird.body.setSize(
    this.bird.displayWidth * 0.6,
    this.bird.displayHeight * 0.6
  );
  this.bird.body.setOffset(
    this.bird.displayWidth * 0.2,
    this.bird.displayHeight * 0.2
  );
};

// Compute difficulty based on score (hard ramp)
FlappyBird.prototype._difficulty = function () {
  const H = this.scale.height;
  const s = this.score;
  // Gap shrinks more aggressively; floor proportionally to screen height
  const baseGap = H * 0.42; // base relative gap
  const shrink = Math.min(baseGap * 0.55, s * (H * 0.007));
  const gap = Math.max(H * 0.17, baseGap - shrink); // never below 17% of height
  // Speed increases with score (cap at 480)
  const speed = Math.min(480, 210 + s * 8);
  // Spawn interval decreases (cap minimum 550ms)
  const spawnInterval = Math.max(550, 1400 - s * 55);
  return { gap, speed, spawnInterval };
};

// Adaptive flap velocity:
// - Base jump is proportion of screen height (so it feels similar on different devices)
// - As horizontal speed increases, we give a bit more upward impulse to compensate for tighter reaction windows
// - Clamp so player can't launch completely off screen; bird gravity will still pull back quickly
FlappyBird.prototype._flapVelocity = function () {
  const H = this.scale.height || 600;
  const diff = this._difficulty();
  // Base upward velocity scales with height (higher screen => stronger number) negative is up in Phaser
  const base = -H * 0.30; // ~ -180 at H=600
  // Add a fraction based on how far speed progressed between min (210) and max (480)
  const speedProgress = (diff.speed - 210) / (480 - 210); // 0..1
  const extra = -H * 0.06 * speedProgress; // up to additional ~ -36 at H=600
  let v = base + extra;
  // Soften first few taps before game gets going (score < 3) for accessibility
  if (this.score < 3) v *= 0.92;
  // Hard clamp: not weaker than -H*0.24 and not stronger than -H*0.38
  v = Math.max(-H * 0.38, Math.min(-H * 0.24, v));
  return v;
};