-- ============================================
-- TABELA ADMIN - ACESSO PAINEL ADMINISTRATIVO
-- Login: admin | Senha: admin
-- Cole no SQL Editor do Supabase (xmgwjxfhomxtlynnufvw)
-- ============================================

-- 1) Tabela de admins (login simples, sem depender de auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Para produção use crypt() com pgcrypto
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policies: qualquer um pode tentar logar (SELECT precisa estar aberto para login), só admin pode gerenciar
DROP POLICY IF EXISTS "Anyone can attempt admin login" ON public.admin_users;
CREATE POLICY "Anyone can attempt admin login" ON public.admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage admins" ON public.admin_users;
CREATE POLICY "Admins can manage admins" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);
-- NOTA: Para produção restrinja: USING (auth.jwt() ->> 'email' = 'admin@fabiana.com')

-- 2) Inserir admin padrão (ignora se já existe) - só 1 linha, login aceita admin ou admin@fabiana.com via OR na query
INSERT INTO public.admin_users (username, email, password)
VALUES ('admin', 'admin@fabiana.com', 'admin')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, email = EXCLUDED.email;

-- 3) Garantir usuário no Supabase Auth + role admin (para RLS das outras tabelas)
-- Cria usuário via auth.users se não existir (senha será 'admin' - hash bcrypt gerado pelo Supabase)
-- Se já criou manualmente pelo Dashboard > Authentication > Users, pode pular este bloco
DO $$
DECLARE
  new_user_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Verifica se admin@fabiana.com já existe
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@fabiana.com') INTO admin_exists;
  
  IF NOT admin_exists THEN
    -- Cria usuário com senha 'admin' usando a função interna do Supabase
    -- O password precisa ser criptografado com bcrypt. Usamos crypt() do pgcrypto
    -- Supabase Auth espera bcrypt, então inserimos direto e o Auth vai validar com crypt
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@fabiana.com',
      crypt('admin', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","full_name":"Administrador"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;

    -- Cria profile
    INSERT INTO public.profiles (id, username, full_name, email)
    VALUES (new_user_id, 'admin', 'Administrador', 'admin@fabiana.com')
    ON CONFLICT (id) DO NOTHING;

    -- Adiciona role admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Se já existe, garante profile e role
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@fabiana.com' LIMIT 1;
    INSERT INTO public.profiles (id, username, full_name, email)
    VALUES (new_user_id, 'admin', 'Administrador', 'admin@fabiana.com')
    ON CONFLICT (id) DO UPDATE SET username='admin', email='admin@fabiana.com';
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 4) Verificação
SELECT 'admin_users' as tabela, username, email, '***' as password_hidden, created_at FROM public.admin_users;
SELECT 'auth.users' as tabela, email, email_confirmed_at FROM auth.users WHERE email='admin@fabiana.com';
SELECT 'user_roles' as tabela, user_id, role FROM public.user_roles WHERE role='admin';
