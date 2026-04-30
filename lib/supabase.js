// lib/supabase.js — client partagé côté API (Node.js)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Client admin (service_role) — pour les routes admin uniquement
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Client public (anon) — pour les routes utilisateurs
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseAdmin };
