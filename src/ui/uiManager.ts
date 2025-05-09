import Phaser from 'phaser';
import { YurtUnit, Tile, TerrainType } from '../models';

interface ResourceCounters {
    food: Phaser.GameObjects.Text;
    wood: Phaser.GameObjects.Text;
    morale: Phaser.GameObjects.Text;
    yurts: Phaser.GameObjects.Text;
}

let counters: ResourceCounters;
let currentScene: Phaser.Scene | null = null;
const UI_STYLE = { 
    font: '16px Arial', 
    color: '#ffffff',
    backgroundColor: '#333333',
    padding: { x: 10, y: 5 }
};

/**
 * Initializes the game's user interface elements.
 * @param scene The Phaser.Scene to add UI elements to.
 * @returns An object containing references to the UI elements.
 */
export function initUI(scene: Phaser.Scene): ResourceCounters {
    currentScene = scene;
    
    // Create resources in the sidebar
    const resourcesContainer = document.getElementById('resources-container');
    if (resourcesContainer) {
        resourcesContainer.innerHTML = `
            <div class="resource-item" id="food-counter">Food: 100</div>
            <div class="resource-item" id="wood-counter">Wood: 50</div>
            <div class="resource-item" id="morale-counter">Morale: 100</div>
            <div class="resource-item" id="yurts-counter">Yurts: 1</div>
        `;
    }
    
    // Add event listeners to buttons
    const placeYurtBtn = document.getElementById('place-yurt-btn');
    if (placeYurtBtn) {
        placeYurtBtn.addEventListener('click', () => {
            // Dispatch a custom event that the game scene can listen for
            window.dispatchEvent(new CustomEvent('place-yurt-clicked'));
        });
    }
    
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('cancel-action-clicked'));
        });
    }
    
    // Create in-game UI elements (for backward compatibility)
    counters = {
        food: scene.add.text(20, 20, '', { font: '1px Arial', color: '#ffffff' }).setAlpha(0),
        wood: scene.add.text(20, 50, '', { font: '1px Arial', color: '#ffffff' }).setAlpha(0),
        morale: scene.add.text(20, 80, '', { font: '1px Arial', color: '#ffffff' }).setAlpha(0),
        yurts: scene.add.text(20, 110, '', { font: '1px Arial', color: '#ffffff' }).setAlpha(0)
    };
    
    // Make UI elements fixed to the camera (though they're now invisible)
    Object.values(counters).forEach(element => {
        element.setScrollFactor(0);
        element.setDepth(100);
    });
    
    return counters;
}

/**
 * Updates the UI with current resource values.
 * @param resources Object containing the current resource values.
 * @param yurtUnits Array of YurtUnit objects.
 */
export function updateResourceUI(
    resources: { food: number; wood: number; },
    yurtUnits: YurtUnit[]
): void {
    // Calculate total morale as average of all yurts
    const totalMorale = yurtUnits.reduce((sum, yurt) => sum + yurt.morale, 0);
    const averageMorale = yurtUnits.length > 0 ? Math.floor(totalMorale / yurtUnits.length) : 0;
    
    // Update the HTML sidebar
    const foodCounter = document.getElementById('food-counter');
    const woodCounter = document.getElementById('wood-counter');
    const moraleCounter = document.getElementById('morale-counter');
    const yurtsCounter = document.getElementById('yurts-counter');
    
    if (foodCounter) foodCounter.textContent = `Food: ${resources.food}`;
    if (woodCounter) woodCounter.textContent = `Wood: ${resources.wood}`;
    if (moraleCounter) moraleCounter.textContent = `Morale: ${averageMorale}`;
    if (yurtsCounter) yurtsCounter.textContent = `Yurts: ${yurtUnits.length}`;
    
    // Also update the game counters for backward compatibility
    if (counters) {
        counters.food.setText(`Food: ${resources.food}`);
        counters.wood.setText(`Wood: ${resources.wood}`);
        counters.morale.setText(`Morale: ${averageMorale}`);
        counters.yurts.setText(`Yurts: ${yurtUnits.length}`);
    }
}

/**
 * Shows a message in the center of the screen that fades out.
 * @param scene The Phaser.Scene to add the message to.
 * @param message The text to display.
 * @param duration How long to show the message (in milliseconds).
 */
export function showMessage(scene: Phaser.Scene, message: string, duration: number = 2000): void {
    // Update game info in the sidebar
    const gameInfo = document.getElementById('game-info');
    if (gameInfo) {
        // Add the message at the top of game info
        const existingText = gameInfo.innerHTML;
        gameInfo.innerHTML = `<div style="color: #ffcc00; margin-bottom: 10px;">${message}</div>${existingText}`;
        
        // Remove the message after the duration
        setTimeout(() => {
            const firstMessage = gameInfo.querySelector('div');
            if (firstMessage) {
                firstMessage.remove();
            }
        }, duration);
    }
    
    // Also show in-game message for visibility
    const text = scene.add.text(
        scene.cameras.main.centerX,
        scene.cameras.main.centerY - 50,
        message,
        { 
            font: '24px Arial', 
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }
    );
    
    text.setOrigin(0.5);
    text.setScrollFactor(0);
    text.setDepth(101); // Above other UI
    
    // Fade out and destroy after duration
    scene.tweens.add({
        targets: text,
        alpha: { from: 1, to: 0 },
        duration: duration,
        onComplete: () => text.destroy()
    });
}

/**
 * Updates the selected tile information in the sidebar.
 * @param tile The selected tile or null if no tile is selected.
 */
export function updateSelectedTileInfo(tile: Tile | null): void {
    const tileInfo = document.getElementById('tile-info');
    if (!tileInfo) return;
    
    if (!tile) {
        tileInfo.textContent = 'No tile selected';
        return;
    }
    
    // Get terrain type as string
    let terrainType = 'Unknown';
    switch (tile.terrainType) {
        case TerrainType.GRASS:
            terrainType = 'Grass';
            break;
        case TerrainType.FOREST:
            terrainType = 'Forest';
            break;
        case TerrainType.WATER:
            terrainType = 'Water';
            break;
        case TerrainType.MOUNTAIN:
            terrainType = 'Mountain';
            break;
    }
    
    tileInfo.innerHTML = `
        <div>Position: (${tile.x}, ${tile.y})</div>
        <div>Terrain: ${terrainType}</div>
        <div>Occupied: ${tile.occupiedBy ? 'Yes' : 'No'}</div>
    `;
} 