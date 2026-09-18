-- ============================================
-- FABIANA PERSONALIZADOS - SQL COMPLETO SUPABASE (CORRIGIDO PARA DB VAZIO)
-- Projeto: xmgwjxfhomxtlynnufvw
-- Cole TUDO no SQL Editor do Supabase (Dashboard > SQL Editor > New query > Run)
-- Idempotente: pode rodar novamente sem duplicar
-- Corrige erro "relation public.categories does not exist" criando tabelas base
-- ============================================

-- 0) Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) ENUM
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 1.1) TABELAS BASE - CRIAÇÃO (se não existirem) - antes dos ALTERs
-- ============================================

-- Categories base
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  image_url TEXT,
  link_url TEXT,
  position INTEGER DEFAULT 0,
  type TEXT DEFAULT 'product',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products base
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  max_installments INTEGER DEFAULT 10,
  sizes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images base
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons base
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles base (depende de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles base
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Storage bucket (ignora se já existe)
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Função has_role (usada nas policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, phone, email)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS base
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies base (recria)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
CREATE POLICY "Admins can insert product images" ON public.product_images FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
CREATE POLICY "Admins can update product images" ON public.product_images FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Admins can delete product images" ON public.product_images FOR DELETE USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Anyone can view coupons" ON public.coupons;
CREATE POLICY "Anyone can view coupons" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Anyone can view product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

-- ============================================
-- 2) AJUSTES FINAIS (ALTERs idempotentes para DBs já existentes)
-- ============================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'product';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_type_check') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_type_check CHECK (type IN ('product','rail'));
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX idx_categories_slug ON public.categories (slug) WHERE slug IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN null;
END $$;
CREATE INDEX IF NOT EXISTS idx_categories_position ON public.categories(position);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_installments INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[];
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON public.product_images(product_id, display_order);

-- Função get_email_by_username
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username TEXT) RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM public.profiles WHERE username = p_username LIMIT 1
$$;

-- ============================================
-- 6) CAROUSEL_IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT,
  link_url TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view carousel" ON public.carousel_images;
CREATE POLICY "Anyone can view carousel" ON public.carousel_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert carousel" ON public.carousel_images;
CREATE POLICY "Admins can insert carousel" ON public.carousel_images FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update carousel" ON public.carousel_images;
CREATE POLICY "Admins can update carousel" ON public.carousel_images FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete carousel" ON public.carousel_images;
CREATE POLICY "Admins can delete carousel" ON public.carousel_images FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_carousel_position ON public.carousel_images(position);

-- ============================================
-- 7) INSTITUTIONAL_BLOCKS
-- ============================================
CREATE TABLE IF NOT EXISTS public.institutional_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.institutional_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view blocks" ON public.institutional_blocks;
CREATE POLICY "Anyone can view blocks" ON public.institutional_blocks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert blocks" ON public.institutional_blocks;
CREATE POLICY "Admins can insert blocks" ON public.institutional_blocks FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update blocks" ON public.institutional_blocks;
CREATE POLICY "Admins can update blocks" ON public.institutional_blocks FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete blocks" ON public.institutional_blocks;
CREATE POLICY "Admins can delete blocks" ON public.institutional_blocks FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_blocks_position ON public.institutional_blocks(position);

-- ============================================
-- 8) SITE_SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_text TEXT DEFAULT 'FRETE GRÁTIS A PARTIR DE R$199,00 - PARCELAMENTO EM ATÉ 10X SEM JUROS',
  banner_color TEXT DEFAULT '#7b7b7b',
  whatsapp_number TEXT DEFAULT '5511999999999',
  primary_color TEXT DEFAULT '#9f9f9f',
  secondary_color TEXT DEFAULT '#f5f5f5',
  button_color TEXT DEFAULT '#C4A77D',
  button_text TEXT DEFAULT 'Comprar',
  accent_color TEXT DEFAULT '#C4A77D',
  button_size TEXT DEFAULT 'md' CHECK (button_size IN ('sm','md','lg')),
  button_border_radius TEXT DEFAULT '4',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Anyone can view settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins can delete settings" ON public.site_settings;
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE USING (public.has_role(auth.uid(),'admin'));
INSERT INTO public.site_settings (id, banner_text) 
SELECT gen_random_uuid(), 'FRETE GRÁTIS A PARTIR DE R$199,00 - PARCELAMENTO EM ATÉ 10X SEM JUROS'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- 11) SEED CATEGORIAS
-- ============================================
INSERT INTO public.categories (name, slug, position, type) 
SELECT * FROM (VALUES 
  ('Véus','veus',0,'product'),
  ('Binários','binarios',1,'product'),
  ('Hinários','hinarios',2,'product'),
  ('Infantis','infantis',3,'product'),
  ('Acessórios','acessorios',4,'product')
) AS v(name, slug, position, type)
WHERE NOT EXISTS (SELECT 1 FROM public.categories);
