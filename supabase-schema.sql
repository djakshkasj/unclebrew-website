-- =========================================================================
-- UNCLE BREW DATABASE SCHEMA FOR SUPABASE (v2 — Auth, Profiles & User Orders)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to run on both fresh databases and existing databases!
-- =========================================================================

-- 1. Create or upgrade the 'orders' table with unique user identification
CREATE TABLE IF NOT EXISTS public.orders (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id          TEXT,
    brewer_id        TEXT,
    order_id         TEXT NOT NULL,
    customer_name    TEXT NOT NULL,
    customer_phone   TEXT NOT NULL,
    customer_email   TEXT,
    delivery_address TEXT,
    fulfillment_type TEXT NOT NULL,
    branch           TEXT NOT NULL,
    payment_method   TEXT NOT NULL,
    items            JSONB NOT NULL,
    subtotal         NUMERIC NOT NULL,
    discount         NUMERIC DEFAULT 0,
    delivery_fee     NUMERIC DEFAULT 0,
    total_amount     NUMERIC NOT NULL,
    status           TEXT DEFAULT 'received'
);

-- Ensure columns exist if table was created using v1 schema
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS brewer_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- 2. Create the 'profiles' table for registered users
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id         TEXT UNIQUE NOT NULL,
    brewer_id       TEXT UNIQUE,
    full_name       TEXT,
    email           TEXT UNIQUE,
    mobile          TEXT,
    loyalty_stamps  INTEGER DEFAULT 4,
    total_orders    INTEGER DEFAULT 0
);

-- 3. Create the 'franchise_inquiries' table
CREATE TABLE IF NOT EXISTS public.franchise_inquiries (
    id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id              TEXT,
    package_name         TEXT NOT NULL,
    full_name            TEXT NOT NULL,
    mobile               TEXT NOT NULL,
    email                TEXT NOT NULL,
    target_city          TEXT NOT NULL,
    has_commercial_space BOOLEAN DEFAULT false,
    status               TEXT DEFAULT 'new'
);

ALTER TABLE public.franchise_inquiries ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_inquiries ENABLE ROW LEVEL SECURITY;

-- 5. Policies for 'orders' (Allow authenticated & client users to create & view their orders)
DROP POLICY IF EXISTS "Allow public to create orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
CREATE POLICY "Allow public to create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to read orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Allow public to read orders"
ON public.orders FOR SELECT
USING (true);

-- 6. Policies for 'profiles'
DROP POLICY IF EXISTS "Allow public profile access" ON public.profiles;
CREATE POLICY "Allow public profile access"
ON public.profiles FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Policies for 'franchise_inquiries'
DROP POLICY IF EXISTS "Allow public to submit franchise inquiries" ON public.franchise_inquiries;
DROP POLICY IF EXISTS "Users insert franchise inquiries" ON public.franchise_inquiries;
CREATE POLICY "Allow public to submit franchise inquiries"
ON public.franchise_inquiries FOR INSERT
WITH CHECK (true);
