-- Add phone column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add full_name column to profiles table  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;