const express = require('express');
const router = express.Router();

const NETEASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://music.163.com/'
};

const LRCLIB_HEADERS = {
  'User-Agent': 'XiuyiBlog/1.0 (https://github.com/xiuyi-ctrl/xiuyi_blog)'
};

// ─── 歌词源 1: 网易云 ───
async function fetchFromNetEase(songId) {
  try {
    const lr = await fetch(
      `https://music.163.com/api/song/lyric?id=${songId}&lv=1&tv=1`,
      { headers: NETEASE_HEADERS }
    );
    const ld = await lr.json();
    const lrc = (ld.lrc && ld.lrc.lyric) || '';
    const tlyric = (ld.tlyric && ld.tlyric.lyric) || '';
    return lrc || tlyric || '';
  } catch {
    return '';
  }
}

// ─── 歌词源 2: lrclib.net ───
async function fetchFromLrclib(songName, artistName) {
  try {
    const params = new URLSearchParams({ track_name: songName });
    if (artistName) {
      const firstArtist = artistName.split('/')[0].trim();
      params.set('artist_name', firstArtist);
    }
    const lr = await fetch(
      `https://lrclib.net/api/get?${params}`,
      { headers: LRCLIB_HEADERS }
    );
    if (lr.status !== 200) return '';
    const ld = await lr.json();
    return ld.syncedLyrics || ld.plainLyrics || '';
  } catch {
    return '';
  }
}

// ─── 歌词源 3: QQ音乐 (OIAPI) ───
async function fetchFromQQMusic(songName) {
  try {
    const searchRes = await fetch(
      `https://www.oiapi.net/api/QQMusicLyric?keyword=${encodeURIComponent(songName)}`
    );
    const searchData = await searchRes.json();
    if (searchData.code !== 1 || !searchData.data || !Array.isArray(searchData.data)) return '';

    const matched = searchData.data.find(
      d => d.name === songName || d.name.includes(songName)
    );
    if (!matched || !matched.mid) return '';

    const lrcRes = await fetch(
      `https://www.oiapi.net/api/QQMusicLyric?id=${matched.mid}&format=lrc`
    );
    const lrcData = await lrcRes.json();
    if (lrcData.code !== 1) return '';

    const content = lrcData.data && (lrcData.data.conteng || lrcData.data.content);
    return content || '';
  } catch {
    return '';
  }
}

// ─── 多源 fallback 主函数 ───
async function fetchLyricMultiSource(songId, songName, artistName) {
  const netease = await fetchFromNetEase(songId);
  if (netease) {
    return { lrc: netease, source: 'netease' };
  }
  console.warn(`[Lyrics] NetEase empty for "${songName}" (${songId}), trying lrclib...`);

  const lrclib = await fetchFromLrclib(songName, artistName);
  if (lrclib) {
    return { lrc: lrclib, source: 'lrclib' };
  }
  console.warn(`[Lyrics] lrclib empty for "${songName}", trying QQ Music...`);

  const qq = await fetchFromQQMusic(songName);
  if (qq) {
    return { lrc: qq, source: 'qqmusic' };
  }
  console.warn(`[Lyrics] All sources empty for "${songName}" (${songId})`);

  return { lrc: '', source: 'none' };
}

// ─── 路由: 获取歌单 ───
router.get('/playlist/:id', async (req, res) => {
  try {
    const playlistId = req.params.id;

    const detailRes = await fetch(
      `https://music.163.com/api/v6/playlist/detail?id=${playlistId}`,
      { headers: NETEASE_HEADERS }
    );
    const detail = await detailRes.json();

    if (detail.code !== 200) {
      return res.status(500).json({ success: false, error: detail.message || 'Failed to fetch playlist' });
    }

    let tracks = detail.playlist.tracks || [];
    const songIds = (detail.playlist.trackIds || []).map(t => t.id);

    const trackIdSet = new Set(tracks.map(t => t.id));
    const missingIds = songIds.filter(id => !trackIdSet.has(id));

    if (missingIds.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < missingIds.length; i += batchSize) {
        const batch = missingIds.slice(i, i + batchSize);
        try {
          const cParam = batch.map(id => JSON.stringify({ id })).join(',');
          const songRes = await fetch(
            `https://music.163.com/api/v3/song/detail`,
            {
              method: 'POST',
              headers: {
                ...NETEASE_HEADERS,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: `c=[${cParam}]`
            }
          );
          const songData = await songRes.json();
          if (songData.songs) {
            tracks = tracks.concat(songData.songs);
          }
        } catch (e) {
          console.error('Batch fetch songs failed:', e.message);
        }
      }
    }

    const songs = tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: (track.ar || []).map(a => a.name).join(' / '),
      cover: (track.al && track.al.picUrl) || '',
      url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
      duration: track.dt || 0
    }));

    const lyricResults = await Promise.all(
      songs.map(async (song) => {
        const { lrc } = await fetchLyricMultiSource(song.id, song.name, song.artist);
        return lrc;
      })
    );

    const songsWithLyric = songs.map((song, i) => ({
      ...song,
      lrc: lyricResults[i] || ''
    }));

    res.json({ success: true, songs: songsWithLyric, total: songIds.length });
  } catch (error) {
    console.error('Music API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── 路由: 获取单曲歌词 ───
router.get('/lyric/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const songName = req.query.name || '';
    const artistName = req.query.artist || '';

    const { lrc } = await fetchLyricMultiSource(songId, songName, artistName);

    res.json({ success: true, lrc });
  } catch (error) {
    console.error('Lyric API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
