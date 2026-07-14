const express = require('express');
const router = express.Router();

const NETEASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://music.163.com/'
};

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
          const songRes = await fetch(
            `https://music.163.com/api/v6/song/detail?ids=[${batch.join(',')}]`,
            { headers: NETEASE_HEADERS }
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
        try {
          const lr = await fetch(
            `https://music.163.com/api/song/lyric?id=${song.id}&lv=1&tv=1`,
            { headers: NETEASE_HEADERS }
          );
          const ld = await lr.json();
          const lrc = (ld.lrc && ld.lrc.lyric) || '';
          const tlyric = (ld.tlyric && ld.tlyric.lyric) || '';
          return lrc || tlyric;
        } catch {
          return '';
        }
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

router.get('/lyric/:id', async (req, res) => {
  try {
    const songId = req.params.id;
    const lyricRes = await fetch(
      `https://music.163.com/api/song/lyric?id=${songId}&lv=1&tv=1`,
      { headers: NETEASE_HEADERS }
    );
    const data = await lyricRes.json();

    if (data.code !== 200) {
      return res.json({ success: true, lrc: '' });
    }

    const lrc = (data.lrc && data.lrc.lyric) || '';
    const tlyric = (data.tlyric && data.tlyric.lyric) || '';

    res.json({ success: true, lrc: lrc || tlyric });
  } catch (error) {
    console.error('Lyric API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
