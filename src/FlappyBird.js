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

    this.add.image(400, 300, 'background').setScale(2);

    this.scoreText = this.add.text(400, 40, 'Score: 0', {
      fontSize: '32px',
      color: '#fff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.bird = this.physics.add.sprite(200, 300, 'bird').setScale(0.10);
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

    const gap = 120;
    const spikeWidth = 24;
    const minGapY = 100 + gap / 2;
    const maxGapY = 500 - gap / 2;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);

    const topSpikeHeight = Math.round(gapY - gap / 2);
    const bottomSpikeHeight = 600 - gap - topSpikeHeight;

    if (topSpikeHeight > 0) {
      const topSpike = this.spikes.create(800, 0, 'spikeTop')
        .setOrigin(0.5, 0)
        .setDisplaySize(spikeWidth, topSpikeHeight);
      topSpike.body.setVelocityX(-200);
      topSpike.body.allowGravity = false;
      topSpike.body.immovable = true;
    }

    if (bottomSpikeHeight > 0) {
      const bottomSpike = this.spikes.create(800, 600, 'spikeBottom')
        .setOrigin(0.5, 1)
        .setDisplaySize(spikeWidth, bottomSpikeHeight);
      bottomSpike.body.setVelocityX(-200);
      bottomSpike.body.allowGravity = false;
      bottomSpike.body.immovable = true;
    }

    const coin = this.coins.create(800, gapY, 'goldCoin')
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

    if (this.bird.y >= 600 - this.bird.displayHeight / 2 && !this.gameOver) {
      this.bird.setVelocityY(0);
      this.bird.body.allowGravity = false;
      this.bird.y = 600 - this.bird.displayHeight / 2;
      this.bird.angle = 90;
      this.handleGameOver();
    }
  }
}