import Phaser from 'phaser';
// import { generateMap } from './map/mapGenerator'; // Removed, as DataManager now handles map generation
import { renderMap, addYurtToMap, highlightTile, clearMapRender } from './map/mapRenderer';
import { initUI, updateResourceUI, showMessage, updateSelectedTileInfo } from './ui/uiManager';
import { YurtUnit, Tile, TerrainType } from './models';
import { DataManager } from './data/DataManager'; // Import DataManager

class GameScene extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    // private mapSize = { rows: 30, cols: 40 }; // Managed by DataManager
    private tileSize = 32;
    // private map: Tile[][] = []; // Managed by DataManager
    // private yurtUnits: YurtUnit[] = []; // Managed by DataManager
    private selectedTile: Tile | null = null;
    private selectedTileHighlight: Phaser.GameObjects.Graphics | null = null;
    // private resources = { food: 100, wood: 50 }; // Managed by DataManager
    private isPlacingYurt = false;

    private dataManager!: DataManager; // Declare DataManager instance

    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('yurt', 'assets/placeholder_yurt.png');
    }

    create() {
        // Initialize DataManager
        // TODO: Potentially load these initial values from a config or saved game later
        this.dataManager = new DataManager(30, 40, { food: 100, wood: 50 });

        this.cursors = this.input.keyboard!.createCursorKeys();

        // Render the map from DataManager
        renderMap(this.dataManager.getMap(), this, this.tileSize);

        this.cameras.main.setBounds(
            0, 0,
            this.dataManager.getMapSize().cols * this.tileSize,
            this.dataManager.getMapSize().rows * this.tileSize
        );

        initUI(this);
        this.createInitialYurt(); // Needs to use DataManager

        this.input.on('pointerdown', this.handleTileClick, this);
        this.input.keyboard!.on('keydown-P', () => {
            this.isPlacingYurt = !this.isPlacingYurt;
            showMessage(this, this.isPlacingYurt ? 'Placing Yurt: Click on a valid tile' : 'Yurt placement cancelled');
        });

        window.addEventListener('place-yurt-clicked', () => {
            this.isPlacingYurt = !this.isPlacingYurt;
            showMessage(this, this.isPlacingYurt ? 'Placing Yurt: Click on a valid tile' : 'Yurt placement cancelled');
        });

        window.addEventListener('cancel-action-clicked', () => {
            if (this.isPlacingYurt) {
                this.isPlacingYurt = false;
                showMessage(this, 'Yurt placement cancelled');
            }
        });

        // Add event listeners for save and load
        window.addEventListener('save-game-clicked', () => this.saveGame());
        window.addEventListener('load-game-clicked', () => this.loadGame());


        showMessage(this, 'Welcome to TownYurd! Use WASD or arrows to move, P to place yurts');
        updateResourceUI(this.dataManager.getResources(), this.dataManager.getYurtUnits());
        updateSelectedTileInfo(null);

        this.time.addEvent({
            delay: 5000, // Resource collection interval
            callback: this.collectResources,
            callbackScope: this,
            loop: true
        });

        // Autosave every 60 seconds
        this.time.addEvent({
            delay: 60000,
            callback: this.saveGame,
            callbackScope: this,
            loop: true,
            args: [true] // Pass true to indicate autosave for a silent message
        });
    }

    update() {
        const cameraSpeed = 10;
        if (this.cursors.left.isDown || this.input.keyboard!.addKey('A').isDown) {
            this.cameras.main.scrollX -= cameraSpeed;
        }
        if (this.cursors.right.isDown || this.input.keyboard!.addKey('D').isDown) {
            this.cameras.main.scrollX += cameraSpeed;
        }
        if (this.cursors.up.isDown || this.input.keyboard!.addKey('W').isDown) {
            this.cameras.main.scrollY -= cameraSpeed;
        }
        if (this.cursors.down.isDown || this.input.keyboard!.addKey('S').isDown) {
            this.cameras.main.scrollY += cameraSpeed;
        }
    }

    private handleTileClick(pointer: Phaser.Input.Pointer) {
        const x = Math.floor(pointer.worldX / this.tileSize);
        const y = Math.floor(pointer.worldY / this.tileSize);
        const mapSize = this.dataManager.getMapSize();

        if (x >= 0 && x < mapSize.cols && y >= 0 && y < mapSize.rows) {
            const clickedTile = this.dataManager.getTile(x,y); // Use DataManager

            if (this.selectedTileHighlight) {
                this.selectedTileHighlight.destroy();
                this.selectedTileHighlight = null;
            }
            if (clickedTile){
                this.selectedTile = clickedTile;
                this.selectedTileHighlight = highlightTile(clickedTile, this, this.tileSize);
                updateSelectedTileInfo(clickedTile);

                if (this.isPlacingYurt) {
                    this.tryPlaceYurt(clickedTile);
                }
            }
        }
    }

    private tryPlaceYurt(tile: Tile) {
        const currentResources = this.dataManager.getResources();
        if (
            tile.terrainType !== TerrainType.WATER &&
            tile.terrainType !== TerrainType.MOUNTAIN &&
            !tile.occupiedBy &&
            currentResources.wood >= 25
        ) {
            const yurtId = `yurt_${Date.now()}`;
            const newYurt: YurtUnit = {
                id: yurtId,
                x: tile.x,
                y: tile.y,
                morale: 70 + Math.floor(Math.random() * 30),
                resources: { food: 0, wood: 0 }
            };

            this.dataManager.addYurtUnit(newYurt); // Use DataManager
            this.dataManager.updateResources(0, -25); // Use DataManager

            addYurtToMap(tile.x, tile.y, this, this.tileSize);
            updateResourceUI(this.dataManager.getResources(), this.dataManager.getYurtUnits());
            showMessage(this, 'Yurt placed successfully!');
            this.isPlacingYurt = false;
        } else {
            let reason = '';
            if (tile.terrainType === TerrainType.WATER) reason = 'Cannot build on water';
            else if (tile.terrainType === TerrainType.MOUNTAIN) reason = 'Cannot build on mountains';
            else if (tile.occupiedBy) reason = 'Tile is already occupied';
            else if (currentResources.wood < 25) reason = 'Not enough wood (need 25)';
            showMessage(this, `Cannot place yurt here. ${reason}`);
        }
    }

    private createInitialYurt() {
        const mapSize = this.dataManager.getMapSize();
        let startX = Math.floor(mapSize.cols / 2);
        let startY = Math.floor(mapSize.rows / 2);
        let tile = this.dataManager.getTile(startX, startY);

        while (tile && (tile.terrainType === TerrainType.WATER || tile.terrainType === TerrainType.MOUNTAIN)) {
            startX = Math.floor(Math.random() * mapSize.cols);
            startY = Math.floor(Math.random() * mapSize.rows);
            tile = this.dataManager.getTile(startX, startY);
        }
        
        if (tile) { // Ensure tile is not null
            const yurtId = 'first_yurt';
            const initialYurt: YurtUnit = {
                id: yurtId,
                x: startX,
                y: startY,
                morale: 100,
                resources: { food: 0, wood: 0 }
            };
            this.dataManager.addYurtUnit(initialYurt); // Use DataManager
    
            addYurtToMap(startX, startY, this, this.tileSize);
            this.cameras.main.centerOn(startX * this.tileSize, startY * this.tileSize);
        } else {
            console.error("Could not find a suitable tile for the initial yurt.");
        }
    }

    private collectResources(): void {
        let totalFoodGain = 0;
        let totalWoodGain = 0;
        const mapSize = this.dataManager.getMapSize();
        const yurts = this.dataManager.getYurtUnits();

        for (const yurt of yurts) {
            let foodGain = 0;
            let woodGain = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = yurt.x + dx;
                    const ny = yurt.y + dy;
                    if (nx >= 0 && nx < mapSize.cols && ny >= 0 && ny < mapSize.rows) {
                        const tile = this.dataManager.getTile(nx, ny); // Use DataManager
                        if (tile && tile.resourceYield) {
                            foodGain += tile.resourceYield.food || 0;
                            woodGain += tile.resourceYield.wood || 0;
                        }
                    }
                }
            }
            totalWoodGain += woodGain;
            totalFoodGain += foodGain;
            // Yurt specific resources can be updated here if needed:
            // yurt.resources.wood += woodGain;
            // yurt.resources.food += foodGain;
        }

        const foodUpkeep = yurts.length;
        this.dataManager.updateResources(totalFoodGain - foodUpkeep, totalWoodGain); // Use DataManager

        updateResourceUI(this.dataManager.getResources(), yurts);
        showMessage(
            this,
            `Resources this cycle: +${totalFoodGain} food, +${totalWoodGain} wood; Upkeep: -${foodUpkeep} food`
        );
        const statsInfo = document.getElementById('stats-info');
        if (statsInfo) {
            statsInfo.textContent = `+${totalFoodGain} food, +${totalWoodGain} wood; -${foodUpkeep} food upkeep`;
        }
    }

    private saveGame(isAutosave: boolean = false): void {
        try {
            const serializedState = this.dataManager.serializeGameState();
            localStorage.setItem('townYurdSaveData', serializedState);
            if (isAutosave) {
                console.log('Game autosaved.'); // Silent save, log to console
            } else {
                showMessage(this, 'Game Saved!');
            }
        } catch (error) {
            console.error('Error saving game:', error);
            showMessage(this, 'Failed to save game.');
        }
    }

    private loadGame(): void {
        try {
            const savedData = localStorage.getItem('townYurdSaveData');
            if (savedData) {
                this.dataManager.deserializeGameState(savedData);
                
                // Clear existing visual map elements
                clearMapRender(this); // You'll need to implement this in mapRenderer.ts
                
                // Re-render map
                renderMap(this.dataManager.getMap(), this, this.tileSize);
                
                // Re-render yurts
                this.dataManager.getYurtUnits().forEach(yurt => {
                    addYurtToMap(yurt.x, yurt.y, this, this.tileSize);
                });

                // Update UI
                updateResourceUI(this.dataManager.getResources(), this.dataManager.getYurtUnits());
                
                // Update camera bounds
                 this.cameras.main.setBounds(
                    0, 0,
                    this.dataManager.getMapSize().cols * this.tileSize,
                    this.dataManager.getMapSize().rows * this.tileSize
                );
                // Center camera on the first yurt or a default position
                const yurts = this.dataManager.getYurtUnits();
                if (yurts.length > 0) {
                     this.cameras.main.centerOn(yurts[0].x * this.tileSize, yurts[0].y * this.tileSize);
                } else {
                    this.cameras.main.centerOn(0,0); // Or some other default
                }

                showMessage(this, 'Game Loaded!');
            } else {
                showMessage(this, 'No saved game found.');
            }
        } catch (error) {
            console.error('Error loading game:', error);
            showMessage(this, 'Failed to load game.');
            // Optionally, initialize a new game state if loading fails catastrophically
            // this.dataManager = new DataManager(30, 40, { food: 100, wood: 50 });
            // renderMap(this.dataManager.getMap(), this, this.tileSize);
            // this.createInitialYurt();
            // updateResourceUI(this.dataManager.getResources(), this.dataManager.getYurtUnits());
        }
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth - 250,
    height: window.innerHeight,
    parent: 'game-container',
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    backgroundColor: '#2d2d2d',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_HORIZONTALLY
    }
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth - 250, window.innerHeight);
});