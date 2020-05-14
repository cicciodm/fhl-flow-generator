import React from 'react';
import levelConfig from "../data/levels/easy.json";
import "./GameBoard.css"
import { range, difference, groupBy } from "lodash";
import { Level, CellStateMap, GameCell, Piece } from "../../../../types/LevelConfig";

interface GameState {
  currentLevel: number;
  debugOpen: boolean;
}

interface LevelState {
  isComplete: boolean;
  cellStateMap: CellStateMap;
  isDrawing: boolean;
  drawingColor: string;
  previousCell: GameCell | null;
}

type SetLevelStateCallback = React.Dispatch<React.SetStateAction<LevelState | null>>;

export default function GameBoard(): JSX.Element {
  const [gameState, setGameState] = React.useState<GameState>({ currentLevel: 0, debugOpen: false });
  const areaRef = React.createRef<HTMLTextAreaElement>();

  const level = levelConfig.levels[gameState.currentLevel] as Level;

  const size = level?.size || 5;
  document.documentElement.style.setProperty("--rowNum", size + "");
  document.documentElement.style.setProperty("--colNum", size + "");

  let xs = range(size);
  let ys = range(size);

  const [levelState, setLevelState] = React.useState<LevelState | null>(getLevelStateFromConfig(level, xs, ys));

  if (!level || !levelState) {
    return <h1 className={"winrar"}>A WINRAR IS YOU</h1>;
  }

  return (
    <div className={"gameBoardContainer"}>
      <div className={"debugContainer"}>
        <button className={"debugButton"} onClick={() => setGameState({ ...gameState, debugOpen: !gameState.debugOpen })}>
          Open debug
        </button>
        {gameState.debugOpen && (
          <div className={"inputContainer"}>
            <textarea className={"configTextArea"} ref={areaRef}></textarea>
            <button className={"debugButton"} onClick={() => {
              loadCellStateMap(areaRef, levelState, setLevelState);
              setGameState({ ...gameState, debugOpen: !gameState.debugOpen });
            }}>
              Load CellStateMap
            </button>
          </div>
        )}
      </div>
      <h1 className={"levelNumber"}>{"Level " + (gameState.currentLevel + 1)}</h1>
      <div className={"gameBoard"}>
        {getGameComponents(levelState, xs, ys, setLevelState)}
      </div>
      {levelState.isComplete && (
        <button className={"nextLevelButton"} onClick={() => {
          const nextLevelIndex = gameState.currentLevel + 1;
          const nextLevel = levelConfig.levels[nextLevelIndex];
          setGameState({ currentLevel: gameState.currentLevel + 1, debugOpen: false });
          if (nextLevel) {
            const nextLevelState = getLevelStateFromConfig(nextLevel, xs, ys);
            setLevelState(nextLevelState);
          }
        }}>
          Next Level
        </button>
      )}
    </div>
  );
}

function loadCellStateMap(
  ref: React.RefObject<HTMLTextAreaElement>,
  levelState: LevelState,
  setLevelState: SetLevelStateCallback
): void {
  const text = ref.current?.value;
  console.log(ref.current?.value);
  if (text) {
    const toCellStateMap = JSON.parse(text) as CellStateMap;
    console.log("parsed", toCellStateMap)
    setLevelState({ ...levelState, cellStateMap: toCellStateMap });
  }
}

function getLevelStateFromConfig(config: Level, xs: number[], ys: number[]): LevelState | null {
  if (!config) {
    return null;
  }

  const levelState: LevelState = {
    isComplete: false,
    cellStateMap: {},
    isDrawing: false,
    drawingColor: "none",
    previousCell: null
  }

  ys.forEach(y => {
    xs.forEach(x => {
      const definedDot = config.points.find(point => point.x === x && point.y === y);
      levelState.cellStateMap["" + x + y] = definedDot ? {
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
  return levelState;
}

function getGameComponents(
  levelState: LevelState,
  xs: number[],
  ys: number[],
  setLevelState: SetLevelStateCallback
): JSX.Element[] {
  return ys.flatMap(y => {
    return xs.map(x => {
      const gameCell = levelState.cellStateMap["" + x + y];
      return (
        <div
          className={"gameCell"}
          key={"" + x + y}
          onClick={() => startDrawing(gameCell, levelState, setLevelState)}
          onMouseEnter={() => mouseEnteredCell(gameCell, levelState, setLevelState)}
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
  levelState: LevelState,
  setLevelState: SetLevelStateCallback
): void {
  // Already drawing, reset
  if (levelState.isDrawing) {
    const levelComplete = isLevelComplete(levelState.cellStateMap);
    setLevelState({ ...levelState, isDrawing: false, drawingColor: "none", previousCell: null, isComplete: levelComplete })
    return;
  }

  // Set DrawingState
  if (!hasPiece("empty", gameCell)) {
    setLevelState({ ...levelState, isDrawing: true, drawingColor: gameCell.color, previousCell: gameCell })
  }
}

function mouseEnteredCell(
  destinationCell: GameCell,
  levelState: LevelState,
  setLevelState: SetLevelStateCallback
): void {
  if (!levelState.isDrawing || !levelState.previousCell) {
    return;
  }

  const sourceCell = levelState.previousCell;

  const [source, destination] = getPiecesForDirection(sourceCell, destinationCell);

  // Invalid move, do nothing
  if (source === "empty" && destination === "empty") {
    return;
  }

  const newSource: GameCell = {
    ...sourceCell,
    color: levelState.drawingColor,
    pieces: [...(difference(sourceCell.pieces, ["empty" as Piece])), source],
  }

  const newDestination: GameCell = {
    ...destinationCell,
    color: levelState.drawingColor,
    pieces: [...(difference(destinationCell.pieces, ["empty" as Piece])), destination],
  }

  const newCellStateMap = {
    ...levelState.cellStateMap
  }

  newCellStateMap["" + newSource.x + newSource.y] = newSource;
  newCellStateMap["" + newDestination.x + newDestination.y] = newDestination;

  const newLevelState = {
    ...levelState,
    cellStateMap: newCellStateMap,
    previousCell: newDestination,
  }

  setLevelState(newLevelState);
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