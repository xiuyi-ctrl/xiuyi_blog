const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', require('./auth'));
router.use('/posts', require('./posts'));
router.use('/music', require('./music'));
router.use('/categories', require('./categories'));
router.use('/projects', require('./projects'));
router.use('/photos', require('./photos'));
router.use('/archive', require('./archive'));

module.exports = router;
