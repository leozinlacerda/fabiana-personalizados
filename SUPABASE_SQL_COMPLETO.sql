-- ============================================
-- FABIANA PERSONALIZADOS - SQL COMPLETO SUPABASE
-- Projeto: xmgwjxfhomxtlynnufvw
-- Cole TUDO no SQL Editor do Supabase (Dashboard > SQL Editor > New query > Run)
-- Idempotente: pode rodar novamente sem duplicar
-- ============================================

-- 0) Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) ENUM (já existe em migrações antigas, garante)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2) CATEGORIES - completar colunas faltantes (link_url, position, type)
-- Base já tem: id, name, slug, image_url, created_at
-- ============================================
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'product' CHECK (type IN ('product','rail'));
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Índice único para slug (se já existe ignora)
DO $$ BEGIN
  CREATE UNIQUE INDEX idx_categories_slug ON public.categories (slug) WHERE slug IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN null;
END $$;
CREATE INDEX IF NOT EXISTS idx_categories_position ON public.categories(position);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

-- ============================================
-- 3) PRODUCTS - adicionar max_installments e sizes
-- Base já tem: id, name, description, price, image_url, category_id, created_at
-- ============================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_installments INTEGER DEFAULT 10;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes TEXT[]; -- array de tamanhos ex: {'P','M','G'}

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);

-- ============================================
-- 4) PRODUCT_IMAGES - já existe, garantir estrutura para ImageKit (image_url = URL completa https://ik.imagekit.io/...)
-- ============================================
-- Tabela já criada em 20251202121306. Apenas garante índices e verifica colunas
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON public.product_images(product_id, display_order);

-- ============================================
-- 5) COUPONS - já existe, nada a fazer
-- ============================================

-- ============================================
-- 6) CAROUSEL_IMAGES - NOVO (Hero da Home)
-- Armazena URLs do ImageKit
-- ============================================
CREATE TABLE IF NOT EXISTS public.carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL, -- URL ImageKit ex: https://ik.imagekit.io/aw0yrq2s3/carousel/xxx.jpg
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
-- 7) INSTITUTIONAL_BLOCKS - NOVO (blocos Irmãs/Infantis etc)
-- Máx 2 blocos na Home, mas sem limitação no banco
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
-- 8) SITE_SETTINGS - NOVO (linha única com configurações do Header/Banner/WhatsApp)
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

-- Garante 1 linha padrão
INSERT INTO public.site_settings (id, banner_text) 
SELECT gen_random_uuid(), 'FRETE GRÁTIS A PARTIR DE R$199,00 - PARCELAMENTO EM ATÉ 10X SEM JUROS'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_site_settings_updated ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9) PROFILES / USER_ROLES - garantir colunas usadas no localStorage
-- Já tem migrações, apenas complementa
-- ============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- 10) RLS ADICIONAL - garantir has_role funciona para novas tabelas
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ============================================
-- 11) SEED CATEGORIAS PADRÃO (opcional - roda só se vazio)
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

-- ============================================
-- FIM - Verificação
-- ============================================
-- Rode após colar para conferir:
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT * FROM public.site_settings;
-- SELECT * FROM public.categories ORDER BY position;
