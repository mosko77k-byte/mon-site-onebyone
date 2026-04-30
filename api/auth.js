// api/auth.js — Inscription & Connexion via Supabase Auth
const { supabase } = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, first_name, last_name } = req.body;

  // ── INSCRIPTION ──────────────────────────────────────
  if (action === 'register') {
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Mot de passe trop court (min. 8 caractères)' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name },
        // Supabase envoie un email de vérification automatiquement
        emailRedirectTo: `${process.env.SITE_URL || 'https://onebyone.paris'}/verified`
      }
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
      success: true,
      message: 'Compte créé ! Vérifie ton email pour activer ton compte.',
      user: { email: data.user?.email, id: data.user?.id }
    });
  }

  // ── CONNEXION ────────────────────────────────────────
  if (action === 'login') {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'Confirme ton email avant de te connecter.' });
      }
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        first_name: data.user.user_metadata?.first_name,
        last_name: data.user.user_metadata?.last_name
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  }

  // ── DÉCONNEXION ──────────────────────────────────────
  if (action === 'logout') {
    await supabase.auth.signOut();
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Action inconnue' });
};
