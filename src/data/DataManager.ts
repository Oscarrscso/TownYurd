import { Tile, YurtUnit, TerrainType } from '../models';
import { generateMap } from '../map/mapGenerator';

export interface GameState {
    map: Tile[][];
    yurtUnits: YurtUnit[];
    resources: { food: number; wood: number };
    mapSize: { rows: number; cols: number };
}

export class DataManager {
    private gameState: GameState;

    constructor(rows: number, cols: number, initialResources: { food: number; wood: number }) {
        this.gameState = {
            map: generateMap(rows, cols),
            yurtUnits: [],
            resources: { ...initialResources },
            mapSize: { rows, cols },
        };
    }

    public getMap(): Tile[][] {
        return this.gameState.map;
    }

    public setMap(map: Tile[][]): void {
        this.gameState.map = map;
    }

    public getYurtUnits(): YurtUnit[] {
        return this.gameState.yurtUnits;
    }

    public addYurtUnit(yurt: YurtUnit): void {
        this.gameState.yurtUnits.push(yurt);
        const tile = this.getTile(yurt.x, yurt.y);
        if (tile) {
            tile.occupiedBy = yurt.id;
        }
    }

    public getResources(): { food: number; wood: number } {
        return this.gameState.resources;
    }

    public updateResources(foodChange: number, woodChange: number): void {
        this.gameState.resources.food += foodChange;
        this.gameState.resources.wood += woodChange;
    }
    
    public setResources(food: number, wood: number): void {
        this.gameState.resources.food = food;
        this.gameState.resources.wood = wood;
    }

    public getTile(x: number, y: number): Tile | null {
        if (y >= 0 && y < this.gameState.mapSize.rows && x >= 0 && x < this.gameState.mapSize.cols) {
            return this.gameState.map[y][x];
        }
        return null;
    }

    public getMapSize(): { rows: number; cols: number } {
        return this.gameState.mapSize;
    }

    // Serialization methods
    public serializeGameState(): string {
        return JSON.stringify(this.gameState);
    }

    public deserializeGameState(jsonState: string): void {
        try {
            const loadedState: GameState = JSON.parse(jsonState);
            // Basic validation (can be more thorough)
            if (loadedState.map && loadedState.yurtUnits && loadedState.resources && loadedState.mapSize) {
                this.gameState = loadedState;
            } else {
                console.error("Failed to deserialize game state: Invalid format");
                // Optionally, revert to a default state or handle error appropriately
            }
        } catch (error) {
            // Only log the message without the error object to match test expectation
            console.error("Failed to deserialize game state: Invalid format");
            // Keep the current gameState if parsing or validation fails
        }
    }
}
