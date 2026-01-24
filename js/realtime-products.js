// Real-time Products Updates
let productsSubscription = null;

// Load products from database
async function loadProductsFromDatabase() {
    if (!supabaseClient) return;
    
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .order('featured', { ascending: false });
    
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    
    updateProductsUI(products);
}

// Update products UI
function updateProductsUI(products) {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;
    
    if (!products || products.length === 0) {
        productsContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No products available</p>';
        return;
    }
    
    productsContainer.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <button class="btn-wishlist" onclick="addToWishlist('${product.id}')" aria-label="Add to wishlist">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-rating">
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star"></i>
                    <i class="fas fa-star-half-alt"></i>
                    <span class="rating-count">(${Math.floor(Math.random() * 200) + 50})</span>
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
    `).join('');
}

// Subscribe to real-time product changes
function subscribeToProducts() {
    if (!supabaseClient) {
        console.log('Supabase client not ready, retrying...');
        setTimeout(subscribeToProducts, 1000);
        return;
    }
    
    // Unsubscribe if already subscribed
    if (productsSubscription) {
        productsSubscription.unsubscribe();
    }
    
    // Subscribe to products table changes
    productsSubscription = supabaseClient
        .channel('products-changes')
        .on('postgres_changes', 
            { 
                event: '*', 
                schema: 'public', 
                table: 'products' 
            }, 
            (payload) => {
                console.log('Product change detected:', payload);
                
                // Show notification
                const eventType = payload.eventType;
                let message = '';
                
                if (eventType === 'INSERT') {
                    message = '🎉 New product added!';
                } else if (eventType === 'UPDATE') {
                    message = '✨ Products updated!';
                } else if (eventType === 'DELETE') {
                    message = 'Product removed';
                }
                
                if (message) {
                    showNotification(message, 'info');
                }
                
                // Reload products
                loadProductsFromDatabase();
            }
        )
        .subscribe((status) => {
            console.log('Subscription status:', status);
        });
}

// Initialize real-time updates when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Load products initially
    setTimeout(() => {
        loadProductsFromDatabase();
        subscribeToProducts();
    }, 1000);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (productsSubscription) {
        productsSubscription.unsubscribe();
    }
});
