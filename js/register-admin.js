/* Admin side of the Follow-Up Register: approvals, dashboard, columns & lists, audit log, access */
const AdminReg = (() => {
  const sb = () => supabaseClient;
  const esc = (v) => escapeHtml(v == null ? '' : String(v));
  const dmy = RegisterApp.dmy;
  const LISTS = [['time_slot', 'Time slots'], ['lead_source', 'Lead sources'], ['current_status', 'Current statuses'], ['outcome', 'Outcomes']];
  const TYPES = [['text', 'Text'], ['number', 'Number'], ['date', 'Date'], ['yesno', 'Yes / No'], ['dropdown', 'Dropdown'], ['phone', 'Phone'], ['email', 'Email']];
  const loaded = {};
  let me = null;

  function show(tab) {
    document.querySelectorAll('.rg-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.rg-panel').forEach(p => p.classList.toggle('active', p.id === 'p-' + tab));
    if (tab === 'approvals') renderApprovals();
    if (tab === 'dashboard') renderDashboard();
    if (tab === 'columns') renderColumns();
    if (tab === 'audit') renderAudit(true);
    if (tab === 'access') renderAccess();
  }
  function updateApprovalBadge() {
    const n = RegisterApp.rows().filter(r => !r.deleted_at && ((r.outcome && !r.outcome_approved) || r.unlock_requested)).length;
    const c = document.getElementById('apCount'); c.textContent = n; c.style.display = n ? '' : 'none';
  }

  /* ---------- approvals ---------- */
  function renderApprovals() {
    const rows = RegisterApp.rows().filter(r => !r.deleted_at);
    const pend = rows.filter(r => r.outcome && !r.outcome_approved);
    const unl = rows.filter(r => r.unlock_requested);
    const who = (id) => RegisterApp.state.people[id] || '';
    document.getElementById('p-approvals').innerHTML = `
      <div class="rg-card"><h3>Outcomes awaiting approval (${pend.length})</h3><p class="sub">Marketing proposes Agreement / Not interested / Prospective; it only counts once you approve. Rejecting clears the outcome so they can correct it.</p>
        <table class="rg-table"><thead><tr><th>Client</th><th>Company</th><th>Owner</th><th>Outcome</th><th>Last notes</th><th></th></tr></thead><tbody>
        ${pend.map(r => `<tr><td><b>${esc(r.client_name)}</b></td><td>${esc(r.company)}</td><td>${esc(who(r.assigned_to))}</td><td><span class="rg-badge warn">${esc(r.outcome)}</span></td><td>${esc((r.last_notes || '').slice(0, 80))}</td>
          <td style="white-space:nowrap"><button class="rg-btn sm primary" data-ap="${r.id}">Approve</button> <button class="rg-btn sm danger" data-rej="${r.id}">Reject</button> <button class="rg-btn sm" data-hist="${r.id}">History</button></td></tr>`).join('') || '<tr><td colspan="6">Nothing waiting. 🎉</td></tr>'}</tbody></table></div>
      <div class="rg-card"><h3>Unlock requests (${unl.length})</h3><p class="sub">Leads older than 24 hours lock their contact details. Unlocking opens them for 24 hours.</p>
        <table class="rg-table"><thead><tr><th>Client</th><th>Company</th><th>Owner</th><th></th></tr></thead><tbody>
        ${unl.map(r => `<tr><td><b>${esc(r.client_name)}</b></td><td>${esc(r.company)}</td><td>${esc(who(r.assigned_to))}</td><td><button class="rg-btn sm primary" data-ul="${r.id}">Unlock 24h</button> <button class="rg-btn sm" data-ulno="${r.id}">Decline</button></td></tr>`).join('') || '<tr><td colspan="4">No requests.</td></tr>'}</tbody></table></div>`;
    updateApprovalBadge();
  }
  async function patch(id, p, msg) {
    const ok = await writeChecked(sb().from('follow_up_register').update(p).eq('id', id), 'That change could not be saved.');
    if (ok) { showToast('success', 'Done', msg); await RegisterApp.reload(); renderApprovals(); }
  }
  document.addEventListener('click', async (e) => {
    const d = e.target.dataset || {};
    if (d.ap) patch(d.ap, { outcome_approved: true }, 'Outcome approved.');
    if (d.rej) { if (await customConfirm('Reject this outcome? It will be cleared so the owner can correct it.', { confirmText: 'Reject', danger: true })) patch(d.rej, { outcome: null, outcome_approved: false }, 'Outcome rejected.'); }
    if (d.ul) patch(d.ul, { unlocked_until: new Date(Date.now() + 864e5).toISOString(), unlock_requested: false }, 'Unlocked for 24 hours.');
    if (d.ulno) patch(d.ulno, { unlock_requested: false }, 'Request declined.');
    if (d.hist) RegisterApp.openHistory(d.hist);
  });

  /* ---------- dashboard ---------- */
  function renderDashboard() {
    const el = document.getElementById('p-dashboard');
    const range = el.dataset.range || 'all';
    const t = todayISO(); const d30 = new Date(); d30.setDate(d30.getDate() - 30);
    const from = range === '30' ? d30.toISOString().slice(0, 10) : range === 'month' ? t.slice(0, 8) + '01' : '';
    const rows = RegisterApp.rows().filter(r => !r.deleted_at && (!from || r.lead_date >= from));
    const agree = rows.filter(r => r.outcome === 'Agreement' && r.outcome_approved).length;
    const count = (arr, fn) => { const m = {}; arr.forEach(r => { const k = fn(r) || '—'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const bars = (pairs, total) => pairs.map(([k, n]) => `<tr><td>${esc(k)}</td><td style="width:55%"><div class="rg-bar"><i style="width:${total ? Math.round(n / total * 100) : 0}%"></i></div></td><td style="text-align:right"><b>${n}</b></td></tr>`).join('') || '<tr><td>No data</td></tr>';
    let missed = 0; rows.forEach(r => { if (RegisterApp.fuState(r).overdue) missed++; });
    const people = RegisterApp.state.people;
    const byOwner = {}; rows.forEach(r => { const o = byOwner[r.assigned_to] || (byOwner[r.assigned_to] = { n: 0, ag: 0, od: 0, ni: 0 }); o.n++; if (r.outcome === 'Agreement' && r.outcome_approved) o.ag++; if (r.outcome === 'Not interested') o.ni++; if (RegisterApp.fuState(r).overdue) o.od++; });
    const stat = (l, v) => `<div class="rg-stat"><small>${l}</small><b>${v}</b></div>`;
    el.innerHTML = `
      <div class="rg-toolbar"><label class="rg-field"><span>Range</span><select id="dbRange">${[['all', 'All time'], ['30', 'Last 30 days'], ['month', 'This month']].map(([v, l]) => `<option value="${v}" ${v === range ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="rg-summary">${stat('Leads', rows.length)}${stat('Agreements (approved)', agree)}${stat('Conversion', rows.length ? (agree / rows.length * 100).toFixed(1) + '%' : '—')}${stat('Follow-ups missed', missed)}${stat('Awaiting approval', rows.filter(r => r.outcome && !r.outcome_approved).length)}</div>
      <div class="rg-two">
        <div class="rg-card"><h3>Leads by source</h3><table class="rg-table">${bars(count(rows, r => r.lead_source), rows.length)}</table></div>
        <div class="rg-card"><h3>Leads by status</h3><table class="rg-table">${bars(count(rows, r => r.current_status), rows.length)}</table></div>
        <div class="rg-card"><h3>Outcomes</h3><table class="rg-table">${bars(count(rows, r => r.outcome || 'Open'), rows.length)}</table></div>
        <div class="rg-card"><h3>Per marketing user</h3><table class="rg-table"><thead><tr><th>User</th><th>Leads</th><th>Agreements</th><th>Not interested</th><th>Missed</th></tr></thead><tbody>
          ${Object.entries(byOwner).map(([id, o]) => `<tr><td>${esc(people[id] || id)}</td><td>${o.n}</td><td>${o.ag}</td><td>${o.ni}</td><td>${o.od ? `<span class="rg-badge bad">${o.od}</span>` : 0}</td></tr>`).join('') || '<tr><td colspan="5">No data</td></tr>'}</tbody></table></div>
      </div>`;
    el.querySelector('#dbRange').onchange = (e) => { el.dataset.range = e.target.value; renderDashboard(); };
  }

  /* ---------- columns & lists ---------- */
  async function renderColumns() {
    const el = document.getElementById('p-columns');
    const S = RegisterApp.state;
    const cols = S.cols.slice().sort((a, b) => a.position - b.position);
    el.innerHTML = `
      <div class="rg-two">
      <div class="rg-card"><h3>Dropdown lists</h3><p class="sub">These feed the dropdowns marketing sees. Removing a choice never changes old leads; it just stops it being picked again.</p>
        ${LISTS.map(([k, label]) => `<div style="margin-bottom:14px"><b style="font-size:12.5px">${label}</b>
          <div class="rg-tags" style="margin-top:6px">${(S.opts[k] || []).map((o, i) => `<span class="rg-tag">${esc(o)}<button data-lrm="${k}" data-i="${i}" title="Remove">×</button></span>`).join('')}</div>
          <div style="display:flex;gap:6px"><input class="rg-input" data-ladd-in="${k}" placeholder="Add a choice…" style="flex:1;padding:8px 10px;border:1px solid var(--rg-line);border-radius:9px;background:var(--rg-surface);color:var(--rg-ink)"><button class="rg-btn sm" data-ladd="${k}">Add</button></div></div>`).join('')}
      </div>
      <div class="rg-card"><h3>Extra columns</h3><p class="sub">Added columns appear in the register for everyone with access. Archiving hides a column but keeps its data and history.</p>
        <table class="rg-table"><thead><tr><th>Label</th><th>Type</th><th>Req.</th><th>Marketing</th><th>#</th><th></th></tr></thead><tbody>
        ${cols.map(c => `<tr style="${c.archived ? 'opacity:.5' : ''}"><td><b>${esc(c.label)}</b>${c.col_type === 'dropdown' ? `<br><small>${esc((c.options || []).join(', '))}</small>` : ''}</td><td>${esc(c.col_type)}</td><td>${c.required ? 'Yes' : '—'}</td><td>${c.marketing_editable ? 'Can edit' : 'Read-only'}</td><td>${c.position}</td>
          <td style="white-space:nowrap"><button class="rg-btn sm" data-cedit="${c.id}">Edit</button> <button class="rg-btn sm ${c.archived ? '' : 'danger'}" data-carch="${c.id}">${c.archived ? 'Restore' : 'Archive'}</button></td></tr>`).join('') || '<tr><td colspan="6">No extra columns yet.</td></tr>'}</tbody></table>
        <hr style="border:0;border-top:1px solid var(--rg-line);margin:16px 0">
        <b style="font-size:13px">Add a column</b>
        <div class="rg-form" style="margin-top:8px">
          <label>Label<input id="ncLabel" maxlength="60" placeholder="e.g. Budget"></label>
          <label>Type<select id="ncType">${TYPES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
          <label class="wide" id="ncOptWrap" style="display:none">Choices (comma separated)<input id="ncOpts" placeholder="Low, Medium, High"></label>
          <label>Marketing can<select id="ncEdit"><option value="1">Edit it</option><option value="0">Only read it</option></select></label>
          <label>Required<select id="ncReq"><option value="0">No</option><option value="1">Yes (for new leads)</option></select></label>
        </div>
        <div class="rg-modal-actions"><button class="rg-btn primary" id="ncAdd">Add column</button></div>
      </div></div>`;
    el.querySelector('#ncType').onchange = (e) => { el.querySelector('#ncOptWrap').style.display = e.target.value === 'dropdown' ? '' : 'none'; };
  }
  const splitOpts = (s) => [...new Set(String(s || '').split(',').map(x => x.trim()).filter(Boolean))];
  async function saveList(k, arr) {
    const ok = await writeChecked(sb().from('register_settings').upsert({ key: k, options: arr, updated_at: new Date().toISOString() }), 'Could not save the list.');
    if (ok) { await RegisterApp.reload(); renderColumns(); }
  }
  document.addEventListener('click', async (e) => {
    const d = e.target.dataset || {}; const S = RegisterApp.state;
    if (d.lrm) {
      const arr = (S.opts[d.lrm] || []).slice(); const gone = arr.splice(+d.i, 1)[0];
      if (!arr.length) { await customAlert('A list needs at least one choice.'); return; }
      if (await customConfirm(`Remove “${gone}” from the list? Old leads keep it, but nobody can pick it again.`, { confirmText: 'Remove', danger: true })) saveList(d.lrm, arr);
    }
    if (d.ladd) {
      const inp = document.querySelector(`[data-ladd-in="${d.ladd}"]`); const v = inp.value.trim(); if (!v) return;
      const arr = (S.opts[d.ladd] || []).slice(); if (arr.includes(v)) { await customAlert('That choice already exists.'); return; }
      if (v.length > 60) { await customAlert('Choices must be under 60 characters.'); return; }
      arr.push(v); saveList(d.ladd, arr);
    }
    if (e.target.id === 'ncAdd') {
      const label = document.getElementById('ncLabel').value.trim(); const type = document.getElementById('ncType').value;
      if (!label) { await customAlert('Give the column a label.'); return; }
      const options = type === 'dropdown' ? splitOpts(document.getElementById('ncOpts').value) : [];
      if (type === 'dropdown' && options.length < 2) { await customAlert('A dropdown needs at least two choices, separated by commas.'); return; }
      const key = 'c_' + Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2, '0')).join('');
      const position = (S.cols.reduce((m, c) => Math.max(m, c.position), 100)) + 10;
      const { error } = await sb().from('register_columns').insert({ key, label, col_type: type, options, required: document.getElementById('ncReq').value === '1', marketing_editable: document.getElementById('ncEdit').value === '1', position });
      if (error) { await customAlert(error.message, { title: 'Not added', danger: true }); return; }
      showToast('success', 'Column added', `“${label}” is now in the register.`); await RegisterApp.reload(); renderColumns();
    }
    if (d.carch) {
      const c = S.cols.find(x => x.id === d.carch);
      if (!c.archived && !(await customConfirm(`Archive “${c.label}”? It is hidden from the register, but its data is kept and you can restore it.`, { confirmText: 'Archive', danger: true }))) return;
      if (await writeChecked(sb().from('register_columns').update({ archived: !c.archived }).eq('id', c.id))) { await RegisterApp.reload(); renderColumns(); }
    }
    if (d.cedit) {
      const c = S.cols.find(x => x.id === d.cedit);
      const m = document.createElement('div'); m.className = 'rg-modal-back';
      m.innerHTML = `<div class="rg-modal"><h3>Edit column</h3><p class="sub">The type of a column can't change once created.</p><div class="rg-form">
        <label>Label<input id="ceLabel" value="${esc(c.label)}" maxlength="60"></label>
        <label>Position<input id="cePos" type="number" value="${c.position}"></label>
        ${c.col_type === 'dropdown' ? `<label class="wide">Choices (comma separated)<input id="ceOpts" value="${esc((c.options || []).join(', '))}"></label>` : ''}
        <label>Marketing can<select id="ceEdit"><option value="1" ${c.marketing_editable ? 'selected' : ''}>Edit it</option><option value="0" ${c.marketing_editable ? '' : 'selected'}>Only read it</option></select></label>
        <label>Required<select id="ceReq"><option value="0" ${c.required ? '' : 'selected'}>No</option><option value="1" ${c.required ? 'selected' : ''}>Yes</option></select></label></div>
        <div class="rg-modal-actions"><button class="rg-btn" id="ceCancel">Cancel</button><button class="rg-btn primary" id="ceSave">Save</button></div></div>`;
      document.body.appendChild(m);
      m.querySelector('#ceCancel').onclick = () => m.remove();
      m.querySelector('#ceSave').onclick = async () => {
        const upd = { label: m.querySelector('#ceLabel').value.trim(), position: parseInt(m.querySelector('#cePos').value, 10) || c.position,
          marketing_editable: m.querySelector('#ceEdit').value === '1', required: m.querySelector('#ceReq').value === '1' };
        if (!upd.label) { await customAlert('Label can\'t be empty.'); return; }
        if (c.col_type === 'dropdown') { upd.options = splitOpts(m.querySelector('#ceOpts').value); if (upd.options.length < 2) { await customAlert('A dropdown needs at least two choices.'); return; } }
        if (await writeChecked(sb().from('register_columns').update(upd).eq('id', c.id))) { m.remove(); await RegisterApp.reload(); renderColumns(); }
      };
    }
  });

  /* ---------- audit ---------- */
  const audit = { rows: [], done: false };
  async function renderAudit(reset) {
    const el = document.getElementById('p-audit');
    if (reset) {
      audit.rows = []; audit.done = false;
      el.innerHTML = `<div class="rg-toolbar">
        <label class="rg-field"><span>Action</span><select id="auAction"><option value="">All</option>${['insert', 'update', 'delete', 'restore', 'download', 'report', 'config', 'blocked'].map(a => `<option>${a}</option>`).join('')}</select></label>
        <label class="rg-field"><span>User</span><select id="auUser"><option value="">Everyone</option>${RegisterApp.state.peopleList.filter(p => p.role !== 'member').map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>
        <label class="rg-field"><span>From</span><input type="date" id="auFrom"></label><label class="rg-field"><span>To</span><input type="date" id="auTo"></label>
        <button class="rg-btn primary" id="auGo">Apply</button><button class="rg-btn" id="auXlsx">⬇ Excel</button></div>
        <div class="rg-card" style="padding:0"><div style="overflow:auto;max-height:68vh"><table class="rg-table" id="auTable"></table></div><div style="padding:12px;text-align:center" id="auMore"></div></div>`;
      el.querySelector('#auGo').onclick = () => renderAudit(true);
      el.querySelector('#auXlsx').onclick = () => { if (!window.XLSX) return; const rows = audit.rows.map(a => [a.at, a.user_name, a.action, a.field, a.old_value, a.new_value]); const ws = XLSX.utils.aoa_to_sheet([['When', 'User', 'Action', 'Field', 'Was', 'Now']].concat(rows)); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Audit'); XLSX.writeFile(wb, 'Register_Audit_' + todayISO() + '.xlsx'); };
      el.querySelector('#auMore').onclick = () => renderAudit(false);
    }
    const q = sb().from('register_audit').select('*').order('id', { ascending: false }).range(audit.rows.length, audit.rows.length + 199);
    const v = (id) => el.querySelector('#' + id).value;
    if (v('auAction')) q.eq('action', v('auAction')); if (v('auUser')) q.eq('user_id', v('auUser'));
    if (v('auFrom')) q.gte('at', v('auFrom') + 'T00:00:00'); if (v('auTo')) q.lte('at', v('auTo') + 'T23:59:59');
    const { data, error } = await q;
    if (error) { el.querySelector('#auTable').innerHTML = `<tr><td>${esc(error.message)}</td></tr>`; return; }
    audit.rows = audit.rows.concat(data || []); audit.done = (data || []).length < 200;
    const S = RegisterApp.state; const lead = (id) => { const r = RegisterApp.rows().find(x => x.id === id); return r ? r.client_name : ''; };
    const fl = (k) => { if (!k) return ''; if (k.startsWith('extra:')) { const c = S.cols.find(c => c.key === k.slice(6)); return c ? c.label : k; } const f = S.fields.find(f => f.k === k); return f ? f.label : k; };
    const dt = (a) => { const d = new Date(a.at); return d.toLocaleString('en-GB'); };
    const detail = (a) => a.action === 'download' ? `${a.field} · ${a.detail ? a.detail.rows + ' rows' : ''} ${a.detail && a.detail.from ? `(${dmy(a.detail.from)} → ${dmy(a.detail.to)})` : ''}`
      : a.action === 'report' ? `“${a.field}” · ${a.detail ? a.detail.rows : ''} rows` : a.action === 'config' ? (a.field === 'register_columns' ? 'column “' + esc((a.detail || {}).label) + '” ' + ((a.detail || {}).archived ? '(archived)' : '') : 'dropdown list “' + esc((a.detail || {}).key) + '”') : a.action === 'insert' ? `new lead ${esc((a.detail || {}).mobile || '')}` : '';
    el.querySelector('#auTable').innerHTML = '<thead><tr><th>When</th><th>User</th><th>Action</th><th>Lead</th><th>Field</th><th>Was</th><th>Now</th><th>Detail</th></tr></thead><tbody>' +
      audit.rows.map(a => `<tr><td style="white-space:nowrap">${esc(dt(a))}</td><td>${esc(a.user_name)}</td><td><span class="rg-badge ${a.action === 'delete' || a.action === 'blocked' ? 'bad' : a.action === 'download' || a.action === 'report' ? 'warn' : a.action === 'config' ? 'info' : ''}">${esc(a.action)}</span></td><td>${esc(lead(a.row_id))}</td><td>${esc(a.action === 'blocked' ? a.field : (a.action === 'download' || a.action === 'report' || a.action === 'config' ? '' : fl(a.field)))}</td><td>${esc(a.old_value || '')}</td><td>${esc(a.new_value || '')}</td><td>${detail(a)}</td></tr>`).join('') + '</tbody>';
    el.querySelector('#auMore').innerHTML = audit.done ? `<small style="color:var(--rg-muted)">${audit.rows.length} entries · end of log</small>` : '<button class="rg-btn sm">Load more</button>';
  }

  /* ---------- access ---------- */
  async function renderAccess() {
    const el = document.getElementById('p-access');
    const [p, perms] = await Promise.all([
      sb().from('profiles').select('id, name, email, role').eq('role', 'marketing'),
      sb().from('register_user_perms').select('user_id, can_download')
    ]);
    const map = {}; (perms.data || []).forEach(x => { map[x.user_id] = x.can_download; });
    el.innerHTML = `<div class="rg-card"><h3>Marketing users</h3><p class="sub">Marketing accounts can open only the register — never tasks, projects or the team — and can never download it; they can only save reports for you to review. Create one on the Team page (choose the role “Marketing”).</p>
      <table class="rg-table"><thead><tr><th>Name</th><th>Email</th><th>Can save reports</th></tr></thead><tbody>
      ${(p.data || []).map(u => { const on = map[u.id] !== false; return `<tr><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td><button class="rg-btn sm ${on ? '' : 'danger'}" data-perm="${u.id}" data-on="${on ? 1 : 0}">${on ? 'Can save reports — click to switch off' : 'Switched off — click to allow'}</button></td></tr>`; }).join('') || '<tr><td colspan="3">No marketing users yet.</td></tr>'}</tbody></table>
      <div class="rg-modal-actions" style="justify-content:flex-start"><a class="rg-btn primary" href="team.html" style="text-decoration:none">＋ Add marketing user (Team page)</a></div></div>`;
  }
  document.addEventListener('click', async (e) => {
    const d = e.target.dataset || {}; if (!d.perm) return;
    const next = d.on !== '1';
    const { error } = await sb().from('register_user_perms').upsert({ user_id: d.perm, can_download: next });
    if (error) { await customAlert(error.message, { title: 'Not saved', danger: true }); return; }
    showToast('success', 'Saved', next ? 'Report saving allowed.' : 'Report saving switched off.'); renderAccess();
  });

  async function boot() {
    const auth = await requireAuth({ register: true, standalone: true });
    if (!auth) return;
    if (auth.profile.role !== 'admin') { window.location.replace('register.html'); return; }
    me = auth.profile;
    document.getElementById('rgTabs').addEventListener('click', (e) => { const t = e.target.closest('[data-tab]'); if (t) show(t.dataset.tab); });
    window.addEventListener('register:rendered', updateApprovalBadge);
    await RegisterApp.init({ admin: true, profile: me, mountId: 'regMount' });
    updateApprovalBadge();
  }
  boot();
  return { show };
})();

async function requestLogout() {
  if (RegisterApp.hasUnsaved() && !(await customConfirm('You have unsaved changes that will be lost. Sign out anyway?', { confirmText: 'Sign out', danger: true }))) return;
  logout();
}