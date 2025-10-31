-- Setup script for Supabase pgvector similarity search
-- Run this in your production Supabase database SQL editor

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Ensure the embedding column is properly typed as vector
-- If your embedding column is currently a different type (like json or text[]),
-- you'll need to convert it. This example assumes 512-dimensional CLIP embeddings:

-- Option A: If products table doesn't have embedding column yet
-- ALTER TABLE products ADD COLUMN embedding vector(512);

-- Option B: If embedding exists but is wrong type (e.g., json or text[])
-- ALTER TABLE products ALTER COLUMN embedding TYPE vector(512) 
-- USING embedding::text::vector(512);

-- Step 3: Create an index for fast similarity search
-- Choose one of these index types:

-- IVFFlat index (good for < 1M vectors, faster builds)
CREATE INDEX IF NOT EXISTS products_embedding_idx 
ON products 
USING ivfflat (embedding vector_l2_ops) 
WITH (lists = 100);

-- OR HNSW index (better accuracy, recommended for production)
-- CREATE INDEX IF NOT EXISTS products_embedding_idx 
-- ON products 
-- USING hnsw (embedding vector_l2_ops);

-- Step 4: Create the similarity search function
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(512),
  match_threshold float DEFAULT 2.0,  -- Increased threshold for L2 distance
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id text,
  name text,
  price numeric,
  description text,
  category text,
  brand text,
  size text,
  color text,
  image_url text,
  cloudinary_public_id text,
  affiliate_link text,
  embedding vector(512),
  distance float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    name,
    price,
    description,
    category,
    brand,
    size,
    color,
    image_url,
    cloudinary_public_id,
    affiliate_link,
    embedding,
    (embedding <-> query_embedding) as distance
  FROM products
  WHERE embedding IS NOT NULL
  ORDER BY embedding <-> query_embedding
  LIMIT match_count;
$$;

-- Step 5: Grant execute permission to authenticated users (optional)
-- GRANT EXECUTE ON FUNCTION match_products TO authenticated;
-- GRANT EXECUTE ON FUNCTION match_products TO anon;

-- Test the function with a dummy embedding
-- SELECT * FROM match_products(
--   (SELECT embedding FROM products LIMIT 1),  -- Use an existing embedding for testing
--   2.0,
--   5
-- );
