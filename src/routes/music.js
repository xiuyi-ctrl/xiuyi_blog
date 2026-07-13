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

    const tracks = detail.playlist.tracks || [];
    const songIds = (detail.playlist.trackIds || []).map(t => t.id);

    const songs = tracks.slice(0, 100).map(track => ({
      id: track.id,
      name: track.name,
      artist: (track.ar || []).map(a => a.name).join(' / '),
      cover: (track.al && track.al.picUrl) || '',
      url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
      duration: track.dt || 0
    }));

    res.json({ success: true, songs, total: songIds.length });
  } catch (error) {
    console.error('Music API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
