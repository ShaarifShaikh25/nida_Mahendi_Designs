# Admin Setup Guide

## Step 1: Create Storage Bucket for Images

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Name it: `product-images`
4. Make it **Public** (check the box)
5. Click **Create bucket**

## Step 2: Set Storage Policies

Go to Storage → product-images → Policies, then add:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- Allow admins to delete
CREATE POLICY "Admins can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' );
```

Or use the UI:
- Click "New Policy" → "For full customization"
- Policy name: "Public Read"
- Allowed operation: SELECT
- Target roles: public
- USING expression: `bucket_id = 'product-images'`

## Step 3: Add Admin Role to Database

Run this SQL in Supabase SQL Editor:

```sql
-- Add is_admin column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create your first admin user (replace with your email)
-- First, sign up on your website with this email
-- Then run this query to make that user an admin:
UPDATE customers 
SET is_admin = true 
WHERE email = 'your-admin-email@example.com';
```

## Step 2: Update RLS Policies for Admin

Run this SQL to allow admins to manage products:

```sql
-- Drop existing product policies if needed
DROP POLICY IF EXISTS "Anyone can view products" ON products;

-- Recreate read policy
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Admin can insert products
CREATE POLICY "Admins can insert products" ON products FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = auth.uid() 
        AND customers.is_admin = true
    )
);

-- Admin can update products
CREATE POLICY "Admins can update products" ON products FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = auth.uid() 
        AND customers.is_admin = true
    )
);

-- Admin can delete products
CREATE POLICY "Admins can delete products" ON products FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM customers 
        WHERE customers.id = auth.uid() 
        AND customers.is_admin = true
    )
);
```

## Step 3: Create Your Admin Account

### Method 1: Using Existing Account
1. Sign up on your website (index.html) with your admin email
2. Go to Supabase → SQL Editor
3. Run:
```sql
UPDATE customers 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

### Method 2: Create New Admin Directly
```sql
-- Get the auth user ID first (after signing up)
-- Then insert into customers with admin flag
INSERT INTO customers (id, email, full_name, is_admin) 
VALUES (
    'USER_AUTH_ID',  -- Get this from Authentication → Users in Supabase
    'admin@example.com',
    'Admin User',
    true
);
```

## Step 4: Access Admin Dashboard

1. Go to: `admin.html`
2. Login with your admin email and password
3. You should see the admin dashboard!

## Features:

### Admin Dashboard:
- ✅ View total products, orders, customers
- ✅ Manage all products
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Set product as featured
- ✅ Manage stock status
- ✅ Add product badges

### Security:
- ✅ Only users with `is_admin = true` can access
- ✅ Protected routes with RLS policies
- ✅ Automatic logout for non-admin users
- ✅ Secure authentication

## Usage:

### To Add a Product:
1. Click "Add New Product"
2. Fill in all details
3. Click "Save Product"

### To Edit a Product:
1. Click "Edit" button on any product
2. Modify details
3. Click "Save Product"

### To Delete a Product:
1. Click "Delete" button
2. Confirm deletion

## Important Notes:

- Keep your admin email secure
- Don't share admin credentials
- Regular users cannot access admin panel
- All changes are reflected immediately on main website
- Product images should be in `images/` folder or use full URLs

## Testing:

1. Create admin account
2. Login to admin.html
3. Add a test product
4. Check if it appears on index.html
5. Edit and delete to verify all functions work

## Troubleshooting:

**Can't login to admin?**
- Verify `is_admin = true` in database
- Check email verification is complete

**Can't add/edit products?**
- Verify RLS policies are created
- Check browser console for errors

**Products not showing?**
- Refresh the page
- Check if products exist in database
