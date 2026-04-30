// api/orders.js — Créer une commande + générer un devis
const { supabase, supabaseAdmin } = require('../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — liste des commandes (admin seulement)
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data });
  }

  // POST — créer une commande
  if (req.method === 'POST') {
    const { items, email, shipping_address, payment_method } = req.body;

    if (!items || !items.length || !email) {
      return res.status(400).json({ error: 'Données manquantes (items, email requis)' });
    }

    // Calcul totaux
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const shipping = subtotal >= 150 ? 0 : 8;
    const total = subtotal + shipping;

    // Génération ID commande
    const orderId = 'OBO-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

    // Insertion en base
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([{
        id: orderId,
        user_email: email,
        items: items,
        subtotal,
        shipping,
        total,
        status: 'confirmée',
        shipping_address: shipping_address || '',
        payment_method: payment_method || 'card'
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Décrémenter le stock de chaque article
    for (const item of items) {
      await supabaseAdmin.rpc('decrement_stock', { product_id: item.id, qty: 1 });
    }

    // Générer le devis HTML (retourné dans la réponse)
    const quoteHtml = generateQuoteHtml(data);

    return res.status(201).json({
      success: true,
      order: data,
      quote_html: quoteHtml
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

function generateQuoteHtml(order) {
  const date = new Date(order.created_at).toLocaleDateString('fr-FR');
  const itemsRows = order.items.map(i =>
    `<tr><td>${i.name}</td><td>${i.selSize || i.selectedSize || '-'}</td><td style="text-align:right">${i.price}€</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Devis ${order.id} — ONEBYONE Paris</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 48px; color: #111; max-width: 640px; margin: 0 auto; }
    .logo { font-size: 24px; font-weight: 700; letter-spacing: 0.06em; color: #c49a2a; margin-bottom: 4px; }
    .logo-sub { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #888; margin-bottom: 2rem; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 4px; }
    .meta-val { font-size: 14px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    th { padding: 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; text-align: left; border-bottom: 2px solid #eee; }
    td { padding: 10px 0; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
    .total-row td { font-size: 15px; font-weight: 700; color: #c49a2a; border-bottom: none; padding-top: 16px; }
    .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
    .status { display: inline-block; padding: 4px 12px; background: #f0f9eb; color: #3a7d1e; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  </style>
</head>
<body>
  <div class="logo">ONEBYONE</div>
  <div class="logo-sub">Paris — Streetwear & Luxe</div>

  <div class="meta">
    <div>
      <div class="meta-label">N° Commande</div>
      <div class="meta-val" style="color:#c49a2a">${order.id}</div>
      <div style="font-size:12px;color:#888;margin-top:4px">${date}</div>
    </div>
    <div style="text-align:right">
      <div class="meta-label">Client</div>
      <div class="meta-val">${order.user_email}</div>
      ${order.shipping_address ? `<div style="font-size:12px;color:#888;margin-top:4px">${order.shipping_address}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div class="meta-label">Statut</div>
      <span class="status">${order.status}</span>
    </div>
  </div>

  <table>
    <thead><tr><th>Article</th><th>Taille</th><th style="text-align:right">Prix</th></tr></thead>
    <tbody>
      ${itemsRows}
      <tr><td style="color:#888">Livraison</td><td></td><td style="text-align:right;color:#888">${order.shipping === 0 ? 'Offerte' : order.shipping + '€'}</td></tr>
    </tbody>
    <tfoot>
      <tr class="total-row"><td colspan="2">Total TTC</td><td style="text-align:right">${order.total}€</td></tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>ONEBYONE Paris — onebyone.paris</p>
    <p>Merci pour ta commande ! Pour toute question : contact@onebyone.paris</p>
    <p style="margin-top:8px;font-size:10px">Ce document fait office de confirmation de commande.</p>
  </div>
</body>
</html>`;
}
