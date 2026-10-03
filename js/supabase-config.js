// ============================================================
// Supabase connection config
// Paste your NEW Supabase project's URL and anon key below.
// Found in: Project Settings -> API
// ============================================================
const SUPABASE_URL = 'https://jruxmcjuysyjcomrfqma.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0v5jhUWHI6naZ4SIQAEUZQ_4XVcioaa';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
