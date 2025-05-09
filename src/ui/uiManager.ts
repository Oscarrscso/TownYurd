import Phaser from 'phaser';
import { YurtUnit } from '../models';

interface ResourceCounters {
    food: Phaser.GameObjects.Text;
    wood: Phaser.GameObjects.Text;
    morale: Phaser.GameObjects.Text;
    yurts: Phaser.GameObjects.Text;
}

let counters: ResourceCounters;
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
    // Create a semi-transparent panel for the UI
    const panel = scene.add.rectangle(10, 10, 200, 120, 0x000000, 0.7);
    panel.setOrigin(0, 0);
    panel.setStrokeStyle(1, 0xffffff, 0.8);
    
    // Create text objects for resource counters
    counters = {
        food: scene.add.text(20, 20, 'Food: 100', UI_STYLE),
        wood: scene.add.text(20, 50, 'Wood: 50', UI_STYLE),
        morale: scene.add.text(20, 80, 'Morale: 80', UI_STYLE),
        yurts: scene.add.text(20, 110, 'Yurts: 1', UI_STYLE)
    };
    
    // Make UI elements fixed to the camera
    const uiElements = [panel, ...Object.values(counters)];
    uiElements.forEach(element => {
        element.setScrollFactor(0);
        if (element instanceof Phaser.GameObjects.Text) {
            element.setDepth(100); // Make sure text is on top
        }
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
    if (!counters) return;
    
    // Calculate total morale as average of all yurts
    const totalMorale = yurtUnits.reduce((sum, yurt) => sum + yurt.morale, 0);
    const averageMorale = yurtUnits.length > 0 ? Math.floor(totalMorale / yurtUnits.length) : 0;
    
    // Update the text objects
    counters.food.setText(`Food: ${resources.food}`);
    counters.wood.setText(`Wood: ${resources.wood}`);
    counters.morale.setText(`Morale: ${averageMorale}`);
    counters.yurts.setText(`Yurts: ${yurtUnits.length}`);
}

/**
 * Shows a message in the center of the screen that fades out.
 * @param scene The Phaser.Scene to add the message to.
 * @param message The text to display.
 * @param duration How long to show the message (in milliseconds).
 */
export function showMessage(scene: Phaser.Scene, message: string, duration: number = 2000): void {
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