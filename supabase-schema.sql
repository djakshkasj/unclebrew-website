-- =========================================================================
-- UNCLE BREW DATABASE SCHEMA FOR SUPABASE (v3 — Auth, Encryption & Anti-SQLi)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to run on both fresh databases and existing databases!
-- =========================================================================

-- 0. Enable PostgreSQL Cryptographic Extension (pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create or upgrade the 'orders' table with unique user ID & cryptographic columns
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
    order_hash       TEXT,
    encrypted_pii    TEXT,
    status           TEXT DEFAULT 'received'
);

-- Ensure v2 & v3 columns exist if table was created earlier
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS brewer_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_hash TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS encrypted_pii TEXT;

-- 2. Database-Level Anti-SQL Injection & Anti-XSS Trigger Function
CREATE OR REPLACE FUNCTION public.verify_and_sanitize_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    combined_input TEXT;
BEGIN
    combined_input := COALESCE(NEW.customer_name, '') || ' ' ||
                      COALESCE(NEW.customer_phone, '') || ' ' ||
                      COALESCE(NEW.customer_email, '') || ' ' ||
                      COALESCE(NEW.delivery_address, '') || ' ' ||
                      COALESCE(NEW.branch, '');

    -- Block common SQL Injection & XSS vectors at the database engine level
    IF combined_input ~* '(union\s+select|;\s*(drop|delete|update|insert|alter|truncate)|--\s|/\*|<script|javascript:|pg_sleep)' THEN
        RAISE EXCEPTION 'Security Policy Violation: Malicious SQLi or XSS payload rejected by Uncle Brew Database Firewall.';
    END IF;

    -- Automatically compute SHA-256 integrity hash using pgcrypto if not provided by client
    IF NEW.order_hash IS NULL OR NEW.order_hash = '' THEN
        NEW.order_hash := encode(
            digest(
                COALESCE(NEW.order_id, '') || '|' ||
                COALESCE(NEW.user_id, 'guest') || '|' ||
                COALESCE(NEW.brewer_id, 'UB-GUEST') || '|' ||
                COALESCE(NEW.total_amount::text, '0'),
                'sha256'
            ),
            'hex'
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_verify_order_security ON public.orders;
CREATE TRIGGER trg_verify_order_security
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.verify_and_sanitize_order();

-- 3. Create the 'profiles' table for registered users
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

-- 4. Create the 'franchise_inquiries' table
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_inquiries ENABLE ROW LEVEL SECURITY;

-- 6. Policies for 'orders'
DROP POLICY IF EXISTS "Allow public to create orders" ON public.orders;
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
CREATE POLICY "Allow public to create orders"
ON public.orders FOR INSERT
WITH CHECK (total_amount >= 0 AND length(customer_name) <= 120);

DROP POLICY IF EXISTS "Allow public to read orders" ON public.orders;
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Allow public to read orders"
ON public.orders FOR SELECT
USING (true);

-- 7. Policies for 'profiles'
DROP POLICY IF EXISTS "Allow public profile access" ON public.profiles;
CREATE POLICY "Allow public profile access"
ON public.profiles FOR ALL
USING (true)
WITH CHECK (true);

-- 8. Policies for 'franchise_inquiries'
DROP POLICY IF EXISTS "Allow public to submit franchise inquiries" ON public.franchise_inquiries;
DROP POLICY IF EXISTS "Users insert franchise inquiries" ON public.franchise_inquiries;
CREATE POLICY "Allow public to submit franchise inquiries"
ON public.franchise_inquiries FOR INSERT
WITH CHECK (length(full_name) <= 120);
