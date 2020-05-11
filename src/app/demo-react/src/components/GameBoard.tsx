import React from 'react';
import levels from "../levels/levels.json";
import "./GameBoard.css"
import { range, difference } from "lodash";

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
  cellStateMap: { [coordinates: string]: GameCell };
  isDrawing: boolean;
  drawingColor: string;
  previousCell: GameCell | null;
}

export interface GameCell {
  x: number,
  y: number,
  color: string,
  pieces: Piece[]
}

export type Piece = "empty" | "dot" | "down" | "left" | "up" | "right";

type SetStateCallback = React.Dispatch<React.SetStateAction<GameState>>;

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
    drawingColor: "none",
    previousCell: null
  }

  ys.forEach(y => {
    xs.forEach(x => {
      const definedDot = config.points.find(point => point.x === x && point.y === y);
      gameState.cellStateMap["" + x + y] = definedDot ? {
        x,
        y,
        color: definedDot.color,
        pieces: ["dot"]
      } : {
          x,
          y,
          color: "none",
          pieces: ["empty"]
        };
    });
  });
  return gameState;
}

function getGameComponents(
  gameState: GameState,
  xs: number[],
  ys: number[],
  setGameState: SetStateCallback
): JSX.Element[] {
  return ys.flatMap(y => {
    return xs.map(x => {
      const gameCell = gameState.cellStateMap["" + x + y];
      return (
        <div
          className={"gameCell"}
          key={"" + x + y}
          onClick={() => startDrawing(gameCell, gameState, setGameState)}
          onMouseEnter={() => mouseEnteredCell(gameCell, gameState, setGameState)}
          onMouseLeave={() => mouseLeftCell(gameCell, gameState, setGameState)}
        >
          {getInnerCellForGamePiece(gameCell)}
        </div>
      );
    });
  });
}

function getInnerCellForGamePiece(gameCell: GameCell): JSX.Element[] {
  return gameCell.pieces.map(piece => {
    if (piece === "empty") {
      return <></>;
    }

    const isDot = piece === "dot";
    return (
      <div
        style={{ backgroundColor: gameCell.color }}
        className={piece}>
      </div>
    );
  });
}

function startDrawing(
  gameCell: GameCell,
  gameState: GameState,
  setGameState: SetStateCallback
): void {
  // Already drawing, reset
  if (gameState.isDrawing) {
    setGameState({ ...gameState, isDrawing: false, drawingColor: "none", previousCell: null })
    return;
  }

  // Set DrawingState
  if (!hasPiece("empty", gameCell)) {
    setGameState({ ...gameState, isDrawing: true, drawingColor: gameCell.color, previousCell: gameCell })
  }
}

function mouseEnteredCell(
  destinationCell: GameCell,
  gameState: GameState,
  setGameState: SetStateCallback
): void {
  if (!gameState.isDrawing || !gameState.previousCell) {
    return;
  }

  const sourceCell = gameState.previousCell;

  const [source, destination] = getPiecesForDirection(sourceCell, destinationCell);

  if (source === "empty" && destination === "empty") {
    return;
  }

  const newSource: GameCell = {
    ...sourceCell,
    color: gameState.drawingColor,
    pieces: [...(difference(sourceCell.pieces, ["empty" as Piece])), source],
  }


  const newDestination: GameCell = {
    ...destinationCell,
    color: gameState.drawingColor,
    pieces: [...(difference(destinationCell.pieces, ["empty" as Piece])), destination],
  }

  const newCellStateMap = {
    ...gameState.cellStateMap
  }

  newCellStateMap["" + newSource.x + newSource.y] = newSource;
  newCellStateMap["" + newDestination.x + newDestination.y] = newDestination;

  const newGameState = {
    ...gameState,
    cellStateMap: newCellStateMap,
    previousCell: newDestination
  }

  setGameState(newGameState);
}

function mouseLeftCell(
  gamePiece: GameCell,
  gameState: GameState,
  setGameState: SetStateCallback
): void {

}

function getPiecesForDirection(source: GameCell, destination: GameCell): Piece[] {
  const pieces: Piece[] = [];

  const verticalMovement = source.y - destination.y;
  const horizontalMovement = source.x - destination.x;

  if (!(verticalMovement || horizontalMovement)) {
    return ["empty", "empty"];
  }

  if (verticalMovement > 0) {
    // Going up
    return ["up", "down"];
  } else if (verticalMovement < 0) {
    // going down
    return ["down", "up"];
  } else if (horizontalMovement > 0) {
    // Going right
    return ["left", "right"];
  } else if (horizontalMovement < 0) {
    // going up
    return ["right", "left"];
  }
  return pieces;
}

function hasPiece(needle: Piece, haystack: GameCell): boolean {
  return haystack.pieces.some(piece => piece === needle)
}