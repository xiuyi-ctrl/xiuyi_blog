import { useState, useEffect, useRef } from 'react';

const GRID = 8;
const GEM_TYPES = 6;
const GEM_EMOJIS = ['🍇', '🍊', '🍋', '🍎', '🥝', '🍉'];

type Cell = { r: number; c: number };

function createBoard(): number[][] {
  const board: number[][] = [];
  for (let r = 0; r < GRID; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID; c++) {
      let v = Math.floor(Math.random() * GEM_TYPES);
      while (
        (c >= 2 && row[c - 1] === v && row[c - 2] === v) ||
        (r >= 2 && board[r - 1][c] === v && board[r - 2][c] === v)
      ) {
        v = Math.floor(Math.random() * GEM_TYPES);
      }
      row.push(v);
    }
    board.push(row);
  }
  return board;
}

function findMatchCells(board: number[][]): Cell[] {
  const marked: boolean[][] = board.map(row => row.map(() => false));
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID - 2; c++) {
      const v = board[r][c];
      if (v === -1) continue;
      if (board[r][c + 1] === v && board[r][c + 2] === v) {
        marked[r][c] = true;
        marked[r][c + 1] = true;
        marked[r][c + 2] = true;
      }
    }
  }
  for (let c = 0; c < GRID; c++) {
    for (let r = 0; r < GRID - 2; r++) {
      const v = board[r][c];
      if (v === -1) continue;
      if (board[r + 1][c] === v && board[r + 2][c] === v) {
        marked[r][c] = true;
        marked[r + 1][c] = true;
        marked[r + 2][c] = true;
      }
    }
  }
  const cells: Cell[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (marked[r][c]) cells.push({ r, c });
    }
  }
  return cells;
}

function applyGravity(board: number[][]): void {
  for (let c = 0; c < GRID; c++) {
    let write = GRID - 1;
    for (let r = GRID - 1; r >= 0; r--) {
      if (board[r][c] !== -1) {
        if (write !== r) {
          board[write][c] = board[r][c];
          board[r][c] = -1;
        }
        write--;
      }
    }
  }
}

function refill(board: number[][]): void {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (board[r][c] === -1) {
        board[r][c] = Math.floor(Math.random() * GEM_TYPES);
      }
    }
  }
}

function hasPossibleMove(board: number[][]): boolean {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (c + 1 < GRID) {
        const g = board.map(row => [...row]);
        const t = g[r][c];
        g[r][c] = g[r][c + 1];
        g[r][c + 1] = t;
        if (findMatchCells(g).length > 0) return true;
      }
      if (r + 1 < GRID) {
        const g = board.map(row => [...row]);
        const t = g[r][c];
        g[r][c] = g[r + 1][c];
        g[r + 1][c] = t;
        if (findMatchCells(g).length > 0) return true;
      }
    }
  }
  return false;
}

export default function Match3() {
  const [board, setBoard] = useState<number[][]>(() => createBoard());
  const [selected, setSelected] = useState<Cell | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem('match3_best');
    return saved ? parseInt(saved) : 0;
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [busy, setBusy] = useState(false);
  const [clearing, setClearing] = useState<string[]>([]);

  const boardRef = useRef<number[][]>(board);
  const scoreRef = useRef(0);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const updateBest = (next: number) => {
    const saved = parseInt(localStorage.getItem('match3_best') || '0');
    if (next > saved) {
      setBest(next);
      localStorage.setItem('match3_best', String(next));
    }
  };

  const resolve = (b: number[][], comboNum: number) => {
    const matched = findMatchCells(b);
    if (matched.length === 0) {
      if (!hasPossibleMove(b)) {
        updateBest(scoreRef.current);
        setGameState('over');
      }
      setCombo(0);
      setClearing([]);
      setBusy(false);
      return;
    }
    const gained = matched.length * 10 * comboNum;
    scoreRef.current += gained;
    setScore(scoreRef.current);
    setCombo(comboNum);
    setClearing(matched.map(({ r, c }) => `${r},${c}`));
    setTimeout(() => {
      matched.forEach(({ r, c }) => {
        b[r][c] = -1;
      });
      applyGravity(b);
      refill(b);
      boardRef.current = b;
      setBoard(b.map(row => [...row]));
      setClearing([]);
      setTimeout(() => resolve(b, comboNum + 1), 200);
    }, 280);
  };

  const startGame = () => {
    const b = createBoard();
    boardRef.current = b;
    setBoard(b);
    scoreRef.current = 0;
    setScore(0);
    setCombo(0);
    setSelected(null);
    setClearing([]);
    setBusy(false);
    setGameState('playing');
  };

  const handleCellClick = (r: number, c: number) => {
    if (busy || gameState !== 'playing') return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    const dr = Math.abs(selected.r - r);
    const dc = Math.abs(selected.c - c);
    if (dr + dc !== 1) {
      setSelected({ r, c });
      return;
    }
    const fromR = selected.r;
    const fromC = selected.c;
    setSelected(null);
    setBusy(true);

    const b = boardRef.current.map(row => [...row]);
    const a = b[fromR][fromC];
    b[fromR][fromC] = b[r][c];
    b[r][c] = a;
    boardRef.current = b;
    setBoard(b);

    if (findMatchCells(b).length === 0) {
      setTimeout(() => {
        const bb = b.map(row => [...row]);
        const x = bb[fromR][fromC];
        bb[fromR][fromC] = bb[r][c];
        bb[r][c] = x;
        boardRef.current = bb;
        setBoard(bb);
        setBusy(false);
      }, 180);
    } else {
      resolve(b, 1);
    }
  };

  return (
    <div className="match3-container">
      <div className="match3-stats">
        <div className="match3-stat">
          <span className="match3-stat-label">得分</span>
          <span className="match3-stat-value">{score}</span>
        </div>
        <div className="match3-stat">
          <span className="match3-stat-label">最高</span>
          <span className="match3-stat-value">{best}</span>
        </div>
        <button className="match3-reset-btn" onClick={startGame}>重新开始</button>
      </div>

      <div className="match3-board-wrap">
        <div className="match3-board">
          {board.map((row, r) => (
            <div className="match3-row" key={r}>
              {row.map((gem, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`match3-cell${selected && selected.r === r && selected.c === c ? ' selected' : ''}${clearing.includes(`${r},${c}`) ? ' clearing' : ''}${gem === -1 ? ' empty' : ''}`}
                  onClick={() => handleCellClick(r, c)}
                  aria-label={`位置 ${r + 1},${c + 1}`}
                >
                  {gem !== -1 && <span className="match3-gem">{GEM_EMOJIS[gem]}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {(gameState === 'idle' || gameState === 'over') && (
          <div className="match3-overlay">
            <div className="match3-overlay-card">
              {gameState === 'over' ? (
                <>
                  <h3>无可消除</h3>
                  <p>得分：{score}，最高：{best}</p>
                </>
              ) : (
                <>
                  <h3>消消乐</h3>
                  <p>点击相邻的棋子交换，三个相同即可消除</p>
                </>
              )}
              <button className="match3-overlay-btn" onClick={startGame}>
                {gameState === 'over' ? '再来一局' : '开始游戏'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && combo > 1 && (
          <div className="match3-combo">连击 ×{combo}</div>
        )}
      </div>
    </div>
  );
}
