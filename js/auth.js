/* Hide a protected page until the sign-in/role check finishes, so a
   marketing user never sees even a flash of the task portal.
   While it waits, a branded loading animation is shown instead of a blank page. */
(function () {
  const CSS = `
.euo-splash{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:radial-gradient(900px 500px at 50% 38%,#e8f6f6 0%,#ffffff 60%);color:#0f172a;visibility:visible;font-family:Inter,system-ui,sans-serif;transition:opacity .45s ease,transform .45s ease}
.euo-splash.dark{background:radial-gradient(900px 500px at 50% 38%,#0d2a2a 0%,#0c111b 62%);color:#e7ebf3}
.euo-splash.out{opacity:0;transform:scale(1.04);pointer-events:none}
.euo-blob{position:relative;width:92px;height:92px;flex:none}
.euo-blob .g,.euo-blob .glow{position:absolute;inset:0;background:conic-gradient(from 0deg,#009090,#0FB9AE,#F47F1F,#F06422,#009090);animation:euoMorph 5.5s ease-in-out infinite,euoTurn 4s linear infinite}
.euo-blob .glow{filter:blur(18px);opacity:.55}
.euo-blob .in{position:absolute;inset:7px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;animation:euoPop 2.2s ease-in-out infinite}
.euo-dark .euo-blob .in,.euo-splash.dark .euo-blob .in{background:#0c111b}
.euo-blob .in img{width:56%;height:56%;object-fit:contain}
.euo-blob .in b{width:30%;height:30%;border-radius:50%;background:#F06422}
.euo-word{font:800 15px Sora,Inter,system-ui,sans-serif;letter-spacing:.42em;text-indent:.42em;text-transform:uppercase;background:linear-gradient(100deg,currentColor 35%,#F06422 50%,currentColor 65%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:euoShine 2.2s linear infinite}
.euo-msg{font-size:12.5px;opacity:.6;min-height:18px;text-align:center;padding:0 24px;margin-top:-14px}
.euo-sub{font-size:12.5px;min-height:16px;text-align:center;padding:0 24px;max-width:340px;margin-top:-18px;opacity:0;transition:opacity .4s}
.euo-slow .euo-sub{opacity:1;color:#b45309}
.euo-splash.dark.euo-slow .euo-sub{color:#f0b429}
.euo-mini{display:inline-flex;align-items:center;gap:10px;vertical-align:middle}
.euo-mini .euo-blob{width:20px;height:20px}.euo-mini .glow{display:none}.euo-mini .in{inset:3px}.euo-mini .in img{display:none}.euo-mini .in b{width:34%;height:34%}
.euo-skel{display:flex;flex-direction:column;gap:10px;padding:6px 2px;width:100%;max-width:560px}
.euo-skel i{display:block;height:13px;border-radius:8px;background:linear-gradient(90deg,rgba(148,163,184,.18) 25%,rgba(240,100,34,.22) 50%,rgba(148,163,184,.18) 75%);background-size:300% 100%;animation:euoShimmer 1.4s ease-in-out infinite}
.euo-skel i:nth-child(1){width:42%;height:16px}.euo-skel i:nth-child(2){width:96%}.euo-skel i:nth-child(3){width:78%}.euo-skel i:nth-child(4){width:60%}
.euo-bar{position:fixed;left:0;top:0;height:3px;width:100%;z-index:2147483100;overflow:hidden;opacity:0;transition:opacity .25s;pointer-events:none}
.euo-bar.on{opacity:1}
.euo-bar::before{content:"";position:absolute;top:0;bottom:0;width:38%;border-radius:3px;background:linear-gradient(90deg,transparent,#009090,#0FB9AE,#F06422,transparent);animation:euoSweep 1.1s ease-in-out infinite}
.euo-pill{position:fixed;left:50%;bottom:22px;transform:translate(-50%,24px);opacity:0;z-index:2147483100;display:flex;align-items:center;gap:10px;background:rgba(22,32,51,.92);backdrop-filter:blur(10px);color:#f3f5fa;padding:9px 16px 9px 12px;border-radius:999px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3);transition:all .3s ease;pointer-events:none;max-width:calc(100vw - 24px)}
.euo-pill.on{opacity:1;transform:translate(-50%,0)}
.euo-pill.off{background:rgba(127,29,29,.95)}
@keyframes euoMorph{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}25%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}50%{border-radius:50% 50% 33% 67%/55% 27% 73% 45%}75%{border-radius:70% 30% 50% 50%/30% 30% 70% 70%}}
@keyframes euoTurn{to{transform:rotate(360deg)}}
@keyframes euoPop{0%,100%{transform:scale(1)}50%{transform:scale(.93)}}
@keyframes euoShine{to{background-position:-250% 0}}
@keyframes euoShimmer{0%{background-position:100% 0}100%{background-position:-200% 0}}
@keyframes euoSweep{0%{left:-40%}100%{left:102%}}
@media (prefers-reduced-motion:reduce){.euo-blob .g,.euo-blob .glow,.euo-word,.euo-skel i,.euo-bar::before{animation-duration:8s}}`;
  const blob = () => '<div class="euo-blob"><span class="glow"></span><span class="g"></span><span class="in"><img src="assets/logo-mark.png" alt="" onerror="this.outerHTML=\'<b></b>\'"></span></div>';
  window.EuoLoader = { orbit: blob, mini: (text) => '<span class="euo-mini">' + blob() + '<span>' + (text || 'Loading…') + '</span></span>', skeleton: (text) => '<div class="euo-skel" role="status" aria-label="' + (text || 'Loading') + '"><i></i><i></i><i></i><i></i></div>' };
  const dark = () => { try { return localStorage.getItem('euodoo-dark-mode') === '1'; } catch (e) { return false; } };
  const st = document.createElement('style'); st.textContent = CSS; (document.head || document.documentElement).appendChild(st);

  let splash = null, startT = Date.now(), minUntil = 0;
  const SLOW = 'Slow connection — still working on it…', VERY = 'Your internet is very slow or lost. This page keeps trying — please wait or check your connection.';
  function showSplash() {
    if (splash) return;
    minUntil = Date.now() + 700; splash = document.createElement('div'); splash.className = 'euo-splash' + (dark() ? ' dark' : '');
    splash.innerHTML = blob() + '<div class="euo-word">Euodoo</div><div class="euo-msg">Getting things ready…</div><div class="euo-sub"></div>';
    document.documentElement.appendChild(splash);
    const tick = setInterval(() => {
      if (!splash) return clearInterval(tick);
      const s = (Date.now() - startT) / 1000, sub = splash.querySelector('.euo-sub');
      if (s > 5) splash.classList.add('euo-slow');
      sub.textContent = s > 15 ? VERY : s > 5 ? SLOW : '&nbsp;'.replace('&nbsp;','');
    }, 700);
  }
  window.hideEuoSplash = function () { if (!splash) return; const wait = Math.max(0, minUntil - Date.now()); setTimeout(() => { const x = splash; if (!x) return; splash = null; x.classList.add('out'); setTimeout(() => x.remove(), 500); }, wait); };

  try {
    const open = /(^\/?$|index|404|client-view|reset)/i.test(window.location.pathname);
    if (!open) {
      document.documentElement.style.visibility = 'hidden';
      showSplash();
      setTimeout(function () { document.documentElement.style.visibility = ''; window.hideEuoSplash(); }, 25000); // failsafe
    }
  } catch (e) {}

  // thin sweeping bar + "slow connection" / "offline" pill while requests are in flight
  const ready = () => {
    const bar = document.createElement('div'); bar.className = 'euo-bar';
    const pill = document.createElement('div'); pill.className = 'euo-pill';
    document.body.appendChild(bar); document.body.appendChild(pill);
    let n = 0, barT = null, slowT = null;
    const pillOn = (html, off) => { pill.innerHTML = html; pill.classList.toggle('off', !!off); pill.classList.add('on'); };
    const pillOff = () => pill.classList.remove('on');
    const update = () => {
      if (!navigator.onLine) { pillOn(window.EuoLoader.mini('You are offline — reconnecting…'), true); return; }
      if (n > 0) {
        if (!barT) barT = setTimeout(() => bar.classList.add('on'), 300);
        if (!slowT) slowT = setTimeout(() => pillOn(window.EuoLoader.mini('Slow connection — still loading…')), 6000);
      } else {
        clearTimeout(barT); clearTimeout(slowT); barT = slowT = null; bar.classList.remove('on'); pillOff();
      }
    };
    window.addEventListener('euo-net', (e) => { n = e.detail; update(); });
    window.addEventListener('offline', update); window.addEventListener('online', update);
    if (!navigator.onLine) update();
    // every "Loading…" note in the portal gets the animated loader
    const swap = () => document.querySelectorAll('.portal-note:not(.euo-done)').forEach(el => {
      const t = (el.textContent || '').trim();
      if (el.children.length === 0 && /^Loading/i.test(t)) { el.classList.add('euo-done'); el.innerHTML = window.EuoLoader.skeleton(t); }
    });
    swap(); let q = null;
    new MutationObserver(() => { if (!q) q = setTimeout(() => { q = null; swap(); }, 60); }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
})();
function openAuthGate() { try { document.documentElement.style.visibility = ''; if (window.hideEuoSplash) window.hideEuoSplash(); } catch (e) {} }


// ============================================================
// Timer guard — runs on every page while a timer is on.
//  • shows a small "timer running" chip on every page
//  • asks before the tab/window is closed (the browser shows its own "Leave site?" box)
//  • stops the timer if the tab is left for 2 minutes, or there is no activity for 10 minutes,
//    and logs only the time up to the moment you left
//  • pings the server every 30 s, so a closed page / sleeping computer never counts away time
// ============================================================
const EuoTimer = (() => {
  const T = Object.assign({ hiddenMs: 120000, idleMs: 600000, beatMs: 30000, staleMs: 180000 }, window.__EUO_T || {});
  const st = { row: null, tick: null, beat: null, hiddenAt: 0, hiddenTO: null, lastInput: Date.now(), tabId: Math.random().toString(36).slice(2), internal: false, wired: false };
  const fmt = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(t / 3600), Math.floor(t % 3600 / 60), t % 60].map(n => String(n).padStart(2, '0')).join(':'); };
  const onTimerPage = () => /(^|\/)(myday|task)\.html$/i.test(location.pathname);
  const note = (k, a, b) => { try { showToast(k, a, b); } catch (e) {} };

  function chip() {
    let el = document.getElementById('euoTimerChip');
    if (!st.row || onTimerPage()) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'euoTimerChip';
      el.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483050;display:flex;align-items:center;gap:10px;background:#fff7ed;color:#7c2d12;border:1px solid #fdba74;border-radius:999px;padding:8px 8px 8px 14px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2);max-width:calc(100vw - 24px)';
      document.body.appendChild(el);
    }
    const title = st.row.tasks && st.row.tasks.title ? st.row.tasks.title : 'a task';
    el.innerHTML = `<span style="width:9px;height:9px;border-radius:50%;background:#ef4444;animation:euoPop 1.2s ease-in-out infinite;flex:none"></span>
      <b id="euoTimerClock" style="font:700 13px 'JetBrains Mono',monospace;">00:00:00</b>
      <a href="task.html?id=${st.row.task_id}" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-decoration:underline;color:inherit;">${escapeHtml(title)}</a>
      <button type="button" style="border:0;background:#c2410c;color:#fff;border-radius:999px;padding:6px 12px;font:600 12px Inter,system-ui,sans-serif;cursor:pointer;" onclick="EuoTimer.stop()">Stop</button>`;
  }
  function paint() { const c = document.getElementById('euoTimerClock'); if (c && st.row) c.textContent = fmt(Date.now() - new Date(st.row.started_at).getTime()); }

  async function stopWith(endMs, why) {
    const { data, error } = await supabaseClient.rpc('stop_timer', endMs ? { p_end: new Date(endMs).toISOString() } : {});
    if (error) return null;
    const r = (data || [])[0];
    st.row = null; arm(); chip();
    window.dispatchEvent(new CustomEvent('euo-timer'));
    if (r) {
      const h = Number(r.hours);
      if (why) note(h > 0 ? 'warning' : 'info', 'Timer stopped', why + (h > 0 ? ` ${h}h was logged.` : ' It was under a minute, so nothing was logged.'));
      else note(h > 0 ? 'success' : 'info', h > 0 ? 'Time logged' : 'Timer stopped', h > 0 ? `${h}h added${r.capped ? ' (a timer is capped at 12 hours)' : ''}.` : 'Under a minute, so nothing was logged.');
    }
    return r;
  }

  const activeElsewhere = () => { try { const v = JSON.parse(localStorage.getItem('euo-active') || 'null'); return v && v.tab !== st.tabId && Date.now() - v.at < 40000; } catch (e) { return false; } };
  const markActive = () => { try { localStorage.setItem('euo-active', JSON.stringify({ tab: st.tabId, at: Date.now() })); } catch (e) {} };

  function arm() {
    clearInterval(st.tick); clearInterval(st.beat); clearTimeout(st.hiddenTO);
    if (!st.row) return;
    st.tick = setInterval(paint, 1000); paint();
    st.beat = setInterval(async () => {
      if (!st.row) return;
      if (document.visibilityState === 'visible') {
        markActive();
        if (Date.now() - st.lastInput > T.idleMs) { stopWith(st.lastInput, 'There was no activity for 10 minutes, so the timer was stopped when you went quiet.'); return; }
        const { data, error } = await supabaseClient.rpc('timer_heartbeat');
        if (!error && data === false) refresh();      // it had already gone quiet: settle it
      }
    }, T.beatMs);
    if (document.visibilityState === 'hidden') hiddenStart();
  }
  function hiddenStart() {
    clearTimeout(st.hiddenTO); st.hiddenAt = st.hiddenAt || Date.now();
    st.hiddenTO = setTimeout(hiddenCheck, T.hiddenMs);
  }
  function hiddenCheck() {
    if (!st.row || document.visibilityState !== 'hidden') return;
    if (activeElsewhere()) { st.hiddenTO = setTimeout(hiddenCheck, 20000); return; }   // you are in another portal tab
    stopWith(st.hiddenAt, 'The timer was stopped because you left this page.');
  }

  async function refresh() {
    if (!window.__currentProfile) return;
    const { data, error } = await supabaseClient.from('task_timers').select('task_id, started_at, last_seen, tasks(title)').eq('user_id', window.__currentProfile.id).maybeSingle();
    if (error) return;
    st.row = data || null;
    if (st.row && Date.now() - new Date(st.row.last_seen).getTime() > T.staleMs) {
      // the page was closed (or the computer slept) while the timer was on — settle it up to the last ping
      await stopWith(null, 'You left while the timer was running, so it was stopped at the last moment you were here.'); return;
    }
    arm(); chip(); window.dispatchEvent(new CustomEvent('euo-timer'));
  }

  function wire() {
    if (st.wired) return; st.wired = true;
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { st.lastInput = Date.now(); }, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => {
      if (!st.row) return;
      if (document.visibilityState === 'hidden') { st.hiddenAt = 0; hiddenStart(); }
      else {
        clearTimeout(st.hiddenTO);
        const away = st.hiddenAt ? Date.now() - st.hiddenAt : 0, at = st.hiddenAt; st.hiddenAt = 0;
        if (away > T.hiddenMs && !activeElsewhere()) stopWith(at, 'The timer was stopped because you left this page.');   // timers were paused by the browser
        else { st.lastInput = Date.now(); markActive(); }
      }
    });
    // clicking a link inside the portal is not "leaving"
    document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (a && a.origin === location.origin && !a.target) { st.internal = true; setTimeout(() => { st.internal = false; }, 1500); } }, true);
    window.addEventListener('beforeunload', (e) => { if (st.row && !st.internal) { e.preventDefault(); e.returnValue = 'Your timer is still running.'; return e.returnValue; } });
  }
  return { init() { wire(); return refresh(); }, refresh, stop: () => stopWith(null, null), running: () => !!st.row };
})();

// "My Day" shortcut at the top of every sidebar (added here so no page needs editing)
function addMyDayLink(profile) {
  try {
    const nav = document.querySelector('.portal-sidebar nav');
    if (!nav || nav.querySelector('a[href="myday.html"]') || profile.role === 'marketing') return;
    const a = document.createElement('a');
    a.className = 'portal-nav-item'; a.href = 'myday.html';
    a.innerHTML = '<span class="portal-nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></span> My Day';
    nav.insertBefore(a, nav.firstChild);
  } catch (e) {}
}

// ============================================================
// Auth helpers shared across every page
// ============================================================

// Redirects to login if no active session. Returns {user, profile}.
async function requireAuth(opts) {
  opts = opts || {};
  flushPendingToast();
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  let { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('id, name, email, role, avatar_color, created_at, suspended')
    .eq('id', session.user.id)
    .single();
  if (error) {   // database not updated with the suspension column yet: carry on without it
    ({ data: profile, error } = await supabaseClient.from('profiles').select('id, name, email, role, avatar_color, created_at').eq('id', session.user.id).single());
  }

  if (error || !profile) {
    console.error('Could not load profile', error);
    window.location.href = 'index.html';
    return null;
  }
  // A suspended person is signed out straight away (the database also refuses them everything).
  if (profile.suspended) {
    try { sessionStorage.setItem('euo-suspended', '1'); } catch (e) {}
    try { await supabaseClient.auth.signOut(); } catch (e) {}
    window.location.replace('index.html');
    return null;
  }
  window.__currentProfile = profile;

  // Marketing accounts live ONLY in the Follow-Up Register. Any other page
  // sends them straight back (the database also refuses them the data).
  if (profile.role === 'marketing' && !opts.register) {
    try { sessionStorage.setItem('rg-blocked', window.location.pathname); } catch (e) {}
    window.location.replace('register.html');
    return null;
  }
  // The register is for marketing + admin only.
  if (opts.register && profile.role !== 'marketing' && profile.role !== 'admin') {
    window.location.replace('dashboard.html');
    return null;
  }
  addMyDayLink(profile);
  startPresence(profile.id);
  openAuthGate();
  if (opts.standalone) {
    try { if (localStorage.getItem('euodoo-dark-mode') === '1') document.body.classList.add('dark-mode'); } catch (e) {}
    return { user: session.user, profile };
  }
  initNotifications();
  initTopBar();
  EuoTimer.init();
  applyRoleBadge(profile);
  checkDueReminders(profile);
  return { user: session.user, profile };
}

/* Presence: a light heartbeat while a portal tab is open. The SERVER measures
   the time between beats, so it can't be inflated from the browser. It counts a
   tab that is merely open (even in the background) and separately counts the
   time the tab was actually in front of the person. */
function startPresence(uid) {
  if (window.__presenceOn) return;
  window.__presenceOn = true;
  let sid = null;
  try { sid = sessionStorage.getItem('euodoo-sid:' + uid); } catch (e) {}
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
    try { sessionStorage.setItem('euodoo-sid:' + uid, sid); } catch (e) {}
  }
  const beat = () => {
    supabaseClient.rpc('track_presence', {
      p_session: sid, p_visible: document.visibilityState === 'visible',
      p_page: (window.location.pathname.split('/').pop() || 'index.html'), p_user_agent: navigator.userAgent
    }).then(() => {}, () => {});
  };
  beat();
  setInterval(beat, 30000);
  document.addEventListener('visibilitychange', beat);
  window.addEventListener('pagehide', beat);
}

function isAdmin(profile) {
  return profile && profile.role === 'admin';
}

async function logout() {
  queueToast('success', 'Signed out', "You've been logged out safely.");
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ============================================================
   SHARED INLINE SVG ICON SET — used everywhere instead of emoji
   ============================================================ */
const SVG_PATHS = {
  check:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  wrench:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2z"/></svg>',
  eye:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  'eye-off':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>',
  blocked:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  flag:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  edit:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  comment:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
  bell:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  warning:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  clock:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  x:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  info:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  search:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  dot:        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>',
  folder:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  'arrow-left':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  'arrow-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
};

function icon(name, size) {
  size = size || 14;
  return `<span class="i" style="display:inline-flex; vertical-align:-3px; width:${size}px; height:${size}px;">${(SVG_PATHS[name] || '').replace('<svg ', '<svg style="width:100%;height:100%;" ')}</span>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function statusPillClass(status) {
  return {
    todo: 'status-pill status-muted',
    in_progress: 'status-pill status-blue',
    blocked: 'status-pill status-red',
    review: 'status-pill status-halfday',
    pending_approval: 'status-pill status-gold',
    done: 'status-pill status-green'
  }[status] || 'status-pill status-muted';
}

function priorityPillClass(priority) {
  return {
    low: 'status-pill priority-low',
    medium: 'status-pill priority-medium',
    high: 'status-pill priority-high',
    urgent: 'status-pill priority-urgent'
  }[priority] || 'status-pill priority-low';
}

function statusLabel(s) { return (s || '').replace('_', ' '); }

function timelineVariant(status) {
  if (status === 'done') return 'mint';
  if (status === 'in_progress' || status === 'review') return 'sky';
  return 'peach'; // todo, blocked, pending_approval
}

function timelineIcon(status) {
  return icon({ done: 'check', in_progress: 'wrench', review: 'eye', blocked: 'blocked', pending_approval: 'flag' }[status] || 'edit');
}

function commentIcon() { return icon('comment'); }

/* ============================================================
   @MENTIONS — roster is an array of {id, name}
   ============================================================ */
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function extractMentions(text, roster) {
  const found = new Set();
  (roster || []).forEach(p => {
    const first = p.name.split(' ')[0];
    const re = new RegExp('@(' + escapeRegExp(p.name) + '|' + escapeRegExp(first) + ')\\b', 'i');
    if (re.test(text)) found.add(p.id);
  });
  return Array.from(found);
}

function highlightMentions(text, roster) {
  let html = escapeHtml(text);
  (roster || []).forEach(p => {
    const first = p.name.split(' ')[0];
    const re = new RegExp('@(' + escapeRegExp(p.name) + '|' + escapeRegExp(first) + ')\\b', 'gi');
    html = html.replace(re, '<span style="background:rgba(79,63,240,0.12); color:var(--primary); font-weight:600; padding:1px 5px; border-radius:5px;">@$1</span>');
  });
  return html;
}

/* ============================================================
   TOAST NOTIFICATIONS (with optional sound)
   ============================================================ */
function playTone(freq, duration, waveType) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = waveType || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (e) { /* audio not available — fail silently */ }
}

// Plays two quick notes back to back — a tiny "chime" instead of one flat beep.
function playChime(freq1, freq2, duration, waveType) {
  playTone(freq1, duration, waveType);
  setTimeout(() => playTone(freq2, duration, waveType), duration * 0.55);
}

// Distinct sound per toast type, so every change gets an audible cue
// without every notification sounding identical.
function playToastSound(type) {
  switch (type) {
    case 'success': playChime(660, 990, 110, 'sine'); break;     // bright two-note "done" chime
    case 'error':   playTone(220, 320, 'square'); break;         // low buzz
    case 'warning': playChime(520, 440, 130, 'triangle'); break; // gentle two-note alert
    case 'info':
    default:        playTone(760, 150, 'sine'); break;           // soft single ping
  }
}

function ensureToastContainer() {
  let c = document.getElementById('portalToastContainer');
  if (!c) {
    c = document.createElement('div');
    c.className = 'portal-toast-container';
    c.id = 'portalToastContainer';
    document.body.appendChild(c);
  }
  return c;
}

function showToast(type, title, message, opts) {
  opts = opts || {};
  const container = ensureToastContainer();
  const card = document.createElement('div');
  card.className = `portal-toast-card portal-toast-card--${type}`;
  const icons = { success: icon('check', 14), error: icon('x', 14), info: icon('info', 14), warning: icon('warning', 14) };
  card.innerHTML = `
    <div class="portal-toast-icon">${icons[type] || ''}</div>
    <div>
      <div class="portal-toast-title">${escapeHtml(title)}</div>
      <div class="portal-toast-msg">${escapeHtml(message)}</div>
    </div>`;
  container.appendChild(card);
  // Sound plays for every toast by default now — pass { sound: false } to opt out.
  if (opts.sound !== false) playToastSound(type);
  setTimeout(() => {
    card.classList.add('is-leaving');
    setTimeout(() => card.remove(), 220);
  }, opts.duration || 3400);
}

// Queue a toast to show on the NEXT page (used before a redirect, e.g. login/logout)
function queueToast(type, title, message, opts) {
  sessionStorage.setItem('pendingToast', JSON.stringify({ type, title, message, opts: opts || {} }));
}

// Runs an insert/update/delete and tells the user if it silently did nothing.
// (Row-level security can reject a write WITHOUT raising an error — the query
// just affects 0 rows — so checking `error` alone isn't enough.)
async function writeChecked(query, failMsg) {
  const { data, error } = await query.select();
  if (error || !data || !data.length) {
    await customAlert((failMsg || 'That change could not be saved.') + (error ? ' ' + error.message : ' You may not have permission.'), { title: 'Not saved', danger: true });
    return false;
  }
  return true;
}

function flushPendingToast() {
  const raw = sessionStorage.getItem('pendingToast');
  if (!raw) return;
  sessionStorage.removeItem('pendingToast');
  try {
    const { type, title, message, opts } = JSON.parse(raw);
    showToast(type, title, message, opts);
  } catch (e) { /* ignore malformed payload */ }
}

/* ============================================================
   CUSTOM DIALOGS — styled replacements for the browser's native
   confirm()/alert()/prompt(), which can't be themed at all (they
   render as plain OS chrome, no CSS reaches them). These build on
   the same .premium-modal markup used elsewhere in the app, so a
   confirmation looks like part of the product instead of a browser
   popup. Each returns a Promise — call sites need `await`.
   ============================================================ */
function closeCustomDialog(wrap, onKey, resolve, value) {
  wrap.classList.add('is-leaving');
  document.removeEventListener('keydown', onKey);
  setTimeout(() => wrap.remove(), 150);
  resolve(value);
}

function customConfirm(message, opts) {
  opts = opts || {};
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'premium-modal is-open confirm-dialog';
    wrap.innerHTML = `
      <div class="premium-modal__backdrop"></div>
      <div class="premium-modal__dialog confirm-dialog__box" role="alertdialog" aria-modal="true">
        ${opts.title ? `<h3 class="confirm-dialog__title">${escapeHtml(opts.title)}</h3>` : ''}
        <p class="confirm-dialog__msg">${escapeHtml(message)}</p>
        <div class="premium-modal__actions">
          <button type="button" class="btn btn-secondary" data-act="cancel">${escapeHtml(opts.cancelText || 'Cancel')}</button>
          <button type="button" class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${escapeHtml(opts.confirmText || 'OK')}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const onKey = (e) => {
      if (e.key === 'Escape') closeCustomDialog(wrap, onKey, resolve, false);
      if (e.key === 'Enter') closeCustomDialog(wrap, onKey, resolve, true);
    };
    document.addEventListener('keydown', onKey);
    wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, false));
    wrap.querySelector('[data-act="ok"]').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, true));
    wrap.querySelector('.premium-modal__backdrop').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, false));
    wrap.querySelector('[data-act="ok"]').focus();
  });
}

function customAlert(message, opts) {
  opts = opts || {};
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = `premium-modal is-open confirm-dialog ${opts.danger ? 'confirm-dialog--error' : ''}`;
    wrap.innerHTML = `
      <div class="premium-modal__backdrop"></div>
      <div class="premium-modal__dialog confirm-dialog__box" role="alertdialog" aria-modal="true">
        ${opts.title ? `<h3 class="confirm-dialog__title">${escapeHtml(opts.title)}</h3>` : ''}
        <p class="confirm-dialog__msg">${escapeHtml(message)}</p>
        <div class="premium-modal__actions">
          <button type="button" class="btn btn-primary" data-act="ok">${escapeHtml(opts.okText || 'Got it')}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') closeCustomDialog(wrap, onKey, resolve, undefined);
    };
    document.addEventListener('keydown', onKey);
    wrap.querySelector('[data-act="ok"]').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, undefined));
    wrap.querySelector('.premium-modal__backdrop').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, undefined));
    wrap.querySelector('[data-act="ok"]').focus();
  });
}

function customPrompt(message, defaultValue, opts) {
  opts = opts || {};
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'premium-modal is-open confirm-dialog';
    wrap.innerHTML = `
      <div class="premium-modal__backdrop"></div>
      <div class="premium-modal__dialog confirm-dialog__box" role="alertdialog" aria-modal="true">
        ${opts.title ? `<h3 class="confirm-dialog__title">${escapeHtml(opts.title)}</h3>` : ''}
        <p class="confirm-dialog__msg">${escapeHtml(message)}</p>
        <input type="text" class="input-box confirm-dialog__input" id="customPromptInput" value="${escapeHtml(defaultValue || '')}" placeholder="${escapeHtml(opts.placeholder || '')}">
        <div class="premium-modal__actions">
          <button type="button" class="btn btn-secondary" data-act="cancel">${escapeHtml(opts.cancelText || 'Cancel')}</button>
          <button type="button" class="btn btn-primary" data-act="ok">${escapeHtml(opts.okText || 'Save')}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('#customPromptInput');
    const submit = () => closeCustomDialog(wrap, onKey, resolve, input.value);
    const onKey = (e) => {
      if (e.key === 'Escape') closeCustomDialog(wrap, onKey, resolve, null);
      if (e.key === 'Enter') submit();
    };
    document.addEventListener('keydown', onKey);
    wrap.querySelector('[data-act="cancel"]').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, null));
    wrap.querySelector('[data-act="ok"]').addEventListener('click', submit);
    wrap.querySelector('.premium-modal__backdrop').addEventListener('click', () => closeCustomDialog(wrap, onKey, resolve, null));
    input.focus();
    input.select();
  });
}

/* ============================================================
   DUE-DATE URGENCY
   ============================================================ */
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

function dueUrgency(dueDate, status) {
  if (!dueDate || status === 'done') return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days <= 3) return 'soon';
  return null;
}

// Escalates the priority badge when the due date is close, regardless of the stored priority
function priorityPillClassUrgent(priority, dueDate, status) {
  const urgency = dueUrgency(dueDate, status);
  const base = priorityPillClass(priority);
  if (urgency === 'overdue') return 'status-pill priority-urgent is-urgent';
  if (urgency === 'today' || urgency === 'tomorrow') return base + ' is-urgent';
  return base;
}

function dueDateLabel(dueDate, status) {
  if (!dueDate) return '';
  const urgency = dueUrgency(dueDate, status);
  const formatted = new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (urgency === 'overdue') return `${icon('warning', 12)} Overdue · was ${formatted}`;
  if (urgency === 'today') return `${icon('clock', 12)} Due today`;
  if (urgency === 'tomorrow') return `${icon('clock', 12)} Due tomorrow`;
  return `Due ${formatted}`;
}

/* ============================================================
   ACCOUNT MODAL — rename + change password, opened from the
   sidebar user chip instead of that chip logging out directly.
   ============================================================ */
function ensureAccountModal() {
  if (document.getElementById('accountModal')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="premium-modal" id="accountModal">
      <div class="premium-modal__backdrop" onclick="closeAccountModal()"></div>
      <div class="premium-modal__dialog">
        <button class="premium-modal__close" onclick="closeAccountModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <div class="section-tag">Account</div>
        <h3>Your Profile</h3>

        <div class="portal-field">
          <label>Display Name</label>
          <input type="text" class="input-box" id="acctName">
        </div>
        <button class="btn btn-primary" style="width:100%; justify-content:center; margin-bottom:6px;" onclick="saveAccountName()">Save Name</button>

        <div class="portal-divider"></div>

        <div class="portal-field">
          <label>New Password</label>
          <input type="password" class="input-box" id="acctPass1" placeholder="At least 6 characters">
        </div>
        <div class="portal-field">
          <label>Confirm New Password</label>
          <input type="password" class="input-box" id="acctPass2" placeholder="Repeat password">
        </div>
        <button class="btn btn-primary" style="width:100%; justify-content:center; margin-bottom:6px;" onclick="saveAccountPassword()">Change Password</button>

        <div class="portal-divider"></div>
        <button class="btn btn-outline-danger" style="width:100%; justify-content:center;" onclick="logout()">Log Out</button>
      </div>
    </div>`;
  document.body.appendChild(wrap.firstElementChild);
}

function openAccountModal() {
  ensureAccountModal();
  const p = window.__currentProfile;
  document.getElementById('acctName').value = p ? p.name : '';
  document.getElementById('acctPass1').value = '';
  document.getElementById('acctPass2').value = '';
  document.getElementById('accountModal').classList.add('is-open');
}

function closeAccountModal() {
  const m = document.getElementById('accountModal');
  if (m) m.classList.remove('is-open');
}

async function saveAccountName() {
  const name = document.getElementById('acctName').value.trim();
  if (!name) { showToast('error', 'Name required', 'Please enter a name.'); return; }

  const { error } = await supabaseClient.from('profiles').update({ name }).eq('id', window.__currentProfile.id);
  if (error) { showToast('error', 'Could not update', error.message); return; }

  window.__currentProfile.name = name;
  const nameEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = name;
  if (avatarEl) avatarEl.textContent = initials(name);

  showToast('success', 'Saved', 'Your name has been updated.');
  closeAccountModal();
}

async function saveAccountPassword() {
  const p1 = document.getElementById('acctPass1').value;
  const p2 = document.getElementById('acctPass2').value;
  if (!p1 || p1.length < 6) { showToast('error', 'Too short', 'Password must be at least 6 characters.'); return; }
  if (p1 !== p2) { showToast('error', 'Mismatch', "Passwords don't match."); return; }

  const { error } = await supabaseClient.auth.updateUser({ password: p1 });
  if (error) { showToast('error', 'Could not update', error.message); return; }

  document.getElementById('acctPass1').value = '';
  document.getElementById('acctPass2').value = '';
  showToast('success', 'Password changed', 'Your password has been updated.');
}

/* ============================================================
   NOTIFICATION BELL — injected on every page, checked on load
   ============================================================ */
function ensureNotificationBell() {
  if (document.getElementById('notifBell')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="notifBell" style="position:fixed; top:20px; right:24px; z-index:70;">
      <button id="notifBtn" style="position:relative; width:38px; height:38px; border-radius:10px; border:1px solid var(--border-rule); background:var(--surface); box-shadow:0 1px 3px rgba(15,23,42,.08); display:flex; align-items:center; justify-content:center; color:var(--ink-soft); cursor:pointer;">
        ${icon('bell', 17)}
        <span id="notifBadge" style="display:none; position:absolute; top:-4px; right:-4px; min-width:16px; height:16px; padding:0 4px; border-radius:999px; background:#ef4444; color:#fff; font-size:10px; font-weight:700; align-items:center; justify-content:center;"></span>
      </button>
      <div id="notifPanel" style="display:none; position:absolute; top:46px; right:0; width:320px; max-height:400px; overflow-y:auto; background:var(--surface); border:1px solid var(--border-rule); border-radius:12px; box-shadow:0 4px 18px rgba(15,23,42,.12); padding:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px 10px;">
          <b style="font-size:.82rem;">Notifications</b>
          <button onclick="markAllNotificationsRead()" style="background:none; border:none; color:var(--primary); font-size:11.5px; font-weight:600; cursor:pointer;">Mark all read</button>
        </div>
        <div id="notifList"></div>
      </div>
    </div>`;
  document.body.appendChild(wrap.firstElementChild);
  document.getElementById('notifBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const p = document.getElementById('notifPanel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', (e) => {
    const bell = document.getElementById('notifBell');
    if (bell && !bell.contains(e.target)) document.getElementById('notifPanel').style.display = 'none';
  });
}

async function refreshNotifications() {
  const me = window.__currentProfile;
  if (!me) return;
  const { data, error } = await supabaseClient
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(name), tasks(title), task_updates(update_text)')
    .eq('user_id', me.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return;

  const unread = (data || []).filter(n => !n.is_read).length;
  const badge = document.getElementById('notifBadge');
  if (badge) {
    if (unread > 0) { badge.textContent = unread > 9 ? '9+' : String(unread); badge.style.display = 'flex'; }
    else badge.style.display = 'none';
  }

  const list = document.getElementById('notifList');
  if (!list) return;
  if (!data || data.length === 0) {
    list.innerHTML = `<p class="portal-note" style="padding:10px; text-align:center;">No notifications yet.</p>`;
    return;
  }
  list.innerHTML = data.map(n => `
    <a href="task.html?id=${n.task_id}" onclick="markNotificationRead('${n.id}')" style="display:block; padding:8px 10px; border-radius:8px; margin-bottom:2px; ${n.is_read ? '' : 'background:#eff6ff;'}">
      <div style="font-size:.8rem;">${n.message ? escapeHtml(n.message) : `<b>${escapeHtml(n.actor?.name || 'Someone')}</b> mentioned you`}</div>
      <div class="portal-note" style="font-size:.74rem; margin-top:2px;">${escapeHtml(n.tasks?.title || 'a task')}${n.task_updates?.update_text ? ' — ' + escapeHtml(n.task_updates.update_text.slice(0, 60)) : ''}</div>
      <div class="portal-note" style="font-size:.68rem; margin-top:2px;">${timeAgo(n.created_at)}</div>
    </a>
  `).join('');
}

async function markNotificationRead(id) {
  await supabaseClient.from('notifications').update({ is_read: true }).eq('id', id);
}

async function markAllNotificationsRead() {
  const me = window.__currentProfile;
  if (!me) return;
  await supabaseClient.from('notifications').update({ is_read: true }).eq('user_id', me.id).eq('is_read', false);
  refreshNotifications();
}

async function initNotifications() {
  ensureNotificationBell();
  refreshNotifications();
}

/* ============================================================
   @MENTION AUTOCOMPLETE — attach to any textarea
   ============================================================ */
function attachMentionAutocomplete(textarea, roster) {
  if (!textarea) return;
  const box = document.createElement('div');
  box.style.cssText = 'display:none; position:absolute; z-index:80; background:var(--surface); border:1px solid var(--border-rule); border-radius:8px; box-shadow:0 2px 10px rgba(15,23,42,.10); max-height:170px; overflow-y:auto; min-width:180px;';
  textarea.parentNode.style.position = 'relative';
  textarea.parentNode.appendChild(box);

  function currentQuery() {
    const pos = textarea.selectionStart;
    const before = textarea.value.slice(0, pos);
    const m = before.match(/@([a-zA-Z]*)$/);
    return m ? m[1] : null;
  }

  function renderSuggestions(query) {
    const q = query.toLowerCase();
    const matches = (roster || []).filter(p => p.name.toLowerCase().includes(q)).slice(0, 6);
    if (!matches.length) { box.style.display = 'none'; return; }
    box.innerHTML = matches.map(p => `<div class="mention-item" data-name="${escapeHtml(p.name)}" style="padding:8px 12px; font-size:.82rem; cursor:pointer;">${escapeHtml(p.name)}</div>`).join('');
    box.style.display = 'block';
    box.style.top = (textarea.offsetTop + textarea.offsetHeight) + 'px';
    box.style.left = textarea.offsetLeft + 'px';
    box.querySelectorAll('.mention-item').forEach(el => {
      el.addEventListener('mousedown', (e) => { e.preventDefault(); insertMention(el.dataset.name); });
      el.addEventListener('mouseenter', () => el.style.background = 'var(--n-bg-hover, #f5f5f7)');
      el.addEventListener('mouseleave', () => el.style.background = '');
    });
  }

  function insertMention(name) {
    const pos = textarea.selectionStart;
    const before = textarea.value.slice(0, pos).replace(/@([a-zA-Z]*)$/, '@' + name + ' ');
    const after = textarea.value.slice(pos);
    textarea.value = before + after;
    box.style.display = 'none';
    textarea.focus();
  }

  textarea.addEventListener('input', () => {
    const q = currentQuery();
    if (q !== null && q.length >= 3) renderSuggestions(q); else box.style.display = 'none';
  });
  textarea.addEventListener('blur', () => setTimeout(() => box.style.display = 'none', 150));
}

/* ============================================================
   ROLE BADGE — clear Admin vs Employee visual distinction
   ============================================================ */
function roleBadgeHtml(profile) {
  const admin = isAdmin(profile);
  const mkt = profile && profile.role === 'marketing';
  return `<span class="role-badge ${admin ? 'role-badge--admin' : 'role-badge--member'}">${admin ? icon('flag', 11) : icon('check', 11)} ${admin ? 'Admin' : (mkt ? 'Marketing' : 'Employee')}</span>`;
}

function applyRoleBadge(profile) {
  const el = document.getElementById('who-designation');
  if (el) el.innerHTML = roleBadgeHtml(profile);
  // Show any nav item marked admin-only
  document.querySelectorAll('[data-admin-only]').forEach(n => {
    n.style.display = isAdmin(profile) ? '' : 'none';
  });
  // Admins get a shortcut to the Marketing Register in every sidebar.
  const nav = document.querySelector('.portal-sidebar nav');
  if (nav && isAdmin(profile) && !nav.querySelector('[data-register-link]')) {
    const a = document.createElement('a');
    a.className = 'portal-nav-item';
    a.href = 'register-admin.html';
    a.setAttribute('data-register-link', '1');
    a.innerHTML = '<span class="portal-nav-icon">' + icon('flag', 14) + '</span> Marketing Register';
    nav.appendChild(a);
  }
  if (nav && isAdmin(profile) && !nav.querySelector('[data-activity-link]')) {
    const a2 = document.createElement('a');
    a2.className = 'portal-nav-item' + (/activity/.test(window.location.pathname) ? ' active' : '');
    a2.href = 'activity.html';
    a2.setAttribute('data-activity-link', '1');
    a2.innerHTML = '<span class="portal-nav-icon">' + icon('clock', 14) + '</span> Activity';
    nav.appendChild(a2);
  }
  document.body.classList.toggle('is-admin-user', isAdmin(profile));
  document.body.classList.toggle('is-member-user', !isAdmin(profile));
}

/* ============================================================
   DARK MODE — persisted per-browser via localStorage
   ============================================================ */
function initDarkMode() {
  try {
    const saved = localStorage.getItem('euodoo-dark-mode');
    if (saved === '1') document.body.classList.add('dark-mode');
  } catch (e) { /* localStorage unavailable */ }
  ensureDarkModeToggle();
}

function ensureDarkModeToggle() {
  if (document.getElementById('darkModeBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'darkModeBtn';
  btn.title = 'Toggle dark mode';
  btn.className = 'topbar-icon-btn';
  btn.innerHTML = icon('clock', 16); // placeholder, replaced below
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  btn.style.cssText = 'position:fixed; top:20px; right:116px; z-index:70; width:38px; height:38px; border-radius:10px; border:1px solid var(--border-rule); background:var(--surface); box-shadow:0 1px 3px rgba(15,23,42,.08); display:flex; align-items:center; justify-content:center; color:var(--ink-soft); cursor:pointer;';
  btn.addEventListener('click', toggleDarkMode);
  document.body.appendChild(btn);
}

function toggleDarkMode() {
  const on = document.body.classList.toggle('dark-mode');
  try { localStorage.setItem('euodoo-dark-mode', on ? '1' : '0'); } catch (e) {}
}

/* ============================================================
   COLLAPSIBLE SIDEBAR — persisted per-browser via localStorage.
   The collapsed/expanded class is already applied synchronously
   by a bootstrap script at the top of <body> (avoids a flash of
   the wrong width); this just wires up the toggle control and
   gives every nav item a tooltip for when it's icon-only.
   ============================================================ */
function initSidebarCollapse() {
  const sidebar = document.querySelector('.portal-sidebar');
  if (!sidebar) return;

  // Give every nav item a title so the icon is still identifiable
  // on hover once the label text is visually hidden.
  sidebar.querySelectorAll('.portal-nav-item').forEach(item => {
    if (!item.title) item.title = item.textContent.trim();
  });

  if (!document.getElementById('sidebarCollapseTab')) {
    const tab = document.createElement('button');
    tab.id = 'sidebarCollapseTab';
    tab.className = 'sidebar-collapse-tab';
    tab.title = 'Collapse sidebar';
    tab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="15 18 9 12 15 6"/></svg>`;
    tab.addEventListener('click', toggleSidebarCollapse);
    sidebar.style.position = sidebar.style.position || 'sticky';
    sidebar.appendChild(tab);
  }
}

function toggleSidebarCollapse() {
  const on = document.body.classList.toggle('sidebar-collapsed');
  try { localStorage.setItem('euodoo-sidebar-collapsed', on ? '1' : '0'); } catch (e) {}
}

/* ============================================================
   LOGOUT — a visible top-bar button beside the notification bell,
   so signing out doesn't require opening the account menu first.
   ============================================================ */
function ensureLogoutButton() {
  if (document.getElementById('logoutBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'logoutBtn';
  btn.title = 'Log out';
  btn.className = 'topbar-icon-btn';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  btn.style.cssText = 'position:fixed; top:20px; right:70px; z-index:70; width:38px; height:38px; border-radius:10px; border:1px solid var(--border-rule); background:var(--surface); box-shadow:0 1px 3px rgba(15,23,42,.08); display:flex; align-items:center; justify-content:center; color:var(--ink-soft); cursor:pointer;';
  btn.addEventListener('mouseenter', () => { btn.style.color = '#dc2626'; btn.style.borderColor = '#fca5a5'; });
  btn.addEventListener('mouseleave', () => { btn.style.color = 'var(--ink-soft)'; btn.style.borderColor = 'var(--border-rule)'; });
  btn.addEventListener('click', async () => { if (await customConfirm('Log out of your account?', { confirmText: 'Log out' })) logout(); });
  document.body.appendChild(btn);
}

/* ============================================================
   GLOBAL SEARCH — tasks, projects and people, from any page
   ============================================================ */
function ensureGlobalSearchBar() {
  if (document.getElementById('globalSearchWrap')) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div id="globalSearchWrap" style="position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:70; width:min(420px, 40vw);">
      <div style="position:relative;">
        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--ink-muted);">${icon('search', 14)}</span>
        <input id="globalSearchInput" class="input-box" placeholder="Search tasks, projects, people..." style="padding-left:32px; background:var(--surface);">
      </div>
      <div id="globalSearchResults" style="display:none; margin-top:6px; max-height:360px; overflow-y:auto; background:var(--surface); border:1px solid var(--border-rule); border-radius:12px; box-shadow:0 4px 18px rgba(15,23,42,.12); padding:6px;"></div>
    </div>`;
  document.body.appendChild(wrap.firstElementChild);
  const input = document.getElementById('globalSearchInput');
  let t = null;
  input.addEventListener('input', () => {
    clearTimeout(t);
    const term = input.value.trim();
    if (term.length < 2) { document.getElementById('globalSearchResults').style.display = 'none'; return; }
    t = setTimeout(() => runGlobalSearch(term), 250);
  });
  document.addEventListener('click', (e) => {
    const wrapEl = document.getElementById('globalSearchWrap');
    if (wrapEl && !wrapEl.contains(e.target)) document.getElementById('globalSearchResults').style.display = 'none';
  });
}

async function runGlobalSearch(term) {
  const results = document.getElementById('globalSearchResults');
  results.style.display = 'block';
  results.innerHTML = `<p class="portal-note" style="padding:10px;">Searching...</p>`;

  const [tasksRes, projectsRes, peopleRes] = await Promise.all([
    supabaseClient.from('tasks').select('id, title, status').ilike('title', `%${term}%`).limit(6),
    supabaseClient.from('projects').select('id, name, status').ilike('name', `%${term}%`).limit(5),
    supabaseClient.from('profiles').select('id, name, email').ilike('name', `%${term}%`).limit(5)
  ]);

  const tasks = tasksRes.data || [], projects = projectsRes.data || [], people = peopleRes.data || [];
  if (!tasks.length && !projects.length && !people.length) {
    results.innerHTML = `<p class="portal-note" style="padding:10px; text-align:center;">No matches for "${escapeHtml(term)}".</p>`;
    return;
  }
  let html = '';
  if (tasks.length) {
    html += `<div class="section-label" style="margin:6px 8px 4px;">Tasks</div>`;
    html += tasks.map(t => `<a href="task.html?id=${t.id}" style="display:block; padding:7px 10px; border-radius:8px; font-size:.82rem;">${icon('edit',12)} ${escapeHtml(t.title)} <span class="portal-note">(${statusLabel(t.status)})</span></a>`).join('');
  }
  if (projects.length) {
    html += `<div class="section-label" style="margin:6px 8px 4px;">Projects</div>`;
    html += projects.map(p => `<a href="project.html?id=${p.id}" style="display:block; padding:7px 10px; border-radius:8px; font-size:.82rem;">${icon('folder',12)} ${escapeHtml(p.name)}</a>`).join('');
  }
  if (people.length) {
    html += `<div class="section-label" style="margin:6px 8px 4px;">People</div>`;
    html += people.map(p => `<div style="padding:7px 10px; font-size:.82rem;">${icon('check',12)} ${escapeHtml(p.name)} <span class="portal-note">${escapeHtml(p.email || '')}</span></div>`).join('');
  }
  results.innerHTML = html;
}

/* ============================================================
   CSV EXPORT — generic array-of-objects to downloadable CSV
   ============================================================ */
function exportCSV(filename, rows) {
  if (!rows || !rows.length) { showToast('warning', 'Nothing to export', 'There is no data to export right now.'); return; }
  const headers = Object.keys(rows[0]);
  const escapeCell = (v) => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => escapeCell(r[h])).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('success', 'Exported', `${filename} has downloaded.`);
}

/* ============================================================
   WORKLOAD — per-person open task counts (admin view)
   ============================================================ */
async function computeWorkload() {
  const { data: people } = await supabaseClient.from('profiles').select('id, name, role');
  // a task can have several people on it (task_assignees) besides its main assignee (tasks.assigned_to) — count each person once per task
  const { data: tasks } = await supabaseClient.from('tasks').select('id, assigned_to, status, priority').neq('status', 'done');
  const ids = (tasks || []).map(t => t.id);
  const extra = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabaseClient.from('task_assignees').select('task_id, user_id').in('task_id', ids.slice(i, i + 200));
    (data || []).forEach(r => extra.push(r));
  }
  const byTask = {};
  (tasks || []).forEach(t => { byTask[t.id] = new Set(t.assigned_to ? [t.assigned_to] : []); });
  extra.forEach(r => { if (byTask[r.task_id]) byTask[r.task_id].add(r.user_id); });
  const counts = {};
  (people || []).forEach(p => counts[p.id] = { name: p.name, role: p.role, open: 0, overdue: 0, urgent: 0 });
  (tasks || []).forEach(t => {
    byTask[t.id].forEach(uid => {
      if (!counts[uid]) return;
      counts[uid].open++;
      if (t.priority === 'urgent') counts[uid].urgent++;
    });
  });
  return Object.values(counts).sort((a, b) => b.open - a.open);
}

/* ============================================================
   RECURRING TASKS — client-triggered, no server cron needed.
   Call right after a task's status flips to 'done'.
   ============================================================ */
function nextRecurrenceDate(dueDate, recurrence) {
  const base = dueDate ? new Date(dueDate + 'T00:00:00') : new Date();
  if (recurrence === 'weekly') base.setDate(base.getDate() + 7);
  else if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1);
  else return null;
  return base.toISOString().split('T')[0];
}

async function handleRecurrence(task, actorId) {
  if (!task || !task.recurrence || task.recurrence === 'none') return;
  const nextDue = nextRecurrenceDate(task.due_date, task.recurrence);
  const { data: newTask, error } = await supabaseClient.from('tasks').insert({
    project_id: task.project_id, title: task.title, description: task.description,
    priority: task.priority, assigned_to: task.assigned_to, due_date: nextDue,
    estimated_hours: task.estimated_hours, recurrence: task.recurrence,
    recurrence_parent_id: task.id, created_by: actorId
  }).select().single();
  if (error) { console.error('Could not create recurring task', error); return; }
  await supabaseClient.from('task_updates').insert({
    task_id: newTask.id, user_id: actorId, update_text: 'Auto-created as the next recurrence', old_status: null, new_status: 'todo', is_system: true
  });
  showToast('info', 'Recurring task created', `A new "${task.title}" was scheduled for ${nextDue}.`);
}

/* ============================================================
   DUE-DATE REMINDERS — proactive nudge, once per day per browser,
   for the signed-in user's own overdue/due-soon tasks.
   ============================================================ */
async function checkDueReminders(profile) {
  if (!profile) return;
  const key = 'euodoo-last-reminder-' + todayISO();
  try { if (localStorage.getItem(key)) return; } catch (e) {}

  const { data: tasks } = await supabaseClient
    .from('tasks').select('id, title, due_date, status')
    .eq('assigned_to', profile.id).neq('status', 'done').not('due_date', 'is', null);

  const flagged = (tasks || []).filter(t => ['overdue', 'today', 'tomorrow'].includes(dueUrgency(t.due_date, t.status)));
  if (flagged.length) {
    const overdue = flagged.filter(t => dueUrgency(t.due_date, t.status) === 'overdue').length;
    showToast('warning', 'Due-date reminder',
      `You have ${flagged.length} task(s) due soon${overdue ? ` (${overdue} overdue)` : ''}.`, { duration: 5000 });
  }
  try { localStorage.setItem(key, '1'); } catch (e) {}
}

/* ============================================================
   SLACK / WEBHOOK NOTIFICATIONS — admin-configured, fired
   client-side (fire-and-forget) on key events.
   ============================================================ */
async function notifyWebhook(text) {
  try {
    const { data: cfg } = await supabaseClient.from('webhook_settings').select('*').eq('is_active', true).limit(1).maybeSingle();
    if (!cfg || !cfg.webhook_url) return;
    fetch(cfg.webhook_url, {
      method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }).catch(() => {});
  } catch (e) { /* no webhook configured, or blocked — fail silently */ }
}

/* ============================================================
   TOP BAR INIT — call once per page after requireAuth()
   ============================================================ */
function initTopBar() {
  document.body.classList.add('has-global-topbar');
  ensureGlobalSearchBar();
  initDarkMode();
  ensureLogoutButton();
  initSidebarCollapse();
}