import api from '../api';

interface Song {
  id: number;
  name: string;
  artist: string;
  cover: string;
  url: string;
  lrc?: string;
}

interface MusicState {
  songs: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

type Listener = () => void;

const STORAGE_KEY = 'xiuyi_music_player';
const listeners: Set<Listener> = new Set();

let audio: HTMLAudioElement | null = null;
let state: MusicState = {
  songs: [],
  currentIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
};

let lastNotifyTime = 0;

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        currentIndex: saved.currentIndex ?? 0,
        currentTime: saved.currentTime ?? 0,
      };
    }
  } catch {}
  return { currentIndex: 0, currentTime: 0 };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying,
      currentTime: state.currentTime,
    }));
  } catch {}
}

function notify(throttle = false) {
  const now = Date.now();
  if (throttle && now - lastNotifyTime < 300) return;
  lastNotifyTime = now;
  saveState();
  listeners.forEach(l => l());
}

export function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.addEventListener('timeupdate', () => {
      state.currentTime = audio!.currentTime;
      notify(true);
    });
    audio.addEventListener('loadedmetadata', () => {
      state.duration = audio!.duration;
      const saved = loadSavedState();
      if (saved.currentTime > 0 && saved.currentTime < state.duration) {
        audio!.currentTime = saved.currentTime;
      }
      notify();
    });
    audio.addEventListener('ended', () => {
      next();
    });
  }
  return audio;
}

export function getState(): MusicState {
  return { ...state };
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function loadPlaylist() {
  try {
    const { data } = await api.get('/music/playlist/18146875685');
    if (data.success && data.songs.length > 0) {
      const filtered = data.songs.filter((s: Song) => s.url);
      state.songs = filtered;
      const saved = loadSavedState();
      if (saved.currentIndex < filtered.length) {
        state.currentIndex = saved.currentIndex;
      }
      notify();
      loadSong(state.currentIndex);
    }
  } catch (err) {
    console.error('Failed to load playlist:', err);
  }
}

export function loadSong(index: number) {
  if (index < 0 || index >= state.songs.length) return;
  const wasPlaying = state.isPlaying;
  state.currentIndex = index;
  state.currentTime = 0;
  state.duration = 0;

  const audioEl = getAudio();
  audioEl.src = state.songs[index].url;
  audioEl.load();

  if (wasPlaying) {
    audioEl.play().catch(() => {});
  }
  notify();
}

export function play() {
  const audioEl = getAudio();
  audioEl.play().then(() => {
    state.isPlaying = true;
    notify();
  }).catch(() => {});
}

export function pause() {
  const audioEl = getAudio();
  audioEl.pause();
  state.isPlaying = false;
  notify();
}

export function togglePlay() {
  if (state.isPlaying) {
    pause();
  } else {
    play();
  }
}

export function next() {
  if (state.songs.length === 0) return;
  const wasPlaying = state.isPlaying;
  state.currentIndex = (state.currentIndex + 1) % state.songs.length;
  state.currentTime = 0;
  state.duration = 0;

  const audioEl = getAudio();
  audioEl.src = state.songs[state.currentIndex].url;
  audioEl.load();

  if (wasPlaying) {
    audioEl.play().catch(() => {});
  }
  notify();
}

export function prev() {
  if (state.songs.length === 0) return;
  const wasPlaying = state.isPlaying;
  state.currentIndex = (state.currentIndex - 1 + state.songs.length) % state.songs.length;
  state.currentTime = 0;
  state.duration = 0;

  const audioEl = getAudio();
  audioEl.src = state.songs[state.currentIndex].url;
  audioEl.load();

  if (wasPlaying) {
    audioEl.play().catch(() => {});
  }
  notify();
}

export function seek(time: number) {
  const audioEl = getAudio();
  audioEl.currentTime = time;
  state.currentTime = time;
  notify();
}

export function setSong(index: number) {
  if (index < 0 || index >= state.songs.length) return;
  state.isPlaying = true;
  loadSong(index);
}

export function getCurrentSong(): Song | null {
  return state.songs[state.currentIndex] || null;
}
