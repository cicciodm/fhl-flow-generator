import { Difficulty, Level, LevelList } from "../../../../types/LevelConfig";
import hardLevels from "../data/levels/hard.json";
import easiestLevels from "../data/levels/easiest.json";
import easyLevels from "../data/levels/easy.json";
import mediumLevels from "../data/levels/medium.json";
import moremediumLevels from "../data/levels/moremedium.json";
import React from 'react';
import GameBoard from "./GameBoard";

export const difficulties: Difficulty[] = [
  "easiest", "easy", "medium", "moremedium", "hard"
];

const levelListByDifficulty: { [key: string]: LevelList } = {
  "easiest": easiestLevels,
  "easy": easyLevels,
  "medium": mediumLevels,
  "moremedium": moremediumLevels,
  "hard": hardLevels
};

interface GameState {
  currentDifficultyIndex: number;
  currentLevelIndex: number;
  debugOpen: boolean;
  isGameOver: boolean;
  loadedLevel?: Level;
}

export default function Game(): JSX.Element {
  const [gameState, setGameState] = React.useState<GameState>({ currentLevelIndex: 0, currentDifficultyIndex: 0, debugOpen: false, isGameOver: false });
  const areaRef = React.createRef<HTMLTextAreaElement>();

  const loadLevel = React.useCallback((level: Level) => setGameState({ ...gameState, loadedLevel: level }), [gameState]);
  const moveToNextLevel = React.useCallback(() => {
    let nextLevelIndex = gameState.currentLevelIndex + 1;
    let nextDifficultyIndex = gameState.currentDifficultyIndex;
    const currentDifficulty = difficulties[gameState.currentDifficultyIndex];

    if (nextLevelIndex === levelListByDifficulty[currentDifficulty].levels.length) {
      nextLevelIndex = 0;
      nextDifficultyIndex = nextDifficultyIndex + 1;
    }

    if (nextDifficultyIndex === difficulties.length) {
      setGameState({ ...gameState, isGameOver: true })
    } else {
      setGameState({ ...gameState, currentLevelIndex: nextLevelIndex, currentDifficultyIndex: nextDifficultyIndex });
    }

  }, [gameState])

  const currentDifficulty = difficulties[gameState.currentDifficultyIndex];
  const currentLevelList = levelListByDifficulty[currentDifficulty];

  const currentLevel = currentLevelList.levels[gameState.currentLevelIndex];

  return gameState.isGameOver ?
    <h1 className={"winrar"}>A WINRAR IS YOU</h1> :
    (<div className={"gameBoardContainer"}>
      <div className={"debugContainer"}>
        <button className={"debugButton"} onClick={() => setGameState({ ...gameState, debugOpen: !gameState.debugOpen })}>
          Open debug
        </button>
        {gameState.debugOpen && (
          <div className={"inputContainer"}>
            <textarea className={"configTextArea"} ref={areaRef}></textarea>
            <button className={"debugButton"} onClick={() => {
              loadCellStateMap(areaRef, loadLevel);
              setGameState({ ...gameState, debugOpen: !gameState.debugOpen });
            }}>
              Load CellStateMap
            </button>
          </div>
        )}
      </div>
      <h1 className={"levelNumber"}>{"Level " + (gameState.currentLevelIndex + 1)}</h1>
      <GameBoard
        level={currentLevel}
        moveToNextLevel={moveToNextLevel}
      />
    </div>
    );
}

function loadCellStateMap(
  ref: React.RefObject<HTMLTextAreaElement>,
  loadLevel: (level: Level) => void
): void {
  const text = ref.current?.value;
  if (text) {
    const toLevel = JSON.parse(text) as Level;
    console.log("parsed", toLevel);
    loadLevel(toLevel);
  }
}