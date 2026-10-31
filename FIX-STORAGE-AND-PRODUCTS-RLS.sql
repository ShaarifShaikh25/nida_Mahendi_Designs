-- ====================================================
-- FIX STORAGE & PRODUCT MANAGEMENT RLS POLICIES
-- Run this in your Supabase SQL Editor
-- ====================================================

-- 1. Ensure the 'product-images' storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Clean up any previous storage policies for product-images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- 3. Create Storage Policies for 'product-images' bucket
-- A) Public Read Access (so visitors can see uploaded images)
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- B) Upload Access (allows logged-in admins to upload images)
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- C) Update Access
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- D) Delete Access
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');


-- ====================================================
-- 4. PRODUCTS TABLE RLS POLICIES (Add / Edit / Delete)
-- ====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Clean up any previous policies on products
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- A) Public can view products
CREATE POLICY "Public can view products"
ON products FOR SELECT
USING (true);

-- B) Admins can insert new products
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
);

-- C) Admins can update products
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
);

-- D) Admins can delete products
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid()
        AND customers.is_admin = true
    )
);

-- Verification message
SELECT 'Storage & Product RLS policies applied successfully! ✅' as result;
