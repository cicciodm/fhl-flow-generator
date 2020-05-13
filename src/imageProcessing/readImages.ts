import { readdirSync, writeFile, mkdirSync, writeFileSync } from "fs";
import { LevelConfig, Level } from 'src/types/LevelConfig';
import Jimp from 'jimp';
import { range } from 'lodash'
import * as ntc from "ntc";

type Difficulty = "easy" | "medium" | "hard";

const difficulties: Difficulty[] = ["easy"];

const GRID_SIZE = 5; // will eventually detect this;

const CELL_SIDE = 166;
const GRID_SIDE = CELL_SIDE * GRID_SIZE;
const TOP_OFFSET = 504;

const xs = range(CELL_SIDE / 2, (CELL_SIDE * (GRID_SIZE + 1)) - CELL_SIDE / 2, CELL_SIDE);
const ys = xs.map(val => val + TOP_OFFSET);

async function createLevelConfigs(fileName?: string): Promise<void> {
  for (const difficulty of difficulties) {
    const path = "levels/" + difficulty;
    let files: string[] = fileName ? [fileName] : [];

    let levelConfig: LevelConfig = {
      levels: [],
    }

    if (!fileName) {
      try {
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
        size: GRID_SIZE,
        points: []
      }

      ys.forEach((y, yi) => {
        xs.forEach((x, xi) => {
          const color = image.getPixelColour(x, y);
          const { r, g, b } = Jimp.intToRGBA(color);

          const colorToUse = "#" + convertToHex(r) + convertToHex(g) + convertToHex(b);
          const colorLabel = ntc.name(colorToUse)[3];

          if (colorLabel !== "Black") {
            level.points.push({
              color: colorLabel.toLowerCase(),
              x: xi,
              y: yi
            });
          }
        });
      });
      levelConfig.levels.push(level);
    }

    const configToWrite = JSON.stringify(levelConfig);
    const folderPath = "../app/demo-react/src/data/levels/";

    try {
      mkdirSync(folderPath, { recursive: true });
    } catch (e) {

    }

    writeFileSync(folderPath + "/" + difficulty + ".json", configToWrite, "utf8");
  }
}

function convertToHex(val: number): string {
  const converted = val.toString(16);
  return converted === "0" || converted === "f" ? converted + converted : converted;
}

createLevelConfigs();