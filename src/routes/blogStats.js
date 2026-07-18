const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [[postRow]] = await pool.query('SELECT COUNT(*) as total, COALESCE(SUM(views), 0) as views FROM posts');
    const [[projectRow]] = await pool.query('SELECT COUNT(*) as total FROM projects');
    const [[guestbookRow]] = await pool.query('SELECT COUNT(*) as total FROM guestbook');
    const [[replyRow]] = await pool.query('SELECT COUNT(*) as total FROM guestbook_replies');

    const [photoRows] = await pool.query('SELECT image_url FROM photos');
    let photoCount = 0;
    photoRows.forEach(row => {
      const images = typeof row.image_url === 'string' ? JSON.parse(row.image_url) : row.image_url;
      if (images && typeof images === 'object') {
        photoCount += Object.keys(images).length;
      }
    });

    res.json({
      success: true,
      data: {
        posts: postRow.total,
        views: postRow.views,
        projects: projectRow.total,
        photos: photoCount,
        messages: guestbookRow.total + replyRow.total,
      }
    });
  } catch (error) {
    console.error('Get blog stats error:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

module.exports = router;
