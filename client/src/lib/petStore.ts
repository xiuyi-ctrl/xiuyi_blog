interface PetController {
  wake: () => void;
}

let hidden = false;
let controller: PetController | null = null;
const listeners: Set<() => void> = new Set();

export const petStore = {
  isHidden: () => hidden,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setHidden(value: boolean) {
    hidden = value;
    listeners.forEach((l) => l());
  },
  setController(value: PetController | null) {
    controller = value;
  },
  wake() {
    controller?.wake();
  },
};
