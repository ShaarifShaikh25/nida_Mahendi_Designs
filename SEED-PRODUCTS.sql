-- ===================================
-- SEED INITIAL ORGANIC MEHENDI PRODUCTS
-- Run this in Supabase SQL Editor
-- ===================================

INSERT INTO products (id, name, description, price, original_price, weight, image_url, category, in_stock, featured, badge)
VALUES
(
    '00000000-0000-4000-8000-000000000001',
    'Organic Henna Powder',
    '100% natural, triple-sifted micro-fine henna powder sourced from Sojat, Rajasthan for rich, deep stains.',
    299.00,
    399.00,
    '100g',
    'images/1.jpeg',
    'powder',
    true,
    true,
    'Bestseller'
),
(
    '00000000-0000-4000-8000-000000000002',
    'Henna Cones (Pack of 10)',
    'Handcrafted fresh organic henna cones prepared with eucalyptus & tea tree oils. Chemical-free (No PPD).',
    499.00,
    599.00,
    '10 Cones',
    'images/2.jpeg',
    'cones',
    true,
    true,
    'Popular'
),
(
    '00000000-0000-4000-8000-000000000003',
    'Bridal Special Henna Cones',
    'Ultra-fine 0.38mm precision pin-tip cones formulated for intricate bridal details and dark mahogany stains.',
    799.00,
    999.00,
    '5 Cones',
    'images/3.jpeg',
    'bridal',
    true,
    true,
    'Bridal Choice'
),
(
    '00000000-0000-4000-8000-000000000004',
    'Henna After-Care Oil',
    'Pure essential oil blend (clove, eucalyptus, argan) that locks in moisture and deepens stain color.',
    199.00,
    249.00,
    '50ml',
    'images/4.jpeg',
    'care',
    true,
    false,
    'Essential'
),
(
    '00000000-0000-4000-8000-000000000005',
    'Design Stencils Set',
    'Reusable laser-cut skin-friendly adhesive stencils for perfect Arabic and mandala henna patterns.',
    349.00,
    449.00,
    '20 Designs',
    'images/5.jpeg',
    'accessories',
    true,
    false,
    'Easy Apply'
),
(
    '00000000-0000-4000-8000-000000000006',
    'Complete Artist Starter Kit',
    'Everything you need: 4 fresh cones, 100g Sojat powder, after-care oil, stocking filter, and practice sheet.',
    999.00,
    1299.00,
    'Full Set',
    'images/6.jpeg',
    'kit',
    true,
    true,
    'Save 23%'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    weight = EXCLUDED.weight,
    image_url = EXCLUDED.image_url,
    category = EXCLUDED.category,
    in_stock = EXCLUDED.in_stock,
    featured = EXCLUDED.featured,
    badge = EXCLUDED.badge;

SELECT 'Successfully added 6 organic mehendi products!' as message;

