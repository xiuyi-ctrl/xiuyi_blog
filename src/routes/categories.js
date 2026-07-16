const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(p.id) AS post_count 
      FROM categories c 
      LEFT JOIN posts p ON c.id = p.category_id 
      GROUP BY c.id 
      ORDER BY c.id
    `);
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

module.exports = router;
