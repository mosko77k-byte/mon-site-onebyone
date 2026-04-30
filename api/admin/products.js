// api/admin/products.js — CRUD produits (admin uniquement via service_role)
const { supabaseAdmin } = require('../../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Vérification clé admin simple (à remplacer par JWT en production)
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  // GET — liste tous les produits (même inactifs)
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ products: data });
  }

  // POST — créer un produit
  if (req.method === 'POST') {
    const { name, price, old_price, category, type, badge, sizes, stock, description, image_url } = req.body;
    if (!name || !price || !category || !type) {
      return res.status(400).json({ error: 'Champs requis: name, price, category, type' });
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{ name, price, old_price, category, type, badge, sizes, stock: stock || 0, description, image_url }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, product: data });
  }

  // PUT — modifier un produit (?id=xxx)
  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID produit requis' });
    const updates = req.body;
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, product: data });
  }

  // DELETE — supprimer (désactiver) un produit (?id=xxx)
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID produit requis' });
    // Soft delete — on désactive plutôt que supprimer
    const { error } = await supabaseAdmin
      .from('products')
      .update({ active: false })
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, message: 'Produit désactivé' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
