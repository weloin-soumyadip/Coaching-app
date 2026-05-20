const express = require('express');
const config = require('../config');

const router = express.Router();

// GET /api/health — boot sanity check.
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
