import React from 'react';
import levels from "../levels/levels.json";
import "./GameBoard.css"
import { range } from "lodash";

export interface Level {
  size: number;
  points: Point[];
}

export interface Point {
  color: string,
  x: number,
  y: number
};

interface GameState {
  isComplete: boolean;
  cellStateMap: { [coordinates: string]: GamePiece };
  isDrawing: boolean;
  drawingColor: string;
}

export interface GamePiece {
  color: string,
  piece: Piece
}

export type Piece = "empty" | "dot" | "upright" | "upleft" | "dowright" | "downleft" | "updown" | "leftright";

export default function GameBoard(): JSX.Element {
  const level = levels[0] as Level;
  const size = level.size;

  let xs = range(size);
  let ys = range(size);


  const [gameState, setGameState] = React.useState<GameState>(getGameStateFromConfig(level, xs, ys));

  document.documentElement.style.setProperty("--rowNum", level.size + "");
  document.documentElement.style.setProperty("--colNum", level.size + "");

  return (
    <div className={"gameBoardContainer"}>
      <div className={"gameBoard"}>
        {getGameComponents(gameState, xs, ys, setGameState)}
      </div>
    </div>
  );
}

function getGameStateFromConfig(config: Level, xs: number[], ys: number[]): GameState {
  const gameState: GameState = {
    isComplete: false,
    cellStateMap: {},
    isDrawing: false,
    drawingColor: "none"
  }

  ys.forEach(y => {
    xs.forEach(x => {
      const definedDot = config.points.find(point => point.x === x && point.y === y);
      gameState.cellStateMap["" + x + y] = definedDot ? {
        color: definedDot.color,
        piece: "dot"
      } : {
          color: "none",
          piece: "empty"
        };
    });
  });
  return gameState;
}

function getGameComponents(
  gameState: GameState,
  xs: number[],
  ys: number[],
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
): JSX.Element[] {
  return ys.flatMap(y => {
    return xs.map(x => {
      const gamePiece = gameState.cellStateMap["" + x + y];
      return (
        <div className={"gameCell"} key={"" + x + y} onClick={() => startDrawing(gamePiece, gameState, setGameState)}>
          {getInnerCellForGamePiece(gamePiece)}
        </div>
      );
    });
  });
}

function getInnerCellForGamePiece(gamePiece: GamePiece): JSX.Element | null {
  switch (gamePiece.piece) {
    case "dot":
      return <div style={{ backgroundColor: gamePiece.color }} className={"dot"}></div>
    default:
      return null;
  }
}

function startDrawing(
  gamePiece: GamePiece,
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
): void {
  // Already drawing, reset
  if (gameState.isDrawing) {
    setGameState({ ...gameState, isDrawing: false, drawingColor: "none" })
    return;
  }

  // Set DrawingState
  if (gamePiece.piece !== "empty") {
    setGameState({ ...gameState, isDrawing: true, drawingColor: gamePiece.color })
  }
}