import { readdirSync, mkdirSync, writeFileSync } from "fs";
import { LevelConfig, Level, PointWithHex, Point, Difficulties, DifficultySizeMap } from '../types/LevelConfig';
import Jimp from 'jimp';
import { range, zip } from 'lodash'
import * as ntc from "ntc";

const GRID_WIDTH = 828;
const BLACK = "#000000"

// Average for when the grid starts from the top of the picture
const TOP_OFFSET = 515;

async function createLevelConfigs(fileName?: string): Promise<void> {

  for (const difficulty of Difficulties) {
    const gridSize = DifficultySizeMap[difficulty];
    const cellSize = Math.round(GRID_WIDTH / gridSize);
    const halfCell = Math.round(cellSize / 2);

    const xs = range(halfCell, (cellSize * (gridSize + 1)) - halfCell, cellSize);
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
      // image.contrast(0.50);
      image.color([{ apply: "saturate", params: [50] }]);

      const level: Level = {
        size: gridSize,
        points: []
      }

      const pointsWithHex: PointWithHex[] = [];

      ys.forEach((y, yi) => {
        xs.forEach((x, xi) => {
          const color = image.getPixelColor(x, y);
          const { r, g, b, a } = Jimp.intToRGBA(color);
          const colorHex = "#" + convertToHex(r > 25 ? r : 0) + convertToHex(g > 25 ? g : 0) + convertToHex(b > 25 ? b : 0);
          const ntcColorResult = ntc.name(colorHex);
          const ntcColorLabel = ntcColorResult[1];

          console.log("Looking at point", x, y, "we have the info", color, r, g, b, "and then", colorHex, ntcColorLabel, ntcColorResult);

          if (colorHex !== BLACK) {
            pointsWithHex.push({
              color: colorHex,
              colorLabel: ntcColorLabel,
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
  return converted.length === 1 ? "0" + converted : converted;
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