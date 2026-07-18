type Listener = () => void;

const listeners = new Set<Listener>();

export function emitStatsChanged() {
  listeners.forEach(fn => fn());
}

export function onStatsChanged(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
