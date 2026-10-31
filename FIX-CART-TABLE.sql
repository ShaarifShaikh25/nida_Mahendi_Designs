-- ============================================
-- FIX CART TABLE - Remove Foreign Key to Customers
-- ============================================
-- The cart should reference auth.users, not a separate customers table
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing cart table
DROP TABLE IF EXISTS cart CASCADE;

-- Step 2: Recreate cart table without foreign key to customers
CREATE TABLE cart (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL,  -- This will be auth.uid()
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- Step 3: Enable RLS
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view own cart" 
    ON cart FOR SELECT 
    USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert to own cart" 
    ON cart FOR INSERT 
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own cart" 
    ON cart FOR UPDATE 
    USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete from own cart" 
    ON cart FOR DELETE 
    USING (auth.uid() = customer_id);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the table was created correctly:
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cart'
ORDER BY ordinal_position;
