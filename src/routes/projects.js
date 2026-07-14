const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const { keyword } = req.query;
    let sql = 'SELECT * FROM projects';
    const params = [];

    if (keyword) {
      sql += ' WHERE title LIKE ? OR description LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY id DESC';

    const [projects] = await pool.execute(sql, params);
    
    const parsedProjects = projects.map(project => ({
      ...project,
      skill_using: typeof project.skill_using === 'string' 
        ? JSON.parse(project.skill_using) 
        : project.skill_using
    }));

    res.json({ success: true, projects: parsedProjects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
});

module.exports = router;
