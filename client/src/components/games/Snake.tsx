import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const GRID_SIZE = 20;
const TICK_MS = 130;

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'idle' | 'playing' | 'paused' | 'over';

const DIRS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  let p: Point;
  do {
    p = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export default function Snake() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]);
  const [food, setFood] = useState<Point>(() => randomFood([{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem('snake_best');
    return saved ? parseInt(saved) : 0;
  });
  const [gameState, setGameState] = useState<GameState>('idle');

  const snakeRef = useRef<Point[]>(snake);
  const foodRef = useRef<Point>(food);
  const scoreRef = useRef(0);
  const directionRef = useRef<Direction>('right');
  const stateRef = useRef<GameState>('idle');

  const snakeSet = useMemo(
    () => new Set(snake.map(s => `${s.x},${s.y}`)),
    [snake]
  );
  const foodKey = `${food.x},${food.y}`;

  const updateBest = useCallback((next: number) => {
    const saved = parseInt(localStorage.getItem('snake_best') || '0');
    if (next > saved) {
      setBest(next);
      localStorage.setItem('snake_best', String(next));
    }
  }, []);

  const endGame = useCallback(() => {
    stateRef.current = 'over';
    setGameState('over');
    updateBest(scoreRef.current);
  }, [updateBest]);

  const startGame = useCallback(() => {
    const init: Point[] = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    snakeRef.current = init;
    setSnake(init);
    const f = randomFood(init);
    foodRef.current = f;
    setFood(f);
    scoreRef.current = 0;
    setScore(0);
    directionRef.current = 'right';
    stateRef.current = 'playing';
    setGameState('playing');
  }, []);

  const pauseGame = useCallback(() => {
    stateRef.current = 'paused';
    setGameState('paused');
  }, []);

  const resumeGame = useCallback(() => {
    stateRef.current = 'playing';
    setGameState('playing');
  }, []);

  const step = useCallback(() => {
    const dir = DIRS[directionRef.current];
    const current = snakeRef.current;
    const head = current[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      endGame();
      return;
    }

    const willGrow = samePoint(newHead, foodRef.current);
    const body = willGrow ? current : current.slice(0, -1);
    if (body.some(s => samePoint(s, newHead))) {
      endGame();
      return;
    }

    const nextSnake = [newHead, ...current];
    if (willGrow) {
      const next = scoreRef.current + 10;
      scoreRef.current = next;
      setScore(next);
      const f = randomFood(nextSnake);
      foodRef.current = f;
      setFood(f);
    } else {
      nextSnake.pop();
    }
    snakeRef.current = nextSnake;
    setSnake(nextSnake);
  }, [endGame]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(step, TICK_MS);
    return () => clearInterval(timer);
  }, [gameState, step]);

  const changeDirection = useCallback((dir: Direction) => {
    const next = DIRS[dir];
    const prev = DIRS[directionRef.current];
    if (next.x === -prev.x && next.y === -prev.y) return;
    directionRef.current = dir;
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (stateRef.current === 'playing') pauseGame();
        else if (stateRef.current === 'paused') resumeGame();
        else startGame();
        return;
      }
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        if (stateRef.current === 'idle' || stateRef.current === 'over') startGame();
        changeDirection(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [startGame, pauseGame, resumeGame, changeDirection]);

  const statusLabel =
    gameState === 'idle' ? '开始' :
    gameState === 'playing' ? '暂停' :
    gameState === 'paused' ? '继续' : '再来一局';

  const handleStatusClick = () => {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
    else startGame();
  };

  const cells: React.ReactNode[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const key = `${x},${y}`;
      let cls = 'snake-cell';
      if (key === foodKey) cls += ' food';
      if (snakeSet.has(key)) {
        cls += snake[0].x === x && snake[0].y === y ? ' head' : ' body';
      }
      cells.push(<div key={key} className={cls} />);
    }
  }

  return (
    <div className="snake-container">
      <div className="snake-stats">
        <div className="snake-stat">
          <span className="snake-stat-label">得分</span>
          <span className="snake-stat-value">{score}</span>
        </div>
        <div className="snake-stat">
          <span className="snake-stat-label">最高</span>
          <span className="snake-stat-value">{best}</span>
        </div>
        <button className="snake-status-btn" onClick={handleStatusClick}>
          {statusLabel}
        </button>
      </div>

      <div className="snake-board">{cells}</div>

      <div className="snake-pad">
        <button className="snake-pad-btn up" onClick={() => changeDirection('up')} aria-label="上">▲</button>
        <button className="snake-pad-btn left" onClick={() => changeDirection('left')} aria-label="左">◀</button>
        <button className="snake-pad-btn down" onClick={() => changeDirection('down')} aria-label="下">▼</button>
        <button className="snake-pad-btn right" onClick={() => changeDirection('right')} aria-label="右">▶</button>
      </div>

      {(gameState === 'idle' || gameState === 'over' || gameState === 'paused') && (
        <div className="snake-overlay">
          <div className="snake-overlay-card">
            {gameState === 'over' && <h3>游戏结束</h3>}
            {gameState === 'paused' && <h3>已暂停</h3>}
            {gameState === 'idle' && <h3>贪吃蛇</h3>}
            {gameState === 'over' && <p>得分：{score}，最高：{best}</p>}
            {gameState === 'idle' && <p>方向键或 WASD 控制移动</p>}
            <button className="snake-overlay-btn" onClick={startGame}>
              {gameState === 'over' ? '再来一局' : gameState === 'paused' ? '继续游戏' : '开始游戏'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
