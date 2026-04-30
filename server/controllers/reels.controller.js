const newsService = require('../services/news.service');

exports.getReels = async (req, res, next) => {
  const category = req.params.category?.toLowerCase();

  if (!newsService.REEL_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid reels category',
      validCategories: newsService.REEL_CATEGORIES,
    });
  }

  try {
    const reels = await newsService.fetchReels(category);
    res.json({
      category,
      count: reels.length,
      fetchedAt: new Date().toISOString(),
      reels,
    });
  } catch (err) {
    next(err);
  }
};
