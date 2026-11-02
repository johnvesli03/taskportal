
// ============================================================
// Supabase connection config
// Paste your NEW Supabase project's URL and anon key below.
// Found in: Project Settings -> API
// ============================================================
const SUPABASE_URL = 'https://jruxmcjuysyjcomrfqma.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0v5jhUWHI6naZ4SIQAEUZQ_4XVcioaa';

// Counts requests in flight so the page can show a loading animation on slow internet (used by js/auth.js)
(function () {
  var f = window.fetch, n = 0; if (!f) return;
  var tell = function () { try { window.dispatchEvent(new CustomEvent('euo-net', { detail: n })); } catch (e) {} };
  window.fetch = function () {
    n++; tell(); var p = f.apply(this, arguments), d = function () { n = Math.max(0, n - 1); tell(); };
    p.then(d, d); return p;
  };
})();

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);