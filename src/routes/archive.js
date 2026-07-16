const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const [topPosts] = await pool.query(`
      SELECT p.id, p.title, p.cover, p.views, p.created_at,
             u.username as author_name, c.name as category_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.views DESC
      LIMIT 3
    `);

    const [allPosts] = await pool.query(`
      SELECT p.id, p.title, p.created_at, c.name as category_name
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);

    const [allProjects] = await pool.query(`
      SELECT id, title, created_at
      FROM projects
      ORDER BY created_at DESC
    `);

    const [allPhotos] = await pool.query(`
      SELECT id, title, created_at
      FROM photos
      ORDER BY created_at DESC
    `);

    const tagCount = {};
    allPosts.forEach(p => {
      const tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : (p.tags || []);
      tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
    });
    const tagCloud = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const grouped = {};
    allPosts.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      if (!grouped[key]) grouped[key] = { year: d.getFullYear(), month: d.getMonth() + 1, items: [] };
      grouped[key].items.push({ ...p, type: 'post' });
    });
    allProjects.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      if (!grouped[key]) grouped[key] = { year: d.getFullYear(), month: d.getMonth() + 1, items: [] };
      grouped[key].items.push({ ...p, type: 'project' });
    });
    allPhotos.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      if (!grouped[key]) grouped[key] = { year: d.getFullYear(), month: d.getMonth() + 1, items: [] };
      grouped[key].items.push({ ...p, type: 'photo' });
    });

    Object.values(grouped).forEach(g => {
      g.items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    });

    const sorted = Object.entries(grouped)
      .sort((a, b) => {
        if (b[1].year !== a[1].year) return b[1].year - a[1].year;
        return b[1].month - a[1].month;
      })
      .map(([key, value]) => ({ key, ...value }));

    res.json({ success: true, topPosts, timeline: sorted, tagCloud });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({ success: false, message: '获取归档数据失败' });
  }
});

module.exports = router;
