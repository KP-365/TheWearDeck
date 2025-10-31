-- Add new columns to users table for onboarding
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('Male', 'Female')),
ADD COLUMN IF NOT EXISTS preferred_styles text[],
ADD COLUMN IF NOT EXISTS budget_range text,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Update existing budget columns to be nullable since we're using budget_range now
ALTER TABLE public.users 
ALTER COLUMN tops_max_price DROP NOT NULL,
ALTER COLUMN bottoms_max_price DROP NOT NULL,
ALTER COLUMN shoes_max_price DROP NOT NULL,
ALTER COLUMN accessories_max_price DROP NOT NULL;


