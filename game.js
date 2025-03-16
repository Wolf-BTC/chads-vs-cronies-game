// game.js

// Add debug log to confirm game.js is loaded
console.log("game.js loaded");

// Global variables (shared between scenes if needed)
let hexGrid = [];
let hexDrops = [];
let plants = [];
let zombies = [];
let waves = [];
let hexCurrency = 0;
let rateHikeActive = false;
let rateHikeStart = 0;
const RATE_HIKE_DURATION = 5000;
let selectedPlant = null;
let currentFlashTween = null;
let inflationTexts = [];
let waveCount = 0;
let gameOver = false;
let gameWon = false;
let resultText = null;
let hasJeromeSpawned = false;
let waveText = null;
let stageText = null;
let stageVictoryText = null;
let gameOverImage = null;
let uiGraphics = null;
const VICTORY_DISPLAY_TIME = 2000;

// Start Scene
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
        console.log("StartScene constructor called");
    }

    preload() {
        console.log("StartScene preload called");
    }

    create() {
        console.log("StartScene create called");

        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.8);
        graphics.fillRect(0, 0, 900, 600);

        // Simplified game title
        const gameTitle = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "Chad's vs. Dummies", {
            fontSize: '64px',
            color: '#ff00ff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        console.log("Game title added");

        // Add "Start Game" button
        const startButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Start Game', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#ff00ff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        console.log("Start button added");

        startButton.on('pointerover', () => {
            startButton.setStyle({ color: '#ffd700' });
        });
        startButton.on('pointerout', () => {
            startButton.setStyle({ color: '#ffffff' });
        });

        startButton.on('pointerdown', () => {
            console.log("Start button clicked, transitioning to GameScene");
            this.scene.start('GameScene');
        });

        this.tweens.add({
            targets: startButton,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        this.tweens.add({
            targets: gameTitle,
            scale: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }
}

// Game Scene (unchanged)
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.richardPlantSelect = null;
        this.trumpPlantSelect = null;
        this.elonPlantSelect = null;
        this.hexCurrencyText = null;
    }

    preload() {
        this.load.image('squareHex', 'assets/square_hex.png');
        this.load.image('hexDrop', 'assets/hex_drop.png');
        this.load.image('garyDrop', 'assets/garyDrop.png');
        this.load.image('sbfDrop', 'assets/sbfDrop.png');
        this.load.image('warrenDrop', 'assets/warrenDrop.png');
        this.load.image('powellDrop', 'assets/powellDrop.png');
        this.load.image('richardPlant', 'assets/richard_plant.png');
        this.load.image('trumpPlant', 'assets/trumpPlant.png');
        this.load.image('elonPlant', 'assets/elonPlant.png');
        this.load.image('garyZombie', 'assets/garyZombie.png');
        this.load.image('sbfZombie', 'assets/sbfZombie.png');
        this.load.image('warrenZombie', 'assets/warrenZombie.png');
        this.load.image('powellZombie', 'assets/powellZombie.png');
        this.load.image('newWave', 'assets/new_wave.png');
        this.load.image('hamburgerWave', 'assets/hamburgerWave.png');
        this.load.image('rocketWave', 'assets/rocketWave.png');
        this.load.image('newVault', 'assets/new_vault.png');
        this.load.image('richardCry', 'assets/richardCry.png');
    }

    create() {
        const tileWidth = 60;
        const tileHeight = 60;
        const gridOffsetX = 240;
        const gridOffsetY = 150;

        let vaultImage = this.add.image(126.5, 420, 'newVault').setOrigin(0.5, 1).setScale(1.26);
        if (!vaultImage) {
            console.error("Failed to load newVault image at x: 126.5, y: 420");
        } else {
            console.log("newVault image loaded successfully at x: 126.5, y: 420");
        }

        for (let row = 0; row < 5; row++) {
            hexGrid[row] = [];
            for (let col = 0; col < 9; col++) {
                let x = gridOffsetX + col * tileWidth;
                let y = gridOffsetY + row * tileHeight;
                let tile = this.add.image(x, y, 'squareHex').setScale(0.5).setInteractive();
                tile.setData('row', row);
                tile.setData('col', col);
                tile.setData('occupied', false);
                hexGrid[row][col] = tile;

                tile.on('pointerdown', () => {
                    if (!tile.getData('occupied') && selectedPlant && !gameOver && !gameWon) {
                        this.placePlant(tile.getData('row'), tile.getData('col'), tile, selectedPlant);
                        if (currentFlashTween) {
                            currentFlashTween.stop();
                            currentFlashTween = null;
                        }
                        this.richardPlantSelect.alpha = 1;
                        this.trumpPlantSelect.alpha = 1;
                        this.elonPlantSelect.alpha = 1;
                    }
                });
            }
        }
        this.tweens.add({
            targets: hexGrid.flat(),
            duration: 1000,
            alpha: 0.5,
            yoyo: true,
            repeat: -1
        });

        uiGraphics = this.add.graphics();

        uiGraphics.fillStyle(0x000000, 0.7);
        uiGraphics.fillRect(0, 0, 200, 40);
        this.hexCurrencyText = this.add.text(10, 10, 'Coin: ' + hexCurrency, {
            fontSize: '20px',
            color: '#ffd700',
            fontStyle: 'bold'
        });
        this.tweens.add({
            targets: this.hexCurrencyText,
            alpha: 0.8,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        uiGraphics.fillStyle(0x000000, 0.7);
        uiGraphics.fillRect(0, 40, 200, 40);
        let initialWaveInfo = this.getStageWaveInfo(waveCount);
        waveText = this.add.text(10, 50, 'Wave: ' + initialWaveInfo.stageWave + '/' + initialWaveInfo.stageTotal, {
            fontSize: '20px',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        this.tweens.add({
            targets: waveText,
            alpha: 0.8,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        uiGraphics.fillStyle(0x000000, 0.7);
        uiGraphics.fillRect(this.cameras.main.centerX - 100, 0, 200, 40);
        stageText = this.add.text(this.cameras.main.centerX, 10, 'Stage: ' + this.getCurrentStage(waveCount), {
            fontSize: '24px',
            color: '#ff00ff',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.tweens.add({
            targets: stageText,
            scale: 1.1,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        this.richardPlantSelect = this.add.image(200, 550, 'richardPlant').setScale(0.5).setInteractive();
        let richardCostText = this.add.text(200, 580, '50 Coin', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
        this.richardPlantSelect.on('pointerdown', () => {
            if (!gameOver && !gameWon) {
                selectedPlant = 'richardPlant';
                console.log("Selected Richard Plant");
                if (currentFlashTween) {
                    currentFlashTween.stop();
                }
                currentFlashTween = this.tweens.add({
                    targets: this.richardPlantSelect,
                    alpha: 0.5,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                this.trumpPlantSelect.alpha = 1;
                this.elonPlantSelect.alpha = 1;
            }
        });

        this.trumpPlantSelect = this.add.image(350, 550, 'trumpPlant').setScale(0.5).setInteractive();
        let trumpCostText = this.add.text(350, 580, '100 Coin', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
        this.trumpPlantSelect.on('pointerdown', () => {
            if (!gameOver && !gameWon) {
                selectedPlant = 'trumpPlant';
                console.log("Selected Trump Plant");
                if (currentFlashTween) {
                    currentFlashTween.stop();
                }
                currentFlashTween = this.tweens.add({
                    targets: this.trumpPlantSelect,
                    alpha: 0.5,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                this.richardPlantSelect.alpha = 1;
                this.elonPlantSelect.alpha = 1;
            }
        });

        this.elonPlantSelect = this.add.image(500, 550, 'elonPlant').setScale(0.5).setInteractive();
        let elonCostText = this.add.text(500, 580, '150 Coin', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
        this.elonPlantSelect.on('pointerdown', () => {
            if (!gameOver && !gameWon) {
                selectedPlant = 'elonPlant';
                console.log("Selected Elon Plant");
                if (currentFlashTween) {
                    currentFlashTween.stop();
                }
                currentFlashTween = this.tweens.add({
                    targets: this.elonPlantSelect,
                    alpha: 0.5,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                this.richardPlantSelect.alpha = 1;
                this.trumpPlantSelect.alpha = 1;
            }
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: this.spawnHexDrop,
            callbackScope: this,
            loop: true
        });

        this.time.addEvent({
            delay: Phaser.Math.Between(5000, 10000),
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });
    }

    getCurrentStage(waveCount) {
        let stage = 1;
        let cumulativeWaves = 0;
        while (waveCount > cumulativeWaves) {
            let wavesInStage = 10 + (stage - 1) * 2;
            cumulativeWaves += wavesInStage;
            if (waveCount <= cumulativeWaves) {
                return stage;
            }
            stage++;
        }
        return stage;
    }

    getStageWaveInfo(waveCount) {
        let stage = 1;
        let cumulativeWaves = 0;
        while (waveCount > cumulativeWaves) {
            let wavesInStage = 10 + (stage - 1) * 2;
            cumulativeWaves += wavesInStage;
            if (waveCount <= cumulativeWaves) {
                let stageWave = waveCount - (cumulativeWaves - wavesInStage);
                return { stageWave, stageTotal: wavesInStage };
            }
            stage++;
        }
        return { stageWave: 1, stageTotal: 10 };
    }

    spawnHexDrop(x = Phaser.Math.Between(780, 885), y = -20, falling = true) {
        let hexDrop = this.add.image(x, y, 'hexDrop').setScale(0.5).setInteractive();
        if (!hexDrop) {
            console.error("Failed to create hexDrop at x:", x, "y:", y, "Time:", this.time.now);
            return;
        }
        console.log("HexDrop created at x:", x, "y:", y, "Time:", this.time.now);
        hexDrop.setData('collected', false);
        hexDrops.push(hexDrop);

        hexDrop.on('pointerdown', () => {
            if (!hexDrop.getData('collected')) {
                hexDrop.setData('collected', true);
                let coinGain = 25;
                if (rateHikeActive) {
                    coinGain = Math.floor(coinGain / 2);
                }
                hexCurrency += coinGain;
                this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                hexDrop.destroy();
            }
        });

        if (falling) {
            this.tweens.add({
                targets: hexDrop,
                y: 620,
                duration: 10000,
                ease: 'Linear',
                onComplete: () => {
                    if (!hexDrop.getData('collected')) {
                        hexDrop.destroy();
                    }
                }
            });
        }
    }

    placePlant(row, col, tile, plantType) {
        if (!gameOver && !gameWon) {
            let cost = plantType === 'trumpPlant' ? 100 : (plantType === 'elonPlant' ? 150 : 50);
            if (hexCurrency >= cost) {
                let plant = this.add.image(tile.x, tile.y, plantType).setScale(0.5);
                plant.setData('row', row);
                plant.setData('col', col);
                plant.setData('lastAttack', 0);
                plant.setData('type', plantType);
                plant.setData('attackCooldown', plantType === 'trumpPlant' ? 10000 : (plantType === 'elonPlant' ? 15000 : 5000));
                plant.setData('attackDamage', plantType === 'trumpPlant' ? 100 : (plantType === 'elonPlant' ? 150 : 50));
                plants.push(plant);

                tile.setData('occupied', true);
                hexCurrency -= cost;
                this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                selectedPlant = null;
            } else {
                console.log("Not enough Coin for", plantType, "- Need:", cost, "Have:", hexCurrency);
            }
        }
    }

    spawnZombie() {
        if (gameOver || gameWon) return;

        let row = Phaser.Math.Between(0, 4);
        let col = 8;
        let x = hexGrid[row][col].x;
        let y = hexGrid[row][col].y;

        console.log("Before spawn - Wave count:", waveCount);
        waveCount++;
        console.log("After spawn - Wave count updated to:", waveCount);

        let currentStage = this.getCurrentStage(waveCount);
        let waveInfo = this.getStageWaveInfo(waveCount);
        waveText.setText('Wave: ' + waveInfo.stageWave + '/' + waveInfo.stageTotal);
        console.log("Wave display updated to: Wave: " + waveInfo.stageWave + "/" + waveInfo.stageTotal);
        console.log("Calculated stage:", currentStage, "for waveCount:", waveCount);
        stageText.setText('Stage: ' + currentStage);

        let zombie;
        let zombieType;

        if (waveCount <= 3) {
            zombieType = Phaser.Math.Between(0, 8);
            console.log("Wave <= 3, excluding Jerome: zombieType =", zombieType);
        } else if (waveCount === 5 && !hasJeromeSpawned) {
            zombieType = 9;
            console.log("Forcing Jerome Powell spawn on wave 5");
        } else {
            zombieType = Phaser.Math.Between(0, 9);
            console.log("Wave > 3, normal spawn: zombieType =", zombieType);
        }

        if (zombieType < 3) {
            zombie = this.add.image(x, y, 'garyZombie').setScale(0.5);
            zombie.setData('type', 'gary');
            zombie.setData('speed', 20);
            zombie.setData('health', 100);
        } else if (zombieType < 6) {
            zombie = this.add.image(x, y, 'sbfZombie').setScale(0.5);
            zombie.setData('type', 'sbf');
            zombie.setData('speed', 15);
            zombie.setData('health', 200);
            zombie.setData('panicCount', 0);
        } else if (zombieType < 9) {
            zombie = this.add.image(x, y, 'warrenZombie').setScale(0.5);
            zombie.setData('type', 'warren');
            zombie.setData('speed', 10);
            zombie.setData('health', 150);
            zombie.setData('shieldActive', true);
            zombie.setData('shieldDuration', 5000);
            zombie.setData('shieldStart', this.time.now);
        } else {
            zombie = this.add.image(x, y, 'powellZombie').setScale(0.5);
            zombie.setData('type', 'powell');
            zombie.setData('speed', 15);
            zombie.setData('health', 200);
            zombie.setData('rateHikeActive', true);
            zombie.setData('rateHikeStart', this.time.now);
            zombie.setData('rateHikeDuration', 5000);
            rateHikeActive = true;
            rateHikeStart = this.time.now;
            hasJeromeSpawned = true;
            console.log("Jerome Powell activated rate hike at time:", this.time.now);

            let inflationText = this.add.text(x, y - 30, 'INFLATION!!', {
                fontSize: '20px',
                color: '#ff00ff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            inflationTexts.push({ zombie: zombie, text: inflationText });
            let flashTween = this.tweens.add({
                targets: inflationText,
                alpha: 0.5,
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
        if (!zombie) {
            console.error("Failed to create zombie of type:", zombieType);
            return;
        }
        console.log("Zombie created:", zombie.getData('type'), "at x:", x, "y:", y);
        zombie.setData('row', row);
        zombie.setData('col', col);
        zombies.push(zombie);
        console.log("Zombies array length after push:", zombies.length);
    }

    update(time) {
        if (gameOver) {
            console.log("Game over condition triggered, halting update loop");
            return;
        }

        console.log("Update loop running at time:", time, "Zombies count:", zombies.length);
        hexDrops = hexDrops.filter(drop => drop.active);

        if (rateHikeActive) {
            if (time - rateHikeStart >= RATE_HIKE_DURATION) {
                rateHikeActive = false;
                console.log("Rate hike ended at time:", time);
            }
        }

        plants.forEach(plant => {
            let lastAttack = plant.getData('lastAttack');
            let cooldown = plant.getData('attackCooldown');
            if (time - lastAttack >= cooldown) {
                plant.setData('lastAttack', time);
                this.spawnWave(plant);
            }
        });

        zombies.forEach(zombie => {
            if (!zombie.active) return;
            let speed = zombie.getData('speed') / 60;
            let type = zombie.getData('type');

            if (type === 'warren' && zombie.getData('shieldActive')) {
                let shieldStart = zombie.getData('shieldStart');
                if (time - shieldStart >= zombie.getData('shieldDuration')) {
                    zombie.setData('shieldActive', false);
                    console.log("Elizabeth Warren's regulation shield dropped at time:", time);
                } else {
                    plants.forEach(p => {
                        if (Math.abs(p.x - zombie.x) < 100 && Math.abs(p.y - zombie.y) < 100) {
                            p.setData('lastAttack', time - 5000);
                        }
                    });
                }
            }

            if (type === 'sbf' && zombie.getData('panicCount') < 3 && Math.random() < 0.3) {
                zombie.setData('speed', 30);
                zombie.setData('panicCount', zombie.getData('panicCount') + 1);
                console.log("SBF panicking, speed:", zombie.getData('speed'));
            } else if (type === 'sbf' && zombie.getData('panicCount') >= 3) {
                zombie.setData('speed', 15);
            }

            zombie.x -= speed;
            let newCol = Math.max(0, Math.floor((zombie.x - 240) / 60));
            zombie.setData('col', newCol);
            if (zombie.x < 0 && !gameOver) {
                gameOver = true;
                console.log("Zombie reached vault, setting gameOver to true");
                uiGraphics.clear();
                uiGraphics.fillStyle(0x000000, 0.8);
                uiGraphics.fillRect(0, 0, 900, 600);
                resultText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'GAME OVER', {
                    fontSize: '64px',
                    color: '#ff0000',
                    fontStyle: 'bold',
                    stroke: '#ffffff',
                    strokeThickness: 5,
                    shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, fill: true }
                }).setOrigin(0.5);
                gameOverImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'richardCry').setScale(0.5).setOrigin(0.5);
                this.tweens.add({
                    targets: gameOverImage,
                    scale: 0.55,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                console.log("Game Over screen displayed");
            }

            inflationTexts.forEach(item => {
                if (item.zombie === zombie) {
                    item.text.x = zombie.x;
                    item.text.y = zombie.y - 30;
                }
            });
        });

        waves.forEach(wave => {
            if (!wave.active) return;
            wave.x += 100 / 60;
            if (wave.x > 920) {
                wave.destroy();
                return;
            }

            zombies.forEach(zombie => {
                if (!zombie.active) return;
                if (zombie.getData('row') === wave.getData('row') && Math.abs(zombie.x - wave.x) < 20) {
                    let health = zombie.getData('health');
                    let type = zombie.getData('type');
                    let damage = wave.getData('damage') || 50;
                    health -= damage;
                    zombie.setData('health', health);
                    wave.destroy();

                    if (health <= 0) {
                        let dropType = zombie.getData('type');
                        if (dropType === 'gary') {
                            this.spawnGaryDrop(zombie.x, zombie.y);
                        } else if (dropType === 'sbf') {
                            this.spawnSbfDrop(zombie.x, zombie.y);
                        } else if (dropType === 'warren') {
                            this.spawnWarrenDrop(zombie.x, zombie.y);
                        } else if (dropType === 'powell') {
                            this.spawnPowellDrop(zombie.x, zombie.y);
                            inflationTexts = inflationTexts.filter(item => {
                                if (item.zombie === zombie) {
                                    item.text.destroy();
                                    return false;
                                }
                                return true;
                            });
                        }
                        zombie.destroy();
                    } else if (health > 0 && zombie.getData('shieldActive') && type === 'warren') {
                        zombie.setData('shieldActive', false);
                        console.log("Elizabeth Warren's shield dropped after hit at time:", time);
                    }
                    return;
                }
            });
        });

        let currentStage = this.getCurrentStage(waveCount);
        let waveInfo = this.getStageWaveInfo(waveCount);
        if (waveInfo.stageWave === waveInfo.stageTotal && !gameWon) {
            if (!stageVictoryText) {
                uiGraphics.clear();
                uiGraphics.fillStyle(0x000000, 0.7);
                uiGraphics.fillRect(this.cameras.main.centerX - 200, this.cameras.main.centerY - 100, 400, 100);
                stageVictoryText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, 'VICTORY - STAGE ' + currentStage + ' COMPLETE!', {
                    fontSize: '48px',
                    color: '#ff00ff',
                    fontStyle: 'bold',
                    stroke: '#ffffff',
                    strokeThickness: 5,
                    shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 2, fill: true }
                }).setOrigin(0.5);
                this.tweens.add({
                    targets: stageVictoryText,
                    scale: 1.1,
                    duration: 500,
                    yoyo: true,
                    repeat: 1
                });
                console.log("Stage " + currentStage + " complete, showing victory message");

                this.time.delayedCall(VICTORY_DISPLAY_TIME, () => {
                    if (stageVictoryText) {
                        stageVictoryText.destroy();
                        stageVictoryText = null;
                        uiGraphics.clear();
                        console.log("Victory message for Stage " + currentStage + " hidden");

                        plants.forEach(plant => plant.destroy());
                        plants = [];
                        hexGrid.forEach(row => {
                            row.forEach(tile => {
                                tile.setData('occupied', false);
                            });
                        });
                        console.log("Grid reset after Stage " + currentStage);

                        zombies.forEach(zombie => zombie.destroy());
                        zombies = [];
                        inflationTexts.forEach(item => {
                            if (item.text) {
                                item.text.destroy();
                            }
                        });
                        inflationTexts = [];
                        console.log("Zombies and inflation texts reset after Stage " + currentStage);

                        hexDrops.forEach(drop => {
                            if (drop) {
                                drop.destroy();
                            }
                        });
                        hexDrops = [];
                        console.log("Drops reset after Stage " + currentStage);

                        hexCurrency = 0;
                        this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                        console.log("Coin counter reset to 0 after Stage " + currentStage);
                    }
                }, [], this);
            }
        }

        zombies = zombies.filter(zombie => zombie.active);
        waves = waves.filter(wave => wave.active);
    }

    spawnWave(plant) {
        let row = plant.getData('row');
        let x = plant.x;
        let y = plant.y;
        let damage = plant.getData('attackDamage');
        let waveImage = plant.getData('type') === 'trumpPlant' ? 'hamburgerWave' : 
                       (plant.getData('type') === 'elonPlant' ? 'rocketWave' : 'newWave');

        let wave = this.add.image(x, y, waveImage).setScale(0.5);
        wave.setData('row', row);
        wave.setData('damage', damage);
        waves.push(wave);
    }

    spawnGaryDrop(x, y) {
        let garyDrop = this.add.image(x, y, 'garyDrop').setScale(0.5).setInteractive();
        garyDrop.setData('collected', false);
        hexDrops.push(garyDrop);

        garyDrop.on('pointerdown', () => {
            if (!garyDrop.getData('collected')) {
                garyDrop.setData('collected', true);
                let coinGain = 25;
                if (rateHikeActive) {
                    coinGain = Math.floor(coinGain / 2);
                }
                hexCurrency += coinGain;
                this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                garyDrop.destroy();
            }
        });
    }

    spawnSbfDrop(x, y) {
        let sbfDrop = this.add.image(x, y, 'sbfDrop').setScale(0.5).setInteractive();
        sbfDrop.setData('collected', false);
        hexDrops.push(sbfDrop);

        sbfDrop.on('pointerdown', () => {
            if (!sbfDrop.getData('collected')) {
                sbfDrop.setData('collected', true);
                let coinGain = 30;
                if (rateHikeActive) {
                    coinGain = Math.floor(coinGain / 2);
                }
                hexCurrency += coinGain;
                this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                sbfDrop.destroy();
            }
        });
    }

    spawnWarrenDrop(x, y) {
        let warrenDrop = this.add.image(x, y, 'warrenDrop').setScale(0.5).setInteractive();
        warrenDrop.setData('collected', false);
        hexDrops.push(warrenDrop);

        warrenDrop.on('pointerdown', () => {
            if (!warrenDrop.getData('collected')) {
                warrenDrop.setData('collected', true);
                let coinGain = 35;
                if (rateHikeActive) {
                    coinGain = Math.floor(coinGain / 2);
                }
                hexCurrency += coinGain;
                this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                warrenDrop.destroy();
            }
        });
    }

    spawnPowellDrop(x, y) {
        let powellDrop = this.add.image(x, y, 'powellDrop').setScale(0.5).setInteractive();
        powellDrop.setData('collected', false);
        hexDrops.push(powellDrop);

        powellDrop.on('pointerdown', () => {
            if (!powellDrop.getData('collected')) {
                powellDrop.setData('collected', true);
                let coinGain = 40;
                if (rateHikeActive) {
                    coinGain = Math.floor(coinGain / 2);
                }
                hexCurrency += coinGain;
                this.hexCurrencyText.setText('Coin: ' + hexCurrency);
                powellDrop.destroy();
            }
        });
    }
}

// Initialize game after scenes are defined
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    scene: [StartScene, GameScene]
};
const game = new Phaser.Game(config);
console.log("Phaser game initialized");