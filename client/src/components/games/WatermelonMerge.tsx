import { useState, useEffect, useRef } from 'react';

const W = 420;
const H = 620;
const DANGER_Y = 100;
const GRAVITY = 1500;
const SETTLE_MS = 700;
const RESTITUTION = 0.15;
const MAX_FRUITS = 160;
const MAX_DROPS_PER_SEC = 3;

type FruitType = {
  name: string;
  emoji: string;
  radius: number;
  score: number;
};

const FRUIT_TYPES: FruitType[] = [
  { name: '樱桃', emoji: '🍒', radius: 16, score: 1 },
  { name: '草莓', emoji: '🍓', radius: 23, score: 3 },
  { name: '葡萄', emoji: '🍇', radius: 30, score: 6 },
  { name: '柠檬', emoji: '🍋', radius: 38, score: 10 },
  { name: '桃子', emoji: '🍑', radius: 46, score: 15 },
  { name: '橙子', emoji: '🍊', radius: 54, score: 21 },
  { name: '猕猴桃', emoji: '🥝', radius: 62, score: 28 },
  { name: '菠萝', emoji: '🍍', radius: 70, score: 36 },
  { name: '椰子', emoji: '🥥', radius: 78, score: 45 },
  { name: '西瓜', emoji: '🍉', radius: 86, score: 55 },
];

const DROP_POOL = [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4];

type Fruit = {
  id: number;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  landed: boolean;
  born: number;
};

function pickType(): number {
  return DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)];
}

export default function WatermelonMerge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fruitsRef = useRef<Fruit[]>([]);
  const nextIdRef = useRef(1);
  const scoreRef = useRef(0);
  const stateRef = useRef<'idle' | 'playing' | 'over'>('idle');
  const currentTypeRef = useRef(0);
  const dropTimesRef = useRef<number[]>([]);

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem('suika_best');
    return saved ? parseInt(saved) : 0;
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'over'>('idle');
  const [currentType, setCurrentType] = useState(0);

  const endGame = () => {
    stateRef.current = 'over';
    setGameState('over');
    const saved = parseInt(localStorage.getItem('suika_best') || '0');
    if (scoreRef.current > saved) {
      setBest(scoreRef.current);
      localStorage.setItem('suika_best', String(scoreRef.current));
    }
  };

  const step = (dt: number) => {
    const fruits = fruitsRef.current;
    const merged = new Set<number>();
    const additions: Fruit[] = [];

    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i];
      f.vy += GRAVITY * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      if (f.x - f.r < 0) {
        f.x = f.r;
        f.vx = Math.abs(f.vx) * RESTITUTION;
      }
      if (f.x + f.r > W) {
        f.x = W - f.r;
        f.vx = -Math.abs(f.vx) * RESTITUTION;
      }
      if (f.y + f.r > H) {
        f.y = H - f.r;
        f.vy = -Math.abs(f.vy) * RESTITUTION;
        f.vx *= 0.92;
        f.landed = true;
      }
    }

    for (let i = 0; i < fruits.length; i++) {
      if (merged.has(fruits[i].id)) continue;
      for (let j = i + 1; j < fruits.length; j++) {
        if (merged.has(fruits[j].id)) continue;
        const a = fruits[i];
        const b = fruits[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.r + b.r;
        const dist = Math.hypot(dx, dy);

        if (dist >= minDist) continue;

        a.landed = true;
        b.landed = true;

        if (a.type === b.type && a.type < FRUIT_TYPES.length - 1) {
          merged.add(a.id);
          merged.add(b.id);
          const nx = (a.x + b.x) / 2;
          const ny = (a.y + b.y) / 2;
          const nvx = (a.vx + b.vx) * 0.5;
          const nvy = (a.vy + b.vy) * 0.5;
          const nextType = a.type + 1;
          additions.push({
            id: nextIdRef.current++,
            type: nextType,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
            r: FRUIT_TYPES[nextType].radius,
            landed: true,
            born: performance.now(),
          });
          scoreRef.current += FRUIT_TYPES[nextType].score;
          setScore(scoreRef.current);
          continue;
        }

        if (dist === 0) {
          continue;
        }
        const nX = dx / dist;
        const nY = dy / dist;
        const overlap = minDist - dist;
        a.x -= nX * overlap * 0.5;
        a.y -= nY * overlap * 0.5;
        b.x += nX * overlap * 0.5;
        b.y += nY * overlap * 0.5;

        const p = a.vx * nX + a.vy * nY;
        const q = b.vx * nX + b.vy * nY;
        const impulse = (q - p) * 0.6;
        a.vx += impulse * nX;
        a.vy += impulse * nY;
        b.vx -= impulse * nX;
        b.vy -= impulse * nY;
      }
    }

    if (merged.size > 0 || additions.length > 0) {
      fruitsRef.current = fruits
        .filter(f => !merged.has(f.id))
        .concat(additions);
    }

    const now = performance.now();
    for (const f of fruitsRef.current) {
      if (f.landed && now - f.born > SETTLE_MS && f.y - f.r < DANGER_Y) {
        endGame();
        return;
      }
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr) canvas.width = cssW * dpr;
    if (canvas.height !== cssH * dpr) canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    const scaleX = cssW / W;
    const scaleY = cssH / H;
    ctx.save();
    ctx.scale(scaleX, scaleY);

    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, DANGER_Y);
    ctx.lineTo(W, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of fruitsRef.current) {
      const type = FRUIT_TYPES[f.type];
      ctx.font = `${f.r * 2}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.fillText(type.emoji, f.x, f.y);
    }
    ctx.restore();
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      if (stateRef.current === 'playing') {
        step(dt);
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = () => {
    fruitsRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    dropTimesRef.current = [];
    const t = pickType();
    currentTypeRef.current = t;
    setCurrentType(t);
    stateRef.current = 'playing';
    setGameState('playing');
  };

  const handleDrop = (clientX: number) => {
    if (stateRef.current !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (fruitsRef.current.length >= MAX_FRUITS) return;
    const now = performance.now();
    dropTimesRef.current = dropTimesRef.current.filter((t) => now - t < 1000);
    if (dropTimesRef.current.length >= MAX_DROPS_PER_SEC) return;
    dropTimesRef.current.push(now);
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const type = currentTypeRef.current;
    fruitsRef.current = [
      ...fruitsRef.current,
      {
        id: nextIdRef.current++,
        type,
        x: Math.min(Math.max(x, FRUIT_TYPES[type].radius), W - FRUIT_TYPES[type].radius),
        y: 20,
        vx: 0,
        vy: 0,
        r: FRUIT_TYPES[type].radius,
        landed: false,
        born: performance.now(),
      },
    ];
    const next = pickType();
    currentTypeRef.current = next;
    setCurrentType(next);
  };

  const currentFruit = FRUIT_TYPES[currentType];

  return (
    <div className="suika-container">
      <div className="suika-stats">
        <div className="suika-stat">
          <span className="suika-stat-label">得分</span>
          <span className="suika-stat-value">{score}</span>
        </div>
        <div className="suika-stat">
          <span className="suika-stat-label">最高</span>
          <span className="suika-stat-value">{best}</span>
        </div>
        <button className="suika-reset-btn" onClick={startGame}>重新开始</button>
      </div>

      <div className="suika-board-wrap">
        <canvas
          ref={canvasRef}
          className="suika-canvas"
          onClick={(e) => handleDrop(e.clientX)}
        />
        <div className="suika-next">
          下一个：<span className="suika-next-emoji">{currentFruit.emoji}</span>
        </div>

        {(gameState === 'idle' || gameState === 'over') && (
          <div className="suika-overlay">
            <div className="suika-overlay-card">
              {gameState === 'over' ? (
                <>
                  <h3>游戏结束</h3>
                  <p>得分：{score}，最高：{best}</p>
                </>
              ) : (
                <>
                  <h3>合成大西瓜</h3>
                  <p>点击放下水果，两个相同水果合成更大的</p>
                </>
              )}
              <button className="suika-overlay-btn" onClick={startGame}>
                {gameState === 'over' ? '再来一局' : '开始游戏'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="suika-legend">
        {FRUIT_TYPES.map((t, i) => (
          <span key={i} className="suika-legend-item">
            {t.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
