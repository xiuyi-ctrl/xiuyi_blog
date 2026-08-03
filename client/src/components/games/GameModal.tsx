import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function GameModal({ isOpen, onClose, title, children }: GameModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="game-modal-overlay"
      onClick={(e) => {
        if (overlayRef.current === e.target) onClose();
      }}
    >
      <div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="game-modal-title">
        <div className="game-modal-header">
          <h2 id="game-modal-title" className="game-modal-title">{title}</h2>
          <button
            className="game-modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <div className="game-modal-content">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}