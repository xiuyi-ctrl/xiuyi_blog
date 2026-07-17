const express = require('express');
const router = express.Router();
const pool = require('../config/database');

function getSimilarityScore(title, keyword) {
  const lowerTitle = title.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  if (lowerTitle === lowerKeyword) return 100;
  if (lowerTitle.startsWith(lowerKeyword)) return 90;
  if (lowerTitle.includes(lowerKeyword)) {
    const index = lowerTitle.indexOf(lowerKeyword);
    return 70 - index * 0.5;
  }

  let keywordIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  for (let i = 0; i < lowerTitle.length && keywordIndex < lowerKeyword.length; i++) {
    if (lowerTitle[i] === lowerKeyword[keywordIndex]) {
      keywordIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }

  if (keywordIndex === lowerKeyword.length) {
    return 40 + maxConsecutive * 5;
  }

  return 0;
}

router.get('/suggestions', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || !keyword.trim()) {
      return res.json({ suggestions: [] });
    }

    const trimmedKeyword = keyword.trim();

    const [posts] = await pool.execute(
      'SELECT id, title FROM posts WHERE title LIKE ?',
      [`%${trimmedKeyword}%`]
    );

    const [projects] = await pool.execute(
      'SELECT id, title FROM projects WHERE title LIKE ?',
      [`%${trimmedKeyword}%`]
    );

    const suggestions = [
      ...posts.map(p => ({ id: p.id, title: p.title, type: 'post' })),
      ...projects.map(p => ({ id: p.id, title: p.title, type: 'project' }))
    ];

    suggestions.sort((a, b) => {
      return getSimilarityScore(b.title, trimmedKeyword) - getSimilarityScore(a.title, trimmedKeyword);
    });

    res.json({ suggestions: suggestions.slice(0, 8) });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
