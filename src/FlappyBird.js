import Phaser from 'phaser';
import backgroundImg from './assets/background.png';
import robotBirdImg from './assets/robotBird.png';
import spikeTop from './assets/spikeTop.png';
import spikeBottom from './assets/spikeBottom.png';
import goldCoin from './assets/goldCoin.png';
import { submitFlappyScore, cleanupFlappyLeaderboard } from './flappyLeaderboardApi';

export default class FlappyBird extends Phaser.Scene {
  constructor() {
    super({ key: 'FlappyBird' });
    this.score = 0;
    this.gameOver = false;
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

  const W = this.scale.width;
  const H = this.scale.height;

  // Background centered & scaled to fill (simple stretch)
  const bg = this.add.image(W / 2, H / 2, 'background');
  bg.setDisplaySize(W, H);

  this.scoreText = this.add.text(W / 2, 40, 'Score: 0', {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

  this.bird = this.physics.add.sprite(W * 0.25, H * 0.5, 'bird').setScale(Math.min(W, H) * 0.00018 * 100);
    this.bird.setCollideWorldBounds(true);

    this.bird.body.setSize(
      this.bird.displayWidth * 0.5,
      this.bird.displayHeight * 0.5
    );
    this.bird.body.setOffset(
      this.bird.displayWidth * 0.25,
      this.bird.displayHeight * 0.25
    );

    this.input.on('pointerdown', () => {
      if (!this.gameOver) {
        this.bird.body.allowGravity = true;
        this.bird.setVelocityY(-250);
      } else {
        this.scene.restart();
      }
    });

    this.spikes = this.physics.add.group();
    this.coins = this.physics.add.group();

    this.time.addEvent({
      delay: 1500,
      callback: this.spawnSpikesAndCoin,
      callbackScope: this,
      loop: true
    });

    this.physics.add.collider(this.bird, this.spikes, () => {
      this.handleGameOver();
    });

    this.physics.add.overlap(this.bird, this.coins, this.handleScore, null, this);

    this.gameOverButton = this.add.text(400, 300, 'Game Over\nClick to Restart', {
      fontSize: '48px',
      color: '#fff',
      fontFamily: 'Arial',
      backgroundColor: '#000',
      padding: { x: 20, y: 20 },
      align: 'center'
    }).setOrigin(0.5).setInteractive().setVisible(false);

    this.gameOverButton.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  spawnSpikesAndCoin() {
    if (this.gameOver) return;

  const W = this.scale.width;
  const H = this.scale.height;
  const baseGap = 120;
  const gap = H < 500 ? baseGap * (H / 600) * 0.9 : baseGap;
  const spikeWidth = Math.max(18, Math.min(32, W * 0.03));
  const minGapY = 100 * (H / 600) + gap / 2;
  const maxGapY = (H - 100 * (H / 600)) - gap / 2;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);

  const topSpikeHeight = Math.round(gapY - gap / 2);
  const bottomSpikeHeight = H - gap - topSpikeHeight;

    if (topSpikeHeight > 0) {
  const topSpike = this.spikes.create(W + spikeWidth, 0, 'spikeTop')
        .setOrigin(0.5, 0)
        .setDisplaySize(spikeWidth, topSpikeHeight);
      topSpike.body.setVelocityX(-200);
      topSpike.body.allowGravity = false;
      topSpike.body.immovable = true;
    }

    if (bottomSpikeHeight > 0) {
  const bottomSpike = this.spikes.create(W + spikeWidth, H, 'spikeBottom')
        .setOrigin(0.5, 1)
        .setDisplaySize(spikeWidth, bottomSpikeHeight);
      bottomSpike.body.setVelocityX(-200);
      bottomSpike.body.allowGravity = false;
      bottomSpike.body.immovable = true;
    }

  const coin = this.coins.create(W + spikeWidth, gapY, 'goldCoin')
      .setOrigin(0.5)
      .setScale(0.08);
    coin.body.setVelocityX(-200);
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
    this.gameOverButton.setVisible(true);

    // Only submit score if the game instance exists
    if (this.sys && this.sys.game && this.sys.game.db) {
      await submitFlappyScore(this.sys.game.db, "Player", this.score);
      await cleanupFlappyLeaderboard(this.sys.game.db);
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
    this.bird.body.setSize(
      this.bird.displayWidth * 0.5,
      this.bird.displayHeight * 0.5
    );
    this.bird.body.setOffset(
      this.bird.displayWidth * 0.25,
      this.bird.displayHeight * 0.25
    );

    if (this.bird.body.velocity.y < -20) {
      this.bird.angle = -20;
    } else if (this.bird.body.velocity.y > 20) {
      this.bird.angle = 30;
    } else {
      this.bird.angle = 0;
    }

    if (this.bird.y < 0 && !this.gameOver) {
      this.handleGameOver();
    }

    const H = this.scale.height;
    if (this.bird.y >= H - this.bird.displayHeight / 2 && !this.gameOver) {
      this.bird.setVelocityY(0);
      this.bird.body.allowGravity = false;
      this.bird.y = H - this.bird.displayHeight / 2;
      this.bird.angle = 90;
      this.handleGameOver();
    }
  }
}