/* ═══════════════════════════════════════════════════════
   ODI — app.js
   Digunakan oleh: id.html
   Berisi: ADS, Config Loader, Link Loader, Feed Renderer,
           Copy System, Search, Filter, Mobile Sheet,
           Smooth Transitions
═══════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   1. ADS — Automatic Device System v1.0
────────────────────────────────────────── */
const ADS = (() => {
  const ua  = navigator.userAgent;
  const W   = window.innerWidth;
  const DPR = window.devicePixelRatio || 1;
  const isTouch    = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const isIOS      = /iP(hone|od|ad)/i.test(ua);
  const isAndroid  = /Android/i.test(ua);
  const isMacOS    = /Macintosh|Mac OS X/i.test(ua) && !isIOS;
  const isIPad     = /iPad/i.test(ua) || (isMacOS && isTouch);
  const isIPhone   = /iPhone/i.test(ua);
  const avr        = (() => { const m = ua.match(/Android (\d+)/i); return m ? parseInt(m[1]) : 99; })();
  const isLowAnd   = isAndroid && avr < 9;
  const isLowDPR   = DPR < 1.5 && W < 480;
  const isMob      = W <= 480, isTab = W > 480 && W <= 1024, isDesk = W > 1024;
  const cores      = navigator.hardwareConcurrency || 4;
  const isLowPow   = cores <= 2;

  let d = 'pc';
  if      (isIPhone || (isIOS && !isIPad))   { d = 'iphone'; }
  else if (isIPad)                            { d = (isLowPow || avr < 9) ? 'tablet-jadul' : 'tablet-ipad'; }
  else if (isAndroid && isTab)               { d = (isLowAnd || isLowPow) ? 'tablet-jadul' : 'tablet'; }
  else if (isTouch && isMob)                 { d = (isLowAnd || isLowDPR || isLowPow) ? 'hp-jadul' : 'hp'; }
  else if (isDesk)                           { d = (isMacOS || ('getBattery' in navigator)) ? 'laptop' : 'pc'; }
  else if (isTab && !isTouch)                { d = 'laptop'; }

  document.documentElement.classList.add('ads-' + d);

  const labels = {
    'iphone':'📱 iPhone','hp':'📱 HP','hp-jadul':'📱 HP Jadul',
    'tablet-ipad':'📲 iPad','tablet':'📲 Tablet','tablet-jadul':'📲 Tablet Jadul',
    'laptop':'💻 Laptop','pc':'🖥️ PC'
  };
  const isLite = d === 'hp-jadul' || d === 'tablet-jadul';
  return { device: d, isLite, label: labels[d] || d };
})();

document.getElementById('ads-badge').textContent = 'ADS · ' + ADS.label;
if (ADS.isLite) {
  const road = document.querySelector('.road');
  if (road) road.style.animation = 'none';
}
setTimeout(() => {
  const b = document.getElementById('ads-badge');
  if (b) b.style.opacity = '0';
}, 4000);

/* ──────────────────────────────────────────
   2. STATE
────────────────────────────────────────── */
let CFG      = null;
let LINKS    = null;
let allDecals = [];
let filtered  = [];

/* ──────────────────────────────────────────
   3. CONFIG LOADER
────────────────────────────────────────── */
async function loadConfig() {
  try {
    const r = await fetch('./config.json');
    if (!r.ok) throw new Error();
    CFG = await r.json();
  } catch(e) {
    console.warn('[ODI] config.json tidak ditemukan.');
  }
}

function applyConfig() {
  const ver = CFG?.site?.version || '1.0.0';
  const el = document.getElementById('nav-ver');
  if (el) el.textContent = 'v' + ver;

  // nav btn license
  const licCfg = CFG?.pages?.license;
  const btnLic = document.getElementById('nav-btn-license');
  if (btnLic && licCfg?.enabled === false) {
    btnLic.classList.add('dis');
  }

  // decals
  allDecals = CFG?.decals || [];
  filtered  = [...allDecals];

  renderFeed(filtered);
  updateFilterCounts();
  updateFeedCount();
}

/* ──────────────────────────────────────────
   4. LINKS LOADER
────────────────────────────────────────── */
async function loadLinks() {
  try {
    const r = await fetch('./link.json');
    if (!r.ok) throw new Error();
    LINKS = await r.json();
    renderLinks();
  } catch(e) {
    console.warn('[ODI] link.json tidak ditemukan.');
  }
}

function renderLinks() {
  const targets = ['links-widget-body', 'sheet-links-body'];
  targets.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !LINKS?.links) return;
    el.innerHTML = LINKS.links.map(link => `
      <a class="link-item" href="${link.url}" target="_blank" rel="noopener"
         style="--link-color:${link.color}">
        <div class="link-icon-wrap">
          <img src="${link.logo}" alt="${link.title}" onerror="this.style.display='none'"/>
        </div>
        <div class="link-info">
          <div class="link-title">${link.title}</div>
          <div class="link-desc">${link.description}</div>
        </div>
        <div class="link-badge" style="color:${link.color};border-color:${link.color}33;">
          ${link.badge}
        </div>
        <span class="link-ext">↗</span>
      </a>
    `).join('');
  });
}

/* ──────────────────────────────────────────
   5. FEED RENDERER
────────────────────────────────────────── */
function renderFeed(decals) {
  const list = document.getElementById('feed-list');
  if (!list) return;

  if (decals.length === 0) {
    list.innerHTML = `
      <div class="feed-empty">
        <div style="font-size:1.5rem;">📭</div>
        <div>${CFG?.id_page?.empty_message || 'Belum ada ID decal.'}</div>
      </div>`;
    return;
  }

  list.innerHTML = decals.map((d, i) => {
    const date = d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '';
    const hasPreview = d.preview && d.preview !== './assets/preview-placeholder.png';

    return `
    <article class="decal-card" data-index="${i}">
      <div class="card-thumb">
        ${hasPreview
          ? `<img src="${d.preview}" alt="${d.nama}" loading="lazy"/>`
          : `<div class="thumb-placeholder">${d.nama.charAt(0)}</div>`
        }
      </div>
      <div class="card-body">
        <div class="card-top">
          <span class="card-name">${d.nama}</span>
          <span class="card-dot">·</span>
          <span class="card-date">${date}</span>
        </div>
        <p class="card-desc">${d.deskripsi || ''}</p>
        <div class="card-id-row">
          <div class="card-id-chip" onclick="copyId(event,'${d.id}')" title="Klik untuk salin ID">
            <span>🏷</span>
            <span>${d.id}</span>
            <span class="chip-copy-icon">⎘</span>
          </div>
        </div>
        <div class="card-creator">
          ${d.discord ? `<div class="creator-badge"><span class="creator-platform">DC</span><span class="creator-name">${d.discord}</span></div>` : ''}
          ${d.roblox  ? `<div class="creator-badge"><span class="creator-platform">RBX</span><span class="creator-name">${d.roblox}</span></div>` : ''}
        </div>
        <div class="card-actions">
          ${buildActionBtn('like','♡','0')}
          ${buildActionBtn('comment','💬','0')}
          ${buildActionBtn('repost','🔁','0')}
          ${buildActionBtn('bookmark','🔖','')}
        </div>
      </div>
    </article>`;
  }).join('');
}

function buildActionBtn(type, icon, count) {
  const cfg = CFG?.id_page?.features?.[type];
  const isCS = cfg?.coming_soon === true;
  const msg  = cfg?.coming_soon_message || 'Segera hadir setelah pengumuman ODI.';
  if (isCS) {
    return `
      <button class="action-btn cs-btn" type="button">
        <span class="a-icon">${icon}</span>
        ${count ? `<span class="a-count">${count}</span>` : ''}
        <div class="cs-tooltip">${msg}</div>
      </button>`;
  }
  return `
    <button class="action-btn" type="button">
      <span class="a-icon">${icon}</span>
      ${count ? `<span class="a-count">${count}</span>` : ''}
    </button>`;
}

/* ──────────────────────────────────────────
   6. COPY SYSTEM
────────────────────────────────────────── */
let toastTimer;
async function copyId(e, id) {
  e.stopPropagation();
  try {
    await navigator.clipboard.writeText(id);
  } catch(_) {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = id; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  }

  // chip flash
  const chip = e.currentTarget;
  chip.classList.add('chip-copied');
  const icon = chip.querySelector('.chip-copy-icon');
  const orig = icon?.textContent;
  if (icon) icon.textContent = '✓';
  setTimeout(() => {
    chip.classList.remove('chip-copied');
    if (icon) icon.textContent = orig;
  }, 1500);

  // toast
  showToast(CFG?.id_page?.features?.copy_on_click?.toast_message || 'ID berhasil disalin!');
}

function showToast(msg) {
  const t = document.getElementById('copy-toast');
  if (!t) return;
  t.textContent = '✓ ' + msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ──────────────────────────────────────────
   7. SEARCH
────────────────────────────────────────── */
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    filtered = q
      ? allDecals.filter(d =>
          d.nama?.toLowerCase().includes(q) ||
          d.id?.includes(q) ||
          d.deskripsi?.toLowerCase().includes(q) ||
          d.discord?.toLowerCase().includes(q) ||
          d.roblox?.toLowerCase().includes(q)
        )
      : [...allDecals];
    renderFeed(filtered);
    updateFeedCount();
  });
}

/* ──────────────────────────────────────────
   8. FILTER
────────────────────────────────────────── */
function initFilters() {
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      const f = p.dataset.filter;
      if (f === 'all') {
        filtered = [...allDecals];
      } else {
        // bisa dikembangkan untuk filter kategori
        filtered = [...allDecals];
      }
      renderFeed(filtered);
      updateFeedCount();
      // clear search
      const si = document.getElementById('search-input');
      if (si) si.value = '';
    });
  });
}

function updateFilterCounts() {
  const allPill = document.querySelector('.filter-pill[data-filter="all"] .filter-count');
  if (allPill) allPill.textContent = allDecals.length;
  // stats sidebar
  const statId = document.getElementById('side-stat-id');
  const statCr = document.getElementById('side-stat-cr');
  if (statId) statId.textContent = allDecals.length;
  if (statCr) {
    const cr = [...new Set(allDecals.map(d => d.discord || d.roblox).filter(Boolean))].length;
    statCr.textContent = cr;
  }
}

function updateFeedCount() {
  const el = document.getElementById('feed-count');
  if (el) el.textContent = filtered.length + ' ID';
}

/* ──────────────────────────────────────────
   9. MOBILE BOTTOM SHEET
────────────────────────────────────────── */
function openSheet() {
  document.getElementById('sheet-overlay').classList.add('open');
  document.getElementById('mobile-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('mobile-sheet').classList.remove('open');
  document.body.style.overflow = '';
}

/* ──────────────────────────────────────────
   10. NAVIGATION
────────────────────────────────────────── */
function navTo(page) {
  const cfg = CFG?.pages?.[page];
  if (!cfg || cfg.enabled === false) return;
  const dur = CFG?.transitions?.duration_ms || 300;
  document.body.style.transition = `opacity ${dur}ms ease`;
  document.body.style.opacity = '0';
  setTimeout(() => { window.location.href = cfg.path; }, dur);
}

/* ──────────────────────────────────────────
   11. INIT
────────────────────────────────────────── */
document.body.style.opacity = '0';
document.body.style.transition = 'opacity .3s ease';

window.addEventListener('DOMContentLoaded', async () => {
  // show loading
  const feedList = document.getElementById('feed-list');
  if (feedList) feedList.innerHTML = '<div class="feed-loading"><div class="feed-spinner"></div>Memuat data...</div>';

  await Promise.all([loadConfig(), loadLinks()]);
  applyConfig();
  initSearch();
  initFilters();

  // overlay close
  const overlay = document.getElementById('sheet-overlay');
  if (overlay) overlay.addEventListener('click', closeSheet);

  // fade in
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });
});
