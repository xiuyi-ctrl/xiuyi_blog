const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM guestbook');
    const total = countResult[0].total;

    const [messages] = await pool.query(
      `SELECT g.*, u.username, u.avatar
       FROM guestbook g
       LEFT JOIN users u ON g.user_id = u.id
       ORDER BY g.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const messageIds = messages.map(m => m.id);
    let replies = [];
    let likes = [];

    if (messageIds.length > 0) {
      [replies] = await pool.query(
        `SELECT r.*, u.username, u.avatar
         FROM guestbook_replies r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.message_id IN (?)
         ORDER BY r.created_at ASC`,
        [messageIds]
      );

      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          [likes] = await pool.query(
            'SELECT message_id FROM guestbook_likes WHERE user_id = ? AND message_id IN (?)',
            [decoded.id, messageIds]
          );
        } catch (e) {}
      }
    }

    const likedSet = new Set(likes.map(l => l.message_id));
    const repliesMap = {};
    replies.forEach(r => {
      if (!repliesMap[r.message_id]) repliesMap[r.message_id] = [];
      repliesMap[r.message_id].push(r);
    });

    const result = messages.map(m => ({
      ...m,
      liked: likedSet.has(m.id),
      replies: repliesMap[m.id] || []
    }));

    res.json({
      messages: result,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (error) {
    console.error('Get guestbook error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/hero', async (req, res) => {
  try {
    const [messages] = await pool.query(
      `SELECT g.id, g.content, g.created_at, u.username, u.avatar
       FROM guestbook g
       LEFT JOIN users u ON g.user_id = u.id
       ORDER BY RAND()
       LIMIT 12`
    );
    res.json({ messages });
  } catch (error) {
    console.error('Get hero messages error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '留言内容不能为空' });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({ message: '留言内容不能超过500字' });
    }

    const [result] = await pool.query(
      'INSERT INTO guestbook (user_id, content) VALUES (?, ?)',
      [user_id, content.trim()]
    );

    const [message] = await pool.query(
      `SELECT g.*, u.username, u.avatar
       FROM guestbook g
       LEFT JOIN users u ON g.user_id = u.id
       WHERE g.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: '留言成功',
      data: { ...message[0], liked: false, replies: [] }
    });
  } catch (error) {
    console.error('Create guestbook error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [existing] = await pool.query('SELECT * FROM guestbook WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    if (existing[0].user_id !== user_id) {
      return res.status(403).json({ message: '只能删除自己的留言' });
    }

    await pool.query('DELETE FROM guestbook WHERE id = ?', [id]);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete guestbook error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const [existing] = await pool.query('SELECT * FROM guestbook WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    const [liked] = await pool.query(
      'SELECT * FROM guestbook_likes WHERE message_id = ? AND user_id = ?',
      [id, user_id]
    );

    if (liked.length > 0) {
      await pool.query('DELETE FROM guestbook_likes WHERE message_id = ? AND user_id = ?', [id, user_id]);
      await pool.query('UPDATE guestbook SET likes = likes - 1 WHERE id = ?', [id]);
      res.json({ liked: false, likes: existing[0].likes - 1 });
    } else {
      await pool.query('INSERT INTO guestbook_likes (message_id, user_id) VALUES (?, ?)', [id, user_id]);
      await pool.query('UPDATE guestbook SET likes = likes + 1 WHERE id = ?', [id]);
      res.json({ liked: true, likes: existing[0].likes + 1 });
    }
  } catch (error) {
    console.error('Like guestbook error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '回复内容不能为空' });
    }

    if (content.trim().length > 200) {
      return res.status(400).json({ message: '回复内容不能超过200字' });
    }

    const [existing] = await pool.query('SELECT * FROM guestbook WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: '留言不存在' });
    }

    const [result] = await pool.query(
      'INSERT INTO guestbook_replies (message_id, user_id, content) VALUES (?, ?, ?)',
      [id, user_id, content.trim()]
    );

    const [reply] = await pool.query(
      `SELECT r.*, u.username, u.avatar
       FROM guestbook_replies r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: '回复成功', data: reply[0] });
  } catch (error) {
    console.error('Reply guestbook error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
