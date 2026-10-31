// ===================================
// Product Catalog & Real-Time Sync
// ===================================

// Default verified organic henna products (Production Catalog)
const DEFAULT_PRODUCTS = [
    {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'Organic Henna Powder',
        description: '100% natural, triple-sifted micro-fine henna powder sourced from Sojat, Rajasthan for rich, deep stains.',
        price: 299,
        original_price: 399,
        weight: '100g',
        image_url: 'images/1.jpeg',
        category: 'powder',
        badge: 'Bestseller',
        rating: 4.9,
        review_count: 128,
        in_stock: true,
        featured: true
    },
    {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'Henna Cones (Pack of 10)',
        description: 'Handcrafted fresh organic henna cones prepared with eucalyptus & tea tree oils. Chemical-free (No PPD).',
        price: 499,
        original_price: 599,
        weight: '10 Cones',
        image_url: 'images/2.jpeg',
        category: 'cones',
        badge: 'Popular',
        rating: 4.9,
        review_count: 95,
        in_stock: true,
        featured: true
    },
    {
        id: '00000000-0000-4000-8000-000000000003',
        name: 'Bridal Special Henna Cones',
        description: 'Ultra-fine 0.38mm precision pin-tip cones formulated for intricate bridal details and dark mahogany stains.',
        price: 799,
        original_price: 999,
        weight: '5 Cones',
        image_url: 'images/3.jpeg',
        category: 'bridal',
        badge: 'Bridal Choice',
        rating: 5.0,
        review_count: 156,
        in_stock: true,
        featured: true
    },
    {
        id: '00000000-0000-4000-8000-000000000004',
        name: 'Henna After-Care Oil',
        description: 'Pure essential oil blend (clove, eucalyptus, argan) that locks in moisture and deepens stain color.',
        price: 199,
        original_price: 249,
        weight: '50ml',
        image_url: 'images/4.jpeg',
        category: 'care',
        badge: 'Essential',
        rating: 4.8,
        review_count: 67,
        in_stock: true,
        featured: false
    },
    {
        id: '00000000-0000-4000-8000-000000000005',
        name: 'Design Stencils Set',
        description: 'Reusable laser-cut skin-friendly adhesive stencils for perfect Arabic and mandala henna patterns.',
        price: 349,
        original_price: 449,
        weight: '20 Designs',
        image_url: 'images/5.jpeg',
        category: 'accessories',
        badge: 'Easy Apply',
        rating: 4.7,
        review_count: 43,
        in_stock: true,
        featured: false
    },
    {
        id: '00000000-0000-4000-8000-000000000006',
        name: 'Complete Artist Starter Kit',
        description: 'Everything you need: 4 fresh cones, 100g Sojat powder, after-care oil, stocking filter, and practice sheet.',
        price: 999,
        original_price: 1299,
        weight: 'Full Set',
        image_url: 'images/6.jpeg',
        category: 'kit',
        badge: 'Save 23%',
        rating: 5.0,
        review_count: 203,
        in_stock: true,
        featured: true
    }
];

// In-memory catalog cache
let currentProducts = [...DEFAULT_PRODUCTS];
let productsSubscription = null;

// Lookup helper for cart and modals
function getProductById(productId) {
    if (!productId) return null;
    return currentProducts.find(p => p.id === productId) || 
           DEFAULT_PRODUCTS.find(p => p.id === productId) || 
           null;
}
window.getProductById = getProductById;
window.DEFAULT_PRODUCTS = DEFAULT_PRODUCTS;

// Star rating generator (NO Math.random)
function renderRatingStars(rating = 5, reviewCount = 50) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star" aria-hidden="true"></i>';
    }
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt" aria-hidden="true"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star" aria-hidden="true"></i>';
    }
    
    html += ` <span class="rating-count">(${reviewCount})</span>`;
    return html;
}

// Render products into the container
function updateProductsUI(products) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;
    
    const items = (products && products.length > 0) ? products : DEFAULT_PRODUCTS;
    currentProducts = items;

    productsContainer.innerHTML = items.map(product => {
        const rating = product.rating || 4.9;
        const reviewCount = product.review_count || 85;
        const imageUrl = product.image_url || 'images/1.jpeg';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='images/1.jpeg'; this.onerror=null;">
                    ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                    <button class="btn-wishlist" onclick="addToWishlist('${product.id}')" aria-label="Add ${product.name} to wishlist">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-rating">
                        ${renderRatingStars(rating, reviewCount)}
                    </div>
                    <div class="product-meta">
                        <span class="product-price">₹${product.price}</span>
                        ${product.original_price ? `<span class="product-original-price">₹${product.original_price}</span>` : ''}
                        ${product.weight ? `<span class="product-weight">${product.weight}</span>` : ''}
                    </div>
                    <button class="btn btn-product btn-add-to-cart" onclick="addToCart('${product.id}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Load products from Supabase with fallback to DEFAULT_PRODUCTS
async function loadProductsFromDatabase() {
    if (!supabaseClient) {
        updateProductsUI(DEFAULT_PRODUCTS);
        return;
    }
    
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('featured', { ascending: false });
        
        if (error || !products || products.length === 0) {
            console.log('Using default product catalog (Supabase empty or unreachable)');
            updateProductsUI(DEFAULT_PRODUCTS);
            return;
        }
        
        console.log(`Loaded ${products.length} products from Supabase database`);
        updateProductsUI(products);
    } catch (err) {
        console.warn('Error fetching products from database, falling back to default catalog:', err);
        updateProductsUI(DEFAULT_PRODUCTS);
    }
}

// Real-time subscription to product updates
function subscribeToProducts() {
    if (!supabaseClient) return;
    
    if (productsSubscription) {
        productsSubscription.unsubscribe();
    }
    
    productsSubscription = supabaseClient
        .channel('products-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products' }, 
            (payload) => {
                let message = '';
                if (payload.eventType === 'INSERT') message = '🎉 New product added!';
                else if (payload.eventType === 'UPDATE') message = '✨ Products updated!';
                else if (payload.eventType === 'DELETE') message = 'Product removed';
                
                if (message && typeof showNotification === 'function') {
                    showNotification(message, 'info');
                }
                loadProductsFromDatabase();
            }
        )
        .subscribe();
}

// Seed default products to Supabase (utility for admin)
async function seedDefaultProducts() {
    if (!supabaseClient) {
        alert('Supabase client is not connected.');
        return false;
    }
    
    const { data: existing } = await supabaseClient.from('products').select('id');
    if (existing && existing.length > 0) {
        const proceed = confirm(`Database already has ${existing.length} products. Do you want to add the standard catalog products?`);
        if (!proceed) return false;
    }
    
    const records = DEFAULT_PRODUCTS.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        original_price: p.original_price,
        weight: p.weight,
        image_url: p.image_url,
        category: p.category,
        badge: p.badge,
        in_stock: p.in_stock,
        featured: p.featured
    }));
    
    const { error } = await supabaseClient.from('products').upsert(records);
    if (error) {
        alert('Error seeding products: ' + error.message);
        return false;
    }
    
    alert('✅ Standard catalog successfully synced to Supabase database!');
    loadProductsFromDatabase();
    return true;
}
window.seedDefaultProducts = seedDefaultProducts;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Render default products immediately for instant FCP (no empty flash)
    updateProductsUI(DEFAULT_PRODUCTS);
    
    let attempts = 0;
    const checkSupabase = setInterval(() => {
        attempts++;
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            clearInterval(checkSupabase);
            loadProductsFromDatabase();
            subscribeToProducts();
        } else if (attempts > 30) {
            clearInterval(checkSupabase);
        }
    }, 100);
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (productsSubscription) {
        productsSubscription.unsubscribe();
    }
});
