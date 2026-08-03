import { useState, useRef } from 'react';

type Suit = '♠' | '♥' | '♦' | '♣';
type Card = { rank: string; suit: Suit };
type Result = 'win' | 'lose' | 'push' | 'blackjack' | null;

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handValue(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isRedSuit(suit: Suit): boolean {
  return suit === '♥' || suit === '♦';
}

const RESULT_LABEL: Record<string, string> = {
  win: '赢了！',
  lose: '庄家赢',
  push: '平局',
  blackjack: 'Blackjack！',
};

export default function Blackjack() {
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [phase, setPhase] = useState<'idle' | 'player' | 'dealer' | 'settled'>('idle');
  const [result, setResult] = useState<Result>(null);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [stats, setStats] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('blackjack_stats') || '{"w":0,"l":0,"d":0}');
      return { w: saved.w || 0, l: saved.l || 0, d: saved.d || 0 };
    } catch {
      return { w: 0, l: 0, d: 0 };
    }
  });

  const deckRef = useRef<Card[]>(buildDeck());
  const playerRef = useRef<Card[]>([]);
  const dealerRef = useRef<Card[]>([]);
  const standRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const draw = (): Card | undefined => {
    if (deckRef.current.length === 0) {
      deckRef.current = buildDeck();
    }
    return deckRef.current.pop();
  };

  const updateStats = (key: 'w' | 'l' | 'd') => {
    setStats(prev => {
      const next = { ...prev, [key]: prev[key] + 1 };
      localStorage.setItem('blackjack_stats', JSON.stringify(next));
      return next;
    });
  };

  const settle = () => {
    const pv = handValue(playerRef.current);
    const dv = handValue(dealerRef.current);
    let res: Exclude<Result, null>;
    if (pv > 21) {
      res = 'lose';
    } else if (dv > 21) {
      res = 'win';
    } else if (pv > dv) {
      res = pv === 21 && playerRef.current.length === 2 ? 'blackjack' : 'win';
    } else if (dv > pv) {
      res = 'lose';
    } else {
      res = 'push';
    }
    setPhase('settled');
    setDealerRevealed(true);
    setResult(res);
    if (res === 'win' || res === 'blackjack') updateStats('w');
    else if (res === 'lose') updateStats('l');
    else updateStats('d');
  };

  const stand = () => {
    if (standRef.current) return;
    standRef.current = true;
    if (phase === 'settled') {
      standRef.current = false;
      return;
    }
    if (phase === 'player') {
      setPhase('dealer');
      setDealerRevealed(true);
    }
    const step = () => {
      if (handValue(dealerRef.current) < 17) {
        const c = draw();
        if (c) {
          dealerRef.current = [...dealerRef.current, c];
          setDealerHand([...dealerRef.current]);
          timerRef.current = window.setTimeout(step, 450);
        } else {
          settle();
        }
      } else {
        settle();
      }
    };
    timerRef.current = window.setTimeout(step, 350);
  };

  const hit = () => {
    if (phase !== 'player') return;
    if (handValue(playerRef.current) === 21) return;
    const c = draw();
    if (!c) return;
    playerRef.current = [...playerRef.current, c];
    setPlayerHand([...playerRef.current]);
    const v = handValue(playerRef.current);
    if (v > 21) {
      setPhase('settled');
      setResult('lose');
      setDealerRevealed(true);
      updateStats('l');
    } else if (v === 21) {
      stand();
    }
  };

  const startRound = () => {
    if (phase === 'dealer') return;
    clearTimers();
    standRef.current = false;
    if (deckRef.current.length < 15) {
      deckRef.current = buildDeck();
    }
    const p1 = draw();
    const p2 = draw();
    const d1 = draw();
    const d2 = draw();
    if (!p1 || !p2 || !d1 || !d2) return;
    playerRef.current = [p1, p2];
    dealerRef.current = [d1, d2];
    setPlayerHand([...playerRef.current]);
    setDealerHand([...dealerRef.current]);
    setResult(null);
    setDealerRevealed(false);
    setPhase('player');
    if (handValue(playerRef.current) === 21) {
      timerRef.current = window.setTimeout(stand, 400);
    }
  };

  const resultLabel = result ? RESULT_LABEL[result] : '';
  const dealerTotal = dealerRevealed || phase === 'settled' ? handValue(dealerHand) : '?';

  const renderCard = (card: Card, key: number, faceDown: boolean) => (
    <div
      key={key}
      className={`blackjack-card${isRedSuit(card.suit) ? ' red' : ''}${faceDown ? ' face-down' : ''}`}
    >
      {faceDown ? (
        <span className="blackjack-card-back">?</span>
      ) : (
        <>
          <span className="blackjack-card-rank">{card.rank}</span>
          <span className="blackjack-card-suit">{card.suit}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="blackjack-container">
      <div className="blackjack-stats">
        <div className="blackjack-stat">
          <span className="blackjack-stat-label">胜</span>
          <span className="blackjack-stat-value">{stats.w}</span>
        </div>
        <div className="blackjack-stat">
          <span className="blackjack-stat-label">负</span>
          <span className="blackjack-stat-value">{stats.l}</span>
        </div>
        <div className="blackjack-stat">
          <span className="blackjack-stat-label">平</span>
          <span className="blackjack-stat-value">{stats.d}</span>
        </div>
        <button
          className="blackjack-round-btn"
          onClick={startRound}
          disabled={phase === 'dealer'}
        >
          {phase === 'idle' || phase === 'settled' ? '新牌局' : '重新发牌'}
        </button>
      </div>

      <div className="blackjack-area">
        <div className="blackjack-area-label">庄家</div>
        <div className="blackjack-cards">
          {dealerHand.map((card, i) =>
            renderCard(card, i, !dealerRevealed && i === 1 && phase !== 'settled')
          )}
        </div>
        <div className="blackjack-total">点数：{dealerTotal}</div>
      </div>

      <div className="blackjack-area">
        <div className="blackjack-area-label">玩家</div>
        <div className="blackjack-cards">
          {playerHand.map((card, i) => renderCard(card, i, false))}
        </div>
        <div className="blackjack-total">点数：{handValue(playerHand)}</div>
      </div>

      {result && phase === 'settled' && (
        <div className={`blackjack-result ${result}`}>{resultLabel}</div>
      )}

      <div className="blackjack-actions">
        <button className="blackjack-action-btn" onClick={hit} disabled={phase !== 'player'}>
          要牌
        </button>
        <button className="blackjack-action-btn stand" onClick={stand} disabled={phase !== 'player'}>
          停牌
        </button>
      </div>

      <div className="blackjack-instructions">
        <p>目标是让点数接近 21 且不超过 21；J/Q/K 计 10 点，A 计 1 或 11 点</p>
      </div>
    </div>
  );
}
