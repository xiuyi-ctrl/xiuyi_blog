const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', require('./auth'));
router.use('/posts', require('./posts'));
router.use('/music', require('./music'));
router.use('/categories', require('./categories'));

module.exports = router;
