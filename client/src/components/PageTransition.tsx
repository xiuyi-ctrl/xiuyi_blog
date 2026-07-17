import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.classList.remove('page-animate');
      void container.offsetWidth;
      container.classList.add('page-animate');
    }
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="page-transition page-animate">
      {children}
    </div>
  );
}
