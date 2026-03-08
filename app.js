/* ════════════════════════════════════════════════════════════════
   WRENCH — app.js
   Complete application logic connected to Supabase
   Version 2.0 — Fully rewritten & improved
════════════════════════════════════════════════════════════════ */

'use strict';

/* ─── SUPABASE CLIENT ──────────────────────────────────────────────────── */
const { createClient } = supabase;
const sb = createClient(
  'https://pmlfgokdjjsxyckojahh.supabase.co',
  'sb_publishable_15j0DLBv2mjt4JMCKvbcfg_tB341vmV'
);

/* ─── CONSTANTS ────────────────────────────────────────────────────────── */
const BRANDS = ['Toyota','Nissan','Honda','BMW','Mercedes-Benz','Ford','Hyundai','Kia','Proton','Perodua','Other'];
const BRAND_FLAG = {
  Toyota:'🇯🇵', Nissan:'🇯🇵', Honda:'🇯🇵', BMW:'🇩🇪',
  'Mercedes-Benz':'🇩🇪', Ford:'🇺🇸', Hyundai:'🇰🇷', Kia:'🇰🇷',
  Proton:'🇲🇾', Perodua:'🇲🇾', Other:'🚗'
};
const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const REMINDER_META = {
  oil_change:    { emoji:'🛢️', label:'Oil Change' },
  tire_rotation: { emoji:'🔄', label:'Tire Rotation' },
  engine_check:  { emoji:'🔧', label:'Engine Check' },
  brake_check:   { emoji:'🛑', label:'Brake Check' },
  air_filter:    { emoji:'💨', label:'Air Filter' },
  battery_check: { emoji:'🔋', label:'Battery Check' },
  other:         { emoji:'⚙️', label:'Other' },
};

const AI_KB = {
  engine:  '🔧 <strong>Engine Issue Detected</strong><br/><br/>Your symptoms suggest one of these common causes:<br/>• <strong>Spark plugs</strong> — worn plugs cause misfires & rough idling (replace every 40,000–60,000 km)<br/>• <strong>Ignition coil</strong> failure — causes hesitation and CEL light<br/>• <strong>Clogged fuel injectors</strong> — poor acceleration & high fuel consumption<br/>• <strong>MAF sensor</strong> — incorrect air/fuel ratio causing stalling<br/><br/>💰 Estimated cost: RM 80–600 depending on cause<br/>🏥 Recommended: OBD-II diagnostic scan (RM 30–50 at most shops)',
  brake:   '🛑 <strong>BRAKE ALERT — Safety Critical</strong><br/><br/>Do not ignore brake problems. Your symptoms match:<br/>• <strong>Worn brake pads</strong> — if thickness < 3mm, replace immediately<br/>• <strong>Warped rotors</strong> — pulsating pedal when braking<br/>• <strong>Brake fluid leak</strong> — spongy pedal, visible fluid under car<br/>• <strong>Caliper sticking</strong> — pulling to one side<br/><br/>💰 Pad replacement: RM 80–250 per axle<br/>⚠️ Stop driving if pedal sinks to the floor',
  battery: '🔋 <strong>Battery / Electrical Issue</strong><br/><br/>Common causes of your symptoms:<br/>• <strong>Dead battery</strong> — lifespan 3–5 years. Test voltage: healthy = 12.6V<br/>• <strong>Failing alternator</strong> — not charging battery while running (should show 13.7–14.7V)<br/>• <strong>Corroded terminals</strong> — clean with baking soda & wire brush<br/>• <strong>Parasitic drain</strong> — something drawing power when engine is off<br/><br/>💰 Battery replacement: RM 150–380<br/>🆓 Most workshops offer free battery testing',
  ac:      '❄️ <strong>Air Conditioning Problem</strong><br/><br/>Your AC issue is likely caused by:<br/>• <strong>Low refrigerant</strong> — most common cause; needs regas<br/>• <strong>Faulty compressor</strong> — clicking noise when AC turns on<br/>• <strong>Clogged condenser</strong> — reduced cooling performance<br/>• <strong>Cabin air filter</strong> — blocked filter reduces airflow<br/><br/>💰 AC regas: RM 80–150<br/>💰 Compressor replacement: RM 600–1,500<br/>Check: Is hot air coming out even on max cold?',
  oil:     '🛢️ <strong>Oil Leak Identified</strong><br/><br/>Check the colour to identify the fluid:<br/>• <strong>Black/dark brown</strong> = Engine oil leak<br/>• <strong>Red/pink</strong> = Transmission fluid<br/>• <strong>Green/orange</strong> = Coolant (overheating risk!)<br/>• <strong>Clear/light yellow</strong> = Power steering fluid<br/><br/>Common leak points: valve cover gasket, oil pan, rear main seal<br/>⚠️ Top up oil immediately to prevent engine damage<br/>💰 Gasket replacement: RM 100–400',
  tire:    '🔴 <strong>Tyre / Wheel Issue</strong><br/><br/>Your symptoms suggest:<br/>• <strong>Flat/puncture</strong> — use spare tyre or call for tow<br/>• <strong>Uneven wear</strong> — caused by misalignment or under-inflation<br/>• <strong>Sidewall damage</strong> — bulge = replace immediately<br/>• <strong>Balancing needed</strong> — vibration at 80–110 km/h<br/><br/>✅ Check tyre pressure: standard is 32–35 PSI<br/>💰 Alignment: RM 60–120 | Balancing: RM 10–20 per tyre',
  overheat:'🌡️ <strong>Overheating Engine</strong><br/><br/>STOP the engine if temperature gauge is in red zone!<br/><br/>Causes:<br/>• <strong>Low coolant</strong> — check reservoir when engine is cold<br/>• <strong>Faulty thermostat</strong> — stuck closed<br/>• <strong>Radiator blockage</strong> — reduced cooling<br/>• <strong>Water pump failure</strong> — no circulation<br/><br/>⚠️ Driving while overheating causes catastrophic engine damage<br/>🚛 Consider requesting a tow truck',
  default: '🔍 <strong>General Car Problem</strong><br/><br/>Based on your description, this could involve multiple systems. Here\'s what I recommend:<br/><br/>1. Note all symptoms (sounds, smells, dashboard lights)<br/>2. Check your owner\'s manual for warning light meanings<br/>3. Get an OBD-II diagnostic scan at any workshop (RM 30–50)<br/><br/>📍 I can help you find certified workshops near you that handle this type of issue. Click "Find Shops" or search above.',
};

const AI_PROBLEMS = [
  { emoji:'🔧', label:'Engine',     key:'engine'  },
  { emoji:'🛑', label:'Brakes',     key:'brake'   },
  { emoji:'🔋', label:'Battery',    key:'battery' },
  { emoji:'❄️', label:'AC',         key:'ac'      },
  { emoji:'🛢️', label:'Oil Leak',   key:'oil'     },
  { emoji:'🔴', label:'Tyres',      key:'tire'    },
  { emoji:'🌡️', label:'Overheating',key:'overheat'},
];

/* ─── APP STATE ────────────────────────────────────────────────────────── */
const S = {
  user:            null,
  profile:         null,
  currentShopId:   null,
  bookingShopId:   null,
  bookingShopName: null,
  selectedDate:    null,
  selectedSlot:    null,
  selectedBrand:   null,
  favorites:       new Set(),
  cancelTargetId:  null,
  reviewTargetId:  null,
  allAppts:        [],
  pageStack:       [],
};

/* ════════════════════════════════════════════════════════════════
   UTILITY HELPERS
════════════════════════════════════════════════════════════════ */

function toast(msg, type = 'info', ms = 3800) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = msg;
  document.getElementById('toastStack').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, ms);
}

function btnLoad(id, on) {
  const btn = document.getElementById(id);
  if (!btn) return;
  if (on) { btn.disabled = true; btn._html = btn.innerHTML; btn.innerHTML = '<span class="spin-sm"></span>'; }
  else     { btn.disabled = false; if (btn._html) btn.innerHTML = btn._html; }
}

function showErr(id, msg) { const el=document.getElementById(id); if(el){el.textContent=msg;el.classList.remove('hidden');} }
function hideErr(id)      { const el=document.getElementById(id); if(el) el.classList.add('hidden'); }

function openModal(id) {
  document.getElementById('modalOverlay').classList.add('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function fmtDate(iso)  { if(!iso) return '—'; const d=new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
function fmtTime(iso)  { if(!iso) return '—'; const d=new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function fmtDist(m)    { if(!m)  return ''; return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`; }
function fmtRating(r)  { return `★ ${(+r||0).toFixed(1)}`; }
function esc(s)        { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function starsHtml(n) {
  let h='';
  for(let i=1;i<=5;i++) h+=`<span class="rv-star${i>n?' empty':''}">★</span>`;
  return `<div class="rv-stars">${h}</div>`;
}
function statusBadge(s) {
  const cls = { pending:'s-pending', confirmed:'s-confirmed', in_progress:'s-in_progress', completed:'s-completed', cancelled:'s-cancelled', no_show:'s-no_show' };
  return `<span class="status-badge ${cls[s]||'s-pending'}">${s.replace(/_/g,' ')}</span>`;
}
function emptyHtml(icon, title, sub) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${icon}</div><div class="empty-title">${title}</div><div class="empty-sub">${sub}</div></div>`;
}

/* ════════════════════════════════════════════════════════════════
   PAGE ROUTER
════════════════════════════════════════════════════════════════ */

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const p = document.getElementById(`pg-${name}`);
  if (p) p.classList.add('active');
}

function goTo(name) {
  // Hide all app pages
  document.querySelectorAll('.ap').forEach(ap => { ap.classList.remove('active'); ap.classList.add('hidden'); });
  const el = document.getElementById(`ap-${name}`);
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.add('active');
  window.scrollTo(0, 0);

  // Push to stack (avoid duplicates at top)
  if (S.pageStack[S.pageStack.length-1] !== name) S.pageStack.push(name);

  // Sync nav highlights
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.nav===name));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav===name));

  // Lazy-load page data
  ({
    home:         loadHomeShops,
    shops:        () => loadShopsPage(S.selectedBrand),
    brands:       renderBrandGrid,
    favorites:    loadFavorites,
    appointments: loadAppointments,
    reminders:    loadReminders,
    dashboard:    loadDashboard,
    ai:           initAI,
    profile:      loadProfileStats,
  }[name] || (() => {}))();
}

function goBack() {
  S.pageStack.pop();
  const prev = S.pageStack.pop() || 'home';
  goTo(prev);
}

/* ════════════════════════════════════════════════════════════════
   AUTHENTICATION
════════════════════════════════════════════════════════════════ */

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  if (!email || !pass) { showErr('loginErr', 'Please fill in both fields.'); return; }
  hideErr('loginErr');
  btnLoad('loginBtn', true);
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    await bootApp(data.user);
  } catch(e) {
    showErr('loginErr', e.message || 'Sign in failed. Check your email and password.');
  } finally { btnLoad('loginBtn', false); }
}

async function doSignup() {
  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const pass  = document.getElementById('signupPassword').value;
  if (!name||!email||!pass) { showErr('signupErr','Please fill in all required fields.'); return; }
  if (pass.length < 8)       { showErr('signupErr','Password must be at least 8 characters.'); return; }
  hideErr('signupErr');
  btnLoad('signupBtn', true);
  try {
    const { error } = await sb.auth.signUp({ email, password: pass, options: { data: { full_name: name, phone } } });
    if (error) throw error;
    toast('✅ Account created! Check your email to verify your address.','success',6000);
    showPage('login');
  } catch(e) {
    showErr('signupErr', e.message || 'Sign up failed. Please try again.');
  } finally { btnLoad('signupBtn', false); }
}

async function doLogout() {
  await sb.auth.signOut();
  S.user = null; S.profile = null; S.favorites.clear(); S.pageStack = [];
  document.getElementById('app').classList.add('hidden');
  showPage('login');
  toast('You have been signed out.');
}

/** Bootstraps the full app after auth */
async function bootApp(user) {
  S.user = user;

  // Load user profile from DB
  const { data: prof } = await sb.from('users').select('*').eq('id', user.id).maybeSingle();
  S.profile = prof;

  const displayName = prof?.full_name || user.email.split('@')[0];
  const initial     = displayName.charAt(0).toUpperCase();

  // Update nav & profile fields
  document.getElementById('navAvatar').textContent      = initial;
  document.getElementById('navName').textContent        = displayName.split(' ')[0];
  document.getElementById('profileAvatar').textContent  = initial;
  document.getElementById('profileName').textContent    = displayName;
  document.getElementById('profileEmail').textContent   = user.email;

  // Load favorites
  const { data: favs } = await sb.from('favorites').select('shop_id').eq('user_id', user.id);
  S.favorites = new Set((favs||[]).map(f => f.shop_id));

  // Populate brand dropdowns
  fillBrandDropdowns();

  // Show app
  document.getElementById('app').classList.remove('hidden');
  showPage('app');
  goTo('home');
}

/* ════════════════════════════════════════════════════════════════
   HOME — NEARBY SHOPS
════════════════════════════════════════════════════════════════ */

async function loadHomeShops() {
  const el = document.getElementById('homeShops');
  el.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  try {
    const { data, error } = await sb.rpc('find_nearby_shops', { p_lat:3.1390, p_lng:101.6869, p_radius_m:20000 });
    if (error) throw error;
    el.innerHTML = '';
    (data||[]).slice(0,6).forEach(shop => el.appendChild(buildShopCard(shop)));
    if (!data?.length) el.innerHTML = emptyHtml('🔧','No shops found nearby','Try expanding your search area.');
  } catch(e) {
    el.innerHTML = `<p style="color:var(--red);padding:16px;grid-column:1/-1">${e.message}</p>`;
  }
}

/* ════════════════════════════════════════════════════════════════
   SHOPS LIST PAGE
════════════════════════════════════════════════════════════════ */

async function loadShopsPage(brand=null) {
  const grid  = document.getElementById('shopsGrid');
  const title = document.getElementById('shopsTitle');
  const count = document.getElementById('shopsCount');
  grid.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';

  try {
    let q = sb.from('repair_shops')
      .select('*, supported_brands(car_brands(name)), shop_photos(url,is_primary)')
      .eq('status','active')
      .order('avg_rating', {ascending:false});

    if (brand) {
      const { data:cb } = await sb.from('car_brands').select('id').eq('name',brand).maybeSingle();
      if (cb) {
        const { data:sb2 } = await sb.from('supported_brands').select('shop_id').eq('brand_id',cb.id);
        const ids = (sb2||[]).map(r=>r.shop_id);
        if (ids.length) q = q.in('id', ids);
        else { grid.innerHTML = emptyHtml('🔧','No shops for this brand','No registered shops support this brand yet.'); return; }
      }
    }

    const search = document.getElementById('shopsInput')?.value.trim();
    if (search) q = q.ilike('name',`%${search}%`);

    const { data, error } = await q.limit(60);
    if (error) throw error;

    title.textContent = brand ? `${brand.toUpperCase()} SHOPS` : 'ALL SHOPS';
    count.textContent = `${data?.length||0} shops`;
    grid.innerHTML = '';
    if (!data?.length) { grid.innerHTML = emptyHtml('🔧','No shops found','Try a different filter or search term.'); return; }
    data.forEach(shop => grid.appendChild(buildShopCard(shop)));
  } catch(e) {
    grid.innerHTML = `<p style="color:var(--red);padding:16px;grid-column:1/-1">${e.message}</p>`;
  }
}

/** Build a shop card element */
function buildShopCard(shop) {
  const photo  = shop.shop_photos?.find(p=>p.is_primary)?.url || shop.shop_photos?.[0]?.url;
  const brands = (shop.supported_brands||[]).map(b=>b.car_brands?.name).filter(Boolean);
  const isFav  = S.favorites.has(shop.id);
  const dist   = fmtDist(shop.distance_meters);

  const card = document.createElement('div');
  card.className = 'shop-card';
  card.setAttribute('role','listitem');
  card.innerHTML = `
    <div class="sc-img">
      ${photo ? `<img src="${esc(photo)}" alt="${esc(shop.name)}" loading="lazy"/>` : `<div class="sc-img-ph">🔧</div>`}
      ${shop.is_emergency_available ? `<div class="sc-emergency">🚨 Emergency</div>` : ''}
      <button class="sc-fav ${isFav?'active':''}" data-id="${shop.id}" aria-label="Save shop">${isFav?'❤️':'🤍'}</button>
    </div>
    <div class="sc-body">
      <div class="sc-name">${esc(shop.name)}</div>
      <div class="sc-addr">${esc(shop.address||shop.city||'—')}</div>
      <div class="sc-meta">
        <div class="sc-rating">${fmtRating(shop.avg_rating)}</div>
        ${dist ? `<div class="sc-dist">📍 ${dist}</div>` : ''}
        <div class="sc-reviews">${shop.total_reviews||0} reviews</div>
      </div>
      ${brands.length ? `<div class="sc-brands">${brands.slice(0,3).map(b=>`<span class="brand-tag">${esc(b)}</span>`).join('')}${brands.length>3?`<span class="brand-tag">+${brands.length-3}</span>`:''}</div>` : ''}
    </div>`;

  card.querySelector('.sc-body').addEventListener('click', () => openShopDetail(shop.id));
  card.querySelector('.sc-img').addEventListener('click', e => { if(!e.target.closest('.sc-fav')) openShopDetail(shop.id); });
  card.querySelector('.sc-fav').addEventListener('click', e => { e.stopPropagation(); toggleFav(shop.id, e.currentTarget); });
  return card;
}

/* ════════════════════════════════════════════════════════════════
   SHOP DETAIL
════════════════════════════════════════════════════════════════ */

async function openShopDetail(shopId) {
  S.currentShopId = shopId;
  goTo('shop-detail');

  // Reset hero & fav button
  const heroEl = document.getElementById('detailHero');
  heroEl.innerHTML = `<div class="detail-hero-ph">🔧</div><button class="float-btn fb-back" id="detailBackBtn">←</button><button class="float-btn fb-fav" id="detailFavBtn">${S.favorites.has(shopId)?'❤️':'🤍'}</button>`;
  document.getElementById('detailBackBtn').addEventListener('click', goBack);
  document.getElementById('detailFavBtn').addEventListener('click', toggleFavDetail);

  const body = document.getElementById('detailBody');
  body.innerHTML = '<div class="spin-box"><div class="spinner"></div></div>';

  try {
    const [shopRes, reviewRes] = await Promise.all([
      sb.from('repair_shops').select('*, services(*), shop_photos(*), supported_brands(car_brands(name)), opening_hours(*)').eq('id',shopId).single(),
      sb.from('reviews').select('*, users(full_name)').eq('shop_id',shopId).eq('is_visible',true).order('created_at',{ascending:false}).limit(6)
    ]);
    if (shopRes.error) throw shopRes.error;

    const shop    = shopRes.data;
    const reviews = reviewRes.data || [];

    // Update hero photo
    const primaryPic = shop.shop_photos?.find(p=>p.is_primary) || shop.shop_photos?.[0];
    if (primaryPic) {
      heroEl.innerHTML = `<img src="${esc(primaryPic.url)}" alt="${esc(shop.name)}" style="width:100%;height:100%;object-fit:cover"/><button class="float-btn fb-back" id="detailBackBtn">←</button><button class="float-btn fb-fav" id="detailFavBtn">${S.favorites.has(shopId)?'❤️':'🤍'}</button>`;
      document.getElementById('detailBackBtn').addEventListener('click', goBack);
      document.getElementById('detailFavBtn').addEventListener('click', toggleFavDetail);
    }

    const brands = (shop.supported_brands||[]).map(b=>b.car_brands?.name).filter(Boolean);

    body.innerHTML = `
      <div style="max-width:860px;margin:0 auto;padding-bottom:40px">
        <div class="detail-shop-header">
          <div>
            <div class="detail-shop-name">${esc(shop.name)}</div>
            <div class="detail-shop-addr">📍 ${esc(shop.address)}</div>
            ${shop.is_emergency_available ? `<span class="status-badge s-confirmed" style="margin-top:8px;display:inline-flex">🚨 Emergency 24/7</span>` : ''}
          </div>
          <div class="detail-rating-box">
            <div class="detail-rating-num">${fmtRating(shop.avg_rating)}</div>
            <div class="detail-rev-count">${shop.total_reviews||0} reviews</div>
          </div>
        </div>

        <div class="detail-actions-row">
          <div class="detail-action" id="daCall"><div class="da-ico">📞</div><div class="da-lbl">Call Shop</div></div>
          <div class="detail-action" id="daMap"><div class="da-ico">🗺️</div><div class="da-lbl">Directions</div></div>
          <div class="detail-action" id="daBook"><div class="da-ico">📅</div><div class="da-lbl">Book Now</div></div>
        </div>

        ${brands.length ? `
        <div class="detail-section">
          <div class="detail-sec-title">SUPPORTED BRANDS</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${brands.map(b=>`<span class="brand-tag">${BRAND_FLAG[b]||'🚗'} ${esc(b)}</span>`).join('')}
          </div>
        </div>` : ''}

        ${shop.services?.length ? `
        <div class="detail-section">
          <div class="detail-sec-title">SERVICES OFFERED</div>
          ${shop.services.map(s=>`
            <div class="svc-row">
              <div>
                <div class="svc-name">${esc(s.name)}</div>
                <div class="svc-meta">${esc(s.category||'')}${s.duration_minutes?' · '+s.duration_minutes+' min':''}</div>
              </div>
              <div class="svc-price">${s.price_min?'RM '+Math.round(+s.price_min)+(s.price_max?'–'+Math.round(+s.price_max):'+'): '—'}</div>
            </div>`).join('')}
        </div>` : ''}

        <div class="detail-section">
          <div class="detail-sec-title">
            CUSTOMER REVIEWS
            <button class="btn btn-outline btn-sm" id="writeReviewBtn">Write Review</button>
          </div>
          ${reviews.length ? reviews.map(r=>`
            <div class="review-card">
              <div class="rv-head">
                <div class="rv-avatar">${(r.users?.full_name||'?').charAt(0).toUpperCase()}</div>
                <div>
                  <div class="rv-name">${esc(r.users?.full_name||'Anonymous')}</div>
                  <div style="display:flex;align-items:center;gap:8px">
                    ${starsHtml(r.rating)}
                    <span class="rv-date">${fmtDate(r.created_at)}</span>
                  </div>
                </div>
              </div>
              ${r.comment ? `<div class="rv-text">${esc(r.comment)}</div>` : ''}
              ${r.owner_reply ? `<div class="rv-reply"><div class="rv-reply-lbl">Owner Response</div><div class="rv-reply-txt">${esc(r.owner_reply)}</div></div>` : ''}
            </div>`).join('')
          : `<p style="color:var(--muted);font-size:.9rem;padding:12px 0">No reviews yet. Be the first to review this shop!</p>`}
        </div>

        <div class="detail-book-sticky">
          <button class="btn btn-primary btn-block btn-xl" id="detailBookBtn">📅 BOOK APPOINTMENT</button>
        </div>
      </div>`;

    document.getElementById('daCall').addEventListener('click', () => {
      if (shop.phone) window.location.href = `tel:${shop.phone}`;
      else toast('Phone number not available for this shop.', 'warning');
    });
    document.getElementById('daMap').addEventListener('click', () => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`, '_blank');
    });
    document.getElementById('daBook').addEventListener('click',      () => startBooking(shop.id, shop.name));
    document.getElementById('detailBookBtn').addEventListener('click',() => startBooking(shop.id, shop.name));
    document.getElementById('writeReviewBtn').addEventListener('click',() => {
      S.reviewTargetId = shopId;
      document.getElementById('reviewRating').value = '0';
      document.getElementById('reviewComment').value = '';
      document.querySelectorAll('#starPicker span').forEach(s=>s.classList.remove('lit'));
      openModal('modalReview');
    });

  } catch(e) {
    body.innerHTML = `<p style="color:var(--red);padding:24px">${e.message}</p>`;
  }
}

/* ════════════════════════════════════════════════════════════════
   FAVORITES
════════════════════════════════════════════════════════════════ */

async function toggleFav(shopId, btn) {
  if (!S.user) { toast('Please sign in to save shops.','warning'); return; }
  const wasFav = S.favorites.has(shopId);
  try {
    if (wasFav) {
      await sb.from('favorites').delete().eq('user_id',S.user.id).eq('shop_id',shopId);
      S.favorites.delete(shopId);
      btn.textContent = '🤍'; btn.classList.remove('active');
      toast('Removed from saved shops.');
    } else {
      await sb.from('favorites').upsert({user_id:S.user.id, shop_id:shopId},{onConflict:'user_id,shop_id'});
      S.favorites.add(shopId);
      btn.textContent = '❤️'; btn.classList.add('active');
      toast('Shop saved! ❤️','success');
    }
  } catch(e) { toast(e.message,'error'); }
}

function toggleFavDetail() {
  const btn = document.getElementById('detailFavBtn');
  if (btn) toggleFav(S.currentShopId, btn);
}

async function loadFavorites() {
  const el = document.getElementById('favGrid');
  el.innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  try {
    const { data, error } = await sb.from('favorites')
      .select('shop_id, repair_shops(*, shop_photos(url,is_primary))')
      .eq('user_id', S.user.id).order('created_at',{ascending:false});
    if (error) throw error;
    el.innerHTML = '';
    document.getElementById('favsCount').textContent = `${data?.length||0} shops`;
    if (!data?.length) { el.innerHTML = emptyHtml('❤️','No saved shops','Tap the heart icon on any shop to save it here.'); return; }
    data.forEach(f => { if (f.repair_shops) el.appendChild(buildShopCard(f.repair_shops)); });
  } catch(e) { el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

/* ════════════════════════════════════════════════════════════════
   BRAND GRID + FILTER CHIPS
════════════════════════════════════════════════════════════════ */

function renderBrandGrid() {
  const grid = document.getElementById('brandGrid');
  if (grid.children.length) return;
  BRANDS.forEach(brand => {
    const card = document.createElement('div');
    card.className = 'brand-card' + (S.selectedBrand===brand?' selected':'');
    card.innerHTML = `<div class="brand-emoji">${BRAND_FLAG[brand]||'🚗'}</div><div class="brand-name">${brand}</div>`;
    card.addEventListener('click', () => {
      document.querySelectorAll('.brand-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      S.selectedBrand = brand;
      goTo('shops');
    });
    grid.appendChild(card);
  });

  // Build filter chips on shops page
  buildFilterChips();
}

function buildFilterChips() {
  const bar = document.getElementById('brandChips');
  if (!bar || bar.children.length) return;
  const makeChip = (label, brand) => {
    const chip = document.createElement('span');
    chip.className = 'chip' + (!brand && !S.selectedBrand ? ' active' : (S.selectedBrand===brand ? ' active' : ''));
    chip.textContent = label;
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      S.selectedBrand = brand;
      document.getElementById('shopsInput').value = '';
      loadShopsPage(brand);
    });
    bar.appendChild(chip);
  };
  makeChip('All', null);
  BRANDS.forEach(b => makeChip(b, b));
}

/* ════════════════════════════════════════════════════════════════
   BOOKING
════════════════════════════════════════════════════════════════ */

function startBooking(shopId, shopName) {
  S.bookingShopId = shopId; S.bookingShopName = shopName;
  S.selectedDate  = null;   S.selectedSlot    = null;
  document.getElementById('bookingShopName').textContent = shopName;
  document.getElementById('sumService').textContent  = '—';
  document.getElementById('sumDateTime').textContent = '—';
  document.getElementById('sumCar').textContent      = '—';
  loadBookingServices(shopId);
  buildDateRail();
  document.getElementById('slotGrid').innerHTML = '<span class="slot-hint">← Pick a date first</span>';
  goTo('booking');
}

async function loadBookingServices(shopId) {
  const sel = document.getElementById('bookingService');
  sel.innerHTML = '<option value="">Loading…</option>';
  const { data } = await sb.from('services').select('*').eq('shop_id',shopId).eq('is_available',true).order('name');
  sel.innerHTML = '<option value="">Select a service…</option>';
  (data||[]).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name}${s.price_min?' — RM '+Math.round(+s.price_min):''}`;
    sel.appendChild(opt);
  });
}

function buildDateRail() {
  const rail = document.getElementById('dateRail');
  rail.innerHTML = '';
  for (let i=1; i<=14; i++) {
    const d = new Date(); d.setDate(d.getDate()+i);
    const chip = document.createElement('div');
    chip.className = 'date-chip';
    chip.innerHTML = `<div class="dc-day">${DAYS[d.getDay()]}</div><div class="dc-num">${d.getDate()}</div>`;
    chip.addEventListener('click', () => {
      rail.querySelectorAll('.date-chip').forEach(c=>c.classList.remove('selected'));
      chip.classList.add('selected');
      S.selectedDate = d;
      S.selectedSlot = null;
      updateBookingSummary();
      loadSlots(S.bookingShopId, d);
    });
    rail.appendChild(chip);
  }
}

async function loadSlots(shopId, date) {
  const grid = document.getElementById('slotGrid');
  grid.innerHTML = '<span class="slot-hint">Loading slots…</span>';
  try {
    const ymd = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const { data, error } = await sb.rpc('get_shop_available_slots', { p_shop_id:shopId, p_date:ymd });
    grid.innerHTML = '';
    if (error||!data?.length) { grid.innerHTML = '<span class="slot-hint" style="grid-column:1/-1">No available slots for this date.</span>'; return; }
    data.forEach(slot => {
      const t = new Date(slot.slot_start);
      const btn = document.createElement('div');
      btn.className = 'slot-btn';
      btn.textContent = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        S.selectedSlot = slot.slot_start;
        updateBookingSummary();
      });
      grid.appendChild(btn);
    });
  } catch(e) { grid.innerHTML = `<span style="color:var(--red)">${e.message}</span>`; }
}

function updateBookingSummary() {
  const svc  = document.getElementById('bookingService');
  const brand = document.getElementById('bookingBrand').value;
  const model = document.getElementById('bookingModel').value.trim();
  const dt  = S.selectedDate && S.selectedSlot ? `${fmtDate(S.selectedDate)} ${fmtTime(S.selectedSlot)}` : '—';
  document.getElementById('sumService').textContent  = svc.options[svc.selectedIndex]?.text || '—';
  document.getElementById('sumDateTime').textContent = dt;
  document.getElementById('sumCar').textContent      = [brand, model].filter(Boolean).join(' ') || '—';
}

async function confirmBooking() {
  if (!S.selectedSlot) { toast('Please select a time slot to continue.','warning'); return; }
  const serviceId = document.getElementById('bookingService').value;
  const brand     = document.getElementById('bookingBrand').value;
  const model     = document.getElementById('bookingModel').value.trim();
  const plate     = document.getElementById('bookingPlate').value.trim();
  const notes     = document.getElementById('bookingNotes').value.trim();
  btnLoad('confirmBookingBtn', true);
  try {
    const { error } = await sb.from('appointments').insert({
      user_id:      S.user.id,
      shop_id:      S.bookingShopId,
      scheduled_at: S.selectedSlot,
      service_id:   serviceId || null,
      car_brand:    brand     || null,
      car_model:    model     || null,
      car_plate:    plate     || null,
      notes:        notes     || null,
    });
    if (error) throw error;
    toast('🎉 Booking confirmed! You\'ll receive a notification shortly.','success',5000);
    goTo('appointments');
  } catch(e) { toast(e.message,'error'); }
  finally { btnLoad('confirmBookingBtn', false); }
}

/* ════════════════════════════════════════════════════════════════
   APPOINTMENTS
════════════════════════════════════════════════════════════════ */

async function loadAppointments() {
  const el = document.getElementById('apptList');
  el.innerHTML = '<div class="spin-box"><div class="spinner"></div></div>';
  try {
    const { data, error } = await sb.from('appointments')
      .select('*, repair_shops(name,address), services(name)')
      .eq('user_id', S.user.id).order('scheduled_at',{ascending:false});
    if (error) throw error;
    S.allAppts = data || [];
    renderAppts('all');
  } catch(e) { el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

function renderAppts(filter) {
  const el   = document.getElementById('apptList');
  const data = filter === 'all' ? S.allAppts : S.allAppts.filter(a => a.status === filter);
  el.innerHTML = '';
  if (!data.length) { el.innerHTML = emptyHtml('📅','No bookings found','Book a repair shop to see your appointments here.'); return; }
  data.forEach(a => {
    const card = document.createElement('div');
    card.className = 'appt-card';
    card.innerHTML = `
      <div class="appt-top">
        <div>
          <div class="appt-shop">${esc(a.repair_shops?.name||'Unknown Shop')}</div>
          <div class="appt-addr">${esc(a.repair_shops?.address||'')}</div>
        </div>
        ${statusBadge(a.status)}
      </div>
      <div class="appt-details">
        <div class="appt-detail">📅 ${fmtDate(a.scheduled_at)}</div>
        <div class="appt-detail">🕐 ${fmtTime(a.scheduled_at)}</div>
        ${a.services?.name ? `<div class="appt-detail">🔧 ${esc(a.services.name)}</div>` : ''}
        ${a.car_brand ? `<div class="appt-detail">🚗 ${esc(a.car_brand)}${a.car_model?' '+esc(a.car_model):''}</div>` : ''}
      </div>
      ${a.status==='pending' ? `<div style="margin-top:10px"><button class="btn btn-ghost btn-sm" style="color:var(--red)" data-appt="${a.id}">Cancel Booking</button></div>` : ''}`;
    const cancelBtn = card.querySelector('[data-appt]');
    if (cancelBtn) { cancelBtn.addEventListener('click', () => { S.cancelTargetId = a.id; openModal('modalConfirm'); }); }
    el.appendChild(card);
  });
}

async function doCancel() {
  if (!S.cancelTargetId) return;
  const { error } = await sb.from('appointments').update({status:'cancelled', cancelled_by:S.user.id}).eq('id',S.cancelTargetId);
  closeModal(); S.cancelTargetId = null;
  if (error) { toast(error.message,'error'); return; }
  toast('Booking cancelled.'); loadAppointments();
}

/* ════════════════════════════════════════════════════════════════
   REVIEWS
════════════════════════════════════════════════════════════════ */

async function submitReview() {
  const rating  = parseInt(document.getElementById('reviewRating').value, 10);
  const comment = document.getElementById('reviewComment').value.trim();
  if (!rating) { toast('Please select a star rating.','warning'); return; }
  btnLoad('submitReviewBtn', true);
  try {
    const { error } = await sb.from('reviews').insert({ shop_id:S.reviewTargetId, user_id:S.user.id, rating, comment:comment||null });
    if (error) throw error;
    closeModal();
    toast('Review submitted! ⭐ Thank you.','success');
    if (S.currentShopId === S.reviewTargetId) openShopDetail(S.currentShopId);
  } catch(e) { toast(e.message,'error'); }
  finally { btnLoad('submitReviewBtn', false); }
}

/* ════════════════════════════════════════════════════════════════
   REMINDERS
════════════════════════════════════════════════════════════════ */

async function loadReminders() {
  const el = document.getElementById('reminderList');
  el.innerHTML = '<div class="spin-box"><div class="spinner"></div></div>';
  try {
    const { data, error } = await sb.from('maintenance_reminders')
      .select('*').eq('user_id',S.user.id).eq('is_completed',false).order('due_date');
    if (error) throw error;
    el.innerHTML = '';
    if (!data?.length) { el.innerHTML = emptyHtml('🔔','No reminders set','Add a reminder to track your car maintenance schedule.'); return; }
    data.forEach(r => {
      const meta    = REMINDER_META[r.type]||REMINDER_META.other;
      const dueDate = new Date(r.due_date);
      const overdue = dueDate < new Date();
      const card    = document.createElement('div');
      card.className = `reminder-card${overdue?' overdue':''}`;
      card.innerHTML = `
        <div class="rm-ico">${meta.emoji}</div>
        <div class="rm-info">
          <div class="rm-title">${esc(r.title)}</div>
          <div class="rm-date${overdue?' overdue':''}">${overdue?'⚠️ Overdue — ':'Due: '}${fmtDate(r.due_date)}${r.mileage?' · '+r.mileage+' km':''}</div>
          ${r.notes?`<div style="font-size:.78rem;color:var(--muted);margin-top:2px">${esc(r.notes)}</div>`:''}
        </div>
        <div class="rm-btns">
          <button class="btn btn-sm" style="background:var(--green-dim);color:var(--green)" data-done="${r.id}">✓ Done</button>
          <button class="btn btn-ghost btn-sm btn-icon" data-del="${r.id}">🗑</button>
        </div>`;
      card.querySelector('[data-done]').addEventListener('click', () => completeReminder(r.id));
      card.querySelector('[data-del]').addEventListener('click',  () => deleteReminder(r.id));
      el.appendChild(card);
    });
  } catch(e) { el.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

async function saveReminder() {
  const type     = document.getElementById('reminderType').value;
  const title    = document.getElementById('reminderTitle').value.trim();
  const date     = document.getElementById('reminderDate').value;
  const mileage  = document.getElementById('reminderMileage').value;
  const notes    = document.getElementById('reminderNotes').value.trim();
  if (!title||!date) { toast('Title and due date are required.','warning'); return; }
  btnLoad('saveReminderBtn', true);
  try {
    const { error } = await sb.from('maintenance_reminders').insert({ user_id:S.user.id, type, title, due_date:date, mileage:mileage||null, notes:notes||null });
    if (error) throw error;
    toast('Reminder saved! 🔔','success');
    ['reminderTitle','reminderDate','reminderMileage','reminderNotes'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('reminderForm').classList.add('hidden');
    loadReminders();
  } catch(e) { toast(e.message,'error'); }
  finally { btnLoad('saveReminderBtn', false); }
}

async function completeReminder(id) {
  await sb.from('maintenance_reminders').update({is_completed:true, completed_at:new Date().toISOString()}).eq('id',id);
  toast('✅ Reminder completed! Great job keeping up with maintenance.','success'); loadReminders();
}
async function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  await sb.from('maintenance_reminders').delete().eq('id',id);
  toast('Reminder deleted.'); loadReminders();
}

/* ════════════════════════════════════════════════════════════════
   AI DIAGNOSIS
════════════════════════════════════════════════════════════════ */

let aiInitialised = false;
function initAI() {
  if (aiInitialised) return;
  aiInitialised = true;
  const chips = document.getElementById('aiChips');
  AI_PROBLEMS.forEach(p => {
    const chip = document.createElement('button');
    chip.className = 'ai-chip';
    chip.textContent = `${p.emoji} ${p.label}`;
    chip.addEventListener('click', () => sendAI(`My car has a ${p.label.toLowerCase()} problem`, p.key));
    chips.appendChild(chip);
  });
}

function sendAI(textOverride, keyHint=null) {
  const input = document.getElementById('chatInput');
  const msg   = textOverride || input.value.trim();
  if (!msg) return;
  input.value = ''; input.style.height = 'auto';
  appendMsg(msg, 'user');

  // Typing indicator
  const typing = appendMsg('<em>WRENCH AI is thinking…</em>', 'bot');
  typing.style.opacity = '.6';

  setTimeout(() => {
    typing.remove();
    const key = keyHint || detectKey(msg);
    if (key === 'findShops') { goTo('shops'); return; }
    appendMsg(AI_KB[key]||AI_KB.default, 'bot');
    setTimeout(() => {
      appendMsg('Would you like me to find repair shops near you for this issue? 👉 <a href="#" onclick="goTo(\'shops\');return false" style="color:var(--fire);font-weight:700">Find Shops →</a>', 'bot');
    }, 600);
  }, 1200 + Math.random()*700);
}

function detectKey(msg) {
  const m = msg.toLowerCase();
  if (/engine|stall|misfire|idle|rough|won.?t start/.test(m)) return 'engine';
  if (/brake|braking|stop|squeal|grind|pedal/.test(m))        return 'brake';
  if (/battery|dead|charge|alternator|won.?t start/.test(m))  return 'battery';
  if (/ac|air.?con|cooling|cold|hot cabin/.test(m))           return 'ac';
  if (/oil|leak|drip|smoke/.test(m))                          return 'oil';
  if (/tyre|tire|flat|puncture|wheel|alignment/.test(m))      return 'tire';
  if (/overheat|temperature|hot engine/.test(m))              return 'overheat';
  if (/find|shop|mechanic|workshop/.test(m))                  return 'findShops';
  return 'default';
}

function appendMsg(html, side) {
  const feed = document.getElementById('chatFeed');
  const now  = new Date();
  const ts   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const div  = document.createElement('div');
  div.className = `chat-msg ${side==='user'?'user-msg':'bot-msg'}`;
  div.innerHTML = side==='bot'
    ? `<div class="msg-icon">🤖</div><div><div class="msg-bubble">${html}</div><div class="msg-time">${ts}</div></div>`
    : `<div><div class="msg-bubble">${esc(html)}</div><div class="msg-time" style="text-align:right">${ts}</div></div>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
  return div;
}

/* ════════════════════════════════════════════════════════════════
   TOW TRUCK
════════════════════════════════════════════════════════════════ */

async function submitTow() {
  const pickup = document.getElementById('towPickup').value.trim();
  if (!pickup) { toast('Please enter your pickup location.','warning'); return; }
  btnLoad('towSubmitBtn', true);
  try {
    const { error } = await sb.from('tow_requests').insert({
      user_id:             S.user.id,
      pickup_location:     'POINT(101.6869 3.1390)',
      pickup_address:      pickup,
      destination_address: document.getElementById('towDest').value.trim()||null,
      car_brand:           document.getElementById('towBrand').value||null,
      car_plate:           document.getElementById('towPlate').value.trim()||null,
      problem_description: document.getElementById('towNotes').value.trim()||null,
    });
    if (error) throw error;
    document.getElementById('towFormSection').classList.add('hidden');
    document.getElementById('towSuccessSection').classList.remove('hidden');
    toast('🚛 Tow request sent! A driver will contact you soon.','success',5000);
  } catch(e) { toast(e.message,'error'); }
  finally { btnLoad('towSubmitBtn', false); }
}

function resetTow() {
  document.getElementById('towFormSection').classList.remove('hidden');
  document.getElementById('towSuccessSection').classList.add('hidden');
  ['towPickup','towDest','towPlate','towNotes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('towBrand').value='';
}

/* ════════════════════════════════════════════════════════════════
   OWNER DASHBOARD
════════════════════════════════════════════════════════════════ */

async function loadDashboard() {
  try {
    const { data:shops } = await sb.from('repair_shops').select('id,avg_rating').eq('owner_id',S.user.id);
    if (!shops?.length) {
      document.getElementById('statBookings').textContent = '0';
      document.getElementById('statRating').textContent   = '—';
      document.getElementById('statRevenue').textContent  = 'RM 0';
      document.getElementById('dashAppts').innerHTML = '<p style="color:var(--muted);font-size:.875rem;padding:10px 0">Register your shop to see live data here.</p>';
      return;
    }
    const shopIds = shops.map(s=>s.id);
    const today   = new Date(); today.setHours(0,0,0,0);
    const [apptRes, revRes] = await Promise.all([
      sb.from('appointments').select('*, users(full_name), services(name)').in('shop_id',shopIds).gte('scheduled_at',today.toISOString()).order('scheduled_at'),
      sb.from('appointments').select('total_price').in('shop_id',shopIds).eq('status','completed').gte('created_at', new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString())
    ]);
    const appts  = apptRes.data||[];
    const rev    = (revRes.data||[]).reduce((sum,r)=>sum+(+r.total_price||0),0);
    const avgRat = shops.reduce((s,sh)=>s+(+sh.avg_rating||0),0)/shops.length;
    document.getElementById('statBookings').textContent = appts.length;
    document.getElementById('statRating').textContent   = avgRat.toFixed(1)+'★';
    document.getElementById('statRevenue').textContent  = `RM ${rev.toLocaleString()}`;
    const list = document.getElementById('dashAppts');
    list.innerHTML = '';
    if (!appts.length) { list.innerHTML='<p style="color:var(--muted);font-size:.875rem;padding:10px 0">No appointments scheduled for today.</p>'; return; }
    appts.slice(0,8).forEach(a=>{
      const row = document.createElement('div');
      row.className = 'dash-appt-row';
      row.innerHTML = `<div class="dash-time">${fmtTime(a.scheduled_at)}</div><div><div class="dash-name">${esc(a.users?.full_name||'Customer')}</div><div class="dash-svc">${esc(a.services?.name||'General service')}</div></div>${statusBadge(a.status)}`;
      list.appendChild(row);
    });
  } catch(e) { console.error('Dashboard error:', e); }
}

/* ════════════════════════════════════════════════════════════════
   PROFILE STATS
════════════════════════════════════════════════════════════════ */

async function loadProfileStats() {
  try {
    const [aRes, rRes] = await Promise.all([
      sb.from('appointments').select('id',{count:'exact',head:true}).eq('user_id',S.user.id),
      sb.from('reviews').select('id',{count:'exact',head:true}).eq('user_id',S.user.id),
    ]);
    document.getElementById('psBookings').textContent = aRes.count||0;
    document.getElementById('psFavs').textContent     = S.favorites.size;
    document.getElementById('psReviews').textContent  = rRes.count||0;
  } catch(e) { console.error(e); }
}

/* ════════════════════════════════════════════════════════════════
   EMERGENCY
════════════════════════════════════════════════════════════════ */

async function handleEmergency() {
  toast('🔍 Finding nearest emergency shop…','info',4000);
  try {
    const { data, error } = await sb.rpc('get_emergency_shop',{p_lat:3.1390, p_lng:101.6869});
    if (error||!data?.length) { toast('No emergency shops found near you right now.','warning'); return; }
    toast(`🚨 Found: ${data[0].name} — ${fmtDist(data[0].distance_meters)} away`,'success',5000);
    openShopDetail(data[0].id);
  } catch(e) { toast('Error finding emergency shop.','error'); }
}

/* ════════════════════════════════════════════════════════════════
   BRAND DROPDOWNS (for booking & tow forms)
════════════════════════════════════════════════════════════════ */

function fillBrandDropdowns() {
  ['bookingBrand','towBrand'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel||sel.options.length>1) return;
    BRANDS.forEach(b => { const o=document.createElement('option'); o.value=b; o.textContent=b; sel.appendChild(o); });
  });
}

/* ════════════════════════════════════════════════════════════════
   EVENT WIRING  (runs on DOMContentLoaded)
════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Auth ── */
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('signupBtn').addEventListener('click', doSignup);
  document.getElementById('googleBtn').addEventListener('click', () => sb.auth.signInWithOAuth({provider:'google'}));
  document.getElementById('goSignup').addEventListener('click', e => { e.preventDefault(); showPage('signup'); });
  document.getElementById('goLogin').addEventListener('click',  e => { e.preventDefault(); showPage('login'); });
  document.getElementById('logoutBtn').addEventListener('click', doLogout);

  // Enter key on login fields
  ['loginEmail','loginPassword'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
  });

  // Password toggles
  document.getElementById('toggleLoginPw')?.addEventListener('click', () => {
    const inp = document.getElementById('loginPassword');
    inp.type = inp.type==='password' ? 'text' : 'password';
  });
  document.getElementById('toggleSignupPw')?.addEventListener('click', () => {
    const inp = document.getElementById('signupPassword');
    inp.type = inp.type==='password' ? 'text' : 'password';
  });

  /* ── Global nav (data-nav attribute routing) ── */
  document.addEventListener('click', e => {
    const navEl = e.target.closest('[data-nav]');
    if (navEl && !navEl.closest('#brandGrid')) { // brand grid handles its own clicks
      goTo(navEl.dataset.nav);
    }
    // Close mobile menu on link click
    if (e.target.closest('[data-cm]') || e.target.closest('.drawer-link')) {
      document.getElementById('mobileDrawer').classList.add('hidden');
    }
  });

  /* ── Hamburger menu ── */
  document.getElementById('burgerBtn').addEventListener('click', () => {
    document.getElementById('mobileDrawer').classList.toggle('hidden');
  });

  /* ── Hero search ── */
  document.getElementById('heroSearchBtn').addEventListener('click', () => {
    const q = document.getElementById('heroInput').value.trim();
    goTo('shops');
    if (q) setTimeout(() => { document.getElementById('shopsInput').value=q; loadShopsPage(null); }, 200);
  });
  document.getElementById('heroInput').addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('heroSearchBtn').click(); });

  /* ── Emergency tile ── */
  document.getElementById('emergencyBtn').addEventListener('click', handleEmergency);

  /* ── Shops search ── */
  document.getElementById('shopsInput').addEventListener('input', () => {
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => loadShopsPage(S.selectedBrand), 350);
  });

  /* ── Brand page back & all shops ── */
  document.getElementById('brandsBack').addEventListener('click', goBack);
  document.getElementById('allShopsBtn').addEventListener('click', () => { S.selectedBrand=null; goTo('shops'); });

  /* ── Booking ── */
  document.getElementById('bookingBackBtn').addEventListener('click', goBack);
  document.getElementById('confirmBookingBtn').addEventListener('click', confirmBooking);
  // Update summary when service/car fields change
  ['bookingService','bookingBrand','bookingModel'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updateBookingSummary);
    document.getElementById(id)?.addEventListener('input',  updateBookingSummary);
  });

  /* ── Appointments tabs ── */
  document.getElementById('apptTabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('#apptTabs .tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    renderAppts(tab.dataset.filter);
  });
  document.getElementById('refreshApptsBtn').addEventListener('click', loadAppointments);

  /* ── Reminders ── */
  document.getElementById('addReminderBtn').addEventListener('click', () => {
    document.getElementById('reminderForm').classList.toggle('hidden');
  });
  document.getElementById('cancelReminderBtn').addEventListener('click', () => {
    document.getElementById('reminderForm').classList.add('hidden');
  });
  document.getElementById('saveReminderBtn').addEventListener('click', saveReminder);

  /* ── AI Chat ── */
  document.getElementById('chatSendBtn').addEventListener('click', () => sendAI());
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); }
  });
  document.getElementById('chatInput').addEventListener('input', function() {
    this.style.height='auto'; this.style.height=this.scrollHeight+'px';
  });
  document.getElementById('clearChatBtn').addEventListener('click', () => {
    document.getElementById('chatFeed').innerHTML='<div class="chat-msg bot-msg"><div class="msg-icon">🤖</div><div class="msg-bubble">Chat cleared. How can I help with your car today? 🔧</div></div>';
  });

  /* ── Tow ── */
  document.getElementById('towSubmitBtn').addEventListener('click', submitTow);
  document.getElementById('towResetBtn').addEventListener('click', resetTow);

  /* ── Modals ── */
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', closeModal));
  document.getElementById('modalOverlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
  document.getElementById('confirmCancelBtn').addEventListener('click', doCancel);
  document.getElementById('submitReviewBtn').addEventListener('click', submitReview);

  /* ── Star picker ── */
  const picker = document.getElementById('starPicker');
  picker.addEventListener('click', e => {
    const v = +e.target.dataset.v; if(!v) return;
    document.getElementById('reviewRating').value = v;
    picker.querySelectorAll('span').forEach((s,i) => s.classList.toggle('lit', i<v));
  });
  picker.addEventListener('mouseover', e => {
    const v = +e.target.dataset.v; if(!v) return;
    picker.querySelectorAll('span').forEach((s,i) => s.style.color = i<v?'var(--gold)':'');
  });
  picker.addEventListener('mouseleave', () => {
    const cur = +document.getElementById('reviewRating').value;
    picker.querySelectorAll('span').forEach((s,i) => { s.style.color=''; s.classList.toggle('lit',i<cur); });
  });

  /* ── Build filter chips early ── */
  renderBrandGrid();
  buildFilterChips();

}); // end DOMContentLoaded

/* ════════════════════════════════════════════════════════════════
   BOOT — Check Existing Auth Session
════════════════════════════════════════════════════════════════ */
(async function boot() {
  const MIN_SPLASH = new Promise(r => setTimeout(r, 1800));
  const sessionPr  = sb.auth.getSession();
  const [, { data:{session} }] = await Promise.all([MIN_SPLASH, sessionPr]);

  if (session?.user) {
    await bootApp(session.user);
  } else {
    showPage('login');
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event==='SIGNED_IN'  && session?.user && !S.user) await bootApp(session.user);
    if (event==='SIGNED_OUT') { S.user=null; document.getElementById('app').classList.add('hidden'); showPage('login'); }
  });
})();
