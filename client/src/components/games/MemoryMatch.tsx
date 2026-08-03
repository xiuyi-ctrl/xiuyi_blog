import { useState, useEffect, useCallback, useRef } from 'react';

type Card = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const EMOJIS = ['🎲', '🎯', '🏀', '⚽', '🎳', '🎮', '🎸', '🎹', '🎺', '🥁', '🎻', '🪘', '🪗', '🎑', '🏆', '🥇', '🥈', '🥉'];

const GRID_SIZES = {
  easy: { rows: 3, cols: 4 },
  medium: { rows: 4, cols: 4 },
  hard: { rows: 4, cols: 5 },
};

type Difficulty = keyof typeof GRID_SIZES;

export default function MemoryMatch() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('memoryMatch_highScore');
    return saved ? parseInt(saved) : 0;
  });
  const flippedRef = useRef<number[]>([]);

  const resetGame = useCallback((diff: Difficulty) => {
    const { rows, cols } = GRID_SIZES[diff];
    const emojis = [...EMOJIS];
    const shuffledEmojis = emojis.sort(() => 0.5 - Math.random());
    const pairs = shuffledEmojis.slice(0, (rows * cols) / 2);
    const cardList: Card[] = [];
    for (let i = 0; i < pairs.length; i++) {
      cardList.push({ id: i * 2, value: pairs[i], isFlipped: false, isMatched: false });
      cardList.push({ id: i * 2 + 1, value: pairs[i], isFlipped: false, isMatched: false });
    }
    cardList.sort(() => 0.5 - Math.random());
    flippedRef.current = [];
    setCards(cardList);
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setGameOver(false);
  }, []);

  const changeDifficulty = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      if (gameStarted) {
        resetGame(diff);
      }
    },
    [gameStarted, resetGame]
  );

  const startGame = useCallback(() => {
    setGameStarted(true);
    resetGame(difficulty);
  }, [difficulty, resetGame]);

  const handleCardClick = (cardId: number) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped) {
      return;
    }
    if (flippedRef.current.length >= 2 || flippedRef.current.includes(cardId)) {
      return;
    }
    flippedRef.current = [...flippedRef.current, cardId];
    setCards(prevCards => prevCards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    setFlippedCards(prev => [...prev, cardId]);
  };

  useEffect(() => {
    if (flippedCards.length !== 2) {
      return;
    }
    const timer = setTimeout(() => {
      const firstCard = cards.find(c => c.id === flippedCards[0]);
      const secondCard = cards.find(c => c.id === flippedCards[1]);
      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        setCards(prevCards => prevCards.map(card =>
          (card.id === firstCard.id || card.id === secondCard.id)
            ? { ...card, isMatched: true }
            : card
        ));
        setMatchedPairs(prev => prev + 1);
      } else {
        setCards(prevCards => prevCards.map(card =>
          (card.id === firstCard?.id || card.id === secondCard?.id)
            ? { ...card, isFlipped: false }
            : card
        ));
      }
      flippedRef.current = [];
      setFlippedCards([]);
      setMoves(prev => prev + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length === 0 || matchedPairs !== cards.length / 2) {
      return;
    }
    setGameOver(true);
    if (moves < highScore || highScore === 0) {
      setHighScore(moves);
      localStorage.setItem('memoryMatch_highScore', String(moves));
    }
  }, [matchedPairs, cards, moves, highScore]);

  const { rows, cols } = GRID_SIZES[difficulty];

  return (
    <div className="memory-match-container">
      {!gameStarted && (
        <div className="memory-match-start-screen">
          <h2>记忆翻牌</h2>
          <div className="memory-match-difficulty-selector">
            <button
              className={`memory-match-difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => changeDifficulty('easy')}
            >
              简单（3x4）
            </button>
            <button
              className={`memory-match-difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => changeDifficulty('medium')}
            >
              中等（4x4）
            </button>
            <button
              className={`memory-match-difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => changeDifficulty('hard')}
            >
              困难（4x5）
            </button>
          </div>
          <button
            className="memory-match-start-btn"
            onClick={startGame}
          >
            开始游戏
          </button>
          <div className="memory-match-high-score">
            最少步数：{highScore}
          </div>
        </div>
      )}

      {gameStarted && (
        <>
          <div className="memory-match-stats">
            <div className="memory-match-stat">
              <span className="memory-match-stat-label">步数</span>
              <span className="memory-match-stat-value">{moves}</span>
            </div>
            <div className="memory-match-stat">
              <span className="memory-match-stat-label">配对</span>
              <span className="memory-match-stat-value">{matchedPairs}/{cards.length / 2}</span>
            </div>
            <button
              className="memory-match-reset-btn"
              onClick={() => resetGame(difficulty)}
            >
              {gameOver ? '再来一局' : '重置'}
            </button>
          </div>

          {gameOver && (
            <div className="memory-match-complete">全部配对成功！</div>
          )}

          <div
            className="memory-match-grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                className={`memory-match-card ${card.isFlipped ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="memory-match-card-inner">
                  <div className="memory-match-card-front"></div>
                  <div className="memory-match-card-back">{card.value}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
