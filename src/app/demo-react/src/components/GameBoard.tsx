import React from 'react';
import levels from "../levels/levels.json";
import "./GameBoard.css"
import { range, difference, groupBy } from "lodash";

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
  cellStateMap: CellStateMap;
  isDrawing: boolean;
  drawingColor: string;
  previousCell: GameCell | null;
}

type CellStateMap = { [coordinates: string]: GameCell };

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
      <div className={"completionIndicator"}>
        {"Level Complete: " + gameState.isComplete}
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
    const levelComplete = isLevelComplete(gameState.cellStateMap);
    setGameState({ ...gameState, isDrawing: false, drawingColor: "none", previousCell: null, isComplete: levelComplete })
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

  // Invalid move, do nothing
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
    previousCell: newDestination,
  }

  setGameState(newGameState);
}

function getPiecesForDirection(source: GameCell, destination: GameCell): Piece[] {
  const pieces: Piece[] = [];

  const verticalMovement = source.y - destination.y;
  const horizontalMovement = source.x - destination.x;

  // Diagonal movement is not allowed
  if (!(verticalMovement || horizontalMovement)) {
    return ["empty", "empty"];
  }

  // Movement bigger than 1 is not allowed
  if (Math.abs(verticalMovement) > 1 || Math.abs(horizontalMovement) > 1) {
    return ["empty", "empty"];
  }

  // A move is only valid if the destination is empty, or has a dot of the correct color
  if (
    hasPiece("empty", destination) ||
    (hasPiece("dot", destination) && source.color === destination.color)
  ) {
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
  } else {
    return ["empty", "empty"];
  }

}

function hasPiece(needle: Piece, haystack: GameCell): boolean {
  return haystack.pieces.some(piece => piece === needle)
}

// Level is complete if:
// - all cells are not empty
// - All dots are connected by a path of the right color
function isLevelComplete(cellStateMap: CellStateMap): boolean {
  const gameCells = Object.values(cellStateMap);

  const allCellsFull = gameCells.every(gameCell => !hasPiece("empty", gameCell));

  const dotGroups = groupBy(gameCells.filter(cell => hasPiece("dot", cell)), cell => cell.color);
  const allDotsConnected = Object.keys(dotGroups).every(color => correctPathExists(dotGroups[color][0], cellStateMap));

  return allDotsConnected && allCellsFull;
}

function correctPathExists(start: GameCell, cellStateMap: CellStateMap): boolean {
  let currentCell = start;
  let directionToFollow = start.pieces.filter(piece => piece !== "dot")[0];

  do {
    let nextY = currentCell.y;
    let nextX = currentCell.x;
    let oppositeDirection: Piece;

    // Move
    switch (directionToFollow) {
      case "up": {
        nextY -= 1;
        oppositeDirection = "down";
        break;
      }
      case "down": {
        nextY += 1;
        oppositeDirection = "up";
        break;
      }
      case "right": {
        nextX += 1;
        oppositeDirection = "left";
        break;
      }
      case "left": {
        oppositeDirection = "right";
        nextX -= 1;
        break;
      }
      default:
        // Hit an empty, not good.
        return false;
    }

    const nextCell = cellStateMap["" + nextX + nextY];

    // Check for correctness

    // We went out of bounds, fail
    if (!nextCell) {
      return false;
    }

    // If the color is different, there is no path
    if (currentCell.color !== nextCell.color) {
      return false;
    }

    // There is no connecting path from the previous cell to the current cell
    // So if we were going "up", we need to make sure that there's a "down"
    if (!hasPiece(oppositeDirection, nextCell)) {
      return false;
    }

    // Step:
    // Change cells
    // The direction we are moving is the other direction which is not the one we came from
    currentCell = nextCell;
    directionToFollow = currentCell.pieces.filter(piece => piece !== oppositeDirection)[0];
  } while (!hasPiece("dot", currentCell))

  return true;
}