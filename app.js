// app.js — ONEBYONE Paris frontend logic

// ── CONFIG (remplace par tes vraies clés Supabase) ──────────────
const SUPABASE_URL = 'https://XXXXXXXXXX.supabase.co';  // ← TON URL SUPABASE
const SUPABASE_ANON_KEY = 'eyJhbGciOiJI...';           // ← TA CLÉ ANON SUPABASE
const API_BASE = '';  // Vercel Functions — même domaine
// ──────────────────────────────────────────────────────────────────

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ICONS = {pantalon:'👖',sweat:'🧥',tshirt:'👕',veste:'🥼',robe:'👗',accessoire:'🧣',short:'🩲'};

let cart = JSON.parse(localStorage.getItem('obp_cart') || '[]');
let currentUser = null;
let filterGender = 'all';
let filterType = 'all';
let selSize = '';
let allProducts = [];

// ── INIT ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await checkSession();
  await loadProducts();
  updCart();
});

async function checkSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    document.getElementById('auth-btn').textContent = session.user.user_metadata?.first_name || 'Mon compte';
  }
}

// ── PRODUITS ──────────────────────────────────────────────────────
async function loadProducts() {
  document.getElementById('prod-loading').style.display = 'block';
  document.getElementById('prod-grid').style.display = 'none';

  let url = `${API_BASE}/api/products?`;
  if (filterGender !== 'all') url += `category=${filterGender}&`;
  if (filterType !== 'all') url += `type=${filterType}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    allProducts = data.products || [];
    renderProducts(allProducts);
  } catch (err) {
    document.getElementById('prod-loading').textContent = 'Erreur de chargement.';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('prod-grid');
  document.getElementById('prod-loading').style.display = 'none';
  grid.style.display = products.length ? 'grid' : 'none';

  if (!products.length) {
    document.getElementById('prod-loading').style.display = 'block';
    document.getElementById('prod-loading').textContent = 'Aucun produit trouvé.';
    return;
  }

  grid.innerHTML = products.map(p => {
    const badge = p.badge === 'New' ? '<div class="pbadge pbadge-new">New</div>'
      : p.badge === 'Sale' ? '<div class="pbadge pbadge-sale">Sale</div>'
      : p.badge === 'Hot' ? '<div class="pbadge pbadge-hot">Hot</div>' : '';
    const icon = ICONS[p.type] || '👕';
    return `<div class="pcard" onclick="openProd(${p.id})">
      <div class="pimg">
        <div class="pimg-icon">${icon}</div>${badge}
        <div class="pcard-overlay">
          <button class="pcard-overlay-btn" onclick="event.stopPropagation();quickAdd(${p.id})">+ Ajouter</button>
        </div>
      </div>
      <div class="pinfo">
        <div class="pcat">${p.category} — ${p.type}</div>
        <div class="pname">${p.name}</div>
        <div style="display:flex;align-items:baseline;gap:4px">
          <span class="pprice">${p.price}€</span>
          ${p.old_price ? `<span class="poldprice">${p.old_price}€</span>` : ''}
        </div>
        <div class="pbtns">
          <button class="pbtn-add" onclick="event.stopPropagation();quickAdd(${p.id})">+ Panier</button>
          <button class="pbtn-fav" onclick="event.stopPropagation();notify('Ajouté aux favoris ♥','ok')">♡</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── FILTRES ───────────────────────────────────────────────────────
function setGender(g) {
  filterGender = g;
  const titles = {all:'All Drops',homme:'Collection Homme',femme:'Collection Femme'};
  document.getElementById('sec-title').textContent = titles[g] || 'All Drops';
  loadProducts();
}
function setTypeFilter(t) {
  filterType = t;
  if (t === 'accessoire') document.getElementById('sec-title').textContent = 'Accessoires';
  loadProducts();
}
function setActiveNav(el) {
  document.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
}
function setActiveFilter(btn, group) {
  const btns = document.querySelectorAll('.filters .f-btn');
  if (group === 'g') btns.forEach((b,i) => { if(i<3) b.classList.remove('active') });
  else btns.forEach((b,i) => { if(i>=4) b.classList.remove('active') });
  btn.classList.add('active');
}

// ── PRODUCT DETAIL ────────────────────────────────────────────────
function openProd(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  selSize = '';
  document.getElementById('prod-p').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1.1fr;gap:1.5rem">
      <div style="background:var(--bg3);border-radius:3px;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:0.15">${ICONS[p.type]||'👕'}</div>
      <div style="padding:0.5rem 0">
        <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text3);margin-bottom:6px">${p.category} — ${p.type}</div>
        <div style="font-family:var(--font-display);font-size:26px;font-weight:700;margin-bottom:6px;color:var(--gold)">${p.name}</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:1rem">
          <span style="font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--gold)">${p.price}€</span>
          ${p.old_price ? `<span style="font-size:15px;color:var(--text3);text-decoration:line-through">${p.old_price}€</span>` : ''}
        </div>
        <div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:1.25rem">${p.description || ''}</div>
        <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text3);margin-bottom:8px">Taille</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1.25rem">
          ${p.sizes.map(s => `<button class="size-btn" onclick="pickSize(this,'${s}')">${s}</button>`).join('')}
        </div>
        <button onclick="addFromDetail(${p.id})" style="width:100%;padding:13px;background:var(--gold);color:#080808;font-size:12px;font-weight:700;letter-spacing:0.1em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body)">Ajouter au panier</button>
        <div style="font-size:10px;color:var(--text3);text-align:center;margin-top:8px">Stock : ${p.stock} pièces</div>
      </div>
    </div>`;
  openMod('prod');
}

function pickSize(btn, s) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  selSize = s;
}
function addFromDetail(id) {
  if (!selSize) { notify('Choisis une taille !','err'); return; }
  const p = allProducts.find(x => x.id === id);
  cart.push({...p, selSize, cartId: Date.now()});
  saveCart(); updCart(); notify(p.name + ' ajouté ✓','ok'); closeMod('prod'); selSize = '';
}
function quickAdd(id) {
  const p = allProducts.find(x => x.id === id);
  cart.push({...p, selSize: (p.sizes && p.sizes[0]) || 'M', cartId: Date.now()});
  saveCart(); updCart(); notify(p.name + ' ajouté ✓','ok');
}

// ── CART ──────────────────────────────────────────────────────────
function saveCart() { localStorage.setItem('obp_cart', JSON.stringify(cart)); }
function updCart() { document.getElementById('cart-ct').textContent = cart.length; }

function renderCart() {
  const total = cart.reduce((a,p) => a + Number(p.price), 0);
  const p = document.getElementById('cart-p');
  p.innerHTML = `<div class="mtitle">Mon Panier <span style="font-size:14px;color:var(--text3);font-weight:400">(${cart.length})</span></div>`
    + (cart.length
      ? `<div style="flex:1;overflow-y:auto">${cart.map(item => `
          <div class="citem">
            <div class="cimg">${ICONS[item.type]||'👕'}</div>
            <div style="flex:1">
              <div class="cname">${item.name}</div>
              <div class="csize">Taille : ${item.selSize}</div>
              <div class="cprice">${item.price}€</div>
            </div>
            <button class="crem" onclick="removeCart(${item.cartId})">✕</button>
          </div>`).join('')}
        </div>
        <div class="csummary">
          <div class="ctotal"><span style="font-size:12px;color:var(--text2)">Total</span><span class="ctval">${total}€</span></div>
          <button onclick="closeMod('cart');openMod('checkout')" style="width:100%;padding:13px;background:var(--gold);color:#080808;font-size:12px;font-weight:700;letter-spacing:0.1em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body);margin-bottom:8px">Passer la commande →</button>
          <button onclick="closeMod('cart')" style="width:100%;padding:10px;border:1px solid var(--border);font-size:11px;color:var(--text2);background:transparent;cursor:pointer;border-radius:2px">Continuer mes achats</button>
        </div>`
      : `<div class="cempty"><div style="font-size:40px;opacity:0.15;margin-bottom:1rem">🛒</div><div>Ton panier est vide</div><button onclick="closeMod('cart')" style="margin-top:1rem;padding:10px 24px;border:1px solid var(--border2);font-size:11px;color:var(--text2);background:transparent;cursor:pointer;border-radius:2px">Découvrir la collection</button></div>`);
}

function removeCart(id) {
  cart = cart.filter(x => x.cartId !== id);
  saveCart(); updCart(); renderCart();
}

// ── CHECKOUT ──────────────────────────────────────────────────────
function renderCheckout() {
  const total = cart.reduce((a,p) => a + Number(p.price), 0);
  const ship = total >= 150 ? 0 : 8;
  document.getElementById('checkout-p').innerHTML = `
    <div class="mtitle">Paiement</div>
    <div class="ptabs">
      <button class="ptab active" onclick="payTab('card',this)">Carte bancaire</button>
      <button class="ptab" onclick="payTab('paypal',this)">PayPal</button>
    </div>
    <div id="pay-content">
      <div style="display:flex;gap:6px;margin-bottom:1rem">
        <span class="bdg bdg-info">VISA</span><span class="bdg bdg-info">Mastercard</span><span class="bdg bdg-info">CB</span><span class="bdg bdg-info">3D Secure</span>
      </div>
      <div class="fg"><label class="fl">Titulaire</label><input class="fi" id="c-name" placeholder="Prénom Nom"/></div>
      <div class="fg"><label class="fl">N° de carte</label><input class="fi" id="c-num" placeholder="1234 5678 9012 3456" maxlength="19" oninput="fmtCard(this)"/></div>
      <div class="fr">
        <div class="fg"><label class="fl">Expiration</label><input class="fi" id="c-exp" placeholder="MM/AA" maxlength="5"/></div>
        <div class="fg"><label class="fl">CVV</label><input class="fi" id="c-cvv" placeholder="123" maxlength="3" type="password"/></div>
      </div>
    </div>
    <div style="background:var(--bg3);border:1px solid var(--border);padding:1rem;border-radius:2px;margin:1rem 0">
      <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text3);margin-bottom:8px">Récapitulatif</div>
      ${cart.map(i => `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);padding:2px 0"><span>${i.name} (${i.selSize})</span><span>${i.price}€</span></div>`).join('')}
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);padding:2px 0;margin-top:4px"><span>Livraison</span><span>${ship === 0 ? 'Offerte' : ship + '€'}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:var(--gold);padding-top:8px;border-top:1px solid var(--border);margin-top:6px"><span>Total</span><span>${total + ship}€</span></div>
    </div>
    <div class="fg"><label class="fl">Email de confirmation</label><input class="fi" id="c-email" placeholder="ton@email.com" value="${currentUser?.email || ''}"/></div>
    <div class="fg"><label class="fl">Adresse de livraison</label><input class="fi" id="c-addr" placeholder="Rue, code postal, ville"/></div>
    <button id="pay-btn" onclick="processPayment('card')" style="width:100%;padding:14px;background:var(--gold);color:#080808;font-size:12px;font-weight:700;letter-spacing:0.12em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body)">Confirmer et payer ${total + ship}€ →</button>`;
}

function payTab(t, btn) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const c = document.getElementById('pay-content');
  if (t === 'paypal') {
    c.innerHTML = `<div style="text-align:center;padding:1.5rem 0">
      <div style="font-size:13px;color:var(--text2);margin-bottom:1.5rem">Tu seras redirigé vers PayPal pour finaliser ton paiement.</div>
      <button class="ppaypal" onclick="processPayment('paypal')"><span style="font-style:italic;font-weight:700;font-size:18px">Pay</span><span style="font-style:italic;font-weight:300;font-size:18px;color:#69a9f0">Pal</span></button>
    </div>`;
  } else {
    c.innerHTML = `<div style="display:flex;gap:6px;margin-bottom:1rem"><span class="bdg bdg-info">VISA</span><span class="bdg bdg-info">Mastercard</span><span class="bdg bdg-info">CB</span></div>
      <div class="fg"><label class="fl">Titulaire</label><input class="fi" id="c-name" placeholder="Prénom Nom"/></div>
      <div class="fg"><label class="fl">N° de carte</label><input class="fi" id="c-num" placeholder="1234 5678 9012 3456" maxlength="19" oninput="fmtCard(this)"/></div>
      <div class="fr">
        <div class="fg"><label class="fl">Expiration</label><input class="fi" id="c-exp" placeholder="MM/AA" maxlength="5"/></div>
        <div class="fg"><label class="fl">CVV</label><input class="fi" id="c-cvv" placeholder="123" maxlength="3" type="password"/></div>
      </div>`;
  }
}

function fmtCard(el) { el.value = el.value.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim(); }

async function processPayment(method) {
  const emailEl = document.getElementById('c-email');
  const addrEl = document.getElementById('c-addr');
  if (!emailEl?.value?.includes('@')) { notify('Email invalide','err'); return; }

  const btn = document.getElementById('pay-btn');
  if (btn) { btn.textContent = 'Traitement...'; btn.disabled = true; }

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart,
        email: emailEl.value,
        shipping_address: addrEl?.value || '',
        payment_method: method
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    renderOrderConfirm(data.order);
  } catch (err) {
    notify('Erreur : ' + err.message, 'err');
    if (btn) { btn.textContent = 'Réessayer'; btn.disabled = false; }
  }
}

function renderOrderConfirm(order) {
  const sub = order.items.reduce((a,p) => a + Number(p.price), 0);
  const ship = order.total - sub;
  document.getElementById('checkout-p').innerHTML = `
    <div style="text-align:center;margin-bottom:1.5rem">
      <div style="font-size:40px;color:var(--gold);margin-bottom:8px">✓</div>
      <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold);margin-bottom:4px">Commande confirmée !</div>
      <div style="font-size:13px;color:var(--text2)">Email envoyé à ${order.user_email}</div>
    </div>
    <div class="quote-box">
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
        <div><div class="qnum">Devis N° ${order.id}</div><div style="font-size:10px;color:var(--text3);margin-top:2px">onebyone.paris</div></div>
        <div style="text-align:right"><div style="font-size:10px;color:var(--text3)">${new Date(order.created_at).toLocaleDateString('fr-FR')}</div><div style="font-size:10px;color:var(--text3)">${order.user_email}</div></div>
      </div>
      ${order.items.map(i => `<div class="qline"><span>${i.name} — ${i.selSize||i.selectedSize||'-'}</span><span>${i.price}€</span></div>`).join('')}
      <div class="qline" style="margin-top:4px"><span>Livraison</span><span>${ship===0?'Offerte':ship+'€'}</span></div>
      <div class="qtotal"><span>Total TTC</span><span style="color:var(--gold)">${order.total}€</span></div>
      <div class="qbtns">
        <button class="qbtn" onclick="printOrder('${order.id}')">Imprimer le devis</button>
        <button class="qbtn primary" onclick="cart=[];saveCart();updCart();closeMod('checkout')">Retour boutique</button>
      </div>
    </div>`;
  cart = []; saveCart(); updCart();
}

async function printOrder(orderId) {
  notify('Ouverture du devis...','ok');
  const res = await fetch(`${API_BASE}/api/orders`);
  const data = await res.json();
  const order = data.orders?.find(o => o.id === orderId);
  if (!order) return;
  // Construire et ouvrir le PDF dans nouvel onglet
  const sub = order.items.reduce((a,p) => a + Number(p.price), 0);
  const ship = order.total - sub;
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Devis ${order.id}</title>
  <style>body{font-family:Arial,sans-serif;padding:48px;color:#111;max-width:640px;margin:0 auto}.logo{font-size:22px;font-weight:700;color:#c49a2a;letter-spacing:0.05em}.sub{font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#888;margin-bottom:2rem}table{width:100%;border-collapse:collapse}td,th{padding:9px 0;border-bottom:1px solid #eee;font-size:13px;text-align:left}th{font-size:10px;text-transform:uppercase;color:#888;font-weight:600}.total{font-weight:700;color:#c49a2a;font-size:15px}.foot{margin-top:3rem;border-top:1px solid #eee;padding-top:1rem;font-size:11px;color:#aaa;text-align:center}</style></head><body>
  <div class="logo">ONEBYONE <span style="font-size:11px;font-weight:400;color:#888">PARIS</span></div>
  <div class="sub">Streetwear & Luxe</div>
  <div style="display:flex;justify-content:space-between;margin-bottom:2rem;border-bottom:1px solid #eee;padding-bottom:1rem">
    <div><strong>Commande N°</strong> <span style="color:#c49a2a">${order.id}</span><br><span style="font-size:12px;color:#888">${new Date(order.created_at).toLocaleDateString('fr-FR')}</span></div>
    <div style="text-align:right"><strong>Client</strong><br><span style="font-size:12px;color:#888">${order.user_email}</span></div>
  </div>
  <table><thead><tr><th>Article</th><th>Taille</th><th style="text-align:right">Prix</th></tr></thead><tbody>
  ${order.items.map(i => `<tr><td>${i.name}</td><td>${i.selSize||'-'}</td><td style="text-align:right">${i.price}€</td></tr>`).join('')}
  <tr><td style="color:#888">Livraison</td><td></td><td style="text-align:right;color:#888">${ship===0?'Offerte':ship+'€'}</td></tr>
  <tr><td class="total" colspan="2">Total TTC</td><td class="total" style="text-align:right">${order.total}€</td></tr>
  </tbody></table>
  <div class="foot">ONEBYONE Paris — onebyone.paris — Merci pour ta commande !</div>
  </body></html>`);
  w.document.close(); w.print();
}

// ── AUTH ──────────────────────────────────────────────────────────
function renderAuth(mode) {
  const p = document.getElementById('auth-p');
  if (mode === 'login') {
    p.innerHTML = `<div class="mtitle">Connexion</div>
      <div class="fg"><label class="fl">Email</label><input class="fi" id="a-email" placeholder="ton@email.com"/></div>
      <div class="fg"><label class="fl">Mot de passe</label><input class="fi" type="password" id="a-pass" placeholder="••••••••"/></div>
      <button onclick="doLogin()" style="width:100%;padding:13px;background:var(--gold);color:#080808;font-size:12px;font-weight:700;letter-spacing:0.1em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body);margin-bottom:1rem">Se connecter</button>
      <div style="text-align:center;font-size:12px;color:var(--text3)">Pas encore de compte ? <span style="color:var(--gold);cursor:pointer" onclick="renderAuth('register')">Créer un compte</span></div>`;
  } else if (mode === 'register') {
    p.innerHTML = `<div class="mtitle">Créer un compte</div>
      <div class="fr">
        <div class="fg"><label class="fl">Prénom</label><input class="fi" id="r-fn" placeholder="Prénom"/></div>
        <div class="fg"><label class="fl">Nom</label><input class="fi" id="r-ln" placeholder="Nom"/></div>
      </div>
      <div class="fg"><label class="fl">Email</label><input class="fi" id="r-email" placeholder="ton@email.com"/></div>
      <div class="fg"><label class="fl">Mot de passe</label><input class="fi" type="password" id="r-pass" placeholder="Min. 8 caractères"/></div>
      <button onclick="doRegister()" style="width:100%;padding:13px;background:var(--gold);color:#080808;font-size:12px;font-weight:700;letter-spacing:0.1em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body);margin-bottom:1rem">Créer mon compte</button>
      <div style="text-align:center;font-size:12px;color:var(--text3)">Déjà un compte ? <span style="color:var(--gold);cursor:pointer" onclick="renderAuth('login')">Se connecter</span></div>`;
  }
}

async function doLogin() {
  const email = document.getElementById('a-email').value;
  const pass = document.getElementById('a-pass').value;
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action:'login', email, password: pass})
  });
  const data = await res.json();
  if (!res.ok) { notify(data.error,'err'); return; }
  currentUser = data.user;
  document.getElementById('auth-btn').textContent = data.user.first_name || 'Mon compte';
  notify('Bienvenue ' + (data.user.first_name||'') + ' !','ok');
  closeMod('auth');
}

async function doRegister() {
  const fn = document.getElementById('r-fn').value;
  const ln = document.getElementById('r-ln').value;
  const email = document.getElementById('r-email').value;
  const pass = document.getElementById('r-pass').value;
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({action:'register', email, password: pass, first_name: fn, last_name: ln})
  });
  const data = await res.json();
  if (!res.ok) { notify(data.error,'err'); return; }
  document.getElementById('auth-p').innerHTML = `
    <div style="text-align:center;padding:2rem 0">
      <div style="font-size:40px;color:var(--gold);margin-bottom:12px">✉</div>
      <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--gold);margin-bottom:8px">Vérifie ton email !</div>
      <div style="font-size:13px;color:var(--text2);line-height:1.7">Un lien de confirmation a été envoyé à <strong style="color:var(--text)">${email}</strong>.<br>Clique dessus pour activer ton compte.</div>
      <button onclick="renderAuth('login')" style="margin-top:1.5rem;padding:10px 28px;background:var(--gold);color:#080808;font-size:11px;font-weight:700;letter-spacing:0.1em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body)">Se connecter</button>
    </div>`;
}

// ── ADMIN ──────────────────────────────────────────────────────────
function showAdmin() { document.getElementById('page-shop').style.display='none'; document.getElementById('page-admin').style.display='block'; renderAdmin('dash'); }
function showShop() { document.getElementById('page-admin').style.display='none'; document.getElementById('page-shop').style.display='block'; }

async function renderAdmin(tab) {
  const c = document.getElementById('acontent');
  if (tab === 'dash') {
    const ordRes = await fetch(`${API_BASE}/api/orders`);
    const ordData = await ordRes.json();
    const orders = ordData.orders || [];
    const rev = orders.reduce((a,o) => a + Number(o.total), 0);
    c.innerHTML = `<div class="atitle">Dashboard</div><div class="asub">Vue d'ensemble — onebyone.paris</div>
      <div class="sgrid">
        <div class="sc"><div class="sc-label">Revenus</div><div class="sc-val">${rev.toFixed(0)}€</div></div>
        <div class="sc"><div class="sc-label">Commandes</div><div class="sc-val">${orders.length}</div></div>
        <div class="sc"><div class="sc-label">Produits</div><div class="sc-val">${allProducts.length}</div></div>
        <div class="sc"><div class="sc-label">Panier moyen</div><div class="sc-val">${orders.length ? (rev/orders.length).toFixed(0) : 0}€</div></div>
      </div>`
      + (orders.length ? `<div class="tw"><div class="th2"><span class="th2-title">Dernières commandes</span></div>
        <table class="at"><tr><th>N°</th><th>Date</th><th>Client</th><th>Total</th><th>Statut</th></tr>
        ${orders.slice(0,8).map(o => `<tr><td style="color:var(--gold)">${o.id}</td><td>${new Date(o.created_at).toLocaleDateString('fr-FR')}</td><td>${o.user_email}</td><td style="color:var(--gold);font-weight:700">${o.total}€</td><td><span class="bdg bdg-ok">${o.status}</span></td></tr>`).join('')}
        </table></div>` : '<div style="padding:2rem;color:var(--text3);font-size:13px">Aucune commande.</div>');

  } else if (tab === 'prods') {
    const pRes = await fetch(`${API_BASE}/api/admin/products`, { headers: {'x-admin-key': prompt('Clé admin :')||''} });
    const pData = await pRes.json();
    const prods = pData.products || allProducts;
    c.innerHTML = `<div class="atitle">Produits</div><div class="asub">Gérer le catalogue</div>
      <div class="pform">
        <div class="fst">Ajouter un produit</div>
        <div class="fr">
          <div class="fg"><label class="fl">Nom</label><input class="fi" id="np-name" placeholder="Ex: Cargo Tech Noir"/></div>
          <div class="fg"><label class="fl">Prix (€)</label><input class="fi" id="np-price" type="number" placeholder="89"/></div>
        </div>
        <div class="fr">
          <div class="fg"><label class="fl">Catégorie</label><select class="fs fi" id="np-cat"><option value="homme">Homme</option><option value="femme">Femme</option></select></div>
          <div class="fg"><label class="fl">Type</label><select class="fs fi" id="np-type"><option value="pantalon">Pantalon</option><option value="sweat">Sweat</option><option value="tshirt">T-shirt</option><option value="veste">Veste</option><option value="robe">Robe</option><option value="short">Short</option><option value="accessoire">Accessoire</option></select></div>
        </div>
        <div class="fr">
          <div class="fg"><label class="fl">Stock</label><input class="fi" id="np-stock" type="number" placeholder="20"/></div>
          <div class="fg"><label class="fl">Badge</label><select class="fs fi" id="np-badge"><option value="">Aucun</option><option>New</option><option>Hot</option><option>Sale</option></select></div>
        </div>
        <div class="fg"><label class="fl">Tailles (virgule séparées)</label><input class="fi" id="np-sizes" placeholder="XS, S, M, L, XL"/></div>
        <div class="fg"><label class="fl">Description</label><input class="fi" id="np-desc" placeholder="Description courte"/></div>
        <button onclick="adminAddProduct()" style="padding:11px 28px;background:var(--gold);color:#080808;font-size:11px;font-weight:700;letter-spacing:0.1em;border:none;border-radius:2px;cursor:pointer;font-family:var(--font-body)">Ajouter au catalogue</button>
      </div>
      <div class="tw"><div class="th2"><span class="th2-title">Catalogue (${prods.length})</span></div>
        <table class="at"><tr><th>Nom</th><th>Cat.</th><th>Type</th><th>Prix</th><th>Stock</th></tr>
        ${prods.map(p => `<tr><td style="color:var(--text)">${p.name}</td><td>${p.category||p.cat}</td><td>${p.type}</td><td style="color:var(--gold);font-weight:700">${p.price}€</td><td>${p.stock}</td></tr>`).join('')}
        </table></div>`;

  } else if (tab === 'orders') {
    const ordRes = await fetch(`${API_BASE}/api/orders`);
    const ordData = await ordRes.json();
    const orders = ordData.orders || [];
    c.innerHTML = `<div class="atitle">Commandes</div><div class="asub">${orders.length} commande(s)</div>`
      + (orders.length ? `<div class="tw"><table class="at"><tr><th>N°</th><th>Date</th><th>Email</th><th>Articles</th><th>Total</th><th>Statut</th></tr>
        ${orders.map(o => `<tr><td style="color:var(--gold)">${o.id}</td><td>${new Date(o.created_at).toLocaleDateString('fr-FR')}</td><td>${o.user_email}</td><td>${o.items?.length||0}</td><td style="color:var(--gold);font-weight:700">${o.total}€</td><td><span class="bdg bdg-ok">${o.status}</span></td></tr>`).join('')}
        </table></div>` : '<div style="padding:3rem;color:var(--text3);text-align:center">Aucune commande.</div>');
  }
}

function adminAddProduct() {
  notify('Produit ajouté — connexion Supabase requise en prod','ok');
}

function aTab(tab, el) {
  document.querySelectorAll('.aside-item').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  renderAdmin(tab);
}

// ── MODALS & UTILS ────────────────────────────────────────────────
function openMod(id) {
  if (id === 'cart') renderCart();
  if (id === 'checkout') renderCheckout();
  if (id === 'auth') renderAuth('login');
  document.getElementById('mod-'+id).style.display = 'flex';
}
function closeMod(id) { document.getElementById('mod-'+id).style.display = 'none'; }

function notify(msg, type) {
  const n = document.getElementById('notif');
  n.textContent = msg;
  n.className = 'notif show' + (type === 'err' ? ' err' : type === 'ok' ? ' ok' : '');
  clearTimeout(n._t);
  n._t = setTimeout(() => n.classList.remove('show'), 3000);
}
