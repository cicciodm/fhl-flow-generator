import { CellStateMap, Level, Piece, Point, GameCell } from "src/types/LevelConfig";
import { range, groupBy, List } from "lodash";
import levels from "../data/levels/test.json";

type MovesMap = { [coordinates: string]: Piece[] };
type ListOfPointPairs = [Point, Point][];

function solveLevel(level: Level): CellStateMap {
  // Prep
  const size = level.size;
  const cellStateMap: CellStateMap = {};
  const listOfPointPairs: ListOfPointPairs =
    Object.values(groupBy(level.points, point => point.color)) as ListOfPointPairs;

  let xs = range(size);
  let ys = range(size);

  ys.forEach(y => {
    xs.forEach(x => {
      const definedDot = level.points.find(point => point.x === x && point.y === y);
      cellStateMap["" + x + y] = definedDot ? {
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

  const possibleMovesMap: MovesMap = {};

  ys.forEach(y => {
    xs.forEach(x => {
      const possibleMoves: Piece[] = [];
      // Can move right
      if (x < size - 1) {
        possibleMoves.push("right");
      }
      // Can move left
      if (x > 0) {
        possibleMoves.push("left");
      }
      // can move down
      if (y < size - 1) {
        possibleMoves.push("down");
      }
      // can move up
      if (y > 0) {
        possibleMoves.push("up");
      }
      possibleMovesMap["" + x + y] = possibleMoves;
    });
  });

  console.log("map of possible moves");

  return cellStateMap;
}

function walkPathToEnd(
  start: Point,
  end: Point,
  currentIndex: number,
  startEndList: ListOfPointPairs,
  possibleMovesMap: MovesMap,
  cellStateMap: CellStateMap,
): boolean {
  let wasPathValid = false;
  const movesFromStart = possibleMovesMap["" + start.x + start.y];

  movesFromStart.forEach(move => {
    // assume this works
    const currentCoordinates = "" + start.x + start.y;
    cellStateMap[currentCoordinates].pieces.push(move);

    const nextPoint = getNextPointInDirection(start, move);

    if (arePointsEqual(nextPoint, end)) {
      // We completed this path
      if (isLevelComplete(cellStateMap)) {
        // We are done done
        console.log("Solution found", cellStateMap);
        wasPathValid = true;
      } else {
        // We are moving to the next path, for the next color
        const nextIndex = currentIndex += 1;
        const [nextStart, nextEnd] = startEndList[nextIndex];
        wasPathValid = walkPathToEnd(
          nextStart,
          nextEnd,
          nextIndex,
          startEndList,
          possibleMovesMap,
          cellStateMap
        );
      }
    } else {
      const nextGameCell = cellStateMap["" + nextPoint.x + nextPoint.y];

      if (nextGameCell && nextGameCell.color != "none") {
        // We actually move to the next cell!
        nextGameCell.color = start.color;
        wasPathValid =
          walkPathToEnd(
            nextGameCell,
            end,
            currentIndex,
            startEndList,
            possibleMovesMap,
            cellStateMap);
      }

      if (!wasPathValid) {
        // We are not done, and need to walk further from here
        nextGameCell.color = "none";
        cellStateMap[currentCoordinates].pieces.pop();
      }
    }
  });

  return wasPathValid;
}

function getNextPointInDirection(point: Point, move: Piece): Point {
  const nextPoint = { ...point };
  switch (move) {
    case "down":
      nextPoint.y = nextPoint.y + 1;
      break;
    case "up":
      nextPoint.y = nextPoint.y - 1;
      break;
    case "left":
      nextPoint.x = nextPoint.x - 1;
      break;
    case "right":
      nextPoint.x = nextPoint.x + 1;
      break;
  }
  return point;
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
    // if (!hasPiece(oppositeDirection, nextCell)) {
    //   return false;
    // }

    // Step:
    // Change cells
    // The direction we are moving is the other direction which is not the one we came from
    currentCell = nextCell;
    directionToFollow = currentCell.pieces.filter(piece => piece !== oppositeDirection)[0];
  } while (!hasPiece("dot", currentCell))

  return true;
}

function arePointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function hasPiece(needle: Piece, haystack: GameCell): boolean {
  return haystack.pieces.some(piece => piece === needle)
}



solveLevel(levels.levels[0]);