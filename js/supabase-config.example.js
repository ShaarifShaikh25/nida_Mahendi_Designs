// ===================================
// Supabase Configuration Template
// ===================================
// INSTRUCTIONS:
// 1. Copy this file and rename to: supabase-config.js
// 2. Get your credentials from: Supabase Dashboard → Settings → API
// 3. Replace the placeholder values below with your actual credentials
// 4. DO NOT commit supabase-config.js to GitHub!

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';  // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Your public anon key (starts with eyJ...)

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================================
// Authentication State Management
// ===================================
let currentUser = null;

// Check if user is logged in
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUIForLoggedInUser();
    } else {
        currentUser = null;
        updateUIForLoggedOutUser();
    }
    return currentUser;
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        updateUIForLoggedInUser();
    } else {
        currentUser = null;
        updateUIForLoggedOutUser();
    }
});

// Update UI based on auth state
function updateUIForLoggedInUser() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    
    // Update user email in menu
    const userEmail = document.querySelector('.user-email');
    if (userEmail && currentUser) {
        userEmail.textContent = currentUser.email;
    }
    
    // Load cart count
    loadCartCount();
}

function updateUIForLoggedOutUser() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    
    // Clear cart count
    updateCartCount(0);
}

// ===================================
// Cart Management
// ===================================
async function loadCartCount() {
    if (!currentUser) {
        // Load from localStorage for guests
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        updateCartCount(guestCart.length);
        return;
    }
    
    const { data, error } = await supabase
        .from('cart')
        .select('*')
        .eq('customer_id', currentUser.id);
    
    if (error) {
        console.error('Error loading cart:', error);
        return;
    }
    
    updateCartCount(data.length);
}

function updateCartCount(count) {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Add to cart
async function addToCart(productId, quantity = 1) {
    if (!currentUser) {
        // Guest cart in localStorage
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const existingItem = guestCart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            guestCart.push({ productId, quantity });
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        updateCartCount(guestCart.length);
        showNotification('Added to cart!', 'success');
        return;
    }
    
    // Logged-in user cart in database
    const { data: existingCart } = await supabase
        .from('cart')
        .select('*')
        .eq('customer_id', currentUser.id)
        .eq('product_id', productId)
        .single();
    
    if (existingCart) {
        // Update quantity
        const { error } = await supabase
            .from('cart')
            .update({ quantity: existingCart.quantity + quantity })
            .eq('id', existingCart.id);
        
        if (error) {
            showNotification('Error updating cart', 'error');
            return;
        }
    } else {
        // Insert new item
        const { error } = await supabase
            .from('cart')
            .insert([
                { customer_id: currentUser.id, product_id: productId, quantity }
            ]);
        
        if (error) {
            showNotification('Error adding to cart', 'error');
            return;
        }
    }
    
    loadCartCount();
    showNotification('Added to cart!', 'success');
}

// ===================================
// Products Management
// ===================================
async function loadProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading products:', error);
        return [];
    }
    
    return products;
}

// ===================================
// Utility Functions
// ===================================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
