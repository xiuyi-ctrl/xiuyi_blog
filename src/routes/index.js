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
router.use('/guestbook', require('./guestbook'));
router.use('/search', require('./search'));
router.use('/blog-stats', require('./blogStats'));
router.use('/site-stats', require('./siteStats'));

module.exports = router;
