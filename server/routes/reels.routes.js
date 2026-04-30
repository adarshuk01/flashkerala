const express = require('express');
const router = express.Router();
const { getReels } = require('../controllers/reels.controller');

/**
 * GET /api/reels/:category
 * Valid categories: all | entertainment | technology | travel | pachakam | premium
 *
 * Response:
 * {
 *   category: string,
 *   count: number,
 *   fetchedAt: ISO string,
 *   reels: Reel[]
 * }
 */
router.get('/:category', getReels);

module.exports = router;
