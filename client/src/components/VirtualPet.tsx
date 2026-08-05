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
const MODEL_L1 = '/live2d/l_234400412/model.json';
const MODEL_L2 = '/live2d/l_234500311/model.json';
const MODEL_COUNT = 5;
const MODEL_NAMES = ['BYC', 'ninifashengri', 'Kiro', 'l_234400412', 'l_234500311'];
const MODEL_BASE_SCALE = [1, 1.2, 1, 1, 1];
const SCALE_MIN = 0.5;
const SCALE_MAX = 2;

const clamp = (value: number, lo: number, hi: number) =>
  Math.min(Math.max(value, lo), hi);

const areaToMotion: Record<string, string> = {
  head: 'flick_head',
  face: 'tap_face',
  breast: 'tap_breast',
  belly: 'tap_belly',
  leg: 'tap_leg',
};

export default function VirtualPet() {
  const widgetRef = useRef<Widget | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const rightOffset = isMobile ? 70 : 96;
    const size = isMobile ? 260 : 300;
    let switchIndex = 0;
    let scaleFactor = 1;

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

    const applyCanvasSize = (w: Widget) => {
      const rootEl = w.l2d.getCanvas().parentElement;
      if (!rootEl) return;
      const px = Math.round(size * scaleFactor);
      rootEl.style.width = `${px}px`;
      rootEl.style.height = `${px}px`;
      w.l2d.resize();
      w.l2d.setScale(MODEL_BASE_SCALE[switchIndex]);
    };

    const switchTo = async (w: Widget, index: number) => {
      switchIndex = index;
      await w.switchModel(index);
      applyCanvasSize(w);
      const motions = w.l2d.getMotions();
      if (motions['login']) {
        w.l2d.playMotion('login');
      }
    };

    const widget = createWidget({
      position: 'bottom-right',
      size,
      primaryColor: '#6366f1',
      transitionType: 'fade',
      transitionDuration: 800,
      model: [
        { path: MODEL_BYC, offset: [0, 0.6], tips },
        { path: MODEL_THIRD, scale: 1.2, tips },
        { path: MODEL_KIRO, tips },
        { path: MODEL_L1, tips },
        { path: MODEL_L2, tips },
      ],
      menus: {
        items: [
          {
            icon: 'mdi:shuffle-variant',
            label: '切换模型',
            onClick: (w) => {
              switchTo(w, (switchIndex + 1) % MODEL_COUNT);
            },
          },
          {
            icon: 'mdi:view-grid',
            label: '选择模型',
            onClick: (w) => {
              showModelPicker(w);
            },
          },
          {
            icon: 'mdi:magnify-plus',
            label: '放大',
            onClick: (w) => {
              scaleFactor = clamp(scaleFactor + 0.1, SCALE_MIN, SCALE_MAX);
              applyCanvasSize(w);
            },
          },
          {
            icon: 'mdi:magnify-minus',
            label: '缩小',
            onClick: (w) => {
              scaleFactor = clamp(scaleFactor - 0.1, SCALE_MIN, SCALE_MAX);
              applyCanvasSize(w);
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
        statusBar.style.bottom = `${bottom + (root?.offsetHeight ?? size) / 2}px`;
      }
    };

    let pickerEl: HTMLElement | null = null;
    let pickerDocHandler: ((e: PointerEvent) => void) | null = null;
    const hideModelPicker = () => {
      pickerEl?.remove();
      pickerEl = null;
      if (pickerDocHandler) {
        window.removeEventListener('pointerdown', pickerDocHandler, true);
        pickerDocHandler = null;
      }
    };
    const showModelPicker = (w: Widget) => {
      if (pickerEl) {
        hideModelPicker();
        return;
      }
      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed',
        right: `${rightOffset + (root?.offsetWidth ?? size) + 16}px`,
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(99,102,241,0.95)',
        borderRadius: '10px',
        padding: '6px',
        zIndex: '81',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      });
      MODEL_NAMES.forEach((name, i) => {
        const btn = document.createElement('button');
        btn.textContent = name;
        Object.assign(btn.style, {
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          cursor: 'pointer',
          background:
            i === switchIndex ? 'rgba(255,255,255,0.25)' : 'transparent',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          textAlign: 'left',
          whiteSpace: 'nowrap',
        });
        btn.addEventListener('mouseenter', () => {
          btn.style.background = 'rgba(255,255,255,0.2)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background =
            i === switchIndex ? 'rgba(255,255,255,0.25)' : 'transparent';
        });
        btn.addEventListener('click', () => {
          hideModelPicker();
          switchTo(w, i);
        });
        el.appendChild(btn);
      });
      pickerEl = el;
      document.body.appendChild(el);
      const onDocPointerDown = (e: PointerEvent) => {
        if (el.contains(e.target as Node)) return;
        hideModelPicker();
      };
      pickerDocHandler = onDocPointerDown;
      window.addEventListener('pointerdown', onDocPointerDown, true);
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
      const maxRight = Math.max(
        0,
        window.innerWidth - (root?.offsetWidth ?? size) + 12,
      );
      const maxBottom = Math.max(
        0,
        window.innerHeight - (root?.offsetHeight ?? size) + 12,
      );
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
      } else {
        const motions = widget.l2d.getMotions();
        const clickGroup = motions['idle_click'];
        if (clickGroup && clickGroup.length > 0) {
          widget.l2d.playMotion('idle_click');
        }
      }
      start = null;
      dragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerEnd);

    const playTapMotion = (areaName: string) => {
      const motions = widget.l2d.getMotions();
      let group = areaToMotion[areaName] ?? 'shake';
      if (switchIndex === 0 && areaName === 'face') {
        group = 'shake';
      }
      if (motions[group]) {
        widget.l2d.playMotion(group);
      }
    };

    const onTapBody = (e: Event) => {
      const detail = (e as CustomEvent<{ canvas: HTMLCanvasElement; areaName: string }>).detail;
      if (!detail || detail.canvas !== canvas) return;
      playTapMotion(detail.areaName);
    };
    window.addEventListener('live2d:tapbody', onTapBody);

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
      window.removeEventListener('live2d:tapbody', onTapBody);
      hideModelPicker();
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
