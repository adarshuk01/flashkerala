# Flash Keralam Server v3

RSS-based Malayalam news API. **No web scraping. Legally safe to host.**

## Why RSS?
Web scraping violates publisher ToS and Indian copyright law.
RSS feeds are the publishers' official method for content syndication.

## Sources
- **Google News RSS** — public, free, used by all major aggregators
- **Mathrubhumi** — open RSS feeds
- **The Hindu** — open RSS feeds

## API Endpoints

```
GET /health
GET /api/news/:category   → latest | sports | entertainment | technology | premium
GET /api/reels/:category  → all | entertainment | technology | travel | pachakam | premium
```

### Response
```json
{
  "category": "latest",
  "count": 25,
  "fetchedAt": "2025-01-01T00:00:00.000Z",
  "articles": [
    {
      "title": "...",
      "link": "https://...",
      "summary": "...",
      "image": "https://...",
      "publishedAt": "1 May 2025, 10:30 am",
      "icon": "https://...",
      "channel": "Google News"
    }
  ]
}
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy to Vercel

```bash
vercel --prod
```
