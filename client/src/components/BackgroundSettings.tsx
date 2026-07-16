import { useState } from 'react';

interface BackgroundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentBg: string;
  blur: number;
  onBgChange: (bg: string) => void;
  onBlurChange: (blur: number) => void;
}

const backgrounds = [
  { id: 1, name: '背景1', url: 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/1.jpg' },
  { id: 2, name: '背景2', url: 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/bg3.jpg' },
  { id: 3, name: '背景3', url: 'https://raw.githubusercontent.com/xiuyi-ctrl/picgo_images/main/images/secondPage.png' },
];

export default function BackgroundSettings({
  isOpen,
  onClose,
  currentBg,
  blur,
  onBgChange,
  onBlurChange
}: BackgroundSettingsProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = backgrounds.findIndex(bg => bg.url === currentBg);
    return idx >= 0 ? idx : 0;
  });

  if (!isOpen) return null;

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + backgrounds.length) % backgrounds.length;
    setCurrentIndex(newIndex);
    onBgChange(backgrounds[newIndex].url);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % backgrounds.length;
    setCurrentIndex(newIndex);
    onBgChange(backgrounds[newIndex].url);
  };

  return (
    <div className="bg-settings-overlay" onClick={onClose}>
      <div className="bg-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bg-settings-header">
          <h3>背景设置</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="bg-carousel">
          <button className="carousel-btn" onClick={handlePrev}>←</button>
          <div className="carousel-preview">
            <div 
              className="carousel-image"
              style={{
                backgroundImage: backgrounds[currentIndex].url ? `url(${backgrounds[currentIndex].url})` : 'none',
                backgroundColor: backgrounds[currentIndex].url ? 'transparent' : 'var(--color-secondary)'
              }}
            />
            <span className="carousel-name">{backgrounds[currentIndex].name}</span>
          </div>
          <button className="carousel-btn" onClick={handleNext}>→</button>
        </div>

        <div className="bg-blur-control">
          <label>模糊程度</label>
          <input
            type="range"
            min="0"
            max="20"
            value={blur}
            onChange={(e) => onBlurChange(Number(e.target.value))}
          />
          <span className="blur-value">{blur}px</span>
        </div>

        <div className="bg-thumbnails">
          {backgrounds.map((bg, index) => (
            <button
              key={bg.id}
              className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                onBgChange(bg.url);
              }}
            >
              <div 
                className="thumbnail-img"
                style={{
                  backgroundImage: bg.url ? `url(${bg.url})` : 'none',
                  backgroundColor: bg.url ? 'transparent' : 'var(--color-secondary)'
                }}
              />
              <span>{bg.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
