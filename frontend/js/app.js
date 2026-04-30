/* ═══════════════════════════════════════════════════════════════
   Flash Keralam — app.js  v4.0
   Malayalam-first UI. Images from all sources. Mixed feeds.
   API routes:
     GET /api/news/:category   → latest | sports | entertainment | technology | premium
     GET /api/reels/:category  → all | entertainment | technology | travel | pachakam | premium
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   CONFIG  — update API_BASE to your deployed server URL
───────────────────────────────────────────────────────────────── */
const CONFIG = {
  API_BASE:   'http://localhost:5001/api',   // ← change to your deployed URL
  HERO_COUNT: 5,
  PAGE_SIZE:  9,
  CACHE_TTL:  5 * 60 * 1000,  // 5 min
};

/* ─────────────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────────────── */
const state = {
  section:      'latest',
  reelCategory: 'all',
  allArticles:  [],
  page:         1,
  cache:        {},
};

/* ─────────────────────────────────────────────────────────────────
   SECTION META — Malayalam labels
───────────────────────────────────────────────────────────────── */
const SECTIONS = {
  latest:        { label: 'പ്രധാന വാർത്ത',   icon: '🗞️' },
  sports:        { label: 'കായിക വാർത്ത',    icon: '⚽' },
  entertainment: { label: 'സിനിമ & വിനോദം', icon: '🎬' },
  technology:    { label: 'ടെക്‌നോളജി',      icon: '💡' },
  premium:       { label: 'Premium+',         icon: '⭐' },
  reels:         { label: 'Shortz',            icon: '▶️' },
};

/* ─────────────────────────────────────────────────────────────────
   SOURCE BADGE COLORS — so each channel looks distinct
───────────────────────────────────────────────────────────────── */
const SOURCE_COLORS = {
  'Asianet News': '#e31e25',
  'Mathrubhumi':  '#0057a8',
  'Manorama':     '#d4281b',
  'The Hindu':    '#1a3a5c',
  'Google News':  '#4285f4',
  'DD News':      '#f26522',
};

function sourceColor(channel) {
  return SOURCE_COLORS[channel] || '#666';
}

/* ─────────────────────────────────────────────────────────────────
   DOM REFS
───────────────────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const DOM = {
  progressBar:  $('progress-bar'),
  liveDate:     $('live-date'),
  liveClock:    $('live-clock'),
  tickerTrack:  $('ticker-track'),
  secIcon:      $('sec-icon'),
  secTitle:     $('sec-title'),
  artCount:     $('art-count'),
  refreshBtn:   $('refresh-btn'),
  reelPills:    $('reel-pills'),
  heroArea:     $('hero-area'),
  contentArea:  $('content-area'),
  loadMoreWrap: $('load-more-wrap'),
  loadMoreBtn:  $('load-more-btn'),
  trendingList: $('trending-list'),
  footerYear:   $('footer-year'),
  backTop:      $('back-top'),
  hamburger:    $('hamburger'),
  mobileNav:    $('mobile-nav'),
};

/* ─────────────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Image tag with Malayalam fallback text and proper onerror */
function imgTag(src, alt, cls = '') {
  if (!src) {
    return `<div class="img-fallback ${cls}"><span class="fallback-icon">📰</span></div>`;
  }
  // Proxy images that might have CORS issues through the fallback
  return `<img src="${esc(src)}" alt="${esc(alt || '')}" class="${cls}" loading="lazy"
    onerror="this.outerHTML='<div class=\\'img-fallback ${cls}\\'><span class=\\'fallback-icon\\'>📰</span></div>'" />`;
}

/* Source badge pill */
function sourceBadge(channel, icon) {
  const color = sourceColor(channel);
  const iconHtml = icon
    ? `<img class="card-ch-icon" src="${esc(icon)}" alt="${esc(channel)}" loading="lazy" onerror="this.style.display='none'">`
    : '';
  return `<div class="card-channel" style="--src-color:${color}">
    ${iconHtml}
    <span class="card-ch-name">${esc(channel || '')}</span>
  </div>`;
}

/* ─────────────────────────────────────────────────────────────────
   CLOCK & DATE — Malayalam locale
───────────────────────────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  if (DOM.liveClock) {
    DOM.liveClock.textContent = now.toLocaleTimeString('ml-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    DOM.liveClock.setAttribute('datetime', now.toISOString());
  }
  if (DOM.liveDate) {
    DOM.liveDate.textContent = now.toLocaleDateString('ml-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }
}
setInterval(updateClock, 1000);
updateClock();
if (DOM.footerYear) DOM.footerYear.textContent = new Date().getFullYear();

/* ─────────────────────────────────────────────────────────────────
   SCROLL: progress bar + back-to-top
───────────────────────────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total = document.documentElement.scrollHeight - window.innerHeight;
  if (DOM.progressBar) DOM.progressBar.style.width = ((scrolled / total) * 100) + '%';
  if (DOM.backTop) DOM.backTop.hidden = scrolled < 500;
}, { passive: true });

if (DOM.backTop) {
  DOM.backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ─────────────────────────────────────────────────────────────────
   HAMBURGER MENU
───────────────────────────────────────────────────────────────── */
if (DOM.hamburger && DOM.mobileNav) {
  DOM.hamburger.addEventListener('click', () => {
    const open = DOM.hamburger.classList.toggle('open');
    DOM.hamburger.setAttribute('aria-expanded', open);
    DOM.mobileNav.hidden = !open;
  });
}

/* ─────────────────────────────────────────────────────────────────
   API FETCH (with cache)
───────────────────────────────────────────────────────────────── */
async function apiFetch(url) {
  const cached = state.cache[url];
  if (cached && Date.now() - cached.ts < CONFIG.CACHE_TTL) return cached.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  const data = await res.json();
  state.cache[url] = { data, ts: Date.now() };
  return data;
}

function bustCache(url) {
  delete state.cache[url];
}

/* ─────────────────────────────────────────────────────────────────
   SKELETON CARDS
───────────────────────────────────────────────────────────────── */
function skeletonCards(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skel-card" aria-hidden="true">
      <div class="skeleton skel-img"></div>
      <div class="skel-body">
        <div class="skeleton skel-line w90"></div>
        <div class="skeleton skel-line w90"></div>
        <div class="skeleton skel-line w75"></div>
        <div class="skeleton skel-line w35" style="margin-top:12px"></div>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   RENDER: HERO GRID
───────────────────────────────────────────────────────────────── */
function renderHero(articles) {
  if (!articles.length) return '';
  // Pick hero: prefer an article with an image
  const withImg = articles.find(a => a.image);
  const main = withImg || articles[0];
  const rest = articles.filter(a => a !== main).slice(0, CONFIG.HERO_COUNT - 1);

  const sideHtml = rest.map(a => `
    <a class="hero-side-item" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer" lang="ml">
      <div class="side-thumb">${imgTag(a.image, a.title)}</div>
      <div class="side-body">
        <div class="side-channel" style="color:${sourceColor(a.channel)}">${esc(a.channel || '')}</div>
        <div class="side-title">${esc(a.title)}</div>
        <div class="side-time">${esc(a.publishedAt || '')}</div>
      </div>
    </a>`).join('');

  return `
    <div class="hero-grid">
      <a class="hero-main" href="${esc(main.link)}" target="_blank" rel="noopener noreferrer" lang="ml">
        ${imgTag(main.image, main.title)}
        <div class="hero-overlay">
          <span class="hero-badge" style="background:${sourceColor(main.channel)}">${esc(main.channel || 'News')}</span>
          <h2 class="hero-title">${esc(main.title)}</h2>
          ${main.summary ? `<p class="hero-summary">${esc(main.summary)}</p>` : ''}
          <div class="hero-foot">
            <span class="hero-time">${esc(main.publishedAt || '')}</span>
            <span class="hero-cta">വായിക്കൂ →</span>
          </div>
        </div>
      </a>
      ${sideHtml}
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────
   RENDER: NEWS GRID — with image-first layout
───────────────────────────────────────────────────────────────── */
function renderNewsGrid(articles, animOffset = 0) {
  if (!articles.length) return '<div class="error-state"><h3>വാർത്തകൾ കണ്ടെത്തിയില്ല</h3></div>';
  return `<div class="news-grid">` +
    articles.map((a, i) => `
      <a class="news-card" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer"
         style="animation-delay:${(i + animOffset) * 0.04}s" lang="ml">
        <div class="card-thumb">
          ${imgTag(a.image, a.title)}
          ${sourceBadge(a.channel, a.icon)}
        </div>
        <div class="card-body">
          ${a.category ? `<div class="card-cat">${esc(a.category)}</div>` : ''}
          <h3 class="card-title">${esc(a.title)}</h3>
          ${a.summary ? `<p class="card-summary">${esc(a.summary)}</p>` : ''}
          <div class="card-footer">
            <span class="card-time">${esc(a.publishedAt || '')}</span>
            <span class="card-read">വായിക്കൂ</span>
          </div>
        </div>
      </a>`).join('') +
    `</div>`;
}

/* ─────────────────────────────────────────────────────────────────
   RENDER: REELS STRIP
───────────────────────────────────────────────────────────────── */
function renderReels(reels) {
  if (!reels.length) {
    return '<div class="error-state"><h3>Shortz ഒന്നും കണ്ടെത്തിയില്ല</h3><p>മറ്റൊരു വിഭാഗം പരീക്ഷിക്കൂ.</p></div>';
  }
  return `<div class="reels-strip">` +
    reels.map(r => `
      <a class="reel-card" href="${esc(r.link)}" target="_blank" rel="noopener noreferrer" lang="ml">
        <div class="reel-thumb">
          ${imgTag(r.image, r.title)}
          <div class="reel-play-overlay">
            <div class="reel-play-btn">▶</div>
          </div>
          <div class="reel-channel-badge" style="background:${sourceColor(r.channel)}">${esc(r.channel || 'News')}</div>
        </div>
        <p class="reel-title">${esc(r.title)}</p>
      </a>`).join('') +
    `</div>`;
}

/* ─────────────────────────────────────────────────────────────────
   RENDER: TRENDING SIDEBAR
───────────────────────────────────────────────────────────────── */
function renderTrending(articles) {
  const top = articles.slice(0, 7);
  DOM.trendingList.innerHTML = top.map((a, i) => `
    <a class="trending-item" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer" lang="ml">
      <span class="trending-num">0${i + 1}</span>
      <div>
        <div class="trending-title">${esc(a.title)}</div>
        <div class="trending-channel" style="color:${sourceColor(a.channel)}">${esc(a.channel || '')}</div>
      </div>
    </a>`).join('');
}

/* ─────────────────────────────────────────────────────────────────
   RENDER: BREAKING TICKER
───────────────────────────────────────────────────────────────── */
function renderTicker(articles) {
  const items = articles.slice(0, 12).map(a =>
    `<span lang="ml">${esc(a.title)}</span>`).join('');
  DOM.tickerTrack.innerHTML = items + items; // duplicate for seamless loop
}

/* ─────────────────────────────────────────────────────────────────
   LOAD MORE (pagination)
───────────────────────────────────────────────────────────────── */
function renderPage() {
  const start = CONFIG.HERO_COUNT + (state.page - 1) * CONFIG.PAGE_SIZE;
  const end   = start + CONFIG.PAGE_SIZE;
  const slice = state.allArticles.slice(start, end);
  const hasMore = end < state.allArticles.length;

  if (state.page === 1) {
    DOM.contentArea.innerHTML = renderNewsGrid(slice);
  } else {
    const existing = DOM.contentArea.querySelector('.news-grid');
    if (existing) {
      const offset = existing.querySelectorAll('.news-card').length;
      existing.insertAdjacentHTML('beforeend',
        slice.map((a, i) => `
          <a class="news-card" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer"
             style="animation-delay:${(i + offset) * 0.04}s" lang="ml">
            <div class="card-thumb">
              ${imgTag(a.image, a.title)}
              ${sourceBadge(a.channel, a.icon)}
            </div>
            <div class="card-body">
              ${a.category ? `<div class="card-cat">${esc(a.category)}</div>` : ''}
              <h3 class="card-title">${esc(a.title)}</h3>
              ${a.summary ? `<p class="card-summary">${esc(a.summary)}</p>` : ''}
              <div class="card-footer">
                <span class="card-time">${esc(a.publishedAt || '')}</span>
                <span class="card-read">വായിക്കൂ</span>
              </div>
            </div>
          </a>`).join(''));
    }
  }

  DOM.loadMoreWrap.hidden = !hasMore;
}

/* ─────────────────────────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────────────────────────── */
function updateSectionHead(section, count) {
  const meta = SECTIONS[section] || { label: section, icon: '📰' };
  DOM.secIcon.textContent  = meta.icon;
  DOM.secTitle.textContent = meta.label;
  DOM.artCount.textContent = count != null ? `${count} വാർത്തകൾ` : '';
}

/* ─────────────────────────────────────────────────────────────────
   LOAD SECTION (news)
───────────────────────────────────────────────────────────────── */
async function loadNews(section) {
  DOM.heroArea.innerHTML    = '';
  DOM.contentArea.innerHTML = `<div class="news-grid">${skeletonCards(6)}</div>`;
  DOM.loadMoreWrap.hidden   = true;
  updateSectionHead(section, null);

  try {
    const url  = `${CONFIG.API_BASE}/news/${section}`;
    const data = await apiFetch(url);
    const articles = data.articles || data || [];

    state.allArticles = articles;
    state.page = 1;

    updateSectionHead(section, articles.length);
    DOM.heroArea.innerHTML = renderHero(articles);
    renderPage();
    renderTrending(articles);

    if (section === 'latest') renderTicker(articles);

  } catch (err) {
    console.error('[Flash Keralam] loadNews error:', err);
    DOM.heroArea.innerHTML  = '';
    DOM.contentArea.innerHTML = `
      <div class="error-state">
        <h3>വാർത്തകൾ ലോഡ് ചെയ്യാനായില്ല</h3>
        <p>API_BASE URL അല്ലെങ്കിൽ നെറ്റ്‌വർക്ക് കണക്ഷൻ പരിശോധിക്കൂ.</p>
        <button class="retry-btn" onclick="switchSection('${section}')">വീണ്ടും ശ്രമിക്കൂ</button>
      </div>`;
    DOM.artCount.textContent = 'Error';
  }
}

/* ─────────────────────────────────────────────────────────────────
   LOAD REELS
───────────────────────────────────────────────────────────────── */
async function loadReels(category) {
  DOM.heroArea.innerHTML    = '';
  DOM.contentArea.innerHTML = `<div class="reels-strip">${
    Array.from({length:8}, () =>
      '<div style="flex-shrink:0;width:140px"><div class="skel-img skeleton" style="padding-top:160%;border-radius:10px"></div><div class="skeleton skel-line w90" style="margin-top:8px"></div></div>'
    ).join('')
  }</div>`;
  DOM.loadMoreWrap.hidden = true;
  updateSectionHead('reels', null);

  try {
    const url  = `${CONFIG.API_BASE}/reels/${category}`;
    const data = await apiFetch(url);
    const reels = data.reels || data || [];

    updateSectionHead('reels', reels.length);
    DOM.contentArea.innerHTML = renderReels(reels);

  } catch (err) {
    console.error('[Flash Keralam] loadReels error:', err);
    DOM.contentArea.innerHTML = `
      <div class="error-state">
        <h3>Shortz ലോഡ് ചെയ്യാനായില്ല</h3>
        <button class="retry-btn" onclick="switchReelCat('${category}')">വീണ്ടും ശ്രമിക്കൂ</button>
      </div>`;
  }
}

/* ─────────────────────────────────────────────────────────────────
   SWITCH SECTION
───────────────────────────────────────────────────────────────── */
function switchSection(section) {
  if (section === state.section) return;
  state.section = section;

  document.querySelectorAll('.nav-btn').forEach(b => {
    const active = b.dataset.section === section;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active);
  });
  document.querySelectorAll('.mob-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });

  DOM.reelPills.hidden = section !== 'reels';
  DOM.mobileNav.hidden = true;
  DOM.hamburger.classList.remove('open');
  DOM.hamburger.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (section === 'reels') {
    loadReels(state.reelCategory);
  } else {
    loadNews(section);
  }
}

/* ─────────────────────────────────────────────────────────────────
   SWITCH REEL CATEGORY
───────────────────────────────────────────────────────────────── */
function switchReelCat(category) {
  state.reelCategory = category;
  document.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.reel === category);
  });
  loadReels(category);
}

/* ─────────────────────────────────────────────────────────────────
   REFRESH BUTTON
───────────────────────────────────────────────────────────────── */
DOM.refreshBtn.addEventListener('click', () => {
  const section = state.section;
  if (section === 'reels') {
    bustCache(`${CONFIG.API_BASE}/reels/${state.reelCategory}`);
    loadReels(state.reelCategory);
  } else {
    bustCache(`${CONFIG.API_BASE}/news/${section}`);
    loadNews(section);
  }
  DOM.refreshBtn.classList.add('spinning');
  setTimeout(() => DOM.refreshBtn.classList.remove('spinning'), 900);
});

/* ─────────────────────────────────────────────────────────────────
   LOAD MORE
───────────────────────────────────────────────────────────────── */
DOM.loadMoreBtn.addEventListener('click', () => {
  state.page++;
  renderPage();
  DOM.loadMoreBtn.textContent = 'കൂടുതൽ വാർത്തകൾ';
});

/* ─────────────────────────────────────────────────────────────────
   EVENT DELEGATION
───────────────────────────────────────────────────────────────── */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});
document.querySelectorAll('.mob-btn').forEach(btn => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});
document.querySelectorAll('.pill[data-reel]').forEach(pill => {
  pill.addEventListener('click', () => switchReelCat(pill.dataset.reel));
});
document.querySelectorAll('[data-footer-nav]').forEach(btn => {
  btn.addEventListener('click', () => switchSection(btn.dataset.footerNav));
});

/* ─────────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────────── */
loadNews('latest');
