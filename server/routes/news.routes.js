const express = require('express');
const router = express.Router();
const { getNews } = require('../controllers/news.controller');

/**
 * GET /api/news/:category
 * Valid categories: latest | sports | entertainment | technology | premium
 *
 * Response:
 * {
 *   category: string,
 *   count: number,
 *   fetchedAt: ISO string,
 *   articles: Article[]
 * }
 *
 * Article shape:
 * {
 *   title, link, summary, image, publishedAt, icon, channel, category?
 * }
 */
router.get('/:category', getNews);

module.exports = router;
