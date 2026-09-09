// ============================================================
// supabase.js — Supabase client configuration
// ============================================================
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy your Project URL and anon public key below
// ============================================================

const SUPABASE_URL = "https://gnspbhkfmcimjturpazl.supabase.co"; // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imduc3BiaGtmbWNpbWp0dXJwYXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MDEwNjksImV4cCI6MjEwNDQ3NzA2OX0.BgwNkH55s_yCX2vd0nhxJvVMRrlcSbPsnJE-vlbe4H8";

// Loaded from the Supabase JS CDN script included in the HTML files
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
