import Phaser from 'phaser';
import { generateMap } from './map/mapGenerator';
import { renderMap, addYurtToMap, highlightTile } from './map/mapRenderer';
import { initUI, updateResourceUI, showMessage } from './ui/uiManager';
import { YurtUnit, Tile, TerrainType } from './models';

class GameScene extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private mapSize = { rows: 30, cols: 40 }; // Increased map size
    private tileSize = 32;
    private map: Tile[][] = [];
    private yurtUnits: YurtUnit[] = [];
    private selectedTile: Tile | null = null;
    private selectedTileHighlight: Phaser.GameObjects.Graphics | null = null;
    private resources = { food: 100, wood: 50 };
    private isPlacingYurt = false;

    constructor() {
        super('GameScene');
    }

    preload() {
        // Load assets
        this.load.image('yurt', 'assets/placeholder_yurt.png');
    }

    create() {
        // Initialize controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        
        // Generate the map
        this.map = generateMap(this.mapSize.rows, this.mapSize.cols);
        
        // Render the map
        renderMap(this.map, this, this.tileSize);
        
        // Set camera bounds to the map size
        this.cameras.main.setBounds(
            0, 0, 
            this.mapSize.cols * this.tileSize, 
            this.mapSize.rows * this.tileSize
        );
        
        // Initialize the UI
        initUI(this);
        
        // Create initial yurt unit
        this.createInitialYurt();
        
        // Add mouse input for tile selection
        this.input.on('pointerdown', this.handleTileClick, this);
        
        // Add 'P' key for placing yurts
        this.input.keyboard!.on('keydown-P', () => {
            this.isPlacingYurt = !this.isPlacingYurt;
            showMessage(this, this.isPlacingYurt ? 'Placing Yurt: Click on a valid tile' : 'Yurt placement cancelled');
        });
        
        // Add welcome message
        showMessage(this, 'Welcome to TownYurd! Use WASD or arrows to move, P to place yurts');
        
        // Update the UI with initial values
        updateResourceUI(this.resources, this.yurtUnits);

        // Start automatic resource gathering every 5 seconds
        this.time.addEvent({
            delay: 5000,
            callback: this.collectResources,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        // Handle camera movement
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
        // Convert screen coordinates to tile coordinates
        const x = Math.floor(pointer.worldX / this.tileSize);
        const y = Math.floor(pointer.worldY / this.tileSize);
        
        // Check if coordinates are within map bounds
        if (x >= 0 && x < this.mapSize.cols && y >= 0 && y < this.mapSize.rows) {
            const clickedTile = this.map[y][x];
            
            // Clear previous selection
            if (this.selectedTileHighlight) {
                this.selectedTileHighlight.destroy();
                this.selectedTileHighlight = null;
            }
            
            // Select the new tile
            this.selectedTile = clickedTile;
            this.selectedTileHighlight = highlightTile(clickedTile, this, this.tileSize);
            
            // If in yurt placement mode, try to place a yurt
            if (this.isPlacingYurt) {
                this.tryPlaceYurt(clickedTile);
            }
        }
    }
    
    private tryPlaceYurt(tile: Tile) {
        // Check if the tile is valid for placing a yurt
        if (
            tile.terrainType !== TerrainType.WATER && 
            tile.terrainType !== TerrainType.MOUNTAIN &&
            !tile.occupiedBy && 
            this.resources.wood >= 25
        ) {
            // Create a new yurt
            const yurtId = `yurt_${Date.now()}`;
            const newYurt: YurtUnit = {
                id: yurtId,
                x: tile.x,
                y: tile.y,
                morale: 70 + Math.floor(Math.random() * 30), // Random initial morale
                resources: {
                    food: 0,
                    wood: 0
                }
            };
            
            // Add to the array of yurts
            this.yurtUnits.push(newYurt);
            
            // Mark the tile as occupied
            tile.occupiedBy = yurtId;
            
            // Render the yurt on the map
            addYurtToMap(tile.x, tile.y, this, this.tileSize);
            
            // Deduct resources
            this.resources.wood -= 25;
            
            // Update UI
            updateResourceUI(this.resources, this.yurtUnits);
            
            // Show confirmation
            showMessage(this, 'Yurt placed successfully!');
            
            // Exit placement mode
            this.isPlacingYurt = false;
        } else {
            // Show error message
            let reason = '';
            if (tile.terrainType === TerrainType.WATER) reason = 'Cannot build on water';
            else if (tile.terrainType === TerrainType.MOUNTAIN) reason = 'Cannot build on mountains';
            else if (tile.occupiedBy) reason = 'Tile is already occupied';
            else if (this.resources.wood < 25) reason = 'Not enough wood (need 25)';
            
            showMessage(this, `Cannot place yurt here. ${reason}`);
        }
    }
    
    private createInitialYurt() {
        // Find a suitable grass tile for the initial yurt
        let startX = Math.floor(this.mapSize.cols / 2);
        let startY = Math.floor(this.mapSize.rows / 2);
        
        // Make sure we don't start on water or mountains
        while (
            this.map[startY][startX].terrainType === TerrainType.WATER ||
            this.map[startY][startX].terrainType === TerrainType.MOUNTAIN
        ) {
            startX = Math.floor(Math.random() * this.mapSize.cols);
            startY = Math.floor(Math.random() * this.mapSize.rows);
        }
        
        // Create the initial yurt
        const yurtId = 'first_yurt';
        this.yurtUnits.push({
            id: yurtId,
            x: startX,
            y: startY,
            morale: 100,
            resources: {
                food: 0,
                wood: 0
            }
        });
        
        // Mark the tile as occupied
        this.map[startY][startX].occupiedBy = yurtId;
        
        // Add the yurt to the map
        addYurtToMap(startX, startY, this, this.tileSize);
        
        // Center the camera on the initial yurt
        this.cameras.main.centerOn(startX * this.tileSize, startY * this.tileSize);
    }

    // Automatically gather resources for each yurt from nearby tiles
    private collectResources(): void {
        for (const yurt of this.yurtUnits) {
            let foodGain = 0;
            let woodGain = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = yurt.x + dx;
                    const ny = yurt.y + dy;
                    if (nx >= 0 && nx < this.mapSize.cols && ny >= 0 && ny < this.mapSize.rows) {
                        const tile = this.map[ny][nx];
                        if (tile.terrainType === TerrainType.FOREST) woodGain++;
                        else if (tile.terrainType === TerrainType.GRASS) foodGain++;
                    }
                }
            }
            this.resources.wood += woodGain;
            this.resources.food += foodGain;
            yurt.resources.wood += woodGain;
            yurt.resources.food += foodGain;
        }
        updateResourceUI(this.resources, this.yurtUnits);
    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    render: {
      pixelArt: true,
    }
};

// Ensure the DOM is ready before creating the game instance
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        const newContainer = document.createElement('div');
        newContainer.id = 'game-container';
        document.body.appendChild(newContainer);
    }
    new Phaser.Game(config);
});