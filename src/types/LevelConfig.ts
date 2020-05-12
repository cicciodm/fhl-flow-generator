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
