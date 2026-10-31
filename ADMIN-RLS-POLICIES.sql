-- ===================================
-- ADMIN ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in Supabase SQL Editor
-- ===================================

-- 1. Orders: Allow Admins to View and Update All Orders
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

-- 2. Order Items: Allow Admins to View All Order Items
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

-- 3. Customers: Allow Admins to View All Customers
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM customers
            WHERE customers.id = auth.uid()
            AND customers.is_admin = true
        )
    );

-- 4. Allow Guest Orders insertion (when not logged in)
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items
    FOR INSERT
    WITH CHECK (true);

SELECT 'Admin RLS policies successfully applied!' as message;

