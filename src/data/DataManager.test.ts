import { describe, it, expect, vi } from 'vitest';
import { DataManager, GameState } from './DataManager';
import { YurtUnit, Tile, TerrainType } from '../models';

describe('DataManager Serialization/Deserialization', () => {
    const rows = 10; // Using a smaller map for faster tests
    const cols = 15;
    const initialResources = { food: 100, wood: 50 };

    // Helper to get a deep copy of the current game state for comparison
    const createSnapshot = (dm: DataManager): GameState => {
        return JSON.parse(dm.serializeGameState());
    };

    it('should correctly serialize and deserialize an initial game state (Map Snapshot 1)', () => {
        const dataManager = new DataManager(rows, cols, { ...initialResources });
        const originalState = createSnapshot(dataManager);

        const serializedState = dataManager.serializeGameState();
        const newDataManager = new DataManager(1, 1, { food: 0, wood: 0 }); // Start with a minimal dummy state
        newDataManager.deserializeGameState(serializedState);
        const deserializedState = createSnapshot(newDataManager);

        // Compare map dimensions, resources, yurts
        expect(deserializedState.mapSize).toEqual(originalState.mapSize);
        expect(deserializedState.resources).toEqual(originalState.resources);
        expect(deserializedState.yurtUnits).toEqual(originalState.yurtUnits);

        // Thoroughly compare maps tile by tile
        expect(deserializedState.map.length).toBe(originalState.map.length);
        for (let y = 0; y < originalState.map.length; y++) {
            expect(deserializedState.map[y].length).toBe(originalState.map[y].length);
            for (let x = 0; x < originalState.map[y].length; x++) {
                expect(deserializedState.map[y][x]).toEqual(originalState.map[y][x]);
            }
        }
    });

    it('should correctly serialize and deserialize game state after adding yurts (Map Snapshot 2)', () => {
        const dataManager = new DataManager(rows, cols, { ...initialResources }); // New DM instance for a potentially different map
        const yurt1: YurtUnit = { id: 'y1', x: 1, y: 1, morale: 80, resources: { food: 0, wood: 0 } };
        const yurt2: YurtUnit = { id: 'y2', x: 3, y: 3, morale: 90, resources: { food: 0, wood: 0 } };
        
        // Attempt to place yurts on buildable tiles
        const tile1 = dataManager.getTile(yurt1.x, yurt1.y);
        if (tile1 && tile1.terrainType !== TerrainType.WATER && tile1.terrainType !== TerrainType.MOUNTAIN) {
             dataManager.addYurtUnit(yurt1);
        }
       
        const tile2 = dataManager.getTile(yurt2.x, yurt2.y);
         if (tile2 && tile2.terrainType !== TerrainType.WATER && tile2.terrainType !== TerrainType.MOUNTAIN) {
            dataManager.addYurtUnit(yurt2);
        }

        const originalState = createSnapshot(dataManager);
        const serializedState = dataManager.serializeGameState();
        const newDataManager = new DataManager(1, 1, { food: 0, wood: 0 });
        newDataManager.deserializeGameState(serializedState);
        const deserializedState = createSnapshot(newDataManager);

        expect(deserializedState.yurtUnits.length).toBe(originalState.yurtUnits.length);
        // Use expect.arrayContaining for yurts as order might not be guaranteed, though push maintains it.
        // For exact match including order and content:
        expect(deserializedState.yurtUnits).toEqual(originalState.yurtUnits);

        // Check map for occupiedBy status if yurts were placed
        for (const yurt of originalState.yurtUnits) {
            const originalTile = originalState.map[yurt.y][yurt.x];
            const deserializedTile = deserializedState.map[yurt.y][yurt.x];
            expect(deserializedTile.occupiedBy).toBe(originalTile.occupiedBy);
        }
         // Also check the overall map state
        expect(deserializedState.map).toEqual(originalState.map);
    });

    it('should correctly serialize and deserialize game state after resource changes (Map Snapshot 3)', () => {
        const dataManager = new DataManager(rows + 2, cols - 2, { food: 150, wood: 75 }); // New DM, different size
        dataManager.updateResources(50, -20); // food +50, wood -20
        
        const originalState = createSnapshot(dataManager);
        const serializedState = dataManager.serializeGameState();
        const newDataManager = new DataManager(1, 1, { food: 0, wood: 0 });
        newDataManager.deserializeGameState(serializedState);
        const deserializedState = createSnapshot(newDataManager);

        expect(deserializedState.resources).toEqual(originalState.resources);
        // Check the overall state for full integrity
        expect(deserializedState).toEqual(originalState);
    });
    
    it('should handle deserialization of invalid JSON gracefully', () => {
        const dataManager = new DataManager(rows, cols, initialResources);
        const originalStateSnapshot = createSnapshot(dataManager); 

        const invalidJson = "{\'not_json\': definitely}"; // Intentionally invalid JSON
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        dataManager.deserializeGameState(invalidJson);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to deserialize game state: Invalid format");
        // Check that the state of dataManager remains unchanged.
        const stateAfterInvalidDeserialization = createSnapshot(dataManager);
        expect(stateAfterInvalidDeserialization).toEqual(originalStateSnapshot);

        consoleErrorSpy.mockRestore();
    });

    it('should handle deserialization of JSON with incorrect GameState structure', () => {
        const dataManager = new DataManager(rows, cols, initialResources);
        const originalStateSnapshot = createSnapshot(dataManager);

        const incorrectStructureJson = JSON.stringify({ someOtherData: "value", map: [], yurtUnits: "not_an_array" });
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        dataManager.deserializeGameState(incorrectStructureJson);

        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to deserialize game state: Invalid format");
        const stateAfterIncorrectDeserialization = createSnapshot(dataManager);
        expect(stateAfterIncorrectDeserialization).toEqual(originalStateSnapshot);
        
        consoleErrorSpy.mockRestore();
    });
});
