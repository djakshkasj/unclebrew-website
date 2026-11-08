-- =========================================================================
-- UNCLE BREW DATABASE SCHEMA FOR SUPABASE
-- Run this SQL in your Supabase Project Dashboard -> SQL Editor -> New Query
-- =========================================================================

-- 1. Create the 'orders' table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT,
    fulfillment_type TEXT NOT NULL,
    branch TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    delivery_fee NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'received'
);

-- 2. Create the 'franchise_inquiries' table
CREATE TABLE IF NOT EXISTS public.franchise_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    package_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    target_city TEXT NOT NULL,
    has_commercial_space BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'new'
);

-- 3. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Public Client Access (Insert & View own orders)
DROP POLICY IF EXISTS "Allow public to create orders" ON public.orders;
CREATE POLICY "Allow public to create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to read orders" ON public.orders;
CREATE POLICY "Allow public to read orders" 
ON public.orders 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow public to submit franchise inquiries" ON public.franchise_inquiries;
CREATE POLICY "Allow public to submit franchise inquiries" 
ON public.franchise_inquiries 
FOR INSERT 
WITH CHECK (true);

-- Optional: Enable Realtime for live order tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
