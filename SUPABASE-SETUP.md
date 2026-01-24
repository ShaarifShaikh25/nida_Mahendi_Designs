# Supabase E-Commerce Setup Guide

## Step 1: Create Supabase Account & Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Click "New Project"
4. Fill in:
   - **Project Name**: nida-mahendi-shop
   - **Database Password**: (Choose a strong password - save it!)
   - **Region**: Choose closest to India (Singapore recommended)
5. Wait for project to be created (~2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 3: Create Database Tables

1. In Supabase dashboard, click on **SQL Editor**
2. Click **New Query**
3. Copy and paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    weight TEXT,
    image_url TEXT,
    category TEXT,
    in_stock BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    badge TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    order_number TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending',
    shipping_address JSONB NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart Table (for logged-in users)
CREATE TABLE cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Wishlist Table
CREATE TABLE wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Initial Products
INSERT INTO products (name, description, price, original_price, weight, image_url, category, featured, badge) VALUES
('Organic Henna Powder', '100% natural henna powder for rich, long-lasting color', 299, NULL, '100g', 'images/1.jpeg', 'powder', true, 'Bestseller'),
('Henna Cones (Pack of 10)', 'Ready-to-use cones for instant application', 499, NULL, '10 pieces', 'images/2.jpeg', 'cones', true, 'Popular'),
('Bridal Special Henna', 'Premium quality henna for special occasions', 799, NULL, '250g', 'images/3.jpeg', 'bridal', true, NULL),
('After-Care Oil', 'Natural oil for deeper color and longer retention', 199, NULL, '50ml', 'images/4.jpeg', 'care', false, NULL),
('Design Stencils Set', 'Beautiful reusable stencils for perfect patterns', 349, NULL, '20 designs', 'images/5.jpeg', 'accessories', false, NULL),
('Complete Starter Kit', 'Everything you need to get started', 999, 1299, 'Full Set', 'images/6.jpeg', 'kit', true, 'New');
```

4. Click **Run** to execute the query

## Step 4: Set Up Row Level Security (RLS)

1. Still in **SQL Editor**, run this query:

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access for products
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);

-- Public read access for reviews
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);

-- Customers can view their own data
CREATE POLICY "Users can view own data" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON customers FOR UPDATE USING (auth.uid() = id);

-- Cart policies
CREATE POLICY "Users can view own cart" ON cart FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert to own cart" ON cart FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can update own cart" ON cart FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Users can delete from own cart" ON cart FOR DELETE USING (auth.uid() = customer_id);

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert to own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can delete from own wishlist" ON wishlist FOR DELETE USING (auth.uid() = customer_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Order items policies
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT 
    USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid()));
```

## Step 5: Enable Realtime for Products

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find the **products** table
3. Toggle ON the replication for real-time updates
4. This allows customers to see product changes instantly!

Or run this SQL:

```sql
-- Enable realtime for products table
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

## Step 6: Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable these providers:
   - ✅ **Email** (already enabled)
   - ✅ **Google** (optional - requires Google OAuth setup)
3. Go to **Authentication** → **URL Configuration**
4. Add your site URL (for local: `http://localhost:5500`)

## Step 6: Configure Your Frontend

1. Create a file `js/supabase-config.js` with your credentials:

```javascript
const SUPABASE_URL = 'YOUR_PROJECT_URL';  // Replace with your URL
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';  // Replace with your key
```

2. Update your HTML to include Supabase SDK (already done in updated files)

## Step 7: Test Your Setup

1. Open your website in a browser
2. Try creating an account (Sign Up)
3. Add products to cart
4. Check Supabase dashboard → **Table Editor** to see data

## Step 8: Storage Setup (for Product Images)

1. In Supabase dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `product-images`
4. Make it **Public**
5. Upload your product images here
6. Update image URLs in products table

## Important Notes

- Keep your `SUPABASE_ANON_KEY` in config file
- Never commit `supabase-config.js` to public repositories
- For production, add your domain to Supabase **Authentication** → **URL Configuration**
- Use environment variables for keys in production

## Next Steps

1. Test authentication flow
2. Test cart functionality
3. Implement payment gateway (Razorpay recommended for India)
4. Set up email notifications using Supabase Functions
5. Add admin panel for order management

## Useful Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
- Razorpay Integration: https://razorpay.com/docs/
