const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    let sql = 'SELECT * FROM photos ORDER BY created_at DESC';
    const params = [];

    if (keyword) {
      sql = 'SELECT * FROM photos WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [rows] = await pool.query(sql, params);

    const photos = rows.map(row => ({
      ...row,
      image_url: typeof row.image_url === 'string' ? JSON.parse(row.image_url) : row.image_url
    }));

    res.json({ code: 0, data: photos });
  } catch (error) {
    console.error('获取照片集失败:', error);
    res.status(500).json({ code: 1, message: '获取照片集失败' });
  }
});

module.exports = router;
