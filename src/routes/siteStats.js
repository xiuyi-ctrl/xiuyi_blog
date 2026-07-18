const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/visit', async (req, res) => {
  try {
    await pool.query('UPDATE site_stats SET visit_count = visit_count + 1 WHERE id = 1');
    const [[row]] = await pool.query('SELECT visit_count FROM site_stats WHERE id = 1');
    res.json({ success: true, visitCount: row.visit_count });
  } catch (error) {
    console.error('Visit count error:', error);
    res.status(500).json({ success: false });
  }
});

router.get('/', async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT visit_count FROM site_stats WHERE id = 1');
    res.json({ success: true, visitCount: row.visit_count });
  } catch (error) {
    console.error('Get visit count error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
