-- Complete FashionBrain Database Schema
-- Run this in your Supabase SQL editor to create all necessary tables

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    name text,
    gender text CHECK (gender IN ('Male', 'Female')),
    preferred_styles text[],
    budget_range text,
    onboarding_completed boolean DEFAULT false,
    tops_max_price numeric,
    bottoms_max_price numeric,
    shoes_max_price numeric,
    accessories_max_price numeric,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Step 3: Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    brand text,
    price numeric,
    style text,
    material text,
    affiliate_link text,
    image_url text NOT NULL,
    cloudinary_public_id text,
    embedding vector(512),
    created_at timestamp without time zone DEFAULT now(),
    category text NOT NULL CHECK (category = ANY (ARRAY['top'::text, 'bottom'::text, 'shoes'::text, 'accessory'::text])),
    CONSTRAINT products_pkey PRIMARY KEY (id)
);

-- Step 4: Create user_actions table
CREATE TABLE IF NOT EXISTS public.user_actions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    product_id uuid,
    action text CHECK (action = ANY (ARRAY['like'::text, 'skip'::text, 'shop'::text])),
    created_at timestamp without time zone DEFAULT now(),
    outfit_id uuid,
    CONSTRAINT user_actions_pkey PRIMARY KEY (id),
    CONSTRAINT user_actions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT user_actions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

-- Step 5: Create inspo_images table
CREATE TABLE IF NOT EXISTS public.inspo_images (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    image_url text NOT NULL,
    cloudinary_public_id text,
    embedding vector(512),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT inspo_images_pkey PRIMARY KEY (id),
    CONSTRAINT inspo_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Step 6: Create outfits table
CREATE TABLE IF NOT EXISTS public.outfits (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    product_ids text[] NOT NULL,
    total_price numeric,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT outfits_pkey PRIMARY KEY (id),
    CONSTRAINT outfits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS products_embedding_idx 
ON products 
USING ivfflat (embedding vector_l2_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS inspo_images_embedding_idx 
ON inspo_images 
USING ivfflat (embedding vector_l2_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS user_actions_user_id_idx ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS user_actions_product_id_idx ON user_actions(product_id);
CREATE INDEX IF NOT EXISTS inspo_images_user_id_idx ON inspo_images(user_id);

-- Step 8: Create the similarity search function
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(512),
  match_threshold float DEFAULT 2.0,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  style text,
  material text,
  category text,
  brand text,
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
    style,
    material,
    category,
    brand,
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

-- Step 9: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspo_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Products are public (read-only for users)
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

-- User actions are private to the user
CREATE POLICY "Users can manage own actions" ON public.user_actions
    FOR ALL USING (auth.uid() = user_id);

-- Inspiration images are private to the user
CREATE POLICY "Users can manage own inspo images" ON public.inspo_images
    FOR ALL USING (auth.uid() = user_id);

-- Outfits are private to the user
CREATE POLICY "Users can manage own outfits" ON public.outfits
    FOR ALL USING (auth.uid() = user_id);

-- Step 11: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.user_actions TO authenticated;
GRANT ALL ON public.inspo_images TO authenticated;
GRANT ALL ON public.outfits TO authenticated;
GRANT EXECUTE ON FUNCTION match_products TO authenticated;


