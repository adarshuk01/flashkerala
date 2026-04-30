const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

/* ══════════════════════════════════════════════════════════════════
   Flash Keralam — news.service.js  v4.1
   SPEED STRATEGY:
   ┌─────────────────────────────────────────────────────────────┐
   │  Request 1  → serve raw RSS instantly (~1-2s)              │
   │             → kick off translate+image scrape in BG        │
   │  Request 2+ → serve from cache instantly (0ms)             │
   │             → background job refreshes cache every 12 min  │
   └─────────────────────────────────────────────────────────────┘
   No user ever waits for translation or image scraping.
   ══════════════════════════════════════════════════════════════════ */

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  parseTagValue: true,
  trimValues: true,
});

const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, text/html, */*',
    'Accept-Language': 'en-US,en;q=0.9,ml;q=0.8',
  },
});

const ICONS = {
  'Google News':  'https://www.google.com/favicon.ico',
  'Mathrubhumi':  'https://www.mathrubhumi.com/resources/images/favicon.ico',
  'The Hindu':    'https://www.thehindu.com/favicon.ico',
  'Asianet News': 'https://newsable.asianetnews.com/favicon.ico',
  'Manorama':     'https://www.manoramaonline.com/etc/designs/manoramaonline/favicon.ico',
  'Madhyamam':    'https://www.madhyamam.com/favicon.ico',
};

const ASIANET_BASE = 'https://newsable.asianetnews.com';
const ASIANET = {
  latest:        `${ASIANET_BASE}/rss-feed/kerala`,
  sports:        `${ASIANET_BASE}/rss-feed/sports`,
  entertainment: `${ASIANET_BASE}/rss-feed/entertainment`,
  technology:    `${ASIANET_BASE}/rss-feed/technology`,
  premium:       `${ASIANET_BASE}/rss-feed/india`,
};

const FEEDS = {
  latest: [
    { url: 'https://news.google.com/rss/search?q=kerala+news&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: 'https://www.mathrubhumi.com/rss/news.xml',  channel: 'Mathrubhumi',  icon: ICONS['Mathrubhumi'],  lang: 'ml' },
    { url: ASIANET.latest,                               channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
    { url: 'https://news.google.com/rss/search?q=kerala+news&hl=en-IN&gl=IN&ceid=IN:en', channel: 'Google News', icon: ICONS['Google News'], lang: 'en' },
  ],
  sports: [
    { url: 'https://news.google.com/rss/search?q=kerala+sports&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: 'https://www.mathrubhumi.com/rss/sports.xml', channel: 'Mathrubhumi',  icon: ICONS['Mathrubhumi'],  lang: 'ml' },
    { url: ASIANET.sports,                               channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
    { url: 'https://news.google.com/rss/search?q=kerala+sports+cricket&hl=en-IN&gl=IN&ceid=IN:en', channel: 'Google News', icon: ICONS['Google News'], lang: 'en' },
  ],
  entertainment: [
    { url: 'https://news.google.com/rss/search?q=mollywood+entertainment&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: 'https://www.mathrubhumi.com/rss/movies.xml', channel: 'Mathrubhumi',  icon: ICONS['Mathrubhumi'],  lang: 'ml' },
    { url: ASIANET.entertainment,                        channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
    { url: 'https://news.google.com/rss/search?q=mollywood+cinema&hl=en-IN&gl=IN&ceid=IN:en', channel: 'Google News', icon: ICONS['Google News'], lang: 'en' },
  ],
  technology: [
    { url: 'https://news.google.com/rss/search?q=technology+india&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: ASIANET.technology,                           channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
    { url: 'https://news.google.com/rss/search?q=technology+gadgets+india&hl=en-IN&gl=IN&ceid=IN:en', channel: 'Google News', icon: ICONS['Google News'], lang: 'en' },
  ],
  premium: [
    { url: 'https://news.google.com/rss/search?q=kerala+politics&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: 'https://www.thehindu.com/news/national/kerala/?service=rss', channel: 'The Hindu', icon: ICONS['The Hindu'], lang: 'en' },
    { url: ASIANET.premium,                              channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
    { url: 'https://news.google.com/rss/search?q=kerala+politics+economy&hl=en-IN&gl=IN&ceid=IN:en', channel: 'Google News', icon: ICONS['Google News'], lang: 'en' },
  ],
};

const REEL_FEEDS = {
  all:           [
    { url: 'https://news.google.com/rss/search?q=kerala+video+news&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: ASIANET.latest, channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
  ],
  entertainment: [
    { url: 'https://news.google.com/rss/search?q=mollywood+trailer&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: ASIANET.entertainment, channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
  ],
  technology: [
    { url: 'https://news.google.com/rss/search?q=technology+review+india&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: ASIANET.technology, channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
  ],
  travel: [
    { url: 'https://news.google.com/rss/search?q=kerala+travel+tourism&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
  ],
  pachakam: [
    { url: 'https://news.google.com/rss/search?q=kerala+food+recipe&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
  ],
  premium: [
    { url: 'https://news.google.com/rss/search?q=kerala+exclusive&hl=ml&gl=IN&ceid=IN:ml', channel: 'Google News', icon: ICONS['Google News'], lang: 'ml' },
    { url: ASIANET.premium, channel: 'Asianet News', icon: ICONS['Asianet News'], lang: 'ml' },
  ],
};

exports.REEL_CATEGORIES = Object.keys(REEL_FEEDS);
exports.NEWS_CATEGORIES  = Object.keys(FEEDS);

/* ════════════════════════════════════════════════════════════════
   IN-MEMORY CACHE
   key   → "news:latest" | "reel:all" etc.
   value → { articles[], enriched: bool, fetchedAt: ms, enriching: bool, refreshing: bool }
   ════════════════════════════════════════════════════════════════ */
const CACHE            = new Map();
const TTL_RAW          =  5 * 60 * 1000;   // 5 min  — re-fetch RSS
const TTL_ENRICHED     = 15 * 60 * 1000;   // 15 min — re-enrich
const REFRESH_INTERVAL = 12 * 60 * 1000;   // 12 min — background refresh tick

/* ── Google Translate gtx (free, no key) ────────────────────────── */
async function translateToMalayalam(text) {
  if (!text || !text.trim()) return text;
  if (/[\u0D00-\u0D7F]/.test(text)) return text; // already has Malayalam chars
  try {
    const params = new URLSearchParams({ client: 'gtx', sl: 'auto', tl: 'ml', dt: 't', q: text.slice(0, 500) });
    const { data } = await axios.get(`https://translate.googleapis.com/translate_a/single?${params}`, { timeout: 4000 });
    if (Array.isArray(data?.[0])) return data[0].map(c => c[0] || '').join('');
    return text;
  } catch { return text; }
}

/* ── Scrape og:image (background only) ─────────────────────────── */
async function scrapeOgImage(url) {
  if (!url) return null;
  try {
    const { data: html } = await httpClient.get(url, { timeout: 5000, headers: { Accept: 'text/html' } });
    const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
            || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    return og ? og[1] : null;
  } catch { return null; }
}

/* ── Parse single RSS feed — fast, no enrichment ───────────────── */
async function parseFeed({ url, channel, icon, lang = 'ml' }) {
  try {
    const { data } = await httpClient.get(url);
    const parsed = parser.parse(data);
    const items  = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    const arr    = Array.isArray(items) ? items : [items];
    return arr.map(item => ({
      title:       getText(item.title) || '',
      link:        cleanLink(getText(item.link) || item['link']?.['@_href'] || ''),
      summary:     (stripHtml(getText(item.description) || getText(item.summary) || '')).slice(0, 300),
      image:       extractImage(item) || null,
      publishedAt: formatDate(item.pubDate || item.published || item.updated || null),
      icon,
      channel,
      _lang:       lang,
      _needsImage: !extractImage(item),
    })).filter(a => a.title && a.link);
  } catch (err) {
    console.warn(`[RSS] ${url}: ${err.message}`);
    return [];
  }
}

/* ── Merge + dedup + sort ───────────────────────────────────────── */
function mergeAndSort(results) {
  const seen = new Set();
  return results.flat()
    .filter(a => {
      const k = a.title.slice(0, 60).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k); return true;
    })
    .sort((a, b) => (new Date(b.publishedAt) || 0) - (new Date(a.publishedAt) || 0));
}

/* ── Background enrichment (mutates array in-place) ─────────────── */
async function enrichInBackground(articles) {
  // Translate English articles — 8 parallel
  const eng = articles.filter(a => a._lang === 'en');
  for (let i = 0; i < eng.length; i += 8) {
    await Promise.all(eng.slice(i, i + 8).map(async a => {
      a.title   = await translateToMalayalam(a.title);
      if (a.summary) a.summary = await translateToMalayalam(a.summary);
      a._lang = 'done';
    }));
  }

  // Scrape missing images — 8 parallel, cap 30
  const noImg = articles.filter(a => a._needsImage && a.link).slice(0, 30);
  for (let i = 0; i < noImg.length; i += 8) {
    await Promise.all(noImg.slice(i, i + 8).map(async a => {
      a.image       = await scrapeOgImage(a.link);
      a._needsImage = false;
    }));
  }

  articles.forEach(a => { delete a._lang; delete a._needsImage; });
}

/* ── Fetch raw RSS (no enrichment) ─────────────────────────────── */
async function fetchRaw(feedConfigs) {
  return mergeAndSort(await Promise.all(feedConfigs.map(parseFeed)));
}

/* ════════════════════════════════════════════════════════════════
   MAIN GETTER — serve instantly, enrich in background
   ════════════════════════════════════════════════════════════════ */
async function getArticles(type, category, feedConfigs) {
  const key   = `${type}:${category}`;
  const now   = Date.now();
  const entry = CACHE.get(key);

  // ✅ Fresh + enriched — instant return
  if (entry && entry.enriched && now - entry.fetchedAt < TTL_ENRICHED) {
    return entry.articles;
  }

  // ♻️ Stale enriched — serve stale, refresh in BG
  if (entry && entry.enriched && !entry.refreshing) {
    entry.refreshing = true;
    fetchRaw(feedConfigs).then(articles => {
      const e = { articles, enriched: false, fetchedAt: Date.now(), enriching: true, refreshing: false };
      CACHE.set(key, e);
      enrichInBackground(articles).then(() => { e.enriched = true; e.enriching = false; });
    }).catch(() => { entry.refreshing = false; });
    return entry.articles;
  }

  // ⏳ Raw cache (enrichment running) — return raw for now
  if (entry && now - entry.fetchedAt < TTL_RAW) {
    return entry.articles;
  }

  // 🆕 Cache miss — fetch RSS synchronously, return immediately, enrich in BG
  const articles = await fetchRaw(feedConfigs);
  const e = { articles, enriched: false, fetchedAt: now, enriching: true, refreshing: false };
  CACHE.set(key, e);

  enrichInBackground(articles)
    .then(() => { e.enriched = true; e.enriching = false; console.log(`[Cache] ✓ Enriched ${key}`); })
    .catch(err => { e.enriching = false; console.warn(`[Cache] Enrich fail ${key}: ${err.message}`); });

  return articles;
}

/* ── Warm top 3 categories at startup ──────────────────────────── */
setTimeout(async () => {
  for (const cat of ['latest', 'sports', 'entertainment']) {
    try { await getArticles('news', cat, FEEDS[cat]); console.log(`[Warm] news:${cat}`); }
    catch (e) { console.warn(`[Warm] fail news:${cat}`, e.message); }
  }
}, 3000);

/* ── Periodic background refresh ───────────────────────────────── */
setInterval(() => {
  for (const [key, entry] of CACHE.entries()) {
    if (!entry.enriched || entry.refreshing) continue;
    const [type, cat] = key.split(':');
    const configs = type === 'news' ? FEEDS[cat] : REEL_FEEDS[cat];
    if (!configs) continue;
    entry.refreshing = true;
    fetchRaw(configs).then(articles => {
      const e = { articles, enriched: false, fetchedAt: Date.now(), enriching: true, refreshing: false };
      CACHE.set(key, e);
      return enrichInBackground(articles).then(() => { e.enriched = true; e.enriching = false; });
    }).catch(() => { entry.refreshing = false; });
  }
}, REFRESH_INTERVAL);

/* ── Public API ──────────────────────────────────────────────────── */
exports.fetchNews = (category) => {
  const configs = FEEDS[category];
  if (!configs) throw new Error(`Unknown category: ${category}`);
  return getArticles('news', category, configs);
};

exports.fetchReels = (category) => {
  const configs = REEL_FEEDS[category];
  if (!configs) throw new Error(`Unknown reel category: ${category}`);
  return getArticles('reel', category, configs);
};

/* ── Helpers ─────────────────────────────────────────────────────── */
function getText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.__cdata || val['#text'] || String(val);
  return String(val);
}
function stripHtml(html) { return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function cleanLink(link) {
  if (!link) return '';
  if (link.includes('news.google.com/rss/articles')) {
    try { return new URL(link).searchParams.get('url') || link; } catch { return link; }
  }
  return link;
}
function extractImage(item) {
  const media = item['media:content'] || item['media:thumbnail'];
  if (media) {
    if (Array.isArray(media)) {
      const best = media.find(m => m['@_medium'] === 'image') || media[0];
      if (best?.['@_url']) return best['@_url'];
    }
    if (media['@_url']) return media['@_url'];
  }
  if (item.enclosure?.['@_type']?.startsWith('image')) return item.enclosure['@_url'];
  if (item.image?.url) return getText(item.image.url);
  const desc = getText(item.description) || getText(item['content:encoded']) || '';
  const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  if (item['itunes:image']?.['@_href']) return item['itunes:image']['@_href'];
  return null;
}
function formatDate(raw) {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('ml-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return raw; }
}
