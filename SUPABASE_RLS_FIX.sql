-- ============================================
-- FIX RLS - Permitir Admin Panel funcionar com login admin/admin via admin_users (sem Auth)
-- O painel atual salva sessão no localStorage, então auth.uid() = null e has_role() falha
-- Este fix libera INSERT/UPDATE/DELETE para todos enquanto você testa
-- Depois que o login Supabase Auth funcionar, reverta para has_role
-- Cole no SQL Editor e Run
-- ============================================

-- Categories - liberar escrita pública temporariamente
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Public can insert categories" ON public.categories FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Public can update categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Public can delete categories" ON public.categories FOR DELETE USING (true);

-- Products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

-- Product Images
DROP POLICY IF EXISTS "Admins can insert product images" ON public.product_images;
CREATE POLICY "Public can insert product images" ON public.product_images FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update product images" ON public.product_images;
CREATE POLICY "Public can update product images" ON public.product_images FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete product images" ON public.product_images;
CREATE POLICY "Public can delete product images" ON public.product_images FOR DELETE USING (true);

-- Carousel
DROP POLICY IF EXISTS "Admins can insert carousel" ON public.carousel_images;
CREATE POLICY "Public can insert carousel" ON public.carousel_images FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update carousel" ON public.carousel_images;
CREATE POLICY "Public can update carousel" ON public.carousel_images FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete carousel" ON public.carousel_images;
CREATE POLICY "Public can delete carousel" ON public.carousel_images FOR DELETE USING (true);

-- Institutional Blocks
DROP POLICY IF EXISTS "Admins can insert blocks" ON public.institutional_blocks;
CREATE POLICY "Public can insert blocks" ON public.institutional_blocks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update blocks" ON public.institutional_blocks;
CREATE POLICY "Public can update blocks" ON public.institutional_blocks FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete blocks" ON public.institutional_blocks;
CREATE POLICY "Public can delete blocks" ON public.institutional_blocks FOR DELETE USING (true);

-- Site Settings
DROP POLICY IF EXISTS "Admins can insert settings" ON public.site_settings;
CREATE POLICY "Public can insert settings" ON public.site_settings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Public can update settings" ON public.site_settings FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete settings" ON public.site_settings;
CREATE POLICY "Public can delete settings" ON public.site_settings FOR DELETE USING (true);

-- Coupons (se usar)
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
CREATE POLICY "Public can insert coupons" ON public.coupons FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
CREATE POLICY "Public can update coupons" ON public.coupons FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
CREATE POLICY "Public can delete coupons" ON public.coupons FOR DELETE USING (true);

-- Verificação
SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;
