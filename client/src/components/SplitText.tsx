import { useEffect, useRef, useState } from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  splitType?: 'chars' | 'words';
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export default function SplitText({
  text,
  className = '',
  delay = 50,
  duration = 0.6,
  splitType = 'chars',
  tag = 'p'
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [text]);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const items = el.querySelectorAll('.split-char');
    const timers: ReturnType<typeof setTimeout>[] = [];
    items.forEach((item, i) => {
      const htmlItem = item as HTMLElement;
      htmlItem.style.opacity = '0';
      htmlItem.style.transition = `opacity ${duration}s ease`;
      timers.push(setTimeout(() => {
        htmlItem.style.opacity = '1';
        htmlItem.classList.add('visible');
      }, i * delay));
    });
    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [text, key, delay, duration]);

  const splitText = (str: string) => {
    if (splitType === 'words') {
      return str.split(' ').map((word, i) => (
        <span key={i} className="split-char" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {word}{i < str.split(' ').length - 1 ? ' ' : ''}
        </span>
      ));
    }
    return str.split('').map((char, i) => (
      <span key={i} className="split-char" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
        {char}
      </span>
    ));
  };

  const Tag = tag || 'p';

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      key={key}
      className={`split-parent ${className}`}
      style={{ overflow: 'hidden', display: 'inline-block' }}
    >
      {splitText(text)}
    </Tag>
  );
}
