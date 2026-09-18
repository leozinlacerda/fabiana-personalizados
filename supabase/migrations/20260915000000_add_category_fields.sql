-- Adicionar colunas slug e image_url na tabela categories
ALTER TABLE categories ADD COLUMN slug TEXT;
ALTER TABLE categories ADD COLUMN image_url TEXT;

-- Criar índice único para slug
CREATE UNIQUE INDEX idx_categories_slug ON categories (slug) WHERE slug IS NOT NULL;
