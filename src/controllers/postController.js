const pool = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { title, content, summary, category, tags, cover } = req.body;
    const author_id = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: '标题和内容不能为空' });
    }

    if (category) {
      const [cats] = await pool.query('SELECT id FROM categories WHERE id = ?', [category]);
      if (cats.length === 0) {
        return res.status(400).json({ message: '分类不存在' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO posts (title, content, summary, cover, category_id, tags, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, summary || null, cover || null, category || null, JSON.stringify(tags || []), author_id]
    );

    const [post] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);

    res.status(201).json({
      message: '文章创建成功',
      post: post[0]
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { category, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    if (keyword) {
      whereClause += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const countSql = `SELECT COUNT(*) as total FROM posts p ${whereClause}`;
    const [countResult] = await pool.query(countSql, params);

    const sql = `
      SELECT p.*, u.username as author_name, c.name as category_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [posts] = await pool.query(sql, [...params, pageSize, offset]);

    res.json({
      posts,
      pagination: {
        page,
        pageSize,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / pageSize)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const [posts] = await pool.query(
      `SELECT p.*, u.username as author_name, c.name as category_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    await pool.query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

    const [updated] = await pool.query(
      `SELECT p.*, u.username as author_name, c.name as category_name
       FROM posts p
       LEFT JOIN users u ON p.author_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    res.json({ post: updated[0] });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, category, tags, cover } = req.body;
    const author_id = req.user.id;

    const [existing] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    if (existing[0].author_id !== author_id) {
      return res.status(403).json({ message: '只能编辑自己的文章' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      fields.push('content = ?');
      values.push(content);
    }
    if (summary !== undefined) {
      fields.push('summary = ?');
      values.push(summary);
    }
    if (category !== undefined) {
      const [cats] = await pool.query('SELECT id FROM categories WHERE id = ?', [category]);
      if (cats.length === 0) {
        return res.status(400).json({ message: '分类不存在' });
      }
      fields.push('category_id = ?');
      values.push(category);
    }
    if (tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    if (cover !== undefined) {
      fields.push('cover = ?');
      values.push(cover);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: '没有需要更新的字段' });
    }

    values.push(id);
    await pool.query(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, values);

    const [post] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);

    res.json({
      message: '文章更新成功',
      post: post[0]
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const author_id = req.user.id;

    const [existing] = await pool.query('SELECT * FROM posts WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    if (existing[0].author_id !== author_id) {
      return res.status(403).json({ message: '只能删除自己的文章' });
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [id]);

    res.json({ message: '文章删除成功' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
};
