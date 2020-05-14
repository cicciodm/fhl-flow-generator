import { CellStateMap, Level, Piece, Point, GameCell } from "src/types/LevelConfig";
import { range, groupBy, List } from "lodash";
import levels from "../data/levels/easy.json";

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

  console.log("cellState at start", cellStateMap);

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

  const [start, end] = listOfPointPairs[0];

  walkPathToEnd(start, end, 0, listOfPointPairs, possibleMovesMap, cellStateMap);

  console.log("cellStateMap after solving\n", JSON.stringify(cellStateMap));

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

  console.log("possible moves from point", start, "are", movesFromStart);

  movesFromStart.forEach(move => {
    if (!wasPathValid) {
      console.log("testing", move, "from point", start);
      // assume this works
      const currentCoordinates = "" + start.x + start.y;
      const piecesLeft = cellStateMap[currentCoordinates].pieces.filter(piece => piece !== "empty"); //remove empty
      piecesLeft.push(move);
      cellStateMap[currentCoordinates].pieces = [...piecesLeft];
      console.log("as we are moving towards", move, "cellStateMap at", currentCoordinates, "now has pieces", cellStateMap[currentCoordinates].pieces);

      const nextPoint = getNextPointInDirection(start, move);
      console.log("The next point in direction", move, "is", nextPoint);

      console.log("comparing", nextPoint, "to end", end);
      if (arePointsEqual(nextPoint, end)) {
        const oppositeDirection = getOppositeDirection(move);
        cellStateMap["" + end.x + end.y].pieces.push(oppositeDirection);
        console.log("Adding final move to end", cellStateMap["" + end.x + end.y], oppositeDirection);
        console.log("End found, checking completion", JSON.stringify(cellStateMap));
        // We completed this path
        if (isLevelComplete(cellStateMap)) {
          // We are done done
          console.log("Solution found", JSON.stringify(cellStateMap));
          wasPathValid = true;
        } else {
          console.log("Completed this path, now finding next");
          // We are moving to the next path, for the next color
          const nextIndex = currentIndex += 1;
          if (nextIndex === startEndList.length) {
            wasPathValid = true;
          } else {

            const [nextStart, nextEnd] = startEndList[nextIndex];

            console.log("about to start recursing for", nextStart, nextEnd);
            wasPathValid = walkPathToEnd(
              nextStart,
              nextEnd,
              nextIndex,
              startEndList,
              possibleMovesMap,
              cellStateMap
            );
          }
        }
      } else {
        console.log("We have not reached the end");
        const nextCoordinates = "" + nextPoint.x + nextPoint.y;
        const nextGameCell = cellStateMap[nextCoordinates];
        console.log("The Cell corresponding to the next point after moving is", nextGameCell);

        if (nextGameCell && nextGameCell.color === "none") {
          // We actually move to the next cell!
          const currentColor = cellStateMap[currentCoordinates].color;
          cellStateMap[nextCoordinates].color = currentColor;
          nextPoint.color = currentColor;
          const oppositeDirection = getOppositeDirection(move);
          const nextPieces = cellStateMap[nextCoordinates].pieces.filter(piece => piece !== "empty");
          nextPieces.push(oppositeDirection);
          cellStateMap[nextCoordinates].pieces = [...nextPieces];

          console.log("We are about to recurse for same path with", nextPoint, end);
          console.log("Before recursing, I will mark nextCell as part of the path", cellStateMap[nextCoordinates]);

          wasPathValid =
            walkPathToEnd(
              nextPoint,
              end,
              currentIndex,
              startEndList,
              possibleMovesMap,
              cellStateMap);

          if (!wasPathValid) {
            console.log("We did recurse down, but did not find a valid path from", start, "to", end);
            // We are not done, and need to walk further from here
            cellStateMap[nextCoordinates].color = "none";
            cellStateMap[nextCoordinates].pieces.pop();
            if (cellStateMap[nextCoordinates].pieces.length === 0) {
              cellStateMap[nextCoordinates].pieces.push("empty");
            }
            console.log("Just reset next cell", cellStateMap[nextCoordinates]);
            cellStateMap[currentCoordinates].pieces.pop();
            if (cellStateMap[currentCoordinates].pieces.length === 0) {
              cellStateMap[currentCoordinates].pieces.push("empty");
            }
            console.log("Just reset current cell", cellStateMap[currentCoordinates]);
            return wasPathValid;
          }
        } else {
          if (!wasPathValid) {
            console.log("We hit a wall, and did not find a path from", start, "to", end);
            cellStateMap[currentCoordinates].pieces.pop();
            if (cellStateMap[currentCoordinates].pieces.length === 0) {
              cellStateMap[currentCoordinates].pieces.push("empty");
            }
            console.log("Just reset current cell", cellStateMap[currentCoordinates]);
            return false;
          }
        }
      }

      if (!wasPathValid) {
        cellStateMap[currentCoordinates].pieces.pop();
        if (cellStateMap[currentCoordinates].pieces.length === 0) {
          cellStateMap[currentCoordinates].pieces.push("empty");
        }
        console.log("---- the current move", move, "from", start, "wasn't successful, so removing it from the moves", cellStateMap[currentCoordinates]);
      }
    } else {
      console.log("Solution already found, so skip");
    }
  });
  console.log("We are at the end of call for", start, end, "and will return", wasPathValid);
  return wasPathValid;
}

function getNextPointInDirection(point: Point, move: Piece): Point {
  const nextPoint = { ...point, color: "none" };
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
  return nextPoint;
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
    const { x: nextX, y: nextY } = getNextPointInDirection(currentCell, directionToFollow);
    const oppositeDirection = getOppositeDirection(directionToFollow);

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

function getOppositeDirection(direction: Piece): Piece {
  switch (direction) {
    case "up": {
      return "down";
    }
    case "down": {
      return "up";
    }
    case "right": {
      return "left";
    }
    case "left": {
      return "right";
    }
    default:
      // Hit an empty, not good.
      return "empty";
  }
}

function arePointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function hasPiece(needle: Piece, haystack: GameCell): boolean {
  return haystack.pieces.some(piece => piece === needle)
}



solveLevel(levels.levels[1]);