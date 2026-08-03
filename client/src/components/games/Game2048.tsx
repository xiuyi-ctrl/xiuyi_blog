import { useState, useEffect, useCallback } from 'react';

type Tile = {
  value: number;
  id: number;
};

type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 4;
const WIN_SCORE = 2048;

function createInitialGrid(): Tile[][] {
  const grid: Tile[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  addRandomTile(grid);
  addRandomTile(grid);
  return grid;
}

function addRandomTile(grid: Tile[][]): boolean {
  const emptyCells: { row: number; col: number }[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!grid[row][col]) {
        emptyCells.push({ row, col });
      }
    }
  }
  if (emptyCells.length === 0) return false;
  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  grid[row][col] = { value, id: Date.now() + Math.random() };
  return true;
}

function slideAndMerge(line: Tile[]): { result: Tile[]; score: number } {
  const result: Tile[] = [];
  let score = 0;
  let skipNext = false;
  for (let i = 0; i < line.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const current = line[i];
    if (!current) {
      continue;
    }
    if (i < line.length - 1) {
      const next = line[i + 1];
      if (!next) continue;
      if (current.value === next.value) {
        const merged = current.value * 2;
        result.push({ value: merged, id: Date.now() + Math.random() });
        score += merged;
        skipNext = true;
        continue;
      }
    }
    result.push(current);
  }
  while (result.length < GRID_SIZE) {
    result.push(null as unknown as Tile);
  }
  return { result, score };
}

function transposeGrid(grid: Tile[][]): Tile[][] {
  const result: Tile[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      result[col][row] = grid[row][col];
    }
  }
  return result;
}

function moveTiles(grid: Tile[][], direction: Direction): { newGrid: Tile[][]; moved: boolean; score: number } {
  let moved = false;
  let score = 0;

  if (direction === 'left') {
    for (let row = 0; row < GRID_SIZE; row++) {
      const originalRow = grid[row].slice();
      const rowTiles = grid[row].filter((tile): tile is Tile => tile !== null);
      const { result: newRow, score: mergedScore } = slideAndMerge(rowTiles);
      if (JSON.stringify(originalRow) !== JSON.stringify(newRow)) {
        moved = true;
        score += mergedScore;
        for (let col = 0; col < GRID_SIZE; col++) {
          grid[row][col] = newRow[col];
        }
      }
    }
    if (moved) addRandomTile(grid);
  } else if (direction === 'right') {
    for (let row = 0; row < GRID_SIZE; row++) {
      const originalRow = grid[row].slice();
      const reversedRow = originalRow.slice().reverse();
      const rowTiles = reversedRow.filter((tile): tile is Tile => tile !== null);
      const { result: newRow, score: mergedScore } = slideAndMerge(rowTiles);
      const newReversed = newRow.reverse();
      if (JSON.stringify(originalRow) !== JSON.stringify(newReversed)) {
        moved = true;
        score += mergedScore;
        for (let col = 0; col < GRID_SIZE; col++) {
          grid[row][col] = newReversed[col];
        }
      }
    }
    if (moved) addRandomTile(grid);
  } else if (direction === 'up') {
    const transposed = transposeGrid(grid);
    const movedTransposed = moveTiles(transposed, 'left');
    const newGrid = transposeGrid(movedTransposed.newGrid);
    if (movedTransposed.moved) moved = true;
    Object.assign(grid, newGrid);
    score = movedTransposed.score;
  } else if (direction === 'down') {
    const transposed = transposeGrid(grid);
    const movedTransposed = moveTiles(transposed, 'right');
    const newGrid = transposeGrid(movedTransposed.newGrid);
    if (movedTransposed.moved) moved = true;
    Object.assign(grid, newGrid);
    score = movedTransposed.score;
  }

  return { newGrid: grid, moved, score };
}

function getAllTiles(grid: Tile[][]): Tile[] {
  const tiles: Tile[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col]) {
        tiles.push(grid[row][col]);
      }
    }
  }
  return tiles;
}

export default function Game2048() {
  const [grid, setGrid] = useState<Tile[][]>(createInitialGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('game2048_highScore');
    return saved ? parseInt(saved) : 0;
  });
  const [gameOver, setGameOver] = useState(false);

  const move = useCallback((direction: Direction) => {
    const { newGrid, moved, score: addedScore } = moveTiles(JSON.parse(JSON.stringify(grid)), direction);
    if (!moved) return;
    setGrid(newGrid);
    const newScore = score + addedScore;
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('game2048_highScore', String(newScore));
    }
    const allTiles = getAllTiles(newGrid);
    if (allTiles.some(t => t.value >= WIN_SCORE)) {
      setGameOver(true);
      return;
    }
    if (allTiles.length === GRID_SIZE * GRID_SIZE) {
      setGameOver(true);
    }
  }, [grid, score, highScore]);

  const resetGame = useCallback(() => {
    const newGrid = createInitialGrid();
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) {
        if (e.key === ' ') {
          resetGame();
        }
        return;
      }
      let direction: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': direction = 'up'; break;
        case 'ArrowDown': case 's': case 'S': direction = 'down'; break;
        case 'ArrowLeft': case 'a': case 'A': direction = 'left'; break;
        case 'ArrowRight': case 'd': case 'D': direction = 'right'; break;
      }
      if (direction) {
        e.preventDefault();
        move(direction);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, move, resetGame]);

  const getTileColor = (value: number): string => {
    const colors: { [key: number]: string } = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e'
    };
    return colors[value] || '#3c3a32';
  };

  const getTileTextColor = (value: number): string => {
    return value >= 8 ? '#fff' : '#776e65';
  }; 

  return (
    <div className="game-2048-container">
      <div className="game-2048-stats">
        <div className="game-2048-score">
          <div className="game-2048-score-label">Score</div>
          <div className="game-2048-score-value">{score}</div>
        </div>
        <div className="game-2048-high-score">
          <div className="game-2048-high-score-label">High Score</div>
          <div className="game-2048-high-score-value">{highScore}</div>
        </div>
        <button
          className="game-2048-reset-btn"
          onClick={resetGame}
          aria-label="New Game"
        >
          New Game
        </button>
      </div>

      <div className="game-2048-grid">
        {Array.from({ length: GRID_SIZE }).map((_, rowIndex) => (
          <div key={rowIndex} className="game-2048-row">
            {Array.from({ length: GRID_SIZE }).map((_, colIndex) => {
              const tile = grid[rowIndex][colIndex];
              return (
                <div
                  key={tile ? tile.id : `empty-${rowIndex}-${colIndex}`}
                  className={`game-2048-tile ${tile ? `value-${tile.value}` : ''}`}
                  style={tile ? {
                    backgroundColor: getTileColor(tile.value),
                    color: getTileTextColor(tile.value),
                  } as React.CSSProperties : {}}
                >
                  {tile && <span className="game-2048-tile-value">{tile.value}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-2048-overlay">
          <div className="game-2048-game-over">
            <h2>Game Over!</h2>
            <p>Final Score: {score}</p>
            <p>{score >= highScore ? 'New High Score!' : ''}</p>
            <button
              className="game-2048-play-again-btn"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      <div className="game-2048-instructions">
        <p>Use Arrow Keys or WASD to move tiles. Tiles with same number merge when they touch.</p>
      </div>
    </div>
  );
}