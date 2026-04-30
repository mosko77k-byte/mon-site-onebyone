-- =============================================
-- ONEBYONE PARIS — Supabase Database Schema
-- Colle ce code dans Supabase > SQL Editor > Run
-- =============================================

-- TABLE: products
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  old_price NUMERIC(10,2),
  category TEXT NOT NULL CHECK (category IN ('homme','femme')),
  type TEXT NOT NULL CHECK (type IN ('pantalon','sweat','tshirt','veste','robe','short','accessoire')),
  badge TEXT CHECK (badge IN ('New','Hot','Sale')),
  sizes TEXT[] NOT NULL DEFAULT '{"S","M","L"}',
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: users (en plus de auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmée' CHECK (status IN ('confirmée','en préparation','expédiée','livrée','annulée')),
  shipping_address TEXT,
  payment_method TEXT DEFAULT 'card',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ROW LEVEL SECURITY
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Policies: products lisibles par tous
CREATE POLICY "products_public_read" ON products FOR SELECT USING (active = true);
-- Policies: products modifiables uniquement via service_role (admin)
CREATE POLICY "products_admin_all" ON products FOR ALL USING (auth.role() = 'service_role');

-- Policies: profiles accessibles par leur propriétaire
CREATE POLICY "profiles_own_read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies: orders accessibles par leur propriétaire ou admin
CREATE POLICY "orders_own_read" ON orders FOR SELECT USING (
  user_email = auth.jwt()->>'email' OR auth.role() = 'service_role'
);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_update" ON orders FOR UPDATE USING (auth.role() = 'service_role');

-- Policies: wishlist par propriétaire
CREATE POLICY "wishlist_own" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- TRIGGER: créer profil automatiquement après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- DONNÉES DE DÉMO (optionnel)
INSERT INTO products (name, price, category, type, badge, sizes, stock, description) VALUES
('Cargo Noir Tactical', 139, 'homme', 'pantalon', 'New', '{"XS","S","M","L","XL"}', 14, 'Coupe droite avec poches cargo oversize. Tissu ripstop noir mat.'),
('Sweat Archive Drop', 95, 'homme', 'sweat', 'Hot', '{"S","M","L","XL"}', 20, 'Coton lourd 400g brossé, coupe boxy, broderie signature OBO au dos.'),
('Coach Jacket Void', 195, 'homme', 'veste', 'Sale', '{"S","M","L"}', 7, 'Nylon technique déperlant, doublure mesh, bande latérale signature.'),
('Essential Tee OBO', 55, 'homme', 'tshirt', NULL, '{"XS","S","M","L","XL","XXL"}', 45, '100% coton peigné 220g, coupe oversize allongée, logo brodé poitrine.'),
('Wide Leg Onyx', 155, 'femme', 'pantalon', 'New', '{"XS","S","M","L"}', 11, 'Tissu satin opaque, taille haute, jambe palazzo très large.'),
('Robe Asymétrique Dark', 175, 'femme', 'robe', NULL, '{"XS","S","M","L"}', 8, 'Drapage asymétrique, tissu crêpe noir intense, fentes latérales.'),
('Crop Sweat Luna', 85, 'femme', 'sweat', 'Hot', '{"XS","S","M"}', 16, 'Coupe courte boxy, French terry, surpiqûres apparentes.'),
('Blazer Power Femme', 235, 'femme', 'veste', 'New', '{"XS","S","M","L"}', 5, 'Structure oversize masculin, laine mélangée noire, boutons métal.');
