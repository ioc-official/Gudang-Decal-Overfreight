/* ═══════════════════════════════════════════
   ODI — app.js | Digunakan oleh: main.html
═══════════════════════════════════════════ */

/* ── 1. ADS ── */
const ADS = (() => {
  const ua = navigator.userAgent, W = window.innerWidth, DPR = window.devicePixelRatio || 1;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const isIOS = /iP(hone|od|ad)/i.test(ua), isAndroid = /Android/i.test(ua);
  const isMacOS = /Macintosh|Mac OS X/i.test(ua) && !isIOS;
  const isIPad = /iPad/i.test(ua) || (isMacOS && isTouch);
  const isIPhone = /iPhone/i.test(ua);
  const avr = (() => { const m = ua.match(/Android (\d+)/i); return m ? parseInt(m[1]) : 99; })();
  const isLowAnd = isAndroid && avr < 9, isLowDPR = DPR < 1.5 && W < 480;
  const isMob = W <= 480, isTab = W > 480 && W <= 1024, isDesk = W > 1024;
  const cores = navigator.hardwareConcurrency || 4, isLowPow = cores <= 2;
  let d = 'pc';
  if      (isIPhone || (isIOS && !isIPad)) d = 'iphone';
  else if (isIPad)                         d = (isLowPow || avr < 9) ? 'tablet-jadul' : 'tablet-ipad';
  else if (isAndroid && isTab)             d = (isLowAnd || isLowPow) ? 'tablet-jadul' : 'tablet';
  else if (isTouch && isMob)              d = (isLowAnd || isLowDPR || isLowPow) ? 'hp-jadul' : 'hp';
  else if (isDesk)                         d = (isMacOS || ('getBattery' in navigator)) ? 'laptop' : 'pc';
  else if (isTab && !isTouch)             d = 'laptop';
  document.documentElement.classList.add('ads-' + d);
  const labels = {
    'iphone':'📱 iPhone','hp':'📱 HP','hp-jadul':'📱 HP Jadul',
    'tablet-ipad':'📲 iPad','tablet':'📲 Tablet','tablet-jadul':'📲 Tablet Jadul',
    'laptop':'💻 Laptop','pc':'🖥️ PC'
  };
  return { device: d, isLite: d === 'hp-jadul' || d === 'tablet-jadul', label: labels[d] || d };
})();

const adsBadge = document.getElementById('ads-badge');
if (adsBadge) { adsBadge.textContent = 'ADS · ' + ADS.label; setTimeout(() => adsBadge.style.opacity = '0', 4000); }

/* ── 2. SOUND ── */
const SOUND = (() => {
  let on = localStorage.getItem('odi-sound') !== '0';

  function play(type) {
    if (!on) return;
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      const t = ac.currentTime;
      if (type === 'click') {
        o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.exponentialRampToValueAtTime(440, t + .08);
        g.gain.setValueAtTime(.1, t); g.gain.exponentialRampToValueAtTime(.001, t + .1);
        o.start(); o.stop(t + .1);
      } else if (type === 'copy') {
        o.type = 'sine'; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(880, t + .06);
        g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
        o.start(); o.stop(t + .12);
      } else if (type === 'nav') {
        o.type = 'sine'; o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(220, t + .15);
        g.gain.setValueAtTime(.07, t); g.gain.exponentialRampToValueAtTime(.001, t + .18);
        o.start(); o.stop(t + .18);
      } else if (type === 'expand') {
        o.type = 'triangle'; o.frequency.setValueAtTime(520, t);
        g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .08);
        o.start(); o.stop(t + .08);
      }
    } catch(e) {}
  }

  function toggle() {
    on = !on; localStorage.setItem('odi-sound', on ? '1' : '0');
    document.querySelectorAll('.snd-btn').forEach(b => b.textContent = on ? '🔊' : '🔇');
    if (on) play('click');
  }

  function initBtns() {
    document.querySelectorAll('.snd-btn').forEach(b => {
      b.textContent = on ? '🔊' : '🔇';
      b.onclick = toggle;
    });
  }

  return { play, toggle, initBtns };
})();

/* ── 3. INTRO ── */
function runIntro() {
  const screen = document.getElementById('intro-screen');
  if (!screen) return;
  if (sessionStorage.getItem('odi-intro')) { screen.style.display = 'none'; return; }
  const bar = document.getElementById('intro-bar');
  let p = 0;
  const iv = setInterval(() => {
    p += 2.2;
    if (bar) bar.style.width = Math.min(p, 100) + '%';
    if (p >= 100) {
      clearInterval(iv);
      setTimeout(() => {
        screen.classList.add('fade-out');
        setTimeout(() => { screen.style.display = 'none'; }, 650);
        sessionStorage.setItem('odi-intro', '1');
      }, 200);
    }
  }, 60);
}

/* ── 4. PAGE TRANSITION ── */
function navTo(page) {
  const cfg = CFG?.pages?.[page];
  if (!cfg || cfg.enabled === false) return;
  SOUND.play('nav');
  const ov = document.getElementById('page-overlay');
  if (ov) { ov.classList.add('fade-in'); setTimeout(() => window.location.href = cfg.path, 420); }
  else window.location.href = cfg.path;
}

window.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('page-overlay');
  if (ov) { ov.classList.add('fade-in'); requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.remove('fade-in'))); }
});

/* ── 5. STATE ── */
let CFG = null, LINKS = null, allDecals = [], filtered = [];

/* ── 6. CONFIG ── */
async function loadConfig() {
  try { const r = await fetch('./config.json'); if (!r.ok) throw 0; CFG = await r.json(); }
  catch(e) { console.warn('[ODI] config.json tidak ditemukan.'); }
}

function applyConfig() {
  const ver = CFG?.site?.version || '1.0.0';
  document.querySelectorAll('.nav-ver').forEach(el => el.textContent = 'v' + ver);

  // license btn
  const licOn = CFG?.pages?.license?.enabled;
  document.querySelectorAll('.nav-btn-license, .s-btn-license').forEach(btn => {
    if (licOn === false) btn.classList.add('dis'); else btn.classList.remove('dis');
  });

  // decals
  allDecals = CFG?.decals || [];
  filtered  = [...allDecals];

  const totalId = allDecals.length;
  const uniqueCr = new Set(
    allDecals.map(d => (d.discord || d.roblox || '').toLowerCase().trim()).filter(Boolean)
  ).size;

  document.querySelectorAll('.stat-id').forEach(el => el.textContent = totalId || '—');
  document.querySelectorAll('.stat-cr').forEach(el => el.textContent = uniqueCr || '—');

  const verEl = document.getElementById('side-ver-r');
  if (verEl) verEl.textContent = ver;

  renderFeed(filtered);
  updateCounts();
}

/* ── 7. LINKS ── */
async function loadLinks() {
  try { const r = await fetch('./link.json'); if (!r.ok) throw 0; LINKS = await r.json(); renderLinks(); }
  catch(e) { console.warn('[ODI] link.json tidak ditemukan.'); }
}

function renderLinks() {
  if (!LINKS?.links) return;
  const html = LINKS.links.map(l => `
    <a class="link-row" href="${l.url}" target="_blank" rel="noopener">
      <div class="link-ico"><img src="${l.logo}" alt="${l.title}" onerror="this.style.display='none'"/></div>
      <div class="link-info">
        <div class="link-ttl">${l.title}</div>
        <div class="link-dsc">${l.description}</div>
      </div>
      <div class="link-badge-pill" style="color:${l.color};border-color:${l.color}44;">${l.badge}</div>
      <span class="link-ext">↗</span>
    </a>`).join('');
  ['links-widget-body','sheet-links-body'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = html;
  });
}

/* ── 8. FEED ── */
function fakeN(seed) { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; return (h % 120) + 1; }

function buildAction(type, icon, seed) {
  const feat = CFG?.id_page?.features?.[type];
  const isCS = feat?.coming_soon === true;
  const msg  = feat?.coming_soon_message || 'Segera hadir setelah pengumuman ODI.';
  const n    = seed ? fakeN(seed + type) : '';
  if (isCS) return `<button class="act-btn cs" type="button"><span class="a-ico">${icon}</span>${n ? `<span class="a-num">${n}</span>` : ''}<div class="cs-tip">${msg}</div></button>`;
  return `<button class="act-btn" type="button"><span class="a-ico">${icon}</span>${n ? `<span class="a-num">${n}</span>` : ''}</button>`;
}

function renderFeed(decals) {
  const list = document.getElementById('feed-list');
  if (!list) return;
  if (!decals || decals.length === 0) {
    list.innerHTML = `<div class="feed-empty"><div>📭</div><div>${CFG?.id_page?.empty_message || 'Belum ada ID decal.'}</div></div>`;
    return;
  }
  list.innerHTML = decals.map((d, i) => {
    const date = d.tanggal ? new Date(d.tanggal).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '';
    const isLoko = (d.tier || '').toLowerCase().includes('loko');
    const tierCls = isLoko ? 'tier-loko' : 'tier-kereta';
    const tierLbl = d.tier || 'Kereta';
    const hasImg  = d.preview && !d.preview.includes('placeholder');
    const letter  = (d.roblox || d.discord || '?').charAt(0).toUpperCase();
    return `
    <article class="post-card" onclick="togglePost(this,event)">
      <div class="post-collapsed">
        <div class="post-avatar">${hasImg && d.avatar ? `<img src="${d.avatar}" alt="${d.roblox}"/>` : letter}</div>
        <div class="post-col-body">
          <div class="post-top">
            <span class="post-username">${d.roblox || d.discord || 'Unknown'}</span>
            ${d.discord ? `<span class="post-handle">@${d.discord.replace('@','')}</span>` : ''}
            <span class="post-dot">·</span>
            <span class="post-date">${date}</span>
            <span class="tier-badge ${tierCls}">${tierLbl}</span>
          </div>
          <div class="post-title">${d.nama}</div>
          <div class="post-preview-line">${d.deskripsi || ''}</div>
        </div>
        <span class="post-expand-ico">▾</span>
      </div>
      <div class="post-expanded">
        <div class="post-exp-inner">
          <div class="post-img">
            ${hasImg ? `<img src="${d.preview}" alt="${d.nama}" loading="lazy"/>` : `<div class="post-img-ph">NO PREVIEW</div>`}
          </div>
          <div style="margin-bottom:.7rem;">
            <div class="id-chip" onclick="copyId(event,'${d.id}')" title="Klik untuk salin">
              <span>🏷</span><span>${d.id}</span><span class="id-chip-ico">⎘</span>
            </div>
          </div>
          <p class="post-desc">${d.deskripsi || ''}</p>
          <div class="creator-row">
            ${d.discord ? `<div class="creator-chip"><span class="creator-plat">DC</span><span class="creator-name">${d.discord}</span></div>` : ''}
            ${d.roblox  ? `<div class="creator-chip"><span class="creator-plat">RBX</span><span class="creator-name">${d.roblox}</span></div>`  : ''}
          </div>
          <div class="post-actions">
            ${buildAction('like','♡',d.id)}
            ${buildAction('comment','💬',d.id)}
            ${buildAction('repost','🔁',d.id)}
            ${buildAction('bookmark','🔖','')}
          </div>
        </div>
      </div>
    </article>`;
  }).join('');
}

/* ── 9. TOGGLE POST ── */
function togglePost(card, e) {
  if (e.target.closest('.id-chip') || e.target.closest('.act-btn')) return;
  const wasOpen = card.classList.contains('open');
  document.querySelectorAll('.post-card.open').forEach(c => c.classList.remove('open'));
  if (!wasOpen) { card.classList.add('open'); SOUND.play('expand'); }
}

/* ── 10. COPY ── */
let toastT;
async function copyId(e, id) {
  e.stopPropagation();
  try { await navigator.clipboard.writeText(id); }
  catch(_) {
    const ta = document.createElement('textarea');
    ta.value = id; ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }
  const chip = e.currentTarget;
  const ico  = chip.querySelector('.id-chip-ico');
  const orig = ico?.textContent;
  chip.classList.add('copied'); if (ico) ico.textContent = '✓';
  setTimeout(() => { chip.classList.remove('copied'); if (ico) ico.textContent = orig; }, 1600);
  SOUND.play('copy');
  const msg = CFG?.id_page?.features?.copy_on_click?.toast_message || 'ID berhasil disalin!';
  const t = document.getElementById('copy-toast');
  if (!t) return;
  t.textContent = '✓ ' + msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── 11. SEARCH ── */
function initSearch() {
  const inp = document.getElementById('search-input');
  if (!inp) return;
  inp.addEventListener('input', () => {
    SOUND.play('click');
    const q = inp.value.toLowerCase().trim();
    filtered = q
      ? allDecals.filter(d =>
          (d.nama||'').toLowerCase().includes(q) ||
          (d.id||'').includes(q) ||
          (d.deskripsi||'').toLowerCase().includes(q) ||
          (d.discord||'').toLowerCase().includes(q) ||
          (d.roblox||'').toLowerCase().includes(q) ||
          (d.tier||'').toLowerCase().includes(q))
      : [...allDecals];
    renderFeed(filtered);
    updateFeedCount();
  });
}

/* ── 12. FILTER ── */
function initFilters() {
  document.querySelectorAll('.fpill').forEach(p => {
    p.addEventListener('click', () => {
      SOUND.play('click');
      document.querySelectorAll('.fpill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      const f = p.dataset.filter || 'all';
      filtered = f === 'all' ? [...allDecals]
        : f === 'lokomotif' ? allDecals.filter(d => (d.tier||'').toLowerCase().includes('loko'))
        : allDecals.filter(d => !(d.tier||'').toLowerCase().includes('loko'));
      renderFeed(filtered); updateFeedCount();
      const si = document.getElementById('search-input'); if (si) si.value = '';
    });
  });
}

function updateCounts() {
  const total = allDecals.length;
  const loko  = allDecals.filter(d => (d.tier||'').toLowerCase().includes('loko')).length;
  const kereta = total - loko;
  const allPill   = document.querySelector('.fpill[data-filter="all"] .fpill-count');
  const keretaPill = document.querySelector('.fpill[data-filter="kereta"] .fpill-count');
  const lokoPill   = document.querySelector('.fpill[data-filter="lokomotif"] .fpill-count');
  if (allPill) allPill.textContent = total;
  if (keretaPill) keretaPill.textContent = kereta;
  if (lokoPill) lokoPill.textContent = loko;
  updateFeedCount();
}

function updateFeedCount() {
  const el = document.getElementById('feed-count'); if (el) el.textContent = filtered.length + ' ID';
}

/* ── 13. MOBILE SHEET ── */
function openSheet()  { SOUND.play('click'); document.getElementById('mob-overlay')?.classList.add('open'); document.getElementById('mob-sheet')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeSheet() { document.getElementById('mob-overlay')?.classList.remove('open'); document.getElementById('mob-sheet')?.classList.remove('open'); document.body.style.overflow = ''; }

/* ── 14. INIT ── */
window.addEventListener('DOMContentLoaded', async () => {
  runIntro();
  const fl = document.getElementById('feed-list');
  if (fl) fl.innerHTML = '<div class="feed-loading"><div class="feed-spin"></div>Memuat data...</div>';
  await Promise.all([loadConfig(), loadLinks()]);
  applyConfig();
  initSearch();
  initFilters();
  SOUND.initBtns();
  const ov = document.getElementById('mob-overlay');
  if (ov) ov.addEventListener('click', closeSheet);
  document.querySelectorAll('.s-btn').forEach(b => b.addEventListener('click', () => SOUND.play('click')));
});
