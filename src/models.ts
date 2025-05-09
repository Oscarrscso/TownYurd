export enum TerrainType {
    GRASS = 'grass',
    WATER = 'water',
    FOREST = 'forest',
    MOUNTAIN = 'mountain',
    EMPTY = 'empty' // For areas outside the defined map or uninitialized
}

export interface Tile {
    x: number;
    y: number;
    terrainType: TerrainType;
    occupiedBy?: string; // ID of YurtUnit or null/undefined if not occupied
    resourceYield?: { food?: number; wood?: number; [key: string]: number | undefined };
}

export interface YurtUnit {
    id: string;
    x: number; // Corresponds to Tile's x coordinate
    y: number; // Corresponds to Tile's y coordinate
    morale: number; // e.g., 0-100
    resources: {
        food: number;
        wood: number;
        // Add other resources as needed
    };
}