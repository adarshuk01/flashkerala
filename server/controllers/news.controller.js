const newsService = require('../services/news.service');

exports.getNews = async (req, res, next) => {
  const category = req.params.category?.toLowerCase();

  if (!newsService.NEWS_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: 'Invalid news category',
      validCategories: newsService.NEWS_CATEGORIES,
    });
  }

  try {
    const articles = await newsService.fetchNews(category);
    res.json({
      category,
      count: articles.length,
      fetchedAt: new Date().toISOString(),
      articles,
    });
  } catch (err) {
    next(err);
  }
};
