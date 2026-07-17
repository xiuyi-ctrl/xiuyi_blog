import api from '../api';

interface Song {
  id: number;
  name: string;
  artist: string;
  cover: string;
  url: string;
  lrc?: string;
}

type PlayMode = 'sequential' | 'shuffle' | 'single';

interface MusicState {
  songs: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playMode: PlayMode;
  volume: number;
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
  playMode: 'sequential',
  volume: 0.7,
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
        playMode: saved.playMode ?? 'sequential',
        volume: saved.volume ?? 0.7,
      };
    }
  } catch {}
  return { currentIndex: 0, currentTime: 0, playMode: 'sequential' as PlayMode, volume: 0.7 };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentIndex: state.currentIndex,
      isPlaying: state.isPlaying,
      currentTime: state.currentTime,
      playMode: state.playMode,
      volume: state.volume,
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
    audio.volume = state.volume;
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
      if (state.playMode === 'single') {
        const audioEl = getAudio();
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      } else {
        next();
      }
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
      const { data } = await api.get('/music/playlist/18149408390');
      if (data.success && data.songs.length > 0) {
        state.songs = data.songs;
        const saved = loadSavedState();
        if (saved.currentIndex < data.songs.length) {
          state.currentIndex = saved.currentIndex;
        }
      state.playMode = saved.playMode;
      state.volume = saved.volume;
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

  if (!state.songs[index].lrc) {
    fetchLyric(index);
  }
}

async function fetchLyric(index: number) {
  try {
    const song = state.songs[index];
    if (!song) return;
    const params = new URLSearchParams({ name: song.name, artist: song.artist });
    const { data } = await api.get(`/music/lyric/${song.id}?${params}`);
    if (data.success && data.lrc) {
      state.songs[index].lrc = data.lrc;
      notify();
    }
  } catch (err) {
    console.error('Failed to fetch lyric:', err);
  }
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

  if (state.playMode === 'shuffle') {
    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * state.songs.length);
    } while (nextIdx === state.currentIndex && state.songs.length > 1);
    state.currentIndex = nextIdx;
  } else {
    state.currentIndex = (state.currentIndex + 1) % state.songs.length;
  }

  state.currentTime = 0;
  state.duration = 0;

  const audioEl = getAudio();
  audioEl.src = state.songs[state.currentIndex].url;
  audioEl.load();

  if (wasPlaying) {
    audioEl.play().catch(() => {});
  }
  notify();

  if (!state.songs[state.currentIndex].lrc) {
    fetchLyric(state.currentIndex);
  }
}

export function prev() {
  if (state.songs.length === 0) return;
  const wasPlaying = state.isPlaying;

  if (state.playMode === 'shuffle') {
    let prevIdx: number;
    do {
      prevIdx = Math.floor(Math.random() * state.songs.length);
    } while (prevIdx === state.currentIndex && state.songs.length > 1);
    state.currentIndex = prevIdx;
  } else {
    state.currentIndex = (state.currentIndex - 1 + state.songs.length) % state.songs.length;
  }

  state.currentTime = 0;
  state.duration = 0;

  const audioEl = getAudio();
  audioEl.src = state.songs[state.currentIndex].url;
  audioEl.load();

  if (wasPlaying) {
    audioEl.play().catch(() => {});
  }
  notify();

  if (!state.songs[state.currentIndex].lrc) {
    fetchLyric(state.currentIndex);
  }
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

export function togglePlayMode() {
  const modes: PlayMode[] = ['sequential', 'shuffle', 'single'];
  const currentIdx = modes.indexOf(state.playMode);
  state.playMode = modes[(currentIdx + 1) % modes.length];
  notify();
}

export function setVolume(vol: number) {
  state.volume = Math.max(0, Math.min(1, vol));
  const audioEl = getAudio();
  audioEl.volume = state.volume;
  notify();
}

export function getCurrentSong(): Song | null {
  return state.songs[state.currentIndex] || null;
}
