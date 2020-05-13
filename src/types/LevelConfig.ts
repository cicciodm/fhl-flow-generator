export interface LevelConfig {
  levels: Level[];
}

export interface Level {
  size: number;
  points: Point[];
}

export interface Point {
  color: string,
  x: number,
  y: number
};

export type CellStateMap = { [coordinates: string]: GameCell };

export interface GameCell {
  x: number,
  y: number,
  color: string,
  pieces: Piece[]
}

export type Piece = "empty" | "dot" | "down" | "left" | "up" | "right";