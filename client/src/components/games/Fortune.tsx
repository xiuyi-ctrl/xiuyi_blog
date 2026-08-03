import { useState, useEffect, useRef } from 'react';

interface Fortune {
  id: number;
  rank: string;
  title: string;
  poem: string;
  advice: string;
  color: string;
}

const FORTUNES: Fortune[] = [
  { id: 1, rank: '大吉', title: '旭日东升', poem: '晨光初透窗棂纱，扫尽阴霾见彩霞。心有所向何须问，行至山巅自见花。', advice: '宜开启新计划、勇敢行动，今日诸事顺遂。', color: '#f59e0b' },
  { id: 2, rank: '大吉', title: '紫气东来', poem: '紫气东来绕画梁，喜鹊枝头报吉祥。贵人相助添双翼，乘风直上九霄翔。', advice: '宜社交与合作，易遇贵人指点。', color: '#f59e0b' },
  { id: 3, rank: '大吉', title: '福星高照', poem: '福星高照满庭芳，喜气盈门福泽长。举步生风千里外，抬头皆是好风光。', advice: '宜大胆进取，今日运势极佳，心想事成。', color: '#f59e0b' },
  { id: 4, rank: '吉', title: '顺水行舟', poem: '江水东流万里长，轻舟顺水任翱翔。莫问前路多遥远，风正帆悬正启航。', advice: '宜推进手头项目，顺势而为事半功倍。', color: '#10b981' },
  { id: 5, rank: '吉', title: '守得云开', poem: '乌云蔽日有时尽，静候东风自转晴。守得云开明月现，一路清光伴我行。', advice: '宜坚持，眼前的等待终将柳暗花明。', color: '#10b981' },
  { id: 6, rank: '吉', title: '雁过留声', poem: '长风送雁过千山，一路高歌向云端。莫道此程多寂寞，故人相候在前滩。', advice: '宜出行访友，久未联络的人会带来惊喜。', color: '#10b981' },
  { id: 7, rank: '中吉', title: '循序渐进', poem: '千里之行始足下，欲速不达空嗟呀。一步一步踏实走，自有水到渠成时。', advice: '宜稳扎稳打，把大目标拆成小步骤。', color: '#34d399' },
  { id: 8, rank: '中吉', title: '借风乘势', poem: '好风凭借力送我，上青云志在千里。善于借助外物者，可收事半功倍功。', advice: '宜借力而行，善用工具与他人的经验。', color: '#34d399' },
  { id: 9, rank: '中吉', title: '滴水穿石', poem: '水滴石穿非一日，铁杵成针贵在恒。精诚所至金石开，念念不忘有回响。', advice: '宜专注做好一件事，重复自有力量。', color: '#34d399' },
  { id: 10, rank: '小吉', title: '微光聚芒', poem: '星星之火虽微弱，聚少成多可燎原。今日点滴莫轻视，来日自成一片天。', advice: '宜从小事做起，积累今日的微光。', color: '#a3e635' },
  { id: 11, rank: '小吉', title: '云开见日', poem: '云开雾散见晴空，暖阳初照暖心胸。小事如意添喜乐，好事多磨终有成。', advice: '宜保持乐观，小确幸会悄悄到来。', color: '#a3e635' },
  { id: 12, rank: '小吉', title: '春风化雨', poem: '春风化雨润无声，草木萌发渐向荣。点滴耕耘今日始，他朝自有好收成。', advice: '宜播种与学习，今日的小投入会有回报。', color: '#a3e635' },
  { id: 13, rank: '平', title: '静水深流', poem: '静水深流自蕴藏，不争不抢有清欢。闲看庭前花开花，慢品人间烟火香。', advice: '宜休息与整理，把节奏慢下来也是前进。', color: '#94a3b8' },
  { id: 14, rank: '平', title: '细水长流', poem: '细水长流岁月宽，不徐不疾自安然。凡事留得三分余地，进退从容心自宽。', advice: '宜平常心对待，不急不躁便是顺遂。', color: '#94a3b8' },
  { id: 15, rank: '平', title: '随遇而安', poem: '随遇而安心自宁，云卷云舒皆风景。不争一时之长短，只求日日心常晴。', advice: '宜顺其自然，今日不必强求完美。', color: '#94a3b8' },
  { id: 16, rank: '末吉', title: '韬光养晦', poem: '潜龙暂居深渊底，静待时机自腾飞。锋芒未露非示弱，养精蓄锐待春雷。', advice: '宜低调积累，不宜张扬，时机尚需等待。', color: '#fbbf24' },
  { id: 17, rank: '末吉', title: '蓄势待发', poem: '静水藏锋待时机，风平浪静蓄实力。今朝忍得三分气，来日自可展宏图。', advice: '宜积蓄能量，为未来的机会做好准备。', color: '#fbbf24' },
  { id: 18, rank: '末吉', title: '夜尽天明', poem: '夜尽终将迎曙光，低谷之中莫慌张。守得耐心多等待，否极泰来路转长。', advice: '宜耐心等待，黎明前的黑暗即将过去。', color: '#fbbf24' },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todaySeed(): number {
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  return hashString(key);
}

export default function Fortune() {
  const [fortune, setFortune] = useState<Fortune>(() => {
    const rng = mulberry32(todaySeed());
    return FORTUNES[Math.floor(rng() * FORTUNES.length)];
  });
  const [drawing, setDrawing] = useState(false);
  const [isToday, setIsToday] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const draw = (useToday: boolean) => {
    if (drawing) return;
    setDrawing(true);
    timerRef.current = setTimeout(() => {
      const rng = useToday ? mulberry32(todaySeed()) : Math.random;
      setFortune(FORTUNES[Math.floor(rng() * FORTUNES.length)]);
      setIsToday(useToday);
      setDrawing(false);
    }, 800);
  };

  return (
    <div className="fortune-container">
      <div className="fortune-holder">
        {drawing ? (
          <div className="fortune-drawing">
            <span className="fortune-jar">🎋</span>
            <p>正在解签…</p>
          </div>
        ) : (
          <div className="fortune-card" style={{ borderColor: fortune.color }}>
            <div className="fortune-badge">
              {isToday ? '今日签' : '随机签'}
            </div>
            <div className="fortune-rank" style={{ color: fortune.color }}>
              {fortune.rank}
            </div>
            <div className="fortune-title">{fortune.title}</div>
            <div className="fortune-divider" style={{ background: fortune.color }} />
            <p className="fortune-poem">{fortune.poem}</p>
            <p className="fortune-advice">{fortune.advice}</p>
          </div>
        )}
      </div>

      <div className="fortune-actions">
        <button className="fortune-btn primary" onClick={() => draw(true)} disabled={drawing}>
          今日求签
        </button>
        <button className="fortune-btn" onClick={() => draw(false)} disabled={drawing}>
          再抽一签
        </button>
      </div>
    </div>
  );
}
