import { useEffect, useRef } from 'react';
import { createWidget, type Widget } from 'l2d-widget';
import {
  timeBasedGreeting,
  PET_IDLE_TIPS,
  PET_CLICK_TIPS,
  PET_PAT_TIPS,
} from '../lib/petMessages';
import { petStore } from '../lib/petStore';

const STORE_HIDDEN_KEY = 'pet_hidden';
const MODEL_BYC = '/live2d/byc/model.json';
const MODEL_THIRD = '/live2d/ninifashengri/model.json';
const MODEL_KIRO = '/live2d/kiro/model.json';

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(Math.max(value, lo), hi);

export default function VirtualPet() {
  const widgetRef = useRef<Widget | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const rightOffset = isMobile ? 70 : 96;
    const size = isMobile ? 260 : 300;
    let switchIndex = 0;

    const tips = {
      welcomeMessage: [
        timeBasedGreeting(),
        '欢迎来到秀一的博客～',
        '我是猫猫，请多指教喵～',
      ],
      messages: [...PET_IDLE_TIPS, ...PET_CLICK_TIPS, ...PET_PAT_TIPS],
      duration: 4000,
      interval: 8000,
      typing: {
        param: 'PARAM_MOUTH_OPEN_Y',
        speed: 160,
        minValue: 0.4,
        maxValue: 1,
      },
    };

    const widget = createWidget({
      position: 'bottom-right',
      size,
      primaryColor: '#6366f1',
      transitionType: 'fade',
      transitionDuration: 800,
      model: [
        { path: MODEL_BYC, tips },
        { path: MODEL_THIRD, tips },
        { path: MODEL_KIRO, tips },
      ],
      menus: {
        items: [
          {
            icon: 'mdi:shuffle-variant',
            label: '切换模型',
            onClick: (w) => {
              switchIndex = (switchIndex + 1) % 3;
              w.switchModel(switchIndex);
            },
          },
          {
            icon: 'mdi:hand-heart-outline',
            label: '摸头',
            onClick: (w) => {
              const motions = w.l2d.getMotions();
              const interact = Object.keys(motions).filter((g) =>
                /touch|tap|flick|shake|pat|pet|head|face|breast|belly|leg/.test(g.toLowerCase()),
              );
              const groups =
                interact.length > 0
                  ? interact
                  : Object.keys(motions).filter((g) => g !== 'idle');
              const pool = groups.length > 0 ? groups : Object.keys(motions);
              if (pool.length > 0) {
                w.l2d.playMotion(pool[Math.floor(Math.random() * pool.length)]);
              }
            },
          },
          {
            icon: 'mdi:bed',
            label: '隐藏',
            onClick: (w) => {
              w.sleep();
              try {
                localStorage.setItem(STORE_HIDDEN_KEY, '1');
              } catch {
                /* ignore */
              }
              petStore.setHidden(true);
            },
          },
        ],
      },
    });
    widgetRef.current = widget;

    const root = widget.l2d.getCanvas().parentElement;
    const statusBar = root?.nextElementSibling as HTMLElement | null;
    for (const el of [root, statusBar]) {
      if (!el) continue;
      el.style.zIndex = '80';
      el.style.right = `${rightOffset}px`;
    }
    if (statusBar) {
      statusBar.style.display = 'none';
    }

    const applyPos = (right: number, bottom: number) => {
      if (root) {
        root.style.right = `${right}px`;
        root.style.bottom = `${bottom}px`;
      }
      if (statusBar) {
        statusBar.style.right = `${right}px`;
        statusBar.style.bottom = `${bottom + size / 2}px`;
      }
    };

    petStore.setController({
      wake: () => {
        if (!statusBar) return;
        statusBar.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true }),
        );
        try {
          localStorage.setItem(STORE_HIDDEN_KEY, '0');
        } catch {
          /* ignore */
        }
        petStore.setHidden(false);
      },
    });

    const canvas = widget.l2d.getCanvas();
    canvas.style.touchAction = 'none';
    let start: { x: number; y: number; right: number; bottom: number } | null =
      null;
    let dragging = false;

    const onPointerDown = (e: PointerEvent) => {
      start = {
        x: e.clientX,
        y: e.clientY,
        right: root ? parseFloat(root.style.right) || 0 : 0,
        bottom: root ? parseFloat(root.style.bottom) || 0 : 0,
      };
      dragging = false;
      try {
        canvas.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) < 4) return;
      dragging = true;
      const maxRight = Math.max(0, window.innerWidth - size + 12);
      const maxBottom = Math.max(0, window.innerHeight - size + 12);
      const right = clamp(start.right - dx, 0, maxRight);
      const bottom = clamp(start.bottom - dy, 0, maxBottom);
      applyPos(right, bottom);
    };

    const onPointerEnd = () => {
      if (!start) return;
      if (dragging) {
        const suppress = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
          window.removeEventListener('click', suppress, true);
        };
        window.addEventListener('click', suppress, true);
      }
      start = null;
      dragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerEnd);

    let hiddenAtMount = false;
    try {
      hiddenAtMount = localStorage.getItem(STORE_HIDDEN_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (hiddenAtMount) {
      widget.l2d.on('loaded', () => widget.sleep());
      petStore.setHidden(true);
    }

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      petStore.setController(null);
      widget.destroy();
      widgetRef.current = null;
    };
  }, []);

  return null;
}
