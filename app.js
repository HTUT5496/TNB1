/* ══════════════════════════════════════════════════════
   WRENCH — app.js
   Full application logic with Supabase integration
══════════════════════════════════════════════════════ */

'use strict';

/* ── SUPABASE INIT ────────────────────────────────────────────────────────── */
const { createClient } = supabase;
const sb = createClient(
  'https://pmlfgokdjjsxyckojahh.supabase.co',
  'sb_publishable_15j0DLBv2mjt4JMCKvbcfg_tB341vmV'
);

/* ── CONSTANTS ───────────────────────────────────────────────────────────── */
const BRANDS = ['Toyota','Nissan','Honda','BMW','Mercedes','Ford','Hyundai','Kia','Other'];
const BRAND_FLAG = { Toyota:'🇯🇵', Nissan:'🇯🇵', Honda:'🇯🇵', BMW:'🇩🇪', Mercedes:'🇩🇪', Ford:'🇺🇸', Hyundai:'🇰🇷', Kia:'🇰🇷', Other:'🚗' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const REMINDER_META = {
  oil_change:    { emoji:'🛢️', label:'Oil Change' },
  tire_rotation: { emoji:'🔄', label:'Tire Rotation' },
  engine_check:  { emoji:'🔧', label:'Engine Check' },
  brake_check:   { emoji:'🛑', label:'Brake Check' },
  air_filter:    { emoji:'💨', label:'Air Filter' },
  other:         { emoji:'⚙️', label:'Other' },
};

const AI_KNOWLEDGE = {
  engine:  'Based on your description, this sounds like an **engine issue**. Possible causes include worn spark plugs, a faulty ignition coil, clogged fuel injectors, or a failing MAF sensor. I recommend getting an OBD-II diagnostic scan — most workshops do this free or for RM 30–50. Avoid prolonged driving until checked.',
  brake:   '🛑 **Brake issues are safety-critical** — do not delay! Your symptoms suggest worn brake pads (< 3mm), warped rotors, or a brake fluid leak. Pull over safely if you hear grinding. Get this inspected immediately. Emergency shops near you are available 24/7.',
  battery: 'Your car battery may be failing. A healthy battery reads 12.6V at rest; below 12.2V means it needs replacement. The alternator (should output 13.7–14.7V while running) may also be at fault. Most workshops offer free battery testing. Battery replacement typically costs RM 150–350.',
  ac:      'AC not cooling? Top causes: low refrigerant (regas costs RM 80–150), compressor failure, or a clogged condenser. If you hear a clicking noise when you turn on AC, the compressor clutch may be failing. Book an AC specialist near you.',
  oil:     'An oil leak can come from a valve cover gasket, oil pan gasket, or rear main seal. Check the oil color on the ground: black = engine oil, red/brown = transmission fluid, green/orange = coolant. Top up oil immediately to avoid engine damage and book a service ASAP.',
  tire:    'Tyre problems could include a puncture, sidewall damage, or uneven wear from wheel misalignment. Check tyre pressure first (typical: 30–35 PSI). If flat, use your spare or request a tow. Wheel alignment service costs RM 60–120.',
  default: 'Thanks for the description. Without seeing the car directly, this could involve multiple systems. I recommend visiting a certified mechanic for a full diagnostic scan. Based on your location I can help you find the nearest verified workshop that handles this type of issue.',
};

const AI_PROBLEMS = [
  { emoji:'🔧', label:'Engine',   key:'engine'  },
  { emoji:'🛑', label:'Brakes',   key:'brake'   },
  { emoji:'🔋', label:'Battery',  key:'battery' },
  { emoji:'❄️', label:'AC',       key:'ac'      },
  { emoji:'🛢️', label:'Oil Leak', key:'oil'     },
  { emoji:'🔴', label:'Tyres',    key:'tire'    },
];

/* ── APP STATE ────────────────────────────────────────────────────────────── */
const S = {
  user:          null,
  profile:       null,
  currentShopId: null,
  bookingShopId: null,
  bookingShopName: null,
  selectedDate:  null,
  selectedSlot:  null,
  selectedBrand: null,
  favorites:     new Set(),
  cancelTargetId: null,
  reviewTargetId: null,
  pageHistory:   [],
};

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
═══════════════════════════════════════════════════════════════════════════ */

/** Show a toast notification */
function toast(msg, type = 'info', ms = 3500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toastStack').appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** Show/hide loading state on a button */
function btnLoading(id, on) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (on) {
    btn.disabled = true;
    btn._orig = btn.innerHTML;
    btn.innerHTML = '<span class="spin"></span>';
  } else {
    btn.disabled = false;
    if (btn._orig) btn.innerHTML = btn._orig;
  }
}

/** Show/hide an error banner */
function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideErr(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/** Open / close modal overlay */
function openModal(id) {
  document.getElementById('modalOverlay').classList.add('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

/** Format ISO date string to human-readable */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
}
function fmtDist(metres) {
  if (!metres) return '';
  return metres < 1000 ? `${Math.round(metres)}m` : `${(metres / 1000).toFixed(1)} km`;
}

/** Build star HTML */
function stars(rating, max = 5) {
  let h = '';
  for (let i = 1; i <= max; i++)
    h += `<span class="rv-star${i > rating ? ' empty' : ''}">★</span>`;
  return `<div class="rv-stars">${h}</div>`;
}

/** Status badge HTML */
function statusBadge(status) {
  return `<span class="status-badge status-${status}">${status.replace(/_/g,' ')}</span>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE ROUTING
═══════════════════════════════════════════════════════════════════════════ */

/** Switch between pre-auth pages (splash / login / signup) */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const p = document.getElementById(`pg-${name}`);
  if (p) p.classList.add('active');
}

/** Switch between app inner pages */
function goTo(name) {
  document.querySelectorAll('.ap').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  const el = document.getElementById(`ap-${name}`);
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add('active');

  // History stack (skip duplicate)
  if (S.pageHistory[S.pageHistory.length - 1] !== name) {
    S.pageHistory.push(name);
  }

  // Update top nav active state
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const navLink = document.querySelector(`.nav-link[data-nav="${name}"]`);
  if (navLink) navLink.classList.add('active');

  // Update bottom nav
  document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('active'));
  const bItem = document.querySelector(`.bnav-item[data-nav="${name}"]`);
  if (bItem) bItem.classList.add('active');

  // Lazy-load data for pages
  const loaders = {
    home:         loadHomeShops,
    shops:        () => loadShopsPage(S.selectedBrand),
    brands:       renderBrandGrid,
    favorites:    loadFavorites,
    appointments: loadAppointments,
    reminders:    loadReminders,
    dashboard:    loadDashboard,
  };
  if (loaders[name]) loaders[name]();
}

function goBack() {
  S.pageHistory.pop();
  const prev = S.pageHistory[S.pageHistory.length - 1] || 'home';
  S.pageHistory.pop(); // goTo will re-push it
  goTo(prev);
}

/* ═══════════════════════════════════════════════════════════════════════════
   AUTHENTICATION
═══════════════════════════════════════════════════════════════════════════ */

async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  if (!email || !pass) { showErr('loginErr', 'Please fill in all fields.'); return; }
  hideErr('loginErr');
  btnLoading('loginBtn', true);
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    await bootstrapUser(data.user);
  } catch (e) {
    showErr('loginErr', e.message || 'Sign in failed. Check your credentials.');
  } finally {
    btnLoading('loginBtn', false);
  }
}

async function handleSignup() {
  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const pass  = document.getElementById('signupPassword').value;
  if (!name || !email || !pass) { showErr('signupErr', 'Please fill in all required fields.'); return; }
  if (pass.length < 8) { showErr('signupErr', 'Password must be at least 8 characters.'); return; }
  hideErr('signupErr');
  btnLoading('signupBtn', true);
  try {
    const { error } = await sb.auth.signUp({
      email, password: pass,
      options: { data: { full_name: name, phone } }
    });
    if (error) throw error;
    toast('Account created! Check your email to verify.', 'success', 5000);
    showPage('login');
  } catch (e) {
    showErr('signupErr', e.message || 'Sign up failed. Please try again.');
  } finally {
    btnLoading('signupBtn', false);
  }
}

async function handleLogout() {
  await sb.auth.signOut();
  S.user = null; S.profile = null; S.favorites.clear();
  document.getElementById('app').classList.add('hidden');
  showPage('login');
  toast('Signed out.');
}

/** Runs after successful auth to boot the app */
async function bootstrapUser(user) {
  S.user = user;

  // Load profile row
  const { data } = await sb.from('users').select('*').eq('id', user.id).maybeSingle();
  S.profile = data;

  const displayName = data?.full_name || user.email.split('@')[0];
  const initial     = displayName.charAt(0).toUpperCase();

  // Update UI with user info
  document.getElementById('navAvatar').textContent        = initial;
  document.getElementById('navName').textContent          = displayName.split(' ')[0];
  document.getElementById('profileAvatarLg').textContent  = initial;
  document.getElementById('profileName').textContent      = displayName;
  document.getElementById('profileEmail').textContent     = user.email;

  // Load favorites set
  const { data: favs } = await sb.from('favorites').select('shop_id').eq('user_id', user.id);
  S.favorites = new Set((favs || []).map(f => f.shop_id));

  // Populate brand dropdowns (booking, tow)
  populateBrandDropdowns();

  // Show app
  document.getElementById('app').classList.remove('hidden');
  showPage('app');
  goTo('home');
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOPS — HOME PREVIEW
═══════════════════════════════════════════════════════════════════════════ */

async function loadHomeShops() {
  const grid = document.getElementById('homeShops');
  grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

  try {
    const { data, error } = await sb.rpc('find_nearby_shops', {
      p_lat: 3.1390, p_lng: 101.6869, p_radius_m: 20000
    });
    if (error) throw error;
    grid.innerHTML = '';
    (data || []).slice(0, 6).forEach(shop => grid.appendChild(buildShopCard(shop)));
    if (!data?.length) grid.innerHTML = emptyState('🔧', 'No shops found nearby', 'Try expanding your search radius.');
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--red);padding:16px">${e.message}</p>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOPS — LIST PAGE
═══════════════════════════════════════════════════════════════════════════ */

async function loadShopsPage(brand = null) {
  const grid  = document.getElementById('shopsList');
  const title = document.getElementById('shopsPageTitle');
  const count = document.getElementById('shopsCount');
  grid.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';

  try {
    let q = sb.from('repair_shops').select(`
      *,
      supported_brands(car_brands(name)),
      shop_photos(url,is_primary)
    `).eq('status', 'active').order('avg_rating', { ascending: false });

    if (brand) {
      // Filter through junction table
      const { data: cbData } = await sb.from('car_brands').select('id').eq('name', brand).maybeSingle();
      if (cbData) {
        const { data: sbData } = await sb.from('supported_brands').select('shop_id').eq('brand_id', cbData.id);
        const ids = (sbData || []).map(s => s.shop_id);
        if (ids.length) q = q.in('id', ids);
        else { grid.innerHTML = emptyState('🔧','No shops found','No shops support this brand yet.'); return; }
      }
    }

    const search = document.getElementById('shopsSearchInput')?.value.trim();
    if (search) q = q.ilike('name', `%${search}%`);

    const { data, error } = await q.limit(60);
    if (error) throw error;

    title.textContent = brand ? `${brand} SHOPS` : 'ALL SHOPS';
    count.textContent = `${data?.length || 0} found`;
    grid.innerHTML = '';
    if (!data?.length) { grid.innerHTML = emptyState('🔧', 'No shops found', 'Try a different filter or search.'); return; }
    data.forEach(shop => grid.appendChild(buildShopCard(shop)));
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--red);padding:16px">${e.message}</p>`;
  }
}

/** Build a shop card DOM element */
function buildShopCard(shop) {
  const photo  = shop.shop_photos?.find(p => p.is_primary)?.url || shop.shop_photos?.[0]?.url;
  const brands = (shop.supported_brands || []).map(b => b.car_brands?.name).filter(Boolean);
  const isFav  = S.favorites.has(shop.id);
  const dist   = fmtDist(shop.distance_meters);

  const card = document.createElement('div');
  card.className = 'shop-card';
  card.innerHTML = `
    <div class="shop-card-img">
      ${photo ? `<img src="${photo}" alt="${escHtml(shop.name)}" loading="lazy" />` : `<div class="img-ph">🔧</div>`}
      ${shop.is_emergency_available ? `<div class="card-emergency">🚨 EMERGENCY</div>` : ''}
      <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${shop.id}">${isFav ? '❤️' : '🤍'}</button>
    </div>
    <div class="shop-card-body">
      <div class="shop-card-name">${escHtml(shop.name)}</div>
      <div class="shop-card-addr">${escHtml(shop.address || shop.city || '—')}</div>
      <div class="shop-card-meta">
        <div class="shop-rating">★ ${(+shop.avg_rating || 0).toFixed(1)}</div>
        ${dist ? `<div class="shop-dist">📍 ${dist}</div>` : ''}
        <div class="shop-reviews">${shop.total_reviews || 0} reviews</div>
      </div>
      ${brands.length ? `<div class="shop-brands">${brands.slice(0,3).map(b => `<span class="brand-tag">${b}</span>`).join('')}${brands.length > 3 ? `<span class="brand-tag">+${brands.length-3}</span>` : ''}</div>` : ''}
    </div>`;

  // Click body → open detail
  card.querySelector('.shop-card-body').addEventListener('click', () => openShopDetail(shop.id));
  card.querySelector('.shop-card-img .img-ph, .shop-card-img img')?.parentElement?.addEventListener('click', e => {
    if (!e.target.closest('.card-fav-btn')) openShopDetail(shop.id);
  });

  // Fav button
  card.querySelector('.card-fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleFav(shop.id, e.currentTarget);
  });

  return card;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Empty state HTML helper */
function emptyState(icon, title, sub) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHOP DETAIL
═══════════════════════════════════════════════════════════════════════════ */

async function openShopDetail(shopId) {
  S.currentShopId = shopId;
  goTo('shop-detail');

  const body = document.getElementById('detailBody');
  body.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

  // Reset fav button
  const favBtn = document.getElementById('detailFavBtn');
  favBtn.textContent = S.favorites.has(shopId) ? '❤️' : '🤍';

  try {
    const [shopRes, reviewRes] = await Promise.all([
      sb.from('repair_shops').select(`
        *, services(*), shop_photos(*),
        supported_brands(car_brands(name)),
        opening_hours(*)
      `).eq('id', shopId).single(),
      sb.from('reviews').select('*, users(full_name)')
        .eq('shop_id', shopId).eq('is_visible', true)
        .order('created_at', { ascending: false }).limit(6)
    ]);

    if (shopRes.error) throw shopRes.error;
    const shop    = shopRes.data;
    const reviews = reviewRes.data || [];

    // Update hero image
    const heroEl = document.getElementById('detailHero');
    const photo  = shop.shop_photos?.find(p => p.is_primary) || shop.shop_photos?.[0];
    if (photo) {
      heroEl.innerHTML = `
        <img src="${photo.url}" alt="${escHtml(shop.name)}" style="width:100%;height:100%;object-fit:cover"/>
        <button class="float-back" id="detailBack">←</button>
        <button class="float-fav" id="detailFavBtn">${S.favorites.has(shopId) ? '❤️' : '🤍'}</button>`;
      document.getElementById('detailBack').addEventListener('click', goBack);
      document.getElementById('detailFavBtn').addEventListener('click', () => toggleFavDetail());
    }

    const brands = (shop.supported_brands || []).map(b => b.car_brands?.name).filter(Boolean);

    body.innerHTML = `
      <div style="max-width:860px;margin:0 auto">
        <div class="detail-shop-head">
          <div>
            <div class="detail-shop-name">${escHtml(shop.name)}</div>
            <div class="detail-shop-addr">${escHtml(shop.address)}</div>
            ${shop.is_emergency_available ? `<span class="status-badge" style="background:var(--red-dim);color:var(--red);margin-top:8px;display:inline-flex">🚨 Emergency 24/7</span>` : ''}
          </div>
          <div class="detail-rating-box">
            <div class="detail-rating-num">★ ${(+shop.avg_rating||0).toFixed(1)}</div>
            <div class="detail-review-count">${shop.total_reviews||0} reviews</div>
          </div>
        </div>

        <div class="detail-action-row">
          <div class="detail-action" id="callBtn">
            <div class="da-icon">📞</div><div class="da-label">Call Shop</div>
          </div>
          <div class="detail-action" id="directionsBtn">
            <div class="da-icon">🗺️</div><div class="da-label">Directions</div>
          </div>
          <div class="detail-action" id="bookFromDetailBtn">
            <div class="da-icon">📅</div><div class="da-label">Book Now</div>
          </div>
        </div>

        ${brands.length ? `
        <div class="detail-section">
          <div class="detail-sec-title">SUPPORTED BRANDS</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            ${brands.map(b => `<span class="brand-tag">${BRAND_FLAG[b]||'🚗'} ${b}</span>`).join('')}
          </div>
        </div>` : ''}

        ${shop.services?.length ? `
        <div class="detail-section">
          <div class="detail-sec-title">SERVICES</div>
          ${shop.services.map(s => `
            <div class="service-row">
              <div>
                <div class="srv-name">${escHtml(s.name)}</div>
                <div class="srv-meta">${s.category || ''}${s.duration_minutes ? ' · ' + s.duration_minutes + ' min' : ''}</div>
              </div>
              <div class="srv-price">${s.price_min ? 'RM ' + Math.round(+s.price_min) + (s.price_max ? '–' + Math.round(+s.price_max) : '+') : '—'}</div>
            </div>`).join('')}
        </div>` : ''}

        <div class="detail-section">
          <div class="detail-sec-title">
            REVIEWS
            <button class="btn btn-outline btn-sm" id="writeReviewBtn">Write Review</button>
          </div>
          ${reviews.length ? reviews.map(r => `
            <div class="review-card">
              <div class="rv-head">
                <div class="rv-avatar">${(r.users?.full_name||'?').charAt(0).toUpperCase()}</div>
                <div>
                  <div class="rv-name">${escHtml(r.users?.full_name || 'Anonymous')}</div>
                  <div style="display:flex;gap:8px;align-items:center">
                    ${stars(r.rating)}
                    <span class="rv-date">${fmtDate(r.created_at)}</span>
                  </div>
                </div>
              </div>
              ${r.comment ? `<div class="rv-text">${escHtml(r.comment)}</div>` : ''}
              ${r.owner_reply ? `<div class="rv-reply"><div class="rv-reply-lbl">Owner Response</div><div class="rv-reply-text">${escHtml(r.owner_reply)}</div></div>` : ''}
            </div>`).join('')
          : `<p style="color:var(--muted);font-size:.9rem">No reviews yet. Be the first!</p>`}
        </div>

        <div class="detail-book-bar">
          <button class="btn btn-primary btn-block btn-lg" id="detailBookBtn">📅 BOOK APPOINTMENT</button>
        </div>
      </div>`;

    // Wire up action buttons
    document.getElementById('callBtn').addEventListener('click', () => {
      if (shop.phone) window.location.href = `tel:${shop.phone}`;
      else toast('Phone number not available', 'warning');
    });
    document.getElementById('directionsBtn').addEventListener('click', () => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`, '_blank');
    });
    document.getElementById('bookFromDetailBtn').addEventListener('click', () => startBooking(shop.id, shop.name));
    document.getElementById('detailBookBtn').addEventListener('click',     () => startBooking(shop.id, shop.name));
    document.getElementById('writeReviewBtn').addEventListener('click',    () => openReviewModal(shopId));

  } catch (e) {
    body.innerHTML = `<p style="color:var(--red);padding:24px">${e.message}</p>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAVORITES
═══════════════════════════════════════════════════════════════════════════ */

async function toggleFav(shopId, btn) {
  if (!S.user) { toast('Sign in to save shops', 'warning'); return; }
  const isFav = S.favorites.has(shopId);
  try {
    if (isFav) {
      await sb.from('favorites').delete().eq('user_id', S.user.id).eq('shop_id', shopId);
      S.favorites.delete(shopId);
      btn.textContent = '🤍';
      btn.classList.remove('active');
      toast('Removed from saved shops.');
    } else {
      await sb.from('favorites').upsert({ user_id: S.user.id, shop_id: shopId }, { onConflict: 'user_id,shop_id' });
      S.favorites.add(shopId);
      btn.textContent = '❤️';
      btn.classList.add('active');
      toast('Shop saved! ❤️', 'success');
    }
  } catch (e) { toast(e.message, 'error'); }
}

function toggleFavDetail() {
  const btn = document.getElementById('detailFavBtn');
  if (btn) toggleFav(S.currentShopId, btn);
}

async function loadFavorites() {
  const el = document.getElementById('favList');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  try {
    const { data, error } = await sb.from('favorites')
      .select('shop_id, repair_shops(*, shop_photos(url,is_primary))')
      .eq('user_id', S.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    el.innerHTML = '';
    if (!data?.length) {
      el.innerHTML = emptyState('❤️', 'No saved shops', 'Tap the heart icon on any shop to save it here.');
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    data.forEach(f => { if (f.repair_shops) grid.appendChild(buildShopCard(f.repair_shops)); });
    el.appendChild(grid);
  } catch (e) {
    el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   BRAND GRID
═══════════════════════════════════════════════════════════════════════════ */

function renderBrandGrid() {
  const grid = document.getElementById('brandGrid');
  if (grid.children.length) return; // already rendered
  BRANDS.forEach(brand => {
    const card = document.createElement('div');
    card.className = 'brand-card' + (S.selectedBrand === brand ? ' selected' : '');
    card.innerHTML = `<div class="brand-emoji">${BRAND_FLAG[brand]||'🚗'}</div><div class="brand-name">${brand}</div>`;
    card.addEventListener('click', () => {
      document.querySelectorAll('.brand-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      S.selectedBrand = brand;
      goTo('shops');
    });
    grid.appendChild(card);
  });

  // Build filter chips on shops page too
  const bar = document.getElementById('brandFilters');
  if (bar && !bar.children.length) {
    const allChip = document.createElement('span');
    allChip.className = 'chip' + (!S.selectedBrand ? ' active' : '');
    allChip.textContent = 'ALL';
    allChip.addEventListener('click', () => {
      setActiveChip(allChip);
      S.selectedBrand = null;
      loadShopsPage(null);
    });
    bar.appendChild(allChip);

    BRANDS.forEach(b => {
      const chip = document.createElement('span');
      chip.className = 'chip' + (S.selectedBrand === b ? ' active' : '');
      chip.textContent = b;
      chip.addEventListener('click', () => {
        setActiveChip(chip);
        S.selectedBrand = b;
        loadShopsPage(b);
      });
      bar.appendChild(chip);
    });
  }
}

function setActiveChip(active) {
  document.querySelectorAll('#brandFilters .chip').forEach(c => c.classList.remove('active'));
  active.classList.add('active');
}

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKING
═══════════════════════════════════════════════════════════════════════════ */

function startBooking(shopId, shopName) {
  S.bookingShopId   = shopId;
  S.bookingShopName = shopName;
  S.selectedDate    = null;
  S.selectedSlot    = null;

  document.getElementById('bookingShopName').textContent = shopName;
  loadBookingServices(shopId);
  buildDateRail();
  document.getElementById('slotGrid').innerHTML = '<span class="slot-hint">Select a date first</span>';
  goTo('booking');
}

async function loadBookingServices(shopId) {
  const sel = document.getElementById('bookingService');
  sel.innerHTML = '<option value="">Loading…</option>';
  const { data } = await sb.from('services').select('*').eq('shop_id', shopId).eq('is_available', true);
  sel.innerHTML = '<option value="">Select a service…</option>';
  (data || []).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name}${s.price_min ? ' — RM ' + Math.round(+s.price_min) : ''}`;
    sel.appendChild(opt);
  });
}

function buildDateRail() {
  const rail = document.getElementById('dateRail');
  rail.innerHTML = '';
  for (let i = 1; i <= 14; i++) {
    const d    = new Date();
    d.setDate(d.getDate() + i);
    const chip = document.createElement('div');
    chip.className = 'date-chip';
    chip.innerHTML = `<div class="dc-day">${DAYS[d.getDay()]}</div><div class="dc-num">${d.getDate()}</div>`;
    chip.addEventListener('click', () => {
      rail.querySelectorAll('.date-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      S.selectedDate = d;
      S.selectedSlot = null;
      loadSlots(S.bookingShopId, d);
    });
    rail.appendChild(chip);
  }
}

async function loadSlots(shopId, date) {
  const grid = document.getElementById('slotGrid');
  grid.innerHTML = '<span class="slot-hint">Loading…</span>';
  try {
    const ymd = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const { data, error } = await sb.rpc('get_shop_available_slots', { p_shop_id: shopId, p_date: ymd });
    grid.innerHTML = '';
    if (error || !data?.length) {
      grid.innerHTML = '<span class="slot-hint">No available slots for this date.</span>';
      return;
    }
    data.forEach(slot => {
      const t   = new Date(slot.slot_start);
      const btn = document.createElement('div');
      btn.className = 'slot-btn';
      btn.textContent = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        S.selectedSlot = slot.slot_start;
      });
      grid.appendChild(btn);
    });
  } catch (e) {
    grid.innerHTML = `<span style="color:var(--red)">${e.message}</span>`;
  }
}

async function confirmBooking() {
  if (!S.selectedSlot) { toast('Please select a time slot', 'warning'); return; }
  const serviceId = document.getElementById('bookingService').value;
  const brand     = document.getElementById('bookingBrand').value;
  const model     = document.getElementById('bookingModel').value.trim();
  const plate     = document.getElementById('bookingPlate').value.trim();
  const notes     = document.getElementById('bookingNotes').value.trim();

  btnLoading('confirmBookingBtn', true);
  try {
    const { error } = await sb.from('appointments').insert({
      user_id:      S.user.id,
      shop_id:      S.bookingShopId,
      scheduled_at: S.selectedSlot,
      service_id:   serviceId || null,
      car_brand:    brand || null,
      car_model:    model || null,
      car_plate:    plate || null,
      notes:        notes || null,
    });
    if (error) throw error;
    toast('Booking confirmed! ✅', 'success');
    goTo('appointments');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btnLoading('confirmBookingBtn', false);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPOINTMENTS
═══════════════════════════════════════════════════════════════════════════ */

async function loadAppointments() {
  const el = document.getElementById('apptList');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  try {
    const { data, error } = await sb.from('appointments')
      .select('*, repair_shops(name, address), services(name)')
      .eq('user_id', S.user.id)
      .order('scheduled_at', { ascending: false });
    if (error) throw error;

    el.innerHTML = '';
    if (!data?.length) {
      el.innerHTML = emptyState('📅', 'No bookings yet', 'Find a repair shop and book your first appointment.');
      return;
    }

    data.forEach(a => {
      const card = document.createElement('div');
      card.className = 'appt-card';
      card.innerHTML = `
        <div class="appt-card-top">
          <div>
            <div class="appt-shop-name">${escHtml(a.repair_shops?.name || '—')}</div>
            <div class="appt-addr">${escHtml(a.repair_shops?.address || '')}</div>
          </div>
          ${statusBadge(a.status)}
        </div>
        <div class="appt-meta">
          <div class="appt-meta-item">📅 ${fmtDate(a.scheduled_at)}</div>
          <div class="appt-meta-item">🕐 ${fmtTime(a.scheduled_at)}</div>
          ${a.services?.name ? `<div class="appt-meta-item">🔧 ${escHtml(a.services.name)}</div>` : ''}
          ${a.car_brand ? `<div class="appt-meta-item">🚗 ${escHtml(a.car_brand)}${a.car_model ? ' ' + escHtml(a.car_model) : ''}</div>` : ''}
        </div>
        ${a.status === 'pending' ? `<div class="appt-actions"><button class="btn btn-ghost btn-sm" style="color:var(--red)" data-appt-id="${a.id}">Cancel Booking</button></div>` : ''}`;

      const cancelBtn = card.querySelector('[data-appt-id]');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          S.cancelTargetId = a.id;
          openModal('modalConfirm');
        });
      }
      el.appendChild(card);
    });
  } catch (e) {
    el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`;
  }
}

async function executeCancelBooking() {
  if (!S.cancelTargetId) return;
  const { error } = await sb.from('appointments')
    .update({ status: 'cancelled', cancelled_by: S.user.id })
    .eq('id', S.cancelTargetId);
  closeModal();
  S.cancelTargetId = null;
  if (error) { toast(error.message, 'error'); return; }
  toast('Booking cancelled.');
  loadAppointments();
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS
═══════════════════════════════════════════════════════════════════════════ */

function openReviewModal(shopId) {
  S.reviewTargetId = shopId;
  document.getElementById('reviewRating').value = '0';
  document.getElementById('reviewComment').value = '';
  document.querySelectorAll('#starPicker span').forEach(s => s.classList.remove('lit'));
  openModal('modalReview');
}

async function submitReview() {
  const rating  = parseInt(document.getElementById('reviewRating').value, 10);
  const comment = document.getElementById('reviewComment').value.trim();
  if (!rating) { toast('Please select a star rating', 'warning'); return; }

  btnLoading('submitReviewBtn', true);
  try {
    const { error } = await sb.from('reviews').insert({
      shop_id: S.reviewTargetId,
      user_id: S.user.id,
      rating,
      comment: comment || null,
    });
    if (error) throw error;
    closeModal();
    toast('Review submitted! ⭐', 'success');
    // Refresh detail if on that shop
    if (S.currentShopId === S.reviewTargetId) openShopDetail(S.currentShopId);
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btnLoading('submitReviewBtn', false);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   REMINDERS
═══════════════════════════════════════════════════════════════════════════ */

async function loadReminders() {
  const el = document.getElementById('reminderList');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  try {
    const { data, error } = await sb.from('maintenance_reminders')
      .select('*').eq('user_id', S.user.id).eq('is_completed', false)
      .order('due_date', { ascending: true });
    if (error) throw error;

    el.innerHTML = '';
    if (!data?.length) {
      el.innerHTML = emptyState('🔔', 'No reminders set', 'Add a reminder to track your maintenance schedule.');
      return;
    }

    data.forEach(r => {
      const meta    = REMINDER_META[r.type] || REMINDER_META.other;
      const dueDate = new Date(r.due_date);
      const overdue = dueDate < new Date();
      const card    = document.createElement('div');
      card.className = `reminder-card${overdue ? ' overdue' : ''}`;
      card.innerHTML = `
        <div class="rm-icon">${meta.emoji}</div>
        <div class="rm-body">
          <div class="rm-title">${escHtml(r.title)}</div>
          <div class="rm-date${overdue ? ' overdue' : ''}">${overdue ? '⚠️ Overdue — ' : 'Due: '}${fmtDate(r.due_date)}</div>
          ${r.notes ? `<div style="font-size:.78rem;color:var(--muted);margin-top:2px">${escHtml(r.notes)}</div>` : ''}
        </div>
        <div class="rm-actions">
          <button class="btn btn-sm" style="background:var(--green-dim);color:var(--green)" data-done="${r.id}">✓ Done</button>
          <button class="btn btn-ghost btn-sm btn-icon" data-del="${r.id}">🗑</button>
        </div>`;

      card.querySelector('[data-done]').addEventListener('click', () => completeReminder(r.id));
      card.querySelector('[data-del]').addEventListener('click',  () => deleteReminder(r.id));
      el.appendChild(card);
    });
  } catch (e) {
    el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`;
  }
}

async function createReminder() {
  const type  = document.getElementById('reminderType').value;
  const title = document.getElementById('reminderTitle').value.trim();
  const date  = document.getElementById('reminderDate').value;
  const notes = document.getElementById('reminderNotes').value.trim();
  if (!title || !date) { toast('Title and date are required', 'warning'); return; }

  btnLoading('saveReminderBtn', true);
  try {
    const { error } = await sb.from('maintenance_reminders').insert({
      user_id: S.user.id, type, title, due_date: date, notes: notes || null,
    });
    if (error) throw error;
    toast('Reminder saved! 🔔', 'success');
    // Reset form
    document.getElementById('reminderTitle').value = '';
    document.getElementById('reminderDate').value  = '';
    document.getElementById('reminderNotes').value = '';
    document.getElementById('addReminderForm').classList.add('hidden');
    loadReminders();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btnLoading('saveReminderBtn', false);
  }
}

async function completeReminder(id) {
  await sb.from('maintenance_reminders').update({
    is_completed: true,
    completed_at: new Date().toISOString()
  }).eq('id', id);
  toast('Great job! Reminder marked done ✅', 'success');
  loadReminders();
}

async function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  await sb.from('maintenance_reminders').delete().eq('id', id);
  toast('Reminder deleted.');
  loadReminders();
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI DIAGNOSIS
═══════════════════════════════════════════════════════════════════════════ */

function initAiPage() {
  const chips = document.getElementById('quickProblems');
  if (chips.children.length) return; // already done
  AI_PROBLEMS.forEach(p => {
    const chip = document.createElement('button');
    chip.className = 'prob-chip';
    chip.textContent = `${p.emoji} ${p.label}`;
    chip.addEventListener('click', () => sendAiMsg(`My car has a ${p.label.toLowerCase()} problem`, p.key));
    chips.appendChild(chip);
  });
}

function sendAiMsg(text, keyHint = null) {
  const input = document.getElementById('chatInput');
  const msg   = text || input.value.trim();
  if (!msg) return;
  input.value = '';
  input.style.height = 'auto';

  appendBubble(msg, 'user');

  // Typing indicator
  const typing = appendBubble('…', 'bot');
  typing.id = 'typingBubble';

  setTimeout(() => {
    typing.remove();
    const key = keyHint || detectAiKey(msg);
    const response = AI_KNOWLEDGE[key] || AI_KNOWLEDGE.default;
    appendBubble(response, 'bot');

    // Follow-up suggestion
    setTimeout(() => {
      appendBubble('🔍 Want me to find nearby repair shops for this issue? <strong>Just say "find shops" or browse below.</strong>', 'bot');
    }, 700);
  }, 1400 + Math.random() * 600);
}

function detectAiKey(msg) {
  const m = msg.toLowerCase();
  if (/engine|stall|misfire|idle|start/.test(m)) return 'engine';
  if (/brake|stop|squeal|grind/.test(m))         return 'brake';
  if (/battery|charge|dead|alternator/.test(m))  return 'battery';
  if (/ac|air.?con|cool|hot cabin/.test(m))       return 'ac';
  if (/oil|leak|drip/.test(m))                   return 'oil';
  if (/tyre|tire|flat|puncture/.test(m))         return 'tire';
  if (/shop|find|mechanic/.test(m))              { goTo('shops'); return null; }
  return 'default';
}

function appendBubble(text, side) {
  const feed = document.getElementById('chatFeed');
  const now  = new Date();
  const ts   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const div  = document.createElement('div');
  div.className = `bubble bubble-${side}`;
  div.innerHTML = `<div class="bubble-text">${text}</div><div class="bubble-ts">${ts}</div>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return div;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOW TRUCK
═══════════════════════════════════════════════════════════════════════════ */

async function submitTowRequest() {
  const pickup = document.getElementById('towPickup').value.trim();
  if (!pickup) { toast('Please enter your pickup location', 'warning'); return; }

  btnLoading('towSubmitBtn', true);
  try {
    const { error } = await sb.from('tow_requests').insert({
      user_id:             S.user.id,
      pickup_location:     'POINT(101.6869 3.1390)',
      pickup_address:      pickup,
      destination_address: document.getElementById('towDest').value.trim() || null,
      car_brand:           document.getElementById('towBrand').value || null,
      car_plate:           document.getElementById('towPlate').value.trim() || null,
      problem_description: document.getElementById('towNotes').value.trim() || null,
    });
    if (error) throw error;
    document.getElementById('towFormWrap').classList.add('hidden');
    document.getElementById('towSuccess').classList.remove('hidden');
    toast('Tow request sent! 🚛', 'success');
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btnLoading('towSubmitBtn', false);
  }
}

function resetTow() {
  document.getElementById('towFormWrap').classList.remove('hidden');
  document.getElementById('towSuccess').classList.add('hidden');
  ['towPickup','towDest','towPlate','towNotes'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('towBrand').value = '';
}

/* ═══════════════════════════════════════════════════════════════════════════
   OWNER DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */

async function loadDashboard() {
  try {
    const { data: shops } = await sb.from('repair_shops').select('id,avg_rating,total_reviews').eq('owner_id', S.user.id);
    if (!shops?.length) {
      document.getElementById('statBookings').textContent = '0';
      document.getElementById('statRating').textContent   = '—';
      document.getElementById('statRevenue').textContent  = 'RM 0';
      document.getElementById('dashAppts').innerHTML = '<p style="color:var(--muted);font-size:.875rem">Register your shop to see live data.</p>';
      return;
    }

    const shopIds = shops.map(s => s.id);
    const today   = new Date(); today.setHours(0,0,0,0);

    const [apptRes, revRes] = await Promise.all([
      sb.from('appointments').select('*, users(full_name), services(name)')
        .in('shop_id', shopIds).gte('scheduled_at', today.toISOString()).order('scheduled_at'),
      sb.from('appointments').select('total_price')
        .in('shop_id', shopIds).eq('status', 'completed')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    ]);

    const appts   = apptRes.data || [];
    const revenue = (revRes.data || []).reduce((s, r) => s + (+r.total_price || 0), 0);
    const avgR    = shops.reduce((s, sh) => s + (+sh.avg_rating || 0), 0) / shops.length;

    document.getElementById('statBookings').textContent = appts.length;
    document.getElementById('statRating').textContent   = avgR.toFixed(1) + '⭐';
    document.getElementById('statRevenue').textContent  = `RM ${revenue.toLocaleString()}`;

    const list = document.getElementById('dashAppts');
    list.innerHTML = '';
    if (!appts.length) { list.innerHTML = '<p style="color:var(--muted);font-size:.875rem">No appointments today.</p>'; return; }
    appts.slice(0, 7).forEach(a => {
      const row = document.createElement('div');
      row.className = 'dash-appt-row';
      row.innerHTML = `
        <div class="dash-time">${fmtTime(a.scheduled_at)}</div>
        <div>
          <div class="dash-name">${escHtml(a.users?.full_name || 'Customer')}</div>
          <div class="dash-svc">${escHtml(a.services?.name || 'General service')}</div>
        </div>
        ${statusBadge(a.status)}`;
      list.appendChild(row);
    });
  } catch (e) { console.error('Dashboard error:', e); }
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMERGENCY
═══════════════════════════════════════════════════════════════════════════ */

async function handleEmergency() {
  toast('🔍 Finding nearest emergency shop…', 'info', 4000);
  try {
    const { data, error } = await sb.rpc('get_emergency_shop', { p_lat: 3.1390, p_lng: 101.6869 });
    if (error || !data?.length) { toast('No emergency shops found nearby.', 'warning'); return; }
    toast(`🚨 Found: ${data[0].name} — ${fmtDist(data[0].distance_meters)} away`, 'success', 5000);
    openShopDetail(data[0].id);
  } catch (e) {
    toast('Error finding emergency shop.', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

function populateBrandDropdowns() {
  ['bookingBrand', 'towBrand'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel || sel.options.length > 1) return;
    BRANDS.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      sel.appendChild(opt);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   EVENT LISTENERS — WIRED UP ON DOM READY
═══════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Auth buttons ─── */
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  document.getElementById('signupBtn').addEventListener('click', handleSignup);
  document.getElementById('googleBtn').addEventListener('click', () => {
    sb.auth.signInWithOAuth({ provider: 'google' });
  });
  document.getElementById('goSignup').addEventListener('click', e => { e.preventDefault(); showPage('signup'); });
  document.getElementById('goLogin').addEventListener('click',  e => { e.preventDefault(); showPage('login'); });
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  /* Allow Enter key to trigger login */
  ['loginEmail','loginPassword'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });

  /* ── Navigation ─── */
  // Top nav links and data-nav elements
  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const dest = nav.dataset.nav;
      if (dest === 'ai') initAiPage();
      goTo(dest);
    }
  });

  /* ── Home page ─── */
  document.getElementById('heroSearchBtn').addEventListener('click', () => {
    const q = document.getElementById('heroSearchInput').value.trim();
    if (q) {
      goTo('shops');
      setTimeout(() => {
        document.getElementById('shopsSearchInput').value = q;
        loadShopsPage(null);
      }, 150);
    } else {
      goTo('shops');
    }
  });
  document.getElementById('heroSearchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('heroSearchBtn').click();
  });
  document.getElementById('emergencyTile').addEventListener('click', handleEmergency);

  /* ── Shops page search ─── */
  document.getElementById('shopsSearchInput').addEventListener('input', () => {
    loadShopsPage(S.selectedBrand);
  });

  /* ── Brand page ─── */
  document.getElementById('allShopsBtn').addEventListener('click', () => {
    S.selectedBrand = null; goTo('shops');
  });
  document.getElementById('brandsBack').addEventListener('click', goBack);

  /* ── Detail page ─── */
  document.getElementById('detailBack').addEventListener('click', goBack);
  document.getElementById('detailFavBtn').addEventListener('click', toggleFavDetail);

  /* ── Booking page ─── */
  document.getElementById('bookingBack').addEventListener('click', goBack);
  document.getElementById('confirmBookingBtn').addEventListener('click', confirmBooking);

  /* ── Appointments ─── */
  document.getElementById('refreshAppts').addEventListener('click', loadAppointments);

  /* ── Reminders ─── */
  document.getElementById('addReminderToggle').addEventListener('click', () => {
    document.getElementById('addReminderForm').classList.toggle('hidden');
  });
  document.getElementById('cancelReminderBtn').addEventListener('click', () => {
    document.getElementById('addReminderForm').classList.add('hidden');
  });
  document.getElementById('saveReminderBtn').addEventListener('click', createReminder);

  /* ── AI ─── */
  document.getElementById('chatSendBtn').addEventListener('click', () => sendAiMsg());
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMsg(); }
  });
  document.getElementById('clearChatBtn').addEventListener('click', () => {
    const feed = document.getElementById('chatFeed');
    feed.innerHTML = '<div class="bubble bubble-bot"><div class="bubble-text">👋 Chat cleared. How can I help you with your car today?</div></div>';
  });

  /* ── Tow ─── */
  document.getElementById('towSubmitBtn').addEventListener('click', submitTowRequest);
  document.getElementById('towResetBtn').addEventListener('click', resetTow);

  /* ── Modal ─── */
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('confirmCancelBtn').addEventListener('click', executeCancelBooking);
  document.getElementById('submitReviewBtn').addEventListener('click', submitReview);

  /* ── Star picker ─── */
  const starPicker = document.getElementById('starPicker');
  starPicker.addEventListener('click', e => {
    if (!e.target.dataset.v) return;
    const val = parseInt(e.target.dataset.v, 10);
    document.getElementById('reviewRating').value = val;
    starPicker.querySelectorAll('span').forEach((s, i) => {
      s.classList.toggle('lit', i < val);
    });
  });
  starPicker.addEventListener('mouseover', e => {
    if (!e.target.dataset.v) return;
    const val = parseInt(e.target.dataset.v, 10);
    starPicker.querySelectorAll('span').forEach((s, i) => {
      s.style.color = i < val ? 'var(--gold)' : 'var(--dark-4)';
    });
  });
  starPicker.addEventListener('mouseleave', () => {
    const current = parseInt(document.getElementById('reviewRating').value, 10);
    starPicker.querySelectorAll('span').forEach((s, i) => {
      s.style.color = '';
      s.classList.toggle('lit', i < current);
    });
  });

}); // end DOMContentLoaded

/* ═══════════════════════════════════════════════════════════════════════════
   BOOT — CHECK AUTH STATE
═══════════════════════════════════════════════════════════════════════════ */

(async function boot() {
  // Splash for at least 1.8s
  const splashTimer = new Promise(res => setTimeout(res, 1800));

  const { data: { session } } = await sb.auth.getSession();

  await splashTimer; // ensure splash finishes its animation

  if (session?.user) {
    await bootstrapUser(session.user);
  } else {
    showPage('login');
  }

  // Listen for future auth changes (e.g. OAuth redirect)
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user && !S.user) {
      await bootstrapUser(session.user);
    } else if (event === 'SIGNED_OUT') {
      S.user = null;
      document.getElementById('app').classList.add('hidden');
      showPage('login');
    }
  });

})();
