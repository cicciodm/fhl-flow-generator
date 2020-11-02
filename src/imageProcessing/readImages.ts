import { readdirSync, writeFile, mkdirSync, writeFileSync } from "fs";
import { LevelConfig, Level, PointWithHex, Point } from 'src/types/LevelConfig';
import Jimp from 'jimp';
import { range, zip } from 'lodash'
import * as ntc from "ntc";

type Difficulty = "easiest" | "easy" | "medium" | "moremedium" | "hard";

const difficultySizeMap: { [key: string]: number } = {
  "easiest": 5,
  "easy": 6,
  "medium": 7,
  "moremedium": 8,
  "hard": 9,
}

const difficulties: Difficulty[] = ["easy"];

const GRID_WIDTH = 828;

// Average for when the grid starts from the top of the picture
const TOP_OFFSET = 515;

async function createLevelConfigs(fileName?: string): Promise<void> {

  for (const difficulty of difficulties) {
    const gridSize = difficultySizeMap[difficulty];
    const cellSize = GRID_WIDTH / gridSize;

    const xs = range(cellSize / 2, (cellSize * (gridSize + 1)) - cellSize / 2, cellSize);
    const ys = xs.map(val => val + TOP_OFFSET);

    const path = "levels/" + (fileName ? "" : difficulty);
    let files: string[] = fileName ? [fileName] : [];

    let levelConfig: LevelConfig = {
      levels: [],
    }

    if (!fileName) {
      try {
        console.log("reading", path);
        files = readdirSync(path);
      } catch (e) {
        throw e;
      };
    }

    console.log("Found files", files);

    for (const fileName of files) {
      const imagePath = path + "/" + fileName;

      const image = await Jimp.read(imagePath);

      // see if this works
      image.contrast(0.60);
      image.color([{ apply: "saturate", params: [70] }]);

      const level: Level = {
        size: gridSize,
        points: []
      }

      const pointsWithHex: PointWithHex[] = [];

      ys.forEach((y, yi) => {
        xs.forEach((x, xi) => {
          const color = image.getPixelColour(x, y);
          const { r, g, b } = Jimp.intToRGBA(color);

          const colorHex = "#" + convertToHex(r) + convertToHex(g) + convertToHex(b);
          const colorLabel = ntc.name(colorHex)[1];

          console.log("Looking at point", x, y, colorHex, "ntc returns", colorLabel, "out of", ntc.name(colorHex));

          if (colorLabel !== "Black") {
            pointsWithHex.push({
              color: colorHex,
              colorLabel: colorLabel,
              x: xi,
              y: yi
            });
          }
        });
      });

      level.points = normalizeColors(pointsWithHex);

      levelConfig.levels.push(level);
    }

    const configToWrite = JSON.stringify(levelConfig);
    const appFolderPath = "../app/demo-react/src/data/levels/";
    const dataFolderPath = "../data/levels/";

    try {
      mkdirSync(appFolderPath, { recursive: true });
      mkdirSync(dataFolderPath, { recursive: true });
    } catch (e) {

    }

    writeFileSync(appFolderPath + "/" + difficulty + ".json", configToWrite, "utf8");
    writeFileSync(dataFolderPath + "/" + difficulty + ".json", configToWrite, "utf8");
  }
}

function convertToHex(val: number): string {
  const converted = val.toString(16);
  return converted === "0" || converted === "f" ? converted + converted : converted;
}

function normalizeColors(pointWithHex: PointWithHex[]): Point[] {
  const labelToHexMap: { [key: string]: string } = {};

  const points: Point[] = pointWithHex.map(point => {
    const { color, colorLabel } = point;
    let colorToReturn = labelToHexMap[colorLabel];

    if (!colorToReturn) {
      labelToHexMap[colorLabel] = color;
      colorToReturn = color;
    }

    return {
      ...point,
      color: colorToReturn
    };
  });

  return points;
}

createLevelConfigs();