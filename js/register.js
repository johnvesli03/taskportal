/* ============================================================
   Pure helpers — place (location) reading and smart duplicate matching
   ============================================================ */
const RegHelpers = (() => {
  const CITIES = ['Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Delhi', 'Noida', 'Gurugram', 'Faridabad', 'Ghaziabad', 'Greater Noida', 'Chandigarh', 'Mohali', 'Panchkula', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Dehradun', 'Haridwar', 'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Raipur', 'Bilaspur', 'Patna', 'Ranchi', 'Jamshedpur', 'Kolkata', 'Howrah', 'Siliguri', 'Bhubaneswar', 'Cuttack', 'Guwahati', 'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Hyderabad', 'Secunderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Chittoor', 'Nellore', 'Kurnool', 'Kadapa', 'Anantapur', 'Rajahmundry', 'Kakinada', 'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Goa', 'Panaji', 'Margao', 'Puducherry', 'Shimla', 'Jammu', 'Srinagar', 'Hosur', 'Puttur', 'Palakkad', 'Tumakuru', 'Davangere', 'Ballari', 'Shivamogga', 'Udupi', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Singapore', 'London', 'New York'];
  const ALIAS = { bombay: 'Mumbai', bangalore: 'Bengaluru', bengaluru: 'Bengaluru', madras: 'Chennai', calcutta: 'Kolkata', gurgaon: 'Gurugram', trivandrum: 'Thiruvananthapuram', cochin: 'Kochi', vizag: 'Visakhapatnam', poona: 'Pune', baroda: 'Vadodara', mysore: 'Mysuru', mangalore: 'Mangaluru', 'new delhi': 'Delhi', allahabad: 'Prayagraj', trichy: 'Tiruchirappalli', calicut: 'Kozhikode', hubli: 'Hubballi', belgaum: 'Belagavi', bhubaneshwar: 'Bhubaneswar', pondicherry: 'Puducherry', ernakulam: 'Kochi', tirupathi: 'Tirupati', hydrabad: 'Hyderabad' };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = (s) => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
  let cacheKey = '', cacheList = [];
  // learned = locations already used in the register, so the list grows with the data
  function matchers(learned) {
    const key = (learned || []).join('|'); if (key === cacheKey && cacheList.length) return cacheList;
    const map = {}; CITIES.forEach(c => { map[c.toLowerCase()] = c; });
    Object.keys(ALIAS).forEach(a => { map[a] = ALIAS[a]; });
    (learned || []).forEach(l => { if (l && !map[l.toLowerCase()]) map[l.toLowerCase()] = l; });
    cacheList = Object.keys(map).map(k => ({ name: map[k], len: k.length, re: new RegExp('(^|[^a-z])' + esc(k) + '(?=[^a-z]|$)', 'gi') }));
    cacheKey = key; return cacheList;
  }
  // "Plot 5, Andheri East, Mumbai 400069"  ->  "Mumbai"
  function guessLocation(text, learned) {
    const t = String(text || ''); if (t.trim().length < 3) return null;
    let best = null;
    matchers(learned).forEach(c => {
      c.re.lastIndex = 0; let m, last = null;
      while ((m = c.re.exec(t))) { last = m; if (m.index === c.re.lastIndex) c.re.lastIndex++; }
      if (!last) return;
      const end = last.index + last[0].length;
      if (!best || end > best.end || (end === best.end && c.len > best.len)) best = { name: c.name, end, len: c.len };
    });
    if (best) return best.name;
    const pin = t.match(/\b[1-9]\d{2}\s?\d{3}\b/);
    if (pin) {
      const seg = t.slice(0, pin.index).split(/[,\-–|\n]/).map(x => x.trim()).filter(Boolean).pop() || '';
      if (/^[A-Za-z][A-Za-z .]{2,29}$/.test(seg) && !/\b(road|rd|street|st|nagar|colony|floor|building|plot|no|opp|near|behind|sector|phase|block|lane|complex|tower|plaza|market|chowk|cross|main|avenue|park|layout|extension|area|estate)\b/i.test(seg)) return title(seg);
    }
    return null;
  }
  // ---- duplicate matching ----
  const SUFFIX = /\b(pvt|private|ltd|limited|llp|inc|co|company|corp|corporation|the|and|of|india|services|solutions)\b/g;
  const normCompany = (v) => { const first = String(v || '').split(/[,\n]| - | – /)[0]; return first.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9 ]+/g, ' ').replace(SUFFIX, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).sort().join(' '); };
  const normName = (v) => String(v || '').toLowerCase().replace(/\b(mr|mrs|ms|miss|dr|ca|cs|adv|prof|shri|smt|sri)\b\.?/g, ' ').replace(/[^a-z ]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).sort().join(' ');
  const normEmail = (v) => { let e = String(v || '').toLowerCase().trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return ''; let [l, d] = e.split('@'); l = l.split('+')[0]; if (d === 'gmail.com' || d === 'googlemail.com') { l = l.replace(/\./g, ''); d = 'gmail.com'; } return l + '@' + d; };
  const normPhone = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.length >= 8 ? d.slice(-10) : ''; };
  function lev(a, b, max) {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let rowMin = i;
      for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (cur[j] < rowMin) rowMin = cur[j]; }
      if (rowMin > max) return max + 1; prev = cur;
    }
    return prev[b.length];
  }
  const tol = (a, b) => Math.max(1, Math.floor(Math.min(a.length, b.length) * 0.12));
  const similar = (a, b) => !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 5 && lev(a, b, tol(a, b)) <= tol(a, b)));
  // modes: smart | email | phone | namecomp | company
  function findGroups(rows, mode) {
    const n = rows.length, parent = Array.from({ length: n }, (_, i) => i);
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const union = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[b] = a; };
    const byKey = (keys) => { const m = {}; rows.forEach((r, i) => { keys(r).forEach(k => { if (k) { if (m[k] === undefined) m[k] = i; else union(m[k], i); } }); }); };
    const nameOf = rows.map(r => normName(r.client_name)), compOf = rows.map(r => normCompany(r.company));
    const doEmail = mode === 'smart' || mode === 'email', doPhone = mode === 'smart' || mode === 'phone', doNC = mode === 'smart' || mode === 'namecomp', doCo = mode === 'company';
    if (doEmail) byKey(r => ['e:' + normEmail(r.email)].filter(k => k !== 'e:'));
    if (doPhone) byKey(r => [normPhone(r.mobile), normPhone(r.landline)].filter(Boolean).map(p => 'p:' + p));
    if (doCo) rows.forEach((r, i) => { if (compOf[i].length >= 4) { /* exact on normalised first segment */ } });
    if (doCo) { const m = {}; rows.forEach((r, i) => { const k = compOf[i]; if (k.length >= 4) { if (m[k] === undefined) m[k] = i; else union(m[k], i); } }); }
    if (doNC) {
      const exact = {}; rows.forEach((r, i) => { if (nameOf[i] && compOf[i]) { const k = nameOf[i] + '|' + compOf[i]; if (exact[k] === undefined) exact[k] = i; else union(exact[k], i); } });
      // typo tolerance: same company + similar name, or same name + similar company
      const bucket = (keyArr) => { const b = {}; rows.forEach((r, i) => { const k = keyArr[i]; if (k) (b[k] = b[k] || []).push(i); }); return b; };
      const bc = bucket(compOf); Object.values(bc).forEach(ix => { if (ix.length > 1 && ix.length <= 80) for (let a = 0; a < ix.length; a++) for (let b = a + 1; b < ix.length; b++) if (find(ix[a]) !== find(ix[b]) && similar(nameOf[ix[a]], nameOf[ix[b]])) union(ix[a], ix[b]); });
      const bn = bucket(nameOf); Object.values(bn).forEach(ix => { if (ix.length > 1 && ix.length <= 80) for (let a = 0; a < ix.length; a++) for (let b = a + 1; b < ix.length; b++) if (find(ix[a]) !== find(ix[b]) && compOf[ix[a]] && compOf[ix[b]] && similar(compOf[ix[a]], compOf[ix[b]])) union(ix[a], ix[b]); });
    }
    const g = {}; rows.forEach((r, i) => { const k = find(i); (g[k] = g[k] || []).push(r); });
    return Object.values(g).filter(x => x.length > 1);
  }
  // index of existing leads, for checking an Excel file before it is imported
  function buildIndex(rows) {
    const idx = { e: new Set(), p: new Set(), nc: new Set() };
    rows.forEach(r => { const e = normEmail(r.email); if (e) idx.e.add(e); [normPhone(r.mobile), normPhone(r.landline)].forEach(p => { if (p) idx.p.add(p); }); const n = normName(r.client_name), c = normCompany(r.company); if (n && c) idx.nc.add(n + '|' + c); });
    return idx;
  }
  function importClash(o, idx, seen) {
    const e = normEmail(o.email), n = normName(o.client_name), c = normCompany(o.company);
    const phones = [normPhone(o.mobile), normPhone(o.landline)].filter(Boolean);
    seen.e = seen.e || new Set(); seen.p = seen.p || new Set(); seen.nc = seen.nc || new Set();
    let why = '';
    if (e && idx.e.has(e)) why = 'Duplicate — same email is already in the register';
    else if (e && seen.e.has(e)) why = 'Duplicate — same email appears earlier in the file';
    else if (phones.some(p => idx.p.has(p))) why = 'Duplicate — this phone number is already in the register';
    else if (n && c && idx.nc.has(n + '|' + c)) why = 'Duplicate — same client and company are already in the register';
    else if (n && c && seen.nc.has(n + '|' + c)) why = 'Duplicate — same client and company appear earlier in the file';
    return { why, remember: () => { if (e) seen.e.add(e); phones.forEach(p => seen.p.add(p)); if (n && c) seen.nc.add(n + '|' + c); } };
  }
  // why a lead is thought to repeat another one (shown in the review list)
  function why(a, b) {
    const w = [];
    if (normEmail(a.email) && normEmail(a.email) === normEmail(b.email)) w.push('same email');
    const pa = [normPhone(a.mobile), normPhone(a.landline)].filter(Boolean), pb = [normPhone(b.mobile), normPhone(b.landline)].filter(Boolean);
    if (pa.some(p => pb.includes(p))) w.push('same phone');
    const na = normName(a.client_name), nb = normName(b.client_name), ca = normCompany(a.company), cb = normCompany(b.company);
    if (na && ca && (similar(na, nb) && similar(ca, cb))) w.push('same name + company');
    else if (ca && ca === cb && ca.length >= 4) w.push('same company');
    return w.length ? w.join(', ') : 'linked through another lead';
  }
  return { guessLocation, findGroups, why, buildIndex, importClash, normCompany, normName, normEmail, normPhone };
})();

/* ============================================================
   Follow-Up Register — grid engine (marketing page + admin page)
   Everything typed is a DRAFT until Save / Ctrl+S. The database
   re-checks every rule; this file only gives fast, friendly feedback.
   ============================================================ */
const RegisterApp = (() => {
  const PAGE_SIZE = 50;
  const IDENTITY = ['lead_time', 'client_name', 'company', 'mobile', 'landline', 'email', 'lead_source', 'intro_email_sent', 'intro_email_at'];
  const S = {
    admin: false, me: null, profile: null,
    rows: [], cols: [], opts: {}, people: {}, perms: { can_save: true },
    drafts: {},          // id -> { field: value }
    newRows: [],         // unsaved leads
    errors: {},          // id -> message
    f: { preset: 'all', from: '', to: '', basis: 'entry', q: '', status: '', source: '', owner: 'all', chip: '', category: '', location: '', sort: 'new', showDeleted: false },
    page: 0, saving: false, seq: 0, fields: [], mount: null
  };
  const esc = (v) => escapeHtml(v == null ? '' : String(v));
  const sb = () => supabaseClient;

  /* ---------- dates ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const dmy = (iso) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) ? iso.slice(8, 10) + '-' + iso.slice(5, 7) + '-' + iso.slice(0, 4) : (iso || '');
  const isoToLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const fmtDateTime = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const today = () => todayISO();

  function periodRange(p) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const dow = (t.getDay() + 6) % 7; // Monday = 0
    const add = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    if (p === 'today') return [ymd(t), ymd(t)];
    if (p === 'yesterday') { const y = add(t, -1); return [ymd(y), ymd(y)]; }
    if (p === 'week') return [ymd(add(t, -dow)), ymd(add(t, 6 - dow))];
    if (p === 'lastweek') return [ymd(add(t, -dow - 7)), ymd(add(t, -dow - 1))];
    if (p === 'month') return [ymd(new Date(t.getFullYear(), t.getMonth(), 1)), ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0))];
    if (p === 'lastmonth') return [ymd(new Date(t.getFullYear(), t.getMonth() - 1, 1)), ymd(new Date(t.getFullYear(), t.getMonth(), 0))];
    return ['', ''];
  }

  /* ---------- field definitions ---------- */
  function buildFields() {
    const base = [
      { k: 'lead_date', label: 'Date', type: 'date', w: 118, auto: true },
      { k: 'lead_time', label: 'Time', type: 'select', opt: 'time_slot', w: 120, id: true },
      { k: 'client_name', label: 'Client Name', type: 'text', w: 170, id: true, req: true, cls: 'c-name', max: 150 },
      { k: 'company', label: 'Company Name & Address', type: 'text', w: 270, id: true, req: true, max: 500 },
      { k: 'mobile', label: 'Mobile No', type: 'text', w: 135, id: true, req: true, max: 20 },
      { k: 'landline', label: 'Landline (if avl)', type: 'text', w: 135, id: true, max: 20 },
      { k: 'email', label: 'Email', type: 'text', w: 200, id: true, max: 200 },
      { k: 'lead_source', label: 'Lead Source', type: 'select', opt: 'lead_source', w: 160, id: true, req: true },
      { k: 'intro_email_sent', label: 'Introductory Email Sent', type: 'select', fixed: ['Yes', 'No'], w: 150, id: true, noblank: true },
      { k: 'intro_email_at', label: 'Email Date & Time', type: 'datetime-local', w: 190, id: true },
      { k: 'current_status', label: 'Current Status', type: 'select', opt: 'current_status', w: 140 },
      { k: 'category', label: 'Category', type: 'text', w: 160, max: 100, list: 'rgCatList' },
      { k: 'location', label: 'Location', type: 'text', w: 150, max: 100, list: 'rgLocList' },
      { k: 'last_notes', label: 'Last Discussion Notes', type: 'text', w: 260, max: 3000 },
      { k: 'f1_date', label: '1st Follow-Up Date', type: 'date', w: 150, fu: 1, kind: 'date' },
      { k: 'f1_remarks', label: 'Remarks', type: 'text', w: 200, fu: 1, kind: 'rem', max: 1000 },
      { k: 'f2_date', label: '2nd Follow-Up Date', type: 'date', w: 150, fu: 2, kind: 'date' },
      { k: 'f2_remarks', label: 'Remarks', type: 'text', w: 200, fu: 2, kind: 'rem', max: 1000 },
      { k: 'f3_date', label: '3rd Follow-Up Date', type: 'date', w: 150, fu: 3, kind: 'date' },
      { k: 'f3_remarks', label: 'Remarks', type: 'text', w: 200, fu: 3, kind: 'rem', max: 1000 },
      { k: 'outcome', label: 'Outcome', type: 'select', opt: 'outcome', w: 150, outcome: true }
    ];
    S.cols.filter(c => !c.archived).sort((a, b) => a.position - b.position).forEach(c => {
      const t = c.col_type;
      base.push({
        k: 'x:' + c.key, ck: c.key, extra: true, label: c.label, req: c.required, w: 160, mkEdit: c.marketing_editable, ctype: t,
        type: t === 'date' ? 'date' : (t === 'yesno' || t === 'dropdown') ? 'select' : 'text',
        fixed: t === 'yesno' ? ['Yes', 'No'] : (t === 'dropdown' ? c.options : null)
      });
    });
    S.fields = base;
  }

  /* ---------- values ---------- */
  function rowById(id) { return S.newRows.find(r => r.id === id) || S.rows.find(r => r.id === id); }
  function saved(row, f) {
    if (f.extra) return (row.extra && row.extra[f.ck] != null) ? String(row.extra[f.ck]) : '';
    if (f.k === 'intro_email_at') return isoToLocalInput(row.intro_email_at);
    return row[f.k] == null ? '' : String(row[f.k]);
  }
  function val(row, f) {
    const d = S.drafts[row.id];
    if (d && Object.prototype.hasOwnProperty.call(d, f.k)) return d[f.k];
    return saved(row, f);
  }
  const rawOf = (row, k) => { const f = S.fields.find(x => x.k === k); return f ? val(row, f) : ''; };
  function dirtyIds() {
    const ids = Object.keys(S.drafts).filter(id => Object.keys(S.drafts[id]).length);
    S.newRows.forEach(r => { if (!ids.includes(r.id) && !isBlankNew(r)) ids.push(r.id); });
    return ids;
  }
  function isBlankNew(r) {
    const d = S.drafts[r.id] || {};
    return !Object.keys(d).some(k => String(d[k] || '').trim() !== '' && !(k === 'intro_email_sent'));
  }
  const isMine = (r) => r.created_by === S.me || r.assigned_to === S.me;
  const isLocked24 = (r) => !r.__new && new Date(r.created_at).getTime() < Date.now() - 864e5 && !(r.unlocked_until && new Date(r.unlocked_until) > new Date());

  /* ---------- editable? ---------- */
  function cellRO(row, f) {
    if (f.auto) return 'Set automatically';
    if (S.admin) return row.deleted_at ? 'Deleted' : '';
    if (row.deleted_at) return 'Deleted';
    if (!row.__new && !isMine(row)) return 'Owned by ' + (S.people[row.assigned_to] || 'another user');
    if (f.id && isLocked24(row)) return 'Locked after 24 hours — request an unlock';
    if (f.extra && !f.mkEdit) return 'Admin only';
    if (f.outcome && row.outcome_approved) return 'Approved — locked';
    if (f.fu) {
      if (f.kind === 'date') {
        if (row.__new === undefined && row['f' + f.fu + '_date']) return 'Already saved — dates cannot change';
        if (f.fu > 1 && !rawOf(row, 'f' + (f.fu - 1) + '_date')) return 'Fill the previous follow-up first';
      } else if (!rawOf(row, 'f' + f.fu + '_date')) return 'Set the follow-up date first';
    }
    return '';
  }

  /* ---------- follow-up state ---------- */
  function fuState(r) {
    const t = today(); let overdue = false, due = false, next = '';
    if ((r.outcome && r.outcome !== 'Prospective') || r.deleted_at) return { overdue, due, next };   // a 'Prospective' lead still needs follow-ups
    for (let n = 1; n <= 3; n++) {
      const d = r['f' + n + '_date'];
      if (d && !r['f' + n + '_remarks']) {
        if (!next) next = d;
        if (d < t) overdue = true; else if (d === t) due = true;
      }
    }
    return { overdue, due, next };
  }

  /* ---------- filtering ---------- */
  function inPeriod(r) {
    const f = S.f; if (f.preset === 'all' || (!f.from && !f.to)) return true;
    const within = (d) => d && (!f.from || d >= f.from) && (!f.to || d <= f.to);
    if (f.basis === 'followup') return within(r.f1_date) || within(r.f2_date) || within(r.f3_date);
    return within(r.lead_date);
  }
  // what a lead is grouped under when the admin groups the list
  function groupKey(r) { const g = S.f.group; return (g === 'location' ? (r.location || '~ No location') : g === 'category' ? (r.category || '~ No category') : (S.people[r.assigned_to] || '~ Unassigned')).toLowerCase(); }
  function groupLabel(r) { const g = S.f.group; return g === 'location' ? '📍 ' + (r.location || 'No location') : g === 'category' ? '🏷 ' + (r.category || 'No category') : '👤 ' + (S.people[r.assigned_to] || 'Unassigned'); }
  function filtered() {
    const f = S.f, q = f.q.trim().toLowerCase();
    let list = S.rows.filter(r => (S.admin && f.showDeleted) ? true : !r.deleted_at);
    list = list.filter(r => {
      if (!inPeriod(r)) return false;
      if (f.status && r.current_status !== f.status) return false;
      if (f.source && r.lead_source !== f.source) return false;
      if (f.category && r.category !== f.category) return false;
      if (f.location && (f.location === '__none' ? !!r.location : r.location !== f.location)) return false;
      if (f.owner === 'me' && !isMine(r)) return false;
      if (f.owner && f.owner !== 'all' && f.owner !== 'me' && r.assigned_to !== f.owner) return false;
      if (q) {
        const hay = [r.client_name, r.company, r.mobile, r.email, r.landline, r.last_notes, r.f1_remarks, r.f2_remarks, r.f3_remarks].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (f.chip) {
        const st = fuState(r);
        if (f.chip === 'due' && !st.due) return false;
        if (f.chip === 'overdue' && !st.overdue) return false;
        if (f.chip === 'approval' && !(r.outcome && !r.outcome_approved)) return false;
        if (f.chip === 'unlock' && !r.unlock_requested) return false;
      }
      return true;
    });
    const far = '9999-12-31';
    if (f.sort === 'old') list.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
    else if (f.sort === 'name') list.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
    else if (f.sort === 'next') list.sort((a, b) => (fuState(a).next || far).localeCompare(fuState(b).next || far));
    else list.sort((a, b) => a.created_at < b.created_at ? 1 : -1);
    if (f.sort === 'category' || f.sort === 'categorydesc') list.sort((a, b) => { const x = (a.category || '').toLowerCase(), y = (b.category || '').toLowerCase(); if (!x !== !y) return x ? -1 : 1; return f.sort === 'category' ? x.localeCompare(y) : y.localeCompare(x); });
    if (f.sort === 'location' || f.sort === 'locationdesc') list.sort((a, b) => { const x = (a.location || '').toLowerCase(), y = (b.location || '').toLowerCase(); if (!x !== !y) return x ? -1 : 1; return f.sort === 'location' ? x.localeCompare(y) : y.localeCompare(x); });
    const oname = (r) => (S.people[r.assigned_to] || '').toLowerCase();
    if (S.admin && (f.sort === 'owner' || f.sort === 'ownerdesc')) list.sort((a, b) => f.sort === 'owner' ? oname(a).localeCompare(oname(b)) : oname(b).localeCompare(oname(a)));
    else if (S.admin && f.group) list.sort((a, b) => groupKey(a).localeCompare(groupKey(b)));
    return list;
  }

  /* ---------- load ---------- */
  // The database returns at most 1000 rows per request, so keep asking for the next 1000 until nothing is left
  async function loadRegisterRows() {
    const STEP = 1000; let all = [];
    for (let from = 0; from < 200000;) {
      const { data, error } = await sb().from('follow_up_register').select('*').order('created_at', { ascending: false }).order('id').range(from, from + STEP - 1);
      if (error) return { data: null, error };
      if (!data || !data.length) break;
      all = all.concat(data); from += data.length;
    }
    return { data: all, error: null };
  }
  async function loadAll() {
    const [rows, cols, sets, people, perm, imp] = await Promise.all([
      loadRegisterRows(),
      sb().from('register_columns').select('*').order('position'),
      sb().from('register_settings').select('key, options'),
      sb().from('profiles').select('id, name, role'),
      S.admin ? Promise.resolve({ data: null }) : sb().from('register_user_perms').select('can_download').eq('user_id', S.me).maybeSingle(),
      S.admin ? Promise.resolve({ data: null }) : sb().from('register_import_status').select('user_id').eq('user_id', S.me).maybeSingle()
    ]);
    if (rows.error) throw rows.error;
    S.rows = rows.data || [];
    S.cols = cols.data || [];
    S.opts = {}; (sets.data || []).forEach(s => { S.opts[s.key] = s.options || []; });
    S.people = {}; S.peopleList = (people.data || []); S.peopleList.forEach(p => { S.people[p.id] = p.name; });
    S.importUsed = S.admin ? true : !!(imp && imp.data);   // marketing: true once their one-time import has been used
    S.perms.can_save = S.admin ? true : (perm.data ? perm.data.can_download : true);   // the stored switch now means 'can save reports'
    buildFields();
  }

  /* ---------- table rendering ---------- */
  function optionsFor(f) {
    if (f.fixed) return f.fixed;
    return S.opts[f.opt] || [];
  }
  function inputHtml(row, f, ro) {
    const v = val(row, f);
    const base = `data-id="${esc(row.id)}" data-k="${esc(f.k)}"`;
    if (f.type === 'select') {
      let list = optionsFor(f).slice();
      if (v && !list.includes(v)) list.push(v);
      const blank = f.noblank ? '' : '<option value="">—</option>';
      return `<select ${base} ${ro ? 'disabled' : ''}>${blank}${list.map(o => `<option value="${esc(o)}" ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    }
    const type = f.type === 'text' ? 'text' : f.type;
    const dl = f.list ? `list="${f.list}"` : '';
    const ph = f.k === 'mobile' ? '98765 43210' : f.k === 'email' ? 'name@company.com' : '';
    return `<input type="${type}" ${dl} ${base} value="${esc(v)}" ${f.max ? `maxlength="${f.max}"` : ''} ${ro ? 'readonly tabindex="-1"' : ''} ${ph && !ro ? `placeholder="${ph}"` : ''} autocomplete="off">`;
  }
  function metaHtml(row) {
    const b = [];
    if (row.deleted_at) b.push('<span class="rg-badge bad">Deleted</span>');
    if (row.__new) b.push('<span class="rg-badge info">New</span>');
    else {
      const dirty = S.drafts[row.id] && Object.keys(S.drafts[row.id]).length;
      if (dirty) b.push('<span class="rg-badge warn">Unsaved</span>');
      const st = fuState(row);
      if (st.overdue) b.push('<span class="rg-badge bad">Overdue</span>');
      else if (st.due) b.push('<span class="rg-badge warn">Due today</span>');
      if (row.outcome) b.push(row.outcome_approved ? '<span class="rg-badge ok">Approved</span>' : '<span class="rg-badge warn">Awaiting approval</span>');
      if (isLocked24(row)) b.push('<span class="rg-badge">🔒 Locked</span>');
      if (row.unlock_requested) b.push('<span class="rg-badge info">Unlock requested</span>');
    }
    return b.join(' ');
  }
  function rowHtml(row, idx) {
    const cls = [row.__new ? 'row-new' : '', row.deleted_at ? 'row-deleted' : '', S.errors[row.id] ? 'row-error' : ''].join(' ');
    let h = `<tr data-row="${esc(row.id)}" class="${cls}" ${S.errors[row.id] ? `title="${esc(S.errors[row.id])}"` : ''}>`;
    h += `<td class="c-idx" data-label="#">${row.__new ? '＋' : idx}</td>`;
    S.fields.forEach(f => {
      const why = cellRO(row, f);
      const d = S.drafts[row.id]; const dirty = d && Object.prototype.hasOwnProperty.call(d, f.k);
      let inner;
      if (f.k === 'lead_date') inner = `<input type="text" value="${row.__new ? dmy(today()) + ' (auto)' : dmy(row.lead_date)}" readonly tabindex="-1">`;
      else inner = inputHtml(row, f, !!why);
      h += `<td class="${f.cls || ''} ${why ? 'ro' : ''} ${dirty ? 'dirty' : ''}" ${why ? `title="${esc(why)}"` : ''} data-label="${esc(f.fu && f.kind === 'rem' ? (['', '1st', '2nd', '3rd'][f.fu] + ' remarks') : f.label)}">${inner}</td>`;
    });
    h += `<td class="c-meta" data-label="Owner">${esc(S.people[row.assigned_to] || (row.__new ? (S.admin ? '' : (S.people[S.me] || 'You')) : ''))}${row.__new && S.admin ? ownerSelect(row) : ''}</td>`;
    h += `<td class="c-meta c-status" data-label="Status">${metaHtml(row)}</td>`;
    h += `<td class="c-meta" data-label="Actions"><button class="rg-btn sm" data-act="menu" data-id="${esc(row.id)}">⋯</button></td>`;
    return h + '</tr>';
  }
  function ownerSelect(row) {
    const opts = S.peopleList.filter(p => p.role === 'marketing' || p.role === 'admin');
    const cur = (S.drafts[row.id] || {}).assigned_to || S.me;
    return `<select data-id="${esc(row.id)}" data-k="assigned_to" style="min-width:130px;border:1px solid var(--rg-line);border-radius:8px;padding:5px;">${opts.map(p => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
  }

  function render() {
    const wrap = document.getElementById('rgSheet'); if (!wrap) return;
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (S.page >= pages) S.page = pages - 1;
    const slice = list.slice(S.page * PAGE_SIZE, S.page * PAGE_SIZE + PAGE_SIZE);
    let h = '<table class="rg-grid"><thead><tr><th class="c-idx">#</th>';
    S.fields.forEach(f => { h += `<th class="${f.cls || ''}" style="min-width:${f.w}px">${esc(f.label)}${f.req ? ' <span class="req">*</span>' : ''}</th>`; });
    const arrow = S.f.sort === 'owner' ? ' ▲' : S.f.sort === 'ownerdesc' ? ' ▼' : '';
    h += `<th style="min-width:140px;${S.admin ? 'cursor:pointer' : ''}" ${S.admin ? 'data-act="sortowner" title="Click to sort by employee"' : ''}>Owner${S.admin ? (arrow || ' ⇅') : ''}</th><th style="min-width:170px">Status</th><th style="min-width:60px"></th></tr></thead><tbody>`;
    S.newRows.forEach(r => { h += rowHtml(r, 0); });
    const perGroup = {}; list.forEach(r => { const k = groupKey(r); perGroup[k] = (perGroup[k] || 0) + 1; });
    let lastGroup = null;
    slice.forEach((r, i) => {
      if (S.admin && S.f.group && groupKey(r) !== lastGroup) { lastGroup = groupKey(r); h += `<tr class="rg-group"><td colspan="${S.fields.length + 4}" style="background:#eef2f7;font-weight:700;padding:8px 12px">${esc(groupLabel(r))} — ${perGroup[lastGroup]} lead${perGroup[lastGroup] === 1 ? '' : 's'}</td></tr>`; }
      h += rowHtml(r, S.page * PAGE_SIZE + i + 1);
    });
    h += '</tbody></table>';
    h += `<datalist id="rgLocList">${locations().map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
    h += `<datalist id="rgCatList">${categories().map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;
    if (!list.length && !S.newRows.length) h = '<div class="rg-empty"><b>No leads match.</b><br>Change the period or filters, or press “+ Add lead”.</div>';
    wrap.innerHTML = h;
    const pager = document.getElementById('rgPager');
    pager.innerHTML = `<span>${list.length} lead${list.length === 1 ? '' : 's'} in view · page ${S.page + 1} of ${pages}</span>
      <span><button class="rg-btn sm" data-act="prev" ${S.page === 0 ? 'disabled' : ''}>‹ Prev</button> <button class="rg-btn sm" data-act="next" ${S.page >= pages - 1 ? 'disabled' : ''}>Next ›</button></span>`;
    if (S.admin) {
      const sel = document.getElementById('fOwner');
      if (sel) {
        const cnt = {}; S.rows.forEach(r => { if (!r.deleted_at) cnt[r.assigned_to] = (cnt[r.assigned_to] || 0) + 1; });
        Array.from(sel.options).forEach(op => { if (cnt[op.value] !== undefined || S.people[op.value]) op.textContent = `${S.people[op.value]} – ${cnt[op.value] || 0} lead${cnt[op.value] === 1 ? '' : 's'}`; });
      }
    }
    { const ls = document.getElementById('fLocation'); if (ls) { const cnt = {}; let none = 0; S.rows.forEach(r => { if (r.deleted_at) return; if (r.location) cnt[r.location] = (cnt[r.location] || 0) + 1; else none++; }); const cur = S.f.location; ls.innerHTML = '<option value="">All</option>' + locations().map(c => `<option value="${esc(c)}" ${c === cur ? 'selected' : ''}>${esc(c)} (${cnt[c] || 0})</option>`).join('') + (none ? `<option value="__none" ${cur === '__none' ? 'selected' : ''}>No location (${none})</option>` : ''); } }
    { const cs = document.getElementById('fCategory'); if (cs) { const cur = S.f.category; cs.innerHTML = '<option value="">All</option>' + categories().map(c => `<option value="${esc(c)}" ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join(''); } }
    renderStrip(list); renderSavebar(); window.dispatchEvent(new CustomEvent('register:rendered'));
  }

  function renderStrip(list) {
    const mine = S.admin ? S.rows.filter(r => !r.deleted_at) : S.rows.filter(r => !r.deleted_at && isMine(r));
    let od = 0, du = 0, ap = 0, ul = 0;
    mine.forEach(r => { const s = fuState(r); if (s.overdue) od++; if (s.due) du++; if (r.outcome && !r.outcome_approved) ap++; if (r.unlock_requested) ul++; });
    const chip = (k, n, label, c) => `<button class="rg-chip ${c} ${S.f.chip === k ? 'active' : ''}" data-chip="${k}"><b>${n}</b> ${label}</button>`;
    document.getElementById('rgStrip').innerHTML =
      chip('due', du, 'follow-ups due today', 'warn') + chip('overdue', od, 'overdue', 'bad') +
      (S.admin ? chip('approval', ap, 'outcomes awaiting approval', 'ok') + chip('unlock', ul, 'unlock requests', 'warn') : '') +
      (S.f.chip ? '<button class="rg-btn sm" data-chip="">Clear</button>' : '');
    // period summary
    const periodRows = S.rows.filter(r => (!r.deleted_at) && inPeriod(r) && (S.f.owner !== 'me' || isMine(r)));
    let fuTotal = 0, fuDone = 0;
    periodRows.forEach(r => { for (let n = 1; n <= 3; n++) if (r['f' + n + '_date']) { fuTotal++; if (r['f' + n + '_remarks']) fuDone++; } });
    const cnt = (o) => periodRows.filter(r => r.outcome === o).length;
    const stat = (l, v) => `<div class="rg-stat"><small>${l}</small><b>${v}</b></div>`;
    const lab = S.f.preset === 'all' ? 'All time' : (S.f.from === S.f.to ? dmy(S.f.from) : dmy(S.f.from) + ' → ' + dmy(S.f.to));
    document.getElementById('rgSummary').innerHTML =
      stat('Period', `<span style="font-size:14px">${esc(lab)}</span>`) + stat('Leads', periodRows.length) +
      stat('Follow-ups done', `${fuDone}/${fuTotal}`) + stat('Prospective', cnt('Prospective')) + stat('Agreements', cnt('Agreement')) + stat('Not interested', cnt('Not interested'));
  }

  function renderSavebar() {
    const n = dirtyIds().length;
    const bar = document.getElementById('rgSavebar'); if (!bar) return;
    bar.classList.toggle('show', n > 0);
    bar.querySelector('.cnt').textContent = n + (n === 1 ? ' lead has' : ' leads have');
  }

  /* ---------- editing ---------- */
  function setDraft(id, k, v) {
    const row = rowById(id); if (!row) return;
    const f = S.fields.find(x => x.k === k);
    const orig = k === 'assigned_to' ? (row.assigned_to || S.me) : (f ? saved(row, f) : '');
    const d = S.drafts[id] || (S.drafts[id] = {});
    if (!row.__new && v === orig) delete d[k]; else d[k] = v;
    if (!Object.keys(d).length) delete S.drafts[id];
    delete S.errors[id];
    const tr = document.querySelector(`tr[data-row="${CSS.escape(id)}"]`);
    if (tr) {
      tr.classList.remove('row-error'); tr.removeAttribute('title');
      const td = tr.querySelector(`[data-k="${CSS.escape(k)}"]`);
      if (td && td.closest('td')) td.closest('td').classList.toggle('dirty', !!(S.drafts[id] && Object.prototype.hasOwnProperty.call(S.drafts[id], k)));
      refreshLocks(tr, row);
    }
    renderSavebar();
  }
  function refreshLocks(tr, row) {
    S.fields.forEach(f => {
      const el = tr.querySelector(`[data-k="${CSS.escape(f.k)}"]`); if (!el || f.k === 'lead_date') return;
      const why = cellRO(row, f); const td = el.closest('td');
      td.classList.toggle('ro', !!why); if (why) td.title = why; else td.removeAttribute('title');
      if (el.tagName === 'SELECT') el.disabled = !!why; else { el.readOnly = !!why; el.tabIndex = why ? -1 : 0; }
    });
    const st = tr.querySelector('.c-status'); if (st) st.innerHTML = metaHtml(row);
  }

  function onInput(e) {
    const el = e.target; if (!el.dataset || !el.dataset.k || !el.dataset.id) return;
    if (el.tagName === 'SELECT' && e.type === 'input') return;
    if ((el.dataset.k === 'category' || el.dataset.k === 'location') && e.type === 'change') { const t = el.value.trim().replace(/\s+/g, ' '); const hit = (el.dataset.k === 'category' ? categories() : locations()).find(c => c.toLowerCase() === t.toLowerCase()); el.value = hit || t; }
    setDraft(el.dataset.id, el.dataset.k, el.value);
  }
  // the categories already used in the register (Tax, Hospital, …) — suggestions + filter list
  function categories() { const m = {}; S.rows.forEach(r => { const c = (r.category || '').trim(); if (c && !m[c.toLowerCase()]) m[c.toLowerCase()] = c; }); return Object.keys(m).sort().map(k => m[k]); }
  function locations() { const m = {}; S.rows.forEach(r => { const c = (r.location || '').trim(); if (c && !m[c.toLowerCase()]) m[c.toLowerCase()] = c; }); return Object.keys(m).sort().map(k => m[k]); }
  function onKey(e) {
    const el = e.target; if (!el.dataset || !el.dataset.k) return;
    if ((e.key === 'Enter' && el.tagName !== 'TEXTAREA') || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (el.tagName === 'SELECT' && e.key !== 'Enter') return;
      if ((el.type === 'date' || el.type === 'datetime-local') && e.key !== 'Enter') return;   // arrows change the date there
      e.preventDefault();
      const td = el.closest('td'), tr = td.parentElement; const col = Array.prototype.indexOf.call(tr.children, td);
      let t = (e.key === 'ArrowUp') ? tr.previousElementSibling : tr.nextElementSibling;
      while (t) { const c = t.children[col] && t.children[col].querySelector('input:not([readonly]),select:not([disabled])'); if (c) { c.focus(); if (c.select) c.select(); break; } t = (e.key === 'ArrowUp') ? t.previousElementSibling : t.nextElementSibling; }
    }
  }

  function addLead() {
    const id = 'n' + (++S.seq);
    S.newRows.unshift({ id, __new: true, intro_email_sent: 'No', created_by: S.me, assigned_to: S.me, extra: {} });
    S.drafts[id] = { intro_email_sent: 'No' };
    S.page = 0; render();
    const first = document.querySelector(`tr[data-row="${id}"] [data-k="lead_time"]`);
    const nm = document.querySelector(`tr[data-row="${id}"] [data-k="client_name"]`); (nm || first) && (nm || first).focus();
  }

  /* ---------- validation + save ---------- */
  function mergedValue(row, k) { return String(rawOf(row, k) || '').trim(); }
  function validateRow(row) {
    const e = []; const v = (k) => mergedValue(row, k); const isNew = !!row.__new;
    if (isNew || S.drafts[row.id] && ('client_name' in S.drafts[row.id])) if (!v('client_name')) e.push('Client name is required.');
    if (isNew && !S.admin) { if (!v('company')) e.push('Company name & address is required.'); if (!v('lead_source')) e.push('Lead source is required.'); }
    if (isNew || (S.drafts[row.id] && 'mobile' in S.drafts[row.id])) { if (!/^\d{10,13}$/.test(v('mobile').replace(/\D/g, ''))) e.push('Mobile number must have 10 to 13 digits.'); }
    if (v('landline') && !/^[0-9+\-\s()]{6,20}$/.test(v('landline'))) e.push('Landline number looks invalid.');
    if (v('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) e.push('Email address looks invalid.');
    const base = row.__new ? today() : row.lead_date; let prev = base; const t = today();
    for (let n = 1; n <= 3; n++) {
      const d = v('f' + n + '_date'), rem = v('f' + n + '_remarks');
      if (!d) { if (rem) e.push(`Follow-up ${n} remarks need a date first.`); continue; }
      if (n > 1 && !v('f' + (n - 1) + '_date')) e.push(`Fill follow-up ${n - 1} before follow-up ${n}.`);
      if (d < prev) e.push(`Follow-up ${n} date cannot be before ${dmy(prev)}.`);
      if (!S.admin && !row['f' + n + '_date'] && d < t) e.push(`Follow-up ${n} date cannot be in the past.`);
      prev = d;
    }
    S.fields.filter(f => f.extra).forEach(f => {
      const x = v(f.k);
      if (f.req && !x && !S.admin && isNew) e.push(`“${f.label}” is required.`);
      if (x && f.ctype === 'number' && !/^-?\d+(\.\d+)?$/.test(x)) e.push(`“${f.label}” must be a number.`);
      if (x && f.ctype === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)) e.push(`“${f.label}” must be a valid email.`);
      if (x && f.ctype === 'phone' && !/^[0-9+\-\s()]{6,20}$/.test(x)) e.push(`“${f.label}” must be a valid phone number.`);
    });
    return e;
  }
  function nice(msg) {
    if (/uq_register_mobile|duplicate key/i.test(msg)) return 'Duplicate — a lead with this mobile number already exists.';
    if (/row-level security/i.test(msg)) return 'You do not have permission to change this lead.';
    return msg;
  }
  function payloadFor(row) {
    const d = S.drafts[row.id] || {}; const p = {}; let extra = null;
    S.fields.forEach(f => {
      if (f.auto || !Object.prototype.hasOwnProperty.call(d, f.k)) return;
      let v = typeof d[f.k] === 'string' ? d[f.k].trim() : d[f.k];
      if (f.extra) { extra = extra || Object.assign({}, row.extra || {}); if (v === '') delete extra[f.ck]; else extra[f.ck] = v; return; }
      if (v === '') v = null;
      if (f.k === 'intro_email_at' && v) v = new Date(v).toISOString();
      p[f.k] = v;
    });
    if (extra) p.extra = extra;
    if (row.__new) { p.extra = p.extra || Object.assign({}, row.extra || {}); if (S.admin && d.assigned_to) p.assigned_to = d.assigned_to; }
    if (!row.__new && S.admin && d.assigned_to) p.assigned_to = d.assigned_to;
    // the place is read from the company address when it has not been typed
    if ((row.__new || Object.prototype.hasOwnProperty.call(d, 'company')) && !Object.prototype.hasOwnProperty.call(d, 'location') && !row.location) {
      const g = RegHelpers.guessLocation(p.company || row.company || '', locations()); if (g) p.location = g;
    }
    if (!p.intro_email_sent && row.__new) p.intro_email_sent = 'No';
    return p;
  }

  async function saveAll() {
    if (S.saving) return true;
    const ids = dirtyIds(); if (!ids.length) { showToast('info', 'Nothing to save', 'There are no unsaved changes.'); return true; }
    S.saving = true; document.getElementById('rgSaveBtn').textContent = 'Saving…';
    S.errors = {}; let ok = 0; const failures = [];
    for (const id of ids) {
      const row = rowById(id); if (!row) continue;
      const errs = validateRow(row);
      if (errs.length) { S.errors[id] = errs.join(' '); failures.push(`${row.client_name || rawOf(row, 'client_name') || 'New lead'}: ${errs[0]}`); continue; }
      const p = payloadFor(row);
      try {
        if (row.__new) {
          p.created_by = S.me; if (!p.assigned_to) p.assigned_to = S.me;
          const { data, error } = await sb().from('follow_up_register').insert(p).select().single();
          if (error) throw error;
          S.newRows = S.newRows.filter(r => r.id !== id); delete S.drafts[id]; S.rows.unshift(data); ok++;
        } else {
          const { data, error } = await sb().from('follow_up_register').update(p).eq('id', id).select();
          if (error) throw error;
          if (!data || !data.length) throw new Error('You do not have permission to change this lead.');
          const i = S.rows.findIndex(r => r.id === id); S.rows[i] = data[0]; delete S.drafts[id]; ok++;
        }
      } catch (err) {
        S.errors[id] = nice(err.message || 'Could not save.');
        failures.push(`${rawOf(row, 'client_name') || 'Lead'}: ${S.errors[id]}`);
      }
    }
    S.saving = false; document.getElementById('rgSaveBtn').textContent = 'Save';
    render();
    if (ok) showToast('success', 'Saved', `${ok} lead${ok === 1 ? '' : 's'} saved.`);
    if (failures.length) {
      await customAlert('These could not be saved (they are highlighted red and still unsaved):\n\n• ' + failures.slice(0, 8).join('\n• '), { title: 'Some changes were not saved', danger: true });
      return false;
    }
    return true;
  }
  async function discardAll() {
    if (!dirtyIds().length) return;
    if (!(await customConfirm('Discard all unsaved changes?', { confirmText: 'Discard', danger: true }))) return;
    S.drafts = {}; S.newRows = []; S.errors = {}; render();
  }

  /* ---------- row actions ---------- */
  function closeMenu() { const m = document.getElementById('rgMenu'); if (m) m.remove(); }
  function openMenu(btn, id) {
    closeMenu(); const row = rowById(id); if (!row) return;
    const items = [];
    if (row.__new) items.push(['Remove this row', () => { S.newRows = S.newRows.filter(r => r.id !== id); delete S.drafts[id]; render(); }, true]);
    else {
      if (S.admin) {
        items.push(['View history', () => openHistory(id)]);
        if (row.outcome && !row.outcome_approved) items.push(['Approve outcome', () => adminPatch(id, { outcome_approved: true }, 'Outcome approved.')]);
        items.push(['Unlock for 24 hours', () => adminPatch(id, { unlocked_until: new Date(Date.now() + 864e5).toISOString(), unlock_requested: false }, 'Lead unlocked for 24 hours.')]);
        items.push(['Reassign owner…', () => openReassign(id)]);
        items.push([row.deleted_at ? 'Restore lead' : 'Delete lead', () => toggleDelete(id), !row.deleted_at]);
      } else if (isMine(row) && isLocked24(row) && !row.unlock_requested) {
        items.push(['Request unlock', () => requestUnlock(id)]);
      }
    }
    if (!items.length) items.push(['No actions available', () => {}]);
    const m = document.createElement('div'); m.id = 'rgMenu'; m.className = 'rg-menu';
    items.forEach(([label, fn, danger]) => { const b = document.createElement('button'); b.textContent = label; if (danger) b.className = 'danger'; b.onclick = () => { closeMenu(); fn(); }; m.appendChild(b); });
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(); m.style.top = Math.min(r.bottom + 4, window.innerHeight - m.offsetHeight - 10) + 'px'; m.style.left = Math.max(10, Math.min(r.right - m.offsetWidth, window.innerWidth - m.offsetWidth - 10)) + 'px';
  }
  async function adminPatch(id, patch, okMsg) {
    const ok = await writeChecked(sb().from('follow_up_register').update(patch).eq('id', id), 'That change could not be saved.');
    if (ok) { showToast('success', 'Done', okMsg); await reload(); }
  }
  async function requestUnlock(id) {
    if (!(await customConfirm('Ask an admin to unlock this lead for editing?', { confirmText: 'Send request' }))) return;
    const ok = await writeChecked(sb().from('follow_up_register').update({ unlock_requested: true }).eq('id', id), 'Could not send the request.');
    if (ok) { showToast('success', 'Request sent', 'An admin will review it.'); await reload(); }
  }
  async function toggleDelete(id) {
    const row = rowById(id);
    if (!row.deleted_at && !(await customConfirm(`Delete the lead “${row.client_name}”? It is hidden, never destroyed, and can be restored.`, { confirmText: 'Delete', danger: true }))) return;
    await adminPatch(id, { deleted_at: row.deleted_at ? null : new Date().toISOString() }, row.deleted_at ? 'Lead restored.' : 'Lead deleted.');
  }
  /* ---------- admin: assign leads by location, saved rules ---------- */
  async function loadRules() {
    const { data, error } = await sb().from('register_assign_rules').select('*').order('created_at');
    return error ? [] : (data || []);
  }
  const lc = (v) => String(v || '').trim().toLowerCase();
  // the most specific rule wins: location + category beats location alone
  function ruleFor(row, rules, state) {
    const hit = rules.filter(r => lc(r.location) === lc(row.location) && (!r.category || lc(r.category) === lc(row.category)));
    if (!hit.length) return null;
    hit.sort((a, b) => (b.category ? 1 : 0) - (a.category ? 1 : 0));
    const r = hit[0];
    if (!r.assignee2 || r.assignee2 === r.assignee) return r.assignee;
    state = state || {}; const n = state[r.id] = (state[r.id] || 0) + 1;     // two owners: matching leads alternate between them
    return n % 2 ? r.assignee : r.assignee2;
  }
  const ruleOwners = (r) => [r.assignee, r.assignee2].filter(x => x && x !== undefined);
  async function bulkUpdate(ids, patch, onProgress) {
    let done = 0, fail = 0;
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { data, error } = await sb().from('follow_up_register').update(patch).in('id', chunk).select('id');
      if (error) fail += chunk.length; else { done += (data || []).length; fail += chunk.length - (data || []).length; }
      if (onProgress) onProgress(Math.min(i + 100, ids.length), ids.length);
    }
    return { done, fail };
  }
  async function openAssign() {
    if (!S.admin) return;
    let rules = await loadRules();
    const people = S.peopleList.slice().sort((a, b) => a.name.localeCompare(b.name));
    const pOpt = (sel) => people.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)} (${p.role})</option>`).join('');
    const m = modal(`<h3>Assign leads by location</h3>
      <p class="sub">Send leads to an employee by place (read from the company address) and category. Every change is logged in the Audit log.</p>
      <div class="rg-card" style="margin:0 0 14px"><h4 style="margin:0 0 8px">Assign now</h4>
        <div class="rg-form">
          <label>Location<select id="asLoc"></select></label>
          <label>Category<select id="asCat"></select></label>
          <label>Currently with<select id="asFrom"><option value="">Anyone</option>${pOpt('')}</select></label>
          <label>Assign to<select id="asTo">${pOpt('')}</select></label>
          <label>Split with (optional second owner)<select id="asTo2"><option value="">— nobody, all to one person —</option>${pOpt('')}</select></label>
        </div>
        <p id="asCount" style="margin:10px 0 6px"></p>
        <button class="rg-btn primary" id="asGo" type="button">Assign</button></div>
      <div class="rg-card" style="margin:0 0 14px"><h4 style="margin:0 0 8px">Saved rules <small style="font-weight:400">(used by “By saved location rules” in Import Excel, and by the button below)</small></h4>
        <div id="asRules"></div>
        <div class="rg-form" style="margin-top:8px">
          <label>Location<input id="rlLoc" list="rgLocList" placeholder="e.g. Mumbai"></label>
          <label>Category (optional)<input id="rlCat" list="rgCatList" placeholder="any"></label>
          <label>Assign to<select id="rlTo">${pOpt('')}</select></label>
          <label>Second owner (optional — leads are split evenly)<select id="rlTo2"><option value="">— none —</option>${pOpt('')}</select></label></div>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="rg-btn" id="rlAdd" type="button">＋ Save rule</button><button class="rg-btn primary" id="rlApply" type="button">Apply rules to existing leads</button></div></div>
      <div class="rg-card" style="margin:0 0 14px"><h4 style="margin:0 0 8px">Fill missing locations</h4>
        <p id="flInfo" style="margin:0 0 8px"></p><button class="rg-btn" id="flGo" type="button">Read locations from company addresses</button></div>
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Close</button></div>`);
    const live = () => S.rows.filter(r => !r.deleted_at);
    const fillSelects = () => {
      const cnt = {}; let none = 0; live().forEach(r => { if (r.location) cnt[r.location] = (cnt[r.location] || 0) + 1; else none++; });
      const cc = {}; live().forEach(r => { if (r.category) cc[r.category] = (cc[r.category] || 0) + 1; });
      const lv = m.querySelector('#asLoc').value, cv = m.querySelector('#asCat').value;
      m.querySelector('#asLoc').innerHTML = '<option value="">Choose a location…</option>' + locations().map(l => `<option value="${esc(l)}">${esc(l)} (${cnt[l] || 0})</option>`).join('') + `<option value="__none">No location (${none})</option>`;
      m.querySelector('#asCat').innerHTML = '<option value="">Any category</option>' + categories().map(c => `<option value="${esc(c)}">${esc(c)} (${cc[c] || 0})</option>`).join('');
      m.querySelector('#asLoc').value = lv; m.querySelector('#asCat').value = cv;
    };
    const owners2 = () => { const a = m.querySelector('#asTo').value, b = m.querySelector('#asTo2').value; return b && b !== a ? [a, b] : [a]; };
    const matching = () => {
      const loc = m.querySelector('#asLoc').value, cat = m.querySelector('#asCat').value, from = m.querySelector('#asFrom').value, own = owners2();
      if (!loc) return [];
      return live().filter(r => (loc === '__none' ? !r.location : r.location === loc) && (!cat || r.category === cat) && (!from || r.assigned_to === from) && !own.includes(r.assigned_to));
    };
    const count = () => { const n = matching().length, loc = m.querySelector('#asLoc').value; m.querySelector('#asCount').innerHTML = loc ? `<b>${n}</b> lead${n === 1 ? '' : 's'} will ${owners2().length > 1 ? 'be split between ' + esc(owners2().map(i => S.people[i]).join(' and ')) : 'move to ' + esc(S.people[m.querySelector('#asTo').value] || '')}.` : '<span style="color:var(--rg-muted)">Choose a location to see how many leads match.</span>'; m.querySelector('#asGo').disabled = !n; };
    const showRules = () => {
      m.querySelector('#asRules').innerHTML = rules.length ? `<table class="rg-table"><thead><tr><th>Location</th><th>Category</th><th>Goes to</th><th></th></tr></thead><tbody>${rules.map(r => `<tr><td>${esc(r.location)}</td><td>${esc(r.category || 'any')}</td><td>${esc(S.people[r.assignee] || '?')}${r.assignee2 ? ' + ' + esc(S.people[r.assignee2] || '?') + ' <small>(split evenly)</small>' : ''}</td><td><button class="rg-btn sm danger" data-rdel="${esc(r.id)}" type="button">Remove</button></td></tr>`).join('')}</tbody></table>` : '<p style="color:var(--rg-muted);margin:0">No rules yet.</p>';
    };
    const fillInfo = () => {
      const none = live().filter(r => !r.location && r.company); const guess = none.filter(r => RegHelpers.guessLocation(r.company, locations()));
      m.querySelector('#flInfo').innerHTML = `<b>${live().filter(r => !r.location).length}</b> lead${live().filter(r => !r.location).length === 1 ? '' : 's'} have no location. A place can be read from the address for <b>${guess.length}</b> of them.`;
      m.querySelector('#flGo').disabled = !guess.length;
    };
    const refresh = () => { fillSelects(); count(); showRules(); fillInfo(); };
    refresh();
    ['#asLoc', '#asCat', '#asFrom', '#asTo', '#asTo2'].forEach(q => m.querySelector(q).onchange = count);
    m.querySelector('#asGo').onclick = async (e) => {
      const rows = matching(); if (!rows.length) return; const own = owners2();
      const half = own.length > 1 ? Math.ceil(rows.length / 2) : rows.length;
      if (!(await customConfirm(own.length > 1 ? `Split ${rows.length} leads: ${half} to ${S.people[own[0]]} and ${rows.length - half} to ${S.people[own[1]]}?` : `Move ${rows.length} lead${rows.length === 1 ? '' : 's'} to ${S.people[own[0]]}?`, { confirmText: 'Assign' }))) return;
      e.target.disabled = true; e.target.textContent = 'Assigning…';
      const parts = own.length > 1 ? [[own[0], rows.slice(0, half)], [own[1], rows.slice(half)]] : [[own[0], rows]];
      const r = { done: 0, fail: 0 };
      for (const [uid, list] of parts) { const x = await bulkUpdate(list.map(l => l.id), { assigned_to: uid }, (d, t) => { e.target.textContent = `Assigning… ${d}/${t}`; }); r.done += x.done; r.fail += x.fail; }
      await reload(); e.target.textContent = 'Assign'; refresh();
      showToast(r.fail ? 'warning' : 'success', 'Leads assigned', `${r.done} moved${r.fail ? `, ${r.fail} could not be moved` : ''}.`);
    };
    m.querySelector('#rlAdd').onclick = async () => {
      const loc = m.querySelector('#rlLoc').value.trim().replace(/\s+/g, ' '), cat = m.querySelector('#rlCat').value.trim().replace(/\s+/g, ' '), to = m.querySelector('#rlTo').value;
      if (!loc) { showToast('error', 'Location needed', 'Type the location this rule is for.'); return; }
      const hit = locations().find(l => lc(l) === lc(loc)) || loc.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()), chit = cat ? (categories().find(c => lc(c) === lc(cat)) || cat) : null;
      const to2 = m.querySelector('#rlTo2').value;
      const { error } = await sb().from('register_assign_rules').insert({ location: hit, category: chit, assignee: to, assignee2: to2 && to2 !== to ? to2 : null, created_by: S.me });
      if (error) { await customAlert(nice(error.message), { title: 'Rule not saved', danger: true }); return; }
      rules = await loadRules(); m.querySelector('#rlLoc').value = ''; m.querySelector('#rlCat').value = ''; showRules(); showToast('success', 'Rule saved', `${hit}${chit ? ' · ' + chit : ''} → ${S.people[to]}${to2 && to2 !== to ? ' + ' + S.people[to2] : ''}`);
    };
    m.addEventListener('click', async (e) => {
      const id = e.target.dataset && e.target.dataset.rdel; if (!id) return;
      if (!(await customConfirm('Remove this rule? Leads already assigned stay where they are.', { confirmText: 'Remove', danger: true }))) return;
      const { data, error } = await sb().from('register_assign_rules').delete().eq('id', id).select('id');
      if (error || !data || !data.length) { await customAlert(error ? nice(error.message) : 'Nothing was removed.', { title: 'Not removed', danger: true }); return; }
      rules = await loadRules(); showRules();
    });
    m.querySelector('#rlApply').onclick = async (e) => {
      if (!rules.length) { showToast('info', 'No rules', 'Add a rule first.'); return; }
      const by = {}, st = {}; live().forEach(r => {
        const hit = rules.filter(x => lc(x.location) === lc(r.location) && (!x.category || lc(x.category) === lc(r.category))).sort((a, b) => (b.category ? 1 : 0) - (a.category ? 1 : 0))[0];
        if (!hit || ruleOwners(hit).includes(r.assigned_to)) return;       // already with one of the rule's owners: leave it
        const to = ruleFor(r, rules, st); if (to) (by[to] = by[to] || []).push(r.id);
      });
      const total = Object.values(by).reduce((n, a) => n + a.length, 0);
      if (!total) { showToast('info', 'Nothing to move', 'Every lead that matches a rule is already with the right person.'); return; }
      const lines = Object.keys(by).map(t => `• ${by[t].length} to ${S.people[t]}`).join('\n');
      if (!(await customConfirm(`Apply the rules?\n\n${lines}`, { confirmText: 'Apply' }))) return;
      e.target.disabled = true; e.target.textContent = 'Applying…'; let done = 0, fail = 0;
      for (const t of Object.keys(by)) { const r = await bulkUpdate(by[t], { assigned_to: t }); done += r.done; fail += r.fail; }
      await reload(); e.target.disabled = false; e.target.textContent = 'Apply rules to existing leads'; refresh();
      showToast(fail ? 'warning' : 'success', 'Rules applied', `${done} lead${done === 1 ? '' : 's'} moved${fail ? `, ${fail} could not be moved` : ''}.`);
    };
    m.querySelector('#flGo').onclick = async (e) => {
      const by = {}; live().filter(r => !r.location && r.company).forEach(r => { const g = RegHelpers.guessLocation(r.company, locations()); if (g) (by[g] = by[g] || []).push(r.id); });
      const total = Object.values(by).reduce((n, a) => n + a.length, 0); if (!total) return;
      const top = Object.keys(by).sort((a, b) => by[b].length - by[a].length).slice(0, 8).map(k => `• ${k}: ${by[k].length}`).join('\n');
      if (!(await customConfirm(`Set the location on ${total} lead${total === 1 ? '' : 's'}?\n\n${top}${Object.keys(by).length > 8 ? '\n…and more' : ''}`, { confirmText: 'Fill locations' }))) return;
      e.target.disabled = true; e.target.textContent = 'Working…'; let done = 0, fail = 0;
      for (const k of Object.keys(by)) { const r = await bulkUpdate(by[k], { location: k }); done += r.done; fail += r.fail; }
      await reload(); e.target.disabled = false; e.target.textContent = 'Read locations from company addresses'; refresh();
      showToast(fail ? 'warning' : 'success', 'Locations filled', `${done} lead${done === 1 ? '' : 's'} updated${fail ? `, ${fail} failed` : ''}.`);
    };
  }

  /* ---------- admin: find & remove repeated leads (smart matching, optional merge) ---------- */
  const MERGE_FIELDS = ['company', 'landline', 'email', 'lead_source', 'current_status', 'category', 'location', 'last_notes', 'intro_email_at'];
  const FU_FIELDS = ['f1_date', 'f1_remarks', 'f2_date', 'f2_remarks', 'f3_date', 'f3_remarks'];
  const has = (v) => v != null && String(v).trim() !== '';
  // what the kept lead can take over from the repeats that are being removed (only gaps are filled, nothing is overwritten)
  function mergePatch(keeper, repeats) {
    const patch = {};
    MERGE_FIELDS.forEach(k => { if (!has(keeper[k])) { const r = repeats.find(x => has(x[k])); if (r) patch[k] = r[k]; } });
    if (!FU_FIELDS.some(k => has(keeper[k]))) { const r = repeats.find(x => FU_FIELDS.some(k => has(x[k]))); if (r) FU_FIELDS.forEach(k => { if (has(r[k])) patch[k] = r[k]; }); }
    return patch;
  }
  function openDedupe() {
    if (!S.admin) return;
    const m = modal(`<h3>Find repeated leads</h3>
      <p class="sub">Finds leads that repeat the same person or business. One lead in each group is kept; the ticked ones are deleted (hidden, never destroyed — restore them with “Show deleted”). Every change is logged.</p>
      <div class="rg-form">
        <label>Look for<select id="dpBy"><option value="smart">Smart: same email, phone, or name + company (recommended)</option><option value="email">Same email</option><option value="phone">Same phone number (mobile or landline)</option><option value="namecomp">Same name + company</option><option value="company">Same company</option></select></label>
        <label>Keep<select id="dpKeep"><option value="full">Most complete entry</option><option value="old">Oldest entry</option><option value="new">Newest entry</option></select></label>
      </div>
      <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:.88rem"><input type="checkbox" id="dpMerge" checked style="margin-top:3px"><span>Fill gaps in the kept lead from the repeats first (missing email, notes, follow-ups, location…) — nothing already filled is overwritten.</span></label>
      <div style="margin-top:10px"><button class="rg-btn primary" id="dpScan" type="button">Find repeats</button></div>
      <div id="dpOut" style="margin-top:14px"></div>
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Close</button><button class="rg-btn danger" id="dpDel" disabled>Delete ticked leads</button></div>`);
    const filled = (r) => S.fields.filter(f => has(r[f.k])).length;
    let shown = [];
    const upd = () => { const n = m.querySelectorAll('.dp-chk:checked').length; const b = m.querySelector('#dpDel'); b.disabled = !n; b.textContent = n ? `Delete ${n} ticked lead${n === 1 ? '' : 's'}` : 'Delete ticked leads'; };
    m.querySelector('#dpScan').onclick = (e) => {
      const btn = e.target; btn.disabled = true; btn.textContent = 'Searching…';
      setTimeout(() => {
        const mode = m.querySelector('#dpBy').value, keep = m.querySelector('#dpKeep').value;
        const reps = RegHelpers.findGroups(S.rows.filter(r => !r.deleted_at), mode);
        reps.forEach(g => g.sort((a, b) => keep === 'new' ? (a.created_at < b.created_at ? 1 : -1) : keep === 'full' ? (filled(b) - filled(a)) || (a.created_at < b.created_at ? -1 : 1) : (a.created_at < b.created_at ? -1 : 1)));
        reps.sort((a, b) => b.length - a.length);
        const total = reps.reduce((n, g) => n + g.length - 1, 0);
        const out = m.querySelector('#dpOut'); btn.disabled = false; btn.textContent = 'Find repeats';
        if (!reps.length) { out.innerHTML = '<p><b>No repeated leads found</b> for this setting.</p>'; shown = []; upd(); return; }
        const lim = reps.slice(0, 150); shown = lim;
        out.innerHTML = `<p><b>${reps.length}</b> group${reps.length === 1 ? '' : 's'} of repeats · <b>${total}</b> lead${total === 1 ? '' : 's'} can be removed${reps.length > lim.length ? ` (showing the first ${lim.length} groups — run it again after deleting to see the rest)` : ''}. Untick any lead you want to keep.</p>
          <div style="overflow:auto;max-height:46vh"><table class="rg-table" style="white-space:nowrap"><thead><tr><th></th><th>Client</th><th>Mobile</th><th>Company</th><th>Email</th><th>Location</th><th>Owner</th><th>Entered</th><th>Why</th></tr></thead><tbody>` +
          lim.map((g, gi) => g.map((r, i) => `<tr style="${i === 0 ? 'border-top:2px solid var(--rg-line,#cbd5e1)' : ''}"><td>${i === 0 ? '<span class="rg-badge ok">Keep</span>' : `<input type="checkbox" class="dp-chk" data-id="${esc(r.id)}" data-g="${gi}" checked>`}</td><td>${esc(r.client_name)}</td><td>${esc(r.mobile)}</td><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${esc(r.company || '')}</td><td>${esc(r.email || '')}</td><td>${esc(r.location || '')}</td><td>${esc(S.people[r.assigned_to] || '')}</td><td>${esc(dmy(r.lead_date || String(r.created_at).slice(0, 10)))}</td><td style="color:var(--rg-muted)">${i === 0 ? (() => { const f = Object.keys(mergePatch(g[0], g.slice(1))); return f.length ? 'will gain: ' + esc(f.map(k => { const fd = S.fields.find(x => x.k === k); return fd ? fd.label : k; }).join(', ')) : ''; })() : esc(RegHelpers.why(g[0], r))}</td></tr>`).join('')).join('') + '</tbody></table></div>';
        out.querySelectorAll('.dp-chk').forEach(c => c.onchange = upd); upd();
      }, 30);
    };
    m.querySelector('#dpDel').onclick = async (e) => {
      const chk = Array.from(m.querySelectorAll('.dp-chk:checked')); if (!chk.length) return;
      const merge = m.querySelector('#dpMerge').checked;
      if (!(await customConfirm(`Delete ${chk.length} repeated lead${chk.length === 1 ? '' : 's'}${merge ? ' after filling gaps in the kept leads' : ''}? They are hidden, not destroyed, and can be restored from “Show deleted”.`, { confirmText: 'Delete', danger: true }))) return;
      e.target.disabled = true; e.target.textContent = 'Working…';
      const byGroup = {}; chk.forEach(c => { (byGroup[c.dataset.g] = byGroup[c.dataset.g] || []).push(c.dataset.id); });
      let merged = 0; const ids = [];
      for (const gi of Object.keys(byGroup)) {
        const g = shown[+gi]; const del = byGroup[gi];
        if (merge) {
          const patch = mergePatch(g[0], g.filter(x => del.includes(x.id)));
          if (Object.keys(patch).length) {
            const { data, error } = await sb().from('follow_up_register').update(patch).eq('id', g[0].id).select('id');
            if (error || !data || !data.length) continue;          // could not fill the kept lead: leave this group untouched
            merged++;
          }
        }
        del.forEach(id => ids.push(id));
      }
      const r = await bulkUpdate(ids, { deleted_at: new Date().toISOString() });
      m.remove(); await reload();
      showToast(r.fail || ids.length < chk.length ? 'warning' : 'success', 'Repeated leads removed', `${r.done} deleted${merged ? `, ${merged} kept lead${merged === 1 ? '' : 's'} updated` : ''}${(r.fail || ids.length < chk.length) ? `, ${r.fail + chk.length - ids.length} skipped` : ''}.`);
    };
  }
  function openReassign(id) {
    const opts = S.peopleList.filter(p => p.role === 'marketing' || p.role === 'admin');
    const row = rowById(id);
    const m = modal(`<h3>Reassign lead</h3><p class="sub">${esc(row.client_name)} — choose who owns and can edit it.</p>
      <div class="rg-form"><label class="wide">New owner<select id="rgReown">${opts.map(p => `<option value="${p.id}" ${p.id === row.assigned_to ? 'selected' : ''}>${esc(p.name)} (${p.role})</option>`).join('')}</select></label></div>
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Cancel</button><button class="rg-btn primary" id="rgReownGo">Reassign</button></div>`);
    m.querySelector('#rgReownGo').onclick = async () => { const v = m.querySelector('#rgReown').value; m.remove(); await adminPatch(id, { assigned_to: v }, 'Lead reassigned.'); };
  }
  async function openHistory(id) {
    const { data, error } = await sb().from('register_audit').select('*').eq('row_id', id).order('at', { ascending: false }).limit(200);
    const labelOf = (k) => { if (!k) return ''; if (k.startsWith('extra:')) { const c = S.cols.find(c => c.key === k.slice(6)); return c ? c.label : k; } const f = S.fields.find(f => f.k === k); return f ? f.label : k; };
    const rows = (data || []).map(a => `<tr><td>${esc(fmtDateTime(a.at))}</td><td>${esc(a.user_name || '')}</td><td>${esc(a.action)}</td><td>${esc(labelOf(a.field))}</td><td>${esc(a.old_value || '')}</td><td>${esc(a.new_value || '')}</td></tr>`).join('');
    modal(`<h3>Lead history</h3><p class="sub">Every change, who made it and when.</p>
      ${error ? `<p>${esc(error.message)}</p>` : `<div style="overflow:auto;max-height:55vh"><table class="rg-table"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Field</th><th>Was</th><th>Now</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No history yet.</td></tr>'}</tbody></table></div>`}
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Close</button></div>`);
  }
  function modal(html) {
    const back = document.createElement('div'); back.className = 'rg-modal-back';
    back.innerHTML = `<div class="rg-modal">${html}</div>`; document.body.appendChild(back);
    back.addEventListener('click', (e) => { if (e.target === back || (e.target.dataset && e.target.dataset.close !== undefined)) back.remove(); });
    return back;
  }

  /* ---------- download / reports ---------- */
  function exportTable(list) {
    const heads = S.fields.map(f => f.label).concat(['Owner', 'Outcome approved']);
    const dispF = (r, f) => {
      const v = saved(r, f);
      if (f.type === 'date') return dmy(v);
      if (f.k === 'intro_email_at') return fmtDateTime(r.intro_email_at);
      return v;
    };
    const body = list.map(r => S.fields.map(f => dispF(r, f)).concat([S.people[r.assigned_to] || '', r.outcome ? (r.outcome_approved ? 'Yes' : 'Pending') : '']));
    // the first "Remarks" headers are ambiguous in a spreadsheet — label them per follow-up
    const labels = S.fields.map(f => f.fu && f.kind === 'rem' ? `${f.fu === 1 ? '1st' : f.fu === 2 ? '2nd' : '3rd'} Follow-Up Remarks` : f.label).concat(['Owner', 'Outcome approved']);
    return { heads: labels, body, plain: heads };
  }
  function periodLabel() { if (S.f.preset === 'all' || (!S.f.from && !S.f.to)) return 'All'; return S.f.from === S.f.to ? dmy(S.f.from) : dmy(S.f.from) + '_to_' + dmy(S.f.to); }
  async function ensureSaved() {
    if (dirtyIds().length) {
      if (!(await customConfirm('You have unsaved changes, and they are not included. Save them first?', { confirmText: 'Save & continue', cancelText: 'Cancel' }))) return false;
      if (!(await saveAll())) return false;
    }
    return true;
  }
  async function guardDownload() {
    if (!S.admin) { await customAlert('Only an admin can download the register. You can save a report instead.', { title: 'Not allowed' }); return false; }
    return ensureSaved();
  }
  async function logDownload(fmt, n) {
    const { error } = await sb().rpc('log_register_download', { p_format: fmt, p_from: S.f.from || null, p_to: S.f.to || null, p_rows: n });
    if (error) { await customAlert(error.message, { title: 'Download blocked', danger: true }); return false; }
    return true;
  }
  async function downloadExcel(list, fileLabel) {
    list = list || filtered();
    if (!(await guardDownload())) return;
    if (!window.XLSX) { await customAlert('The Excel library could not be loaded. Check your connection and refresh.', { title: 'Cannot export' }); return; }
    if (!(await logDownload('xlsx', list.length))) return;
    const t = exportTable(list);
    const ws = XLSX.utils.aoa_to_sheet([t.heads].concat(t.body));
    ws['!cols'] = S.fields.map(f => ({ wch: Math.max(12, Math.round(f.w / 8)) })).concat([{ wch: 18 }, { wch: 16 }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Follow-Up Register');
    XLSX.writeFile(wb, `Follow-Up_Register_${fileLabel || periodLabel()}.xlsx`);
  }
  async function downloadPdf(list) {
    list = list || filtered();
    if (!(await guardDownload())) return;
    if (!window.jspdf || !window.jspdf.jsPDF) { await customAlert('The PDF library could not be loaded. Check your connection and refresh.', { title: 'Cannot export' }); return; }
    if (!(await logDownload('pdf', list.length))) return;
    const { jsPDF } = window.jspdf; const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    let logo = null;
    try { const r = await fetch('assets/logo.png'); const b = await r.blob(); logo = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); } catch (e) {}
    if (logo) { try { doc.addImage(logo, 'PNG', 12, 8, 34, 12); } catch (e) {} }
    doc.setFontSize(16); doc.text('Follow-Up Register', logo ? 52 : 12, 15);
    doc.setFontSize(9); doc.text(`Period: ${S.f.preset === 'all' ? 'All' : (S.f.from === S.f.to ? dmy(S.f.from) : dmy(S.f.from) + ' to ' + dmy(S.f.to))}   ·   ${list.length} lead(s)   ·   Generated ${fmtDateTime(new Date().toISOString())} by ${S.profile.name}`, logo ? 52 : 12, 21);
    const t = exportTable(list);
    if (doc.autoTable) doc.autoTable({ head: [t.heads], body: t.body, startY: 26, styles: { fontSize: 6, cellPadding: 1.2, overflow: 'linebreak' }, headStyles: { fillColor: [22, 32, 51] }, margin: { left: 8, right: 8 } });
    doc.save(`Follow-Up_Register_${periodLabel()}.pdf`);
  }
  async function saveReport() {
    if (!S.perms.can_save) { await customAlert('Saving reports is switched off for your account.', { title: 'Not allowed' }); return; }
    if (!(await ensureSaved())) return;
    const list = filtered();
    if (!list.length) { await customAlert('There are no leads in this view to save.', { title: 'Nothing to save' }); return; }
    if (list.length > 5000) { await customAlert('Too many leads for one report. Narrow the period.'); return; }
    const def = `Follow-Up Register ${S.f.preset === 'all' ? 'All' : (S.f.from === S.f.to ? dmy(S.f.from) : dmy(S.f.from) + ' to ' + dmy(S.f.to))}`;
    const title = await customPrompt('Name this saved report. It becomes a frozen copy that later edits cannot change.', def, { title: 'Save report', okText: 'Save report' });
    if (!title || !title.trim()) return;
    const t = exportTable(list);
    const { error } = await sb().from('register_reports').insert({
      title: title.trim().slice(0, 120), period_from: S.f.from || null, period_to: S.f.to || null,
      basis: S.f.preset === 'all' ? 'all' : S.f.basis, row_count: list.length, snapshot: { heads: t.heads, body: t.body }
    });
    if (error) { await customAlert(error.message, { title: 'Not saved', danger: true }); return; }
    showToast('success', 'Report saved', `“${title.trim()}” was stored with ${list.length} lead(s).`);
  }
  async function openReports() {
    const { data, error } = await sb().from('register_reports').select('id, title, period_from, period_to, basis, row_count, created_by, created_at').order('created_at', { ascending: false }).limit(200);
    const rows = (data || []).map(r => `<tr><td><b>${esc(r.title)}</b></td><td>${r.period_from ? esc(dmy(r.period_from) + ' → ' + dmy(r.period_to)) : 'All'}</td><td>${r.row_count}</td><td>${esc(S.people[r.created_by] || '')}</td><td>${esc(fmtDateTime(r.created_at))}</td>
      <td style="white-space:nowrap"><button class="rg-btn sm" data-repview="${r.id}">View</button>${S.admin ? ` <button class="rg-btn sm" data-rep="${r.id}">Excel</button> <button class="rg-btn sm danger" data-repdel="${r.id}">Delete</button>` : ''}</td></tr>`).join('');
    const m = modal(`<h3>Saved reports</h3><p class="sub">Frozen copies — they never change after saving.</p>
      ${error ? `<p>${esc(error.message)}</p>` : `<div style="overflow:auto;max-height:55vh"><table class="rg-table"><thead><tr><th>Report</th><th>Period</th><th>Leads</th><th>By</th><th>Saved</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6">No saved reports yet.</td></tr>'}</tbody></table></div>`}
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Close</button></div>`);
    m.addEventListener('click', async (e) => {
      const rid = e.target.dataset && e.target.dataset.rep, did = e.target.dataset && e.target.dataset.repdel, vid = e.target.dataset && e.target.dataset.repview;
      if (vid) {
        const { data: rep, error: er } = await sb().from('register_reports').select('title, snapshot, row_count, created_at').eq('id', vid).single();
        if (er) { await customAlert(er.message); return; }
        const head = rep.snapshot.heads.map(h => `<th>${esc(h)}</th>`).join('');
        const body = rep.snapshot.body.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
        const v = modal(`<h3>${esc(rep.title)}</h3><p class="sub">${rep.row_count} lead(s) · saved ${esc(fmtDateTime(rep.created_at))} · read-only snapshot</p>
          <div style="overflow:auto;max-height:60vh"><table class="rg-table" style="white-space:nowrap"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
          <div class="rg-modal-actions"><button class="rg-btn" data-close>Close</button></div>`);
        v.querySelector('.rg-modal').style.maxWidth = '95vw';
        return;
      }
      if (did) { if (!(await customConfirm('Delete this saved report?', { confirmText: 'Delete', danger: true }))) return; const ok = await writeChecked(sb().from('register_reports').delete().eq('id', did), 'Could not delete.'); if (ok) { m.remove(); openReports(); } }
      if (rid) {
        if (!S.admin) { await customAlert('Only an admin can download.'); return; }
        const { data: rep, error: er } = await sb().from('register_reports').select('title, snapshot, row_count').eq('id', rid).single();
        if (er || !window.XLSX) { await customAlert(er ? er.message : 'Excel library not loaded.'); return; }
        if (!(await logDownload('report-xlsx', rep.row_count))) return;
        const ws = XLSX.utils.aoa_to_sheet([rep.snapshot.heads].concat(rep.snapshot.body)); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, rep.title.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_') + '.xlsx');
      }
    });
  }

  /* ---------- toolbar ---------- */
  function toolbarHtml() {
    const o = (arr, sel, blank) => (blank ? `<option value="">${blank}</option>` : '') + arr.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');
    const people = S.peopleList.filter(p => p.role === 'marketing' || p.role === 'admin');
    return `
    <div class="rg-toolbar">
      <label class="rg-field"><span>Period</span><select id="fPreset">
        ${[['all', 'All time'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'This week'], ['lastweek', 'Last week'], ['month', 'This month'], ['lastmonth', 'Last month'], ['custom', 'Custom range…']].map(([v, l]) => `<option value="${v}" ${S.f.preset === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="rg-field"><span>From</span><input type="date" id="fFrom" value="${S.f.from}"></label>
      <label class="rg-field"><span>To</span><input type="date" id="fTo" value="${S.f.to}"></label>
      <div class="rg-field"><span>Period applies to</span><div class="rg-seg" id="fBasis"><button data-b="entry" class="${S.f.basis === 'entry' ? 'active' : ''}">Entry date</button><button data-b="followup" class="${S.f.basis === 'followup' ? 'active' : ''}">Follow-up dates</button></div></div>
      <label class="rg-field"><span>Search</span><input type="search" id="fQ" placeholder="Name, company, mobile…" value="${esc(S.f.q)}"></label>
      <label class="rg-field"><span>Status</span><select id="fStatus">${o(S.opts.current_status || [], S.f.status, 'All')}</select></label>
      <label class="rg-field"><span>Source</span><select id="fSource">${o(S.opts.lead_source || [], S.f.source, 'All')}</select></label>
      <label class="rg-field"><span>Category</span><select id="fCategory">${o(categories(), S.f.category, 'All')}</select></label>
      <label class="rg-field"><span>Location</span><select id="fLocation"><option value="">All</option></select></label>
      <label class="rg-field"><span>Owner</span><select id="fOwner"><option value="all">Everyone</option><option value="me" ${S.f.owner === 'me' ? 'selected' : ''}>Mine only</option>${S.admin ? people.map(p => `<option value="${p.id}" ${S.f.owner === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('') : ''}</select></label>
      <label class="rg-field"><span>Sort</span><select id="fSort">${[['new', 'Newest first'], ['old', 'Oldest first'], ['name', 'Client A–Z'], ['next', 'Next follow-up'], ['category', 'Category A–Z'], ['categorydesc', 'Category Z–A'], ['location', 'Location A–Z'], ['locationdesc', 'Location Z–A']].concat(S.admin ? [['owner', 'Employee A–Z'], ['ownerdesc', 'Employee Z–A']] : []).map(([v, l]) => `<option value="${v}" ${S.f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${S.admin ? `<label class="rg-field"><span>Group</span><select id="fGroup"><option value="">No grouping</option><option value="owner" ${S.f.group === 'owner' ? 'selected' : ''}>By employee</option><option value="location" ${S.f.group === 'location' ? 'selected' : ''}>By location</option><option value="category" ${S.f.group === 'category' ? 'selected' : ''}>By category</option></select></label>` : ''}
      ${S.admin ? `<label class="rg-field"><span>Deleted</span><select id="fDeleted"><option value="0">Hide</option><option value="1" ${S.f.showDeleted ? 'selected' : ''}>Show</option></select></label>` : ''}
      <span class="rg-spacer" style="flex:1"></span>
      <button class="rg-btn primary" data-act="add">＋ Add lead</button>
      ${S.admin ? '<button class="rg-btn" data-act="xlsx">⬇ Excel</button><button class="rg-btn" data-act="pdf">⬇ PDF</button>' : ''}
      <button class="rg-btn" data-act="report" ${S.perms.can_save ? '' : 'disabled title="Saving reports is switched off for your account"'}>Save as report</button>
      <button class="rg-btn" data-act="reports">Saved reports</button>
      ${S.admin ? '<button class="rg-btn" data-act="import">⬆ Import Excel</button><button class="rg-btn" data-act="dedupe">🧹 Find repeats</button><button class="rg-btn" data-act="assign">📍 Assign by location</button>' : (S.importUsed ? '' : '<button class="rg-btn" data-act="import1" title="Works only once">⬆ One-time Excel import</button>')}
    </div>`;
  }
  function wireToolbar() {
    const $ = (id) => document.getElementById(id);
    const apply = () => { S.page = 0; render(); };
    $('fPreset').onchange = (e) => { S.f.preset = e.target.value; if (S.f.preset !== 'custom') { [S.f.from, S.f.to] = periodRange(S.f.preset); $('fFrom').value = S.f.from; $('fTo').value = S.f.to; } apply(); };
    $('fFrom').onchange = (e) => { S.f.from = e.target.value; S.f.preset = 'custom'; $('fPreset').value = 'custom'; apply(); };
    $('fTo').onchange = (e) => { S.f.to = e.target.value; S.f.preset = 'custom'; $('fPreset').value = 'custom'; apply(); };
    $('fBasis').onclick = (e) => { const b = e.target.dataset.b; if (!b) return; S.f.basis = b; [...$('fBasis').children].forEach(x => x.classList.toggle('active', x.dataset.b === b)); apply(); };
    let tm; $('fQ').oninput = (e) => { clearTimeout(tm); tm = setTimeout(() => { S.f.q = e.target.value; apply(); }, 200); };
    $('fStatus').onchange = (e) => { S.f.status = e.target.value; apply(); };
    $('fLocation').onchange = (e) => { S.f.location = e.target.value; apply(); };
    $('fCategory').onchange = (e) => { S.f.category = e.target.value; apply(); };
    $('fSource').onchange = (e) => { S.f.source = e.target.value; apply(); };
    $('fOwner').onchange = (e) => { S.f.owner = e.target.value; apply(); };
    $('fSort').onchange = (e) => { S.f.sort = e.target.value; apply(); };
    if ($('fGroup')) $('fGroup').onchange = (e) => { S.f.group = e.target.value; apply(); };
    if ($('fDeleted')) $('fDeleted').onchange = (e) => { S.f.showDeleted = e.target.value === '1'; apply(); };
  }

  /* ---------- Excel import ---------- */
  // Reads the first sheet and maps columns by their headings (works with the original Follow-Up Register sheet).
  const toISO = (v) => {
    if (v == null || v === '') return null;
    if (v instanceof Date) return isNaN(v) ? null : ymd(new Date(v.getTime() + 12 * 36e5));
    const s = String(v).trim(); let x;
    if ((x = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${x[1]}-${x[2]}-${x[3]}`;
    if ((x = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/))) return `${x[3]}-${pad(x[2])}-${pad(x[1])}`;
    return null;
  };
  // "10.30 am on 07-10-2026" -> ISO timestamp (India time)
  const toStamp = (v) => {
    if (v instanceof Date) return isNaN(v) ? null : v.toISOString();
    const s = String(v || '').trim(); if (!s) return null;
    const d = s.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/); if (!d) return null;
    const t = s.match(/(\d{1,2})[.:](\d{2})\s*(am|pm)?/i);
    let hh = t ? parseInt(t[1], 10) : 0; const mm = t ? t[2] : '00';
    if (t && t[3]) { const pm = /pm/i.test(t[3]); if (pm && hh < 12) hh += 12; if (!pm && hh === 12) hh = 0; }
    return `${d[3]}-${pad(d[2])}-${pad(d[1])}T${pad(hh)}:${mm}:00+05:30`;
  };
  async function parseImportFile(file, strict) {
    if (!window.XLSX) throw new Error('The Excel library could not be loaded. Check your connection and refresh.');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true, defval: '' });
    // find the heading row (the row among the first 15 that matches the most register columns), then map columns by meaning
    const classify = (h) => {
      if (!h || /^(owner|outcome approved|#|s\.?\s*no\.?|sl\.?\s*no\.?)$/.test(h)) return null;
      if (/landline|land\s*line|telephone|^tel\b/.test(h)) return 'landline';
      if (/^(lead\s*)?date$|^date of (lead|entry)|^entry date/.test(h)) return 'lead_date';
      if (/^time$|time slot/.test(h)) return 'lead_time';
      if (/client|customer|contact\s*person|^name$|party/.test(h)) return 'client_name';
      if (/company|organi[sz]ation|firm|business/.test(h)) return 'company';
      if (/mobile|phone|cell|whatsapp|contact\s*(no|number)/.test(h)) return 'mobile';
      if (/^e-?mail(\s*(id|address))?$/.test(h)) return 'email';
      if (/source/.test(h)) return 'lead_source';
      if (/introductory/.test(h)) return 'intro_email_sent';
      if (/call\s*\/?\s*e-?mail|date\s*&\s*time/.test(h)) return 'intro_email_at';
      if (/status/.test(h)) return 'current_status';
      if (/categor/.test(h)) return 'category';
      if (/^(location|city|place|town|area)$|^(lead )?(location|city|place)\b/.test(h)) return 'location';
      if (/1st.*date|first.*date/.test(h)) return 'f1_date';
      if (/2nd.*date|second.*date/.test(h)) return 'f2_date';
      if (/3rd.*date|third.*date/.test(h)) return 'f3_date';
      if (/remark/.test(h)) return 'remark';
      if (/discussion|notes?|comment/.test(h)) return 'last_notes';
      if (/outcome/.test(h)) return 'outcome';
      return null;
    };
    const norm = (c) => String(c).trim().toLowerCase().replace(/\s+/g, ' ');
    let hdr = 0, best = -1;
    for (let r = 0; r < Math.min(15, aoa.length); r++) { const sc = (aoa[r] || []).filter(c => classify(norm(c))).length; if (sc > best) { best = sc; hdr = r; } }
    const head = (aoa[hdr] || []).map(norm);
    const map = {}; let remarkN = 0; const unknown = [];
    head.forEach((h, i) => {
      const k = classify(h);
      if (!h || /^(owner|outcome approved|#|s\.?\s*no\.?|sl\.?\s*no\.?)$/.test(h)) return;
      if (!k) { unknown.push(String(aoa[hdr][i]).trim()); return; }
      if (k === 'remark') { remarkN++; if (remarkN <= 3) map['f' + remarkN + '_remarks'] = i; }
      else if (map[k] == null) map[k] = i;
    });
    const outcomes = (S.opts.outcome || []).map(x => x.toLowerCase());
    const rows = aoa.slice(hdr + 1).map((r, idx) => ({ r, line: hdr + idx + 2 })).filter(x => x.r.some(c => String(c).trim() !== '')).map(({ r, line }) => {
      const g = (k) => map[k] == null ? '' : r[map[k]];
      let mob = g('mobile'); mob = (typeof mob === 'number') ? String(Math.round(mob)) : String(mob).replace(/\.0$/, '').trim();
      const o = { __line: line, client_name: String(g('client_name')).trim(), company: String(g('company')).trim() || null, mobile: mob,
        landline: String(g('landline')).trim() || null, email: String(g('email')).trim() || null, lead_source: String(g('lead_source')).trim() || null,
        lead_time: String(g('lead_time')).trim() || null, intro_email_sent: /^y/i.test(String(g('intro_email_sent'))) ? 'Yes' : 'No',
        intro_email_at: toStamp(g('intro_email_at')), current_status: String(g('current_status')).trim() || null, category: String(g('category')).trim() || null, location: String(g('location')).trim() || null,
        last_notes: String(g('last_notes')).trim() || null, outcome: String(g('outcome')).trim() || null };
      const ld = toISO(g('lead_date')); if (ld) o.lead_date = ld;
      for (let n = 1; n <= 3; n++) { o['f' + n + '_date'] = toISO(g('f' + n + '_date')); o['f' + n + '_remarks'] = String(g('f' + n + '_remarks')).trim() || null; }
      // In the original sheet the outcome ("Prospective / Agreement / Not interested") is typed in the last Remarks cell.
      if (!o.outcome) for (let n = 3; n >= 1; n--) {
        const rem = o['f' + n + '_remarks']; const i = rem ? outcomes.indexOf(rem.toLowerCase()) : -1;
        if (i >= 0) { o.outcome = S.opts.outcome[i]; o['f' + n + '_remarks'] = null; break; }
      }
      return o;
    });
    let guessed = 0; rows.forEach(o => { if (!o.location) { const g = RegHelpers.guessLocation(o.company || '', locations()); if (g) { o.location = g; guessed++; } } });
    const LBL = { lead_date: 'Date', lead_time: 'Time', client_name: 'Client Name', company: 'Company', mobile: 'Mobile No', landline: 'Landline', email: 'Email', lead_source: 'Lead Source', intro_email_sent: 'Introductory Email', intro_email_at: 'Call/Email Date', current_status: 'Current Status', category: 'Category', location: 'Location', last_notes: 'Notes', f1_date: '1st follow-up date', f2_date: '2nd follow-up date', f3_date: '3rd follow-up date', f1_remarks: '1st remarks', f2_remarks: '2nd remarks', f3_remarks: '3rd remarks', outcome: 'Outcome' };
    rows.__info = { guessed, matched: Object.keys(map).map(k => LBL[k] || k), unknown, noName: map.client_name == null, noMobile: map.mobile == null };
    return rows;
  }
  // the same checks the database applies, so people see problems BEFORE anything is saved
  function checkImportRow(o, seen) {
    const dropdown = (k, key, label) => { const v = o[k]; if (v && !(S.opts[key] || []).includes(v)) return `${label} “${v}” is not in the allowed list`; return ''; };
    if (!o.client_name) return 'Missing field — client name';
    const digits = o.mobile.replace(/\D/g, '');
    if (!/^\d{10,13}$/.test(digits)) return o.mobile ? 'Invalid mobile number (needs 10 to 13 digits)' : 'Missing field — mobile number';
    const key = digits.slice(-10);
    if (seen.has(key)) return 'Duplicate — same mobile number appears earlier in the file';
    if (S.rows.some(r => !r.deleted_at && String(r.mobile).replace(/\D/g, '').slice(-10) === key)) return 'Duplicate — mobile number is already in the register';
    if (o.landline && !/^[0-9+\-\s()]{6,20}$/.test(o.landline)) return 'Landline looks invalid';
    const clash = RegHelpers.importClash(o, S._dupIdx || (S._dupIdx = RegHelpers.buildIndex(S.rows.filter(r => !r.deleted_at))), seen);
    if (clash.why) return clash.why;
    if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email)) return 'Email looks invalid';
    const bad = dropdown('lead_source', 'lead_source', 'Lead source') || dropdown('current_status', 'current_status', 'Status') ||  dropdown('lead_time', 'time_slot', 'Time') || dropdown('outcome', 'outcome', 'Outcome');
    if (bad) return bad;
    let prev = o.lead_date || today();
    if (o.lead_date && o.lead_date > today()) return 'Date is in the future';
    for (let n = 1; n <= 3; n++) {
      const d = o['f' + n + '_date'];
      if (!d) { if (o['f' + n + '_remarks']) return `Follow-up ${n} remarks have no date`; continue; }
      if (n > 1 && !o['f' + (n - 1) + '_date']) return `Follow-up ${n} is filled but follow-up ${n - 1} is empty`;
      if (d < prev) return `Follow-up ${n} date is before the previous date`;
      prev = d;
    }
    seen.add(key); clash.remember(); return '';
  }
  function downloadLeftOut(parsed, probs) {
    const rows = parsed.map((o, i) => probs[i] ? { 'Excel row': o.__line, 'Client Name': o.client_name, 'Mobile No': o.mobile, 'Company': o.company || '', 'Reason left out': probs[i] } : null).filter(Boolean);
    if (!rows.length || !window.XLSX) return;
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Left out'); XLSX.writeFile(wb, 'left-out-rows.xlsx');
  }
  function importPreviewHtml(parsed, probs) {
    const info = parsed.__info || { matched: [], unknown: [] };
    const infoHtml = `<p style="font-size:12.5px;color:var(--rg-muted)"><b>Columns matched automatically:</b> ${info.matched.length ? esc(info.matched.join(', ')) : 'none'}${info.guessed ? `<br><b>Location read from the company address</b> for ${info.guessed} lead${info.guessed === 1 ? '' : 's'}` : ''}${info.unknown.length ? `<br><b>Not matched (ignored):</b> ${esc(info.unknown.join(', '))}` : ''}${info.noName || info.noMobile ? `<br><b style="color:var(--rg-bad)">No ${info.noName ? '“Client Name”' : ''}${info.noName && info.noMobile ? ' or ' : ''}${info.noMobile ? '“Mobile No”' : ''} column found, so those rows cannot be imported.</b>` : ''}</p>`;
    const bad = probs.filter(Boolean).length;
    const nDup = probs.filter(x => /^Duplicate/.test(x)).length, nMiss = probs.filter(x => /^Missing/.test(x)).length;
    const breakdown = bad ? `<p style="font-size:12.5px;margin:0 0 6px">Left out: <b>${nDup}</b> duplicate · <b>${nMiss}</b> missing a required field · <b>${bad - nDup - nMiss}</b> other problems. <button class="rg-btn sm" id="imLeft" type="button">⬇ Download left-out rows</button></p>` : '';
    const list = parsed.map((o, i) => probs[i] ? `<tr><td>${o.__line}</td><td>${esc(o.client_name || '—')}</td><td>${esc(o.mobile)}</td><td style="color:var(--rg-bad)">${esc(probs[i])}</td></tr>` : '').filter(Boolean).slice(0, 40).join('');
    return infoHtml + breakdown + `<p><b>${parsed.length}</b> rows found · <b style="color:var(--rg-ok)">${parsed.length - bad}</b> ready to import${bad ? ` · <b style="color:var(--rg-bad)">${bad}</b> will be left out` : ''}.</p>
      ${bad ? `<div style="overflow:auto;max-height:200px"><table class="rg-table"><thead><tr><th>Excel row</th><th>Client</th><th>Mobile</th><th>Problem</th></tr></thead><tbody>${list}</tbody></table></div>${bad > 40 ? `<small>…and ${bad - 40} more</small>` : ''}` : ''}`;
  }

  // Admin import — unlimited, assigned to any marketing user
  function openImport() {
    S._dupIdx = null;
    const people = S.peopleList.filter(p => p.role === 'marketing' || p.role === 'admin');
    const m = modal(`<h3>Import leads from Excel / CSV</h3>
      <p class="sub">Use the same headings as the register. A preview shows any problems before anything is saved.</p>
      <div class="rg-form"><label>File<input type="file" id="imFile" accept=".xlsx,.xls,.csv"></label>
      <label>Assign imported leads to<select id="imOwner"><option value="__rules">By saved location rules (no rule → me)</option>${people.map(p => `<option value="${p.id}">${esc(p.name)} (${p.role})</option>`).join('')}</select></label></div>
      <div id="imPreview" style="margin-top:14px"></div>
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Close</button><button class="rg-btn primary" id="imGo" disabled>Import</button></div>`);
    let parsed = [], probs = [];
    m.querySelector('#imFile').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { parsed = await parseImportFile(file); } catch (err) { await customAlert(err.message, { title: 'Cannot read the file' }); return; }
      const seen = new Set(); probs = parsed.map(o => checkImportRow(o, seen));
      m.querySelector('#imPreview').innerHTML = importPreviewHtml(parsed, probs); { const lb = m.querySelector('#imLeft'); if (lb) lb.onclick = () => downloadLeftOut(parsed, probs); }
      m.querySelector('#imGo').disabled = !probs.some(x => !x);
    };
    m.querySelector('#imGo').onclick = async (e) => {
      const owner = m.querySelector('#imOwner').value; e.target.disabled = true; e.target.textContent = 'Importing…'; m.querySelector('#imPreview').innerHTML = '<div style="padding:18px;text-align:center;font-weight:600">⏳ Importation is under process… please wait and do not close this window.</div>'; m.querySelectorAll('[data-close]').forEach(b => b.disabled = true);
      const rules = owner === '__rules' ? await loadRules() : [];
      const rstate = {};
      const ownerFor = (i) => owner === '__rules' ? (ruleFor(parsed[i], rules, rstate) || S.me) : owner;
      let ok = 0; const fails = [];
      const prog = m.querySelector('#imPreview > div');
      const idxs = []; parsed.forEach((o, i) => { if (probs[i]) fails.push(`Row ${o.__line} (${o.client_name || 'no name'}) — ${probs[i]}`); else idxs.push(i); });
      const mk = (i) => { const o = Object.assign({}, parsed[i]); delete o.__line; return Object.assign({}, o, { assigned_to: ownerFor(i), created_by: S.me }); };
      for (let c = 0; c < idxs.length; c += 200) {
        const chunk = idxs.slice(c, c + 200);
        const { error } = await sb().from('follow_up_register').insert(chunk.map(mk));
        if (!error) ok += chunk.length;
        else for (const i of chunk) {          // a bad row inside the batch: retry that batch row by row to find it
          const r = await sb().from('follow_up_register').insert(mk(i));
          if (r.error) fails.push(`Row ${parsed[i].__line} (${parsed[i].client_name || 'no name'}) — ${nice(r.error.message)}`); else ok++;
        }
        if (prog) prog.textContent = `⏳ Importation is under process… ${Math.min(c + 200, idxs.length)} of ${idxs.length} checked. Please wait and do not close this window.`;
      }
      m.remove(); await reload();
      showToast(fails.length ? 'warning' : 'success', 'Importation is done', `${ok} imported, ${fails.length} skipped.`);
      if (fails.length) await customAlert('Skipped rows:\n\n• ' + fails.slice(0, 15).join('\n• ') + (fails.length > 15 ? `\n…and ${fails.length - 15} more` : ''), { title: 'Some rows were not imported' });
    };
  }

  // Marketing import — works exactly ONCE per person, enforced by the database
  function openOneTimeImport() {
    S._dupIdx = null;
    const m = modal(`<h3>One-time Excel import</h3>
      <p class="sub">Bring your existing Follow-Up Register sheet into the portal. <b>You can do this only once.</b> Afterwards this option disappears and only an admin can re-open it. Check the preview carefully.</p>
      <div class="rg-form"><label class="wide">Excel / CSV file (first sheet, headings in row 1)<input type="file" id="imFile" accept=".xlsx,.xls,.csv"></label></div>
      <div id="imPreview" style="margin-top:14px"></div>
      <div class="rg-modal-actions"><button class="rg-btn" data-close>Cancel</button><button class="rg-btn primary" id="imGo" disabled>Import now (one time)</button></div>`);
    let parsed = [], probs = [];
    m.querySelector('#imFile').onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { parsed = await parseImportFile(file); } catch (err) { await customAlert(err.message, { title: 'Cannot read the file' }); return; }
      if (parsed.length > 10000) { await customAlert('A one-time import can have at most 10,000 rows. Please split off the rest and add those leads normally.', { title: 'Too many rows' }); parsed = []; return; }
      const seen = new Set(); probs = parsed.map(o => checkImportRow(o, seen));
      m.querySelector('#imPreview').innerHTML = importPreviewHtml(parsed, probs); { const lb = m.querySelector('#imLeft'); if (lb) lb.onclick = () => downloadLeftOut(parsed, probs); }
      m.querySelector('#imGo').disabled = !probs.some(x => !x);
    };
    m.querySelector('#imGo').onclick = async (e) => {
      const good = parsed.filter((o, i) => !probs[i]); const left = parsed.length - good.length;
      if (!(await customConfirm(`This is your ONE-TIME import.\n\n• ${good.length} lead(s) will be added\n• ${left} row(s) will be left out (you can add those by hand afterwards)\n\nAfter this the import option is switched off for your account. Continue?`, { confirmText: 'Import now', danger: true }))) return;
      e.target.disabled = true; e.target.textContent = 'Importing…'; m.querySelector('#imPreview').innerHTML = '<div style="padding:18px;text-align:center;font-weight:600">⏳ Importation is under process… please wait and do not close this window.</div>'; m.querySelectorAll('[data-close]').forEach(b => b.disabled = true);
      const payload = good.map(o => { const c = Object.assign({}, o); delete c.__line; return c; });
      const { data, error } = await sb().rpc('register_import_leads', { p_rows: payload });
      if (error) { m.querySelectorAll('[data-close]').forEach(b => b.disabled = false); m.querySelector('#imPreview').innerHTML = ''; e.target.disabled = false; e.target.textContent = 'Import now (one time)'; await customAlert(nice(error.message), { title: 'Import failed', danger: true }); return; }
      m.remove(); S.importUsed = true; await reload();
      const serverSkipped = (data.skipped || []).map(x => `Row ${good[x.row - 1] ? good[x.row - 1].__line : x.row} — ${nice(x.reason)}`);
      const clientSkipped = parsed.map((o, i) => probs[i] ? `Row ${o.__line} (${o.client_name || 'no name'}) — ${probs[i]}` : '').filter(Boolean);
      const all = clientSkipped.concat(serverSkipped);
      showToast('success', 'Importation is done', `${data.imported} lead(s) added. The import option is now switched off.`);
      if (all.length) await customAlert(`${data.imported} added. These rows were left out, add them by hand if needed:\n\n• ` + all.slice(0, 20).join('\n• ') + (all.length > 20 ? `\n…and ${all.length - 20} more` : ''), { title: 'Import finished' });
    };
  }

  /* ---------- lifecycle ---------- */
  async function reload() {
    await loadAll();
    Object.keys(S.drafts).forEach(id => { if (!rowById(id)) delete S.drafts[id]; });   // keep unsaved edits across a reload
    S.errors = {};
    const tb = document.getElementById('rgToolbar'); if (tb) { tb.innerHTML = toolbarHtml(); wireToolbar(); }
    render();
  }
  // keeps the grid current when other people save, but never while you have unsaved edits or a box focused
  async function refreshQuiet() {
    if (document.visibilityState !== 'visible' || dirtyIds().length || S.saving) return;
    if (document.querySelector('.rg-modal-back, .premium-modal.is-open, #rgMenu')) return;
    const a = document.activeElement; if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return;
    try { await loadAll(); render(); } catch (e) {}
  }
  async function init(opts) {
    S.admin = !!opts.admin; S.profile = opts.profile; S.me = opts.profile.id; S.mount = document.getElementById(opts.mountId);
    S.mount.innerHTML = '<div class="rg-empty">Loading the register…</div>';
    try { await loadAll(); } catch (err) {
      S.mount.innerHTML = `<div class="rg-empty"><b>Could not load the register.</b><br>${esc(err.message || '')}<br><small>Has migration-v22.sql been run?</small></div>`; return;
    }
    S.mount.innerHTML = `<div id="rgToolbar">${toolbarHtml()}</div><div class="rg-strip" id="rgStrip"></div><div class="rg-summary" id="rgSummary"></div>
      <div class="rg-sheet-wrap" id="rgSheet"></div><div class="rg-pager" id="rgPager"></div>
      <div class="rg-savebar" id="rgSavebar"><span><b class="cnt">0 leads have</b> unsaved changes · <kbd>Ctrl</kbd>+<kbd>S</kbd></span>
        <button class="rg-btn sm" id="rgDiscardBtn">Discard</button><button class="rg-btn primary sm" id="rgSaveBtn">Save</button></div>`;
    wireToolbar();
    const sheet = document.getElementById('rgSheet');
    sheet.addEventListener('input', onInput); sheet.addEventListener('change', onInput); sheet.addEventListener('keydown', onKey);
    S.mount.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act],[data-chip]'); if (!t) return;
      if (t.dataset.chip !== undefined) { S.f.chip = (S.f.chip === t.dataset.chip) ? '' : t.dataset.chip; S.page = 0; render(); return; }
      const a = t.dataset.act;
      if (a === 'add') addLead(); else if (a === 'menu') openMenu(t, t.dataset.id);
      else if (a === 'sortowner') { S.f.sort = S.f.sort === 'owner' ? 'ownerdesc' : 'owner'; const fs = document.getElementById('fSort'); if (fs) fs.value = S.f.sort; S.page = 0; render(); }
      else if (a === 'prev') { S.page--; render(); } else if (a === 'next') { S.page++; render(); }
      else if (a === 'xlsx') downloadExcel(); else if (a === 'pdf') downloadPdf(); else if (a === 'report') saveReport();
      else if (a === 'reports') openReports(); else if (a === 'import') openImport(); else if (a === 'dedupe') openDedupe(); else if (a === 'assign') openAssign(); else if (a === 'import1') { if (!S.importUsed) openOneTimeImport(); }
    });
    setInterval(refreshQuiet, 120000);
    document.getElementById('rgSaveBtn').onclick = saveAll; document.getElementById('rgDiscardBtn').onclick = discardAll;
    document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveAll(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('#rgMenu') && !e.target.closest('[data-act="menu"]')) closeMenu(); });
    window.addEventListener('beforeunload', (e) => { if (dirtyIds().length) { e.preventDefault(); e.returnValue = ''; } });
    render();
    // A marketing user who typed a task-portal URL is sent back here with a notice.
    let blocked = null; try { blocked = sessionStorage.getItem('rg-blocked'); sessionStorage.removeItem('rg-blocked'); } catch (e) {}
    if (blocked && !S.admin) {
      sb().rpc('log_register_blocked', { p_path: blocked }).then(() => {}, () => {});
      customAlert('That page is not part of your role, and the attempt has been logged for the admin.\n\nPlease stay focused on your work and keep building your skills here in the Follow-Up Register.', { title: 'Access restricted', danger: true });
    }
  }
  return { init, reload, rows: () => S.rows, state: S, filtered, openReports, dmy, fuState, openHistory, hasUnsaved: () => dirtyIds().length > 0 };
})();