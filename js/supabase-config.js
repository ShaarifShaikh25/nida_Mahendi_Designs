// ===================================
// Supabase Configuration
// ===================================
// Replace these with your actual Supabase project credentials
// Get these from: Supabase Dashboard → Settings → API

const SUPABASE_URL = 'https://yogdqupxswhqikmcdlhq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_urArMM0zp7aoOHBnKpc7fg_Mv49X8gp';

// ===================================
// Payment Gateway & UPI Configuration
// ===================================
// If you have a Razorpay Key (e.g. 'rzp_test_...' or 'rzp_live_...'), set it here.
// When empty (''), checkout seamlessly uses Direct UPI QR & UTR verification!
window.RAZORPAY_KEY_ID = '';
window.MERCHANT_UPI_ID = 'shaarif.s@ybl'; // Official UPI ID
window.MERCHANT_NAME = 'Nida Mahendi Designs';

// Initialize Supabase client
let supabaseClient;

// Wait for Supabase library to load
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseClient = supabaseClient;
        return true;
    }
    return false;
}

// Try to initialize immediately
if (!initSupabase()) {
    // If not loaded, wait for window load
    window.addEventListener('load', initSupabase);
}

// ===================================
// Authentication State Management
// ===================================
let currentUser = null;

// Check if user is logged in
async function checkAuth() {
    if (!supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
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
if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            currentUser = session.user;
            updateUIForLoggedInUser();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });
}

// Update UI based on auth state
async function updateUIForLoggedInUser() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    
    // Update user email in menu
    const userEmail = document.querySelector('.user-email');
    if (userEmail && currentUser) {
        userEmail.textContent = currentUser.email;
    }

    // Check if user is admin
    const adminLink = document.getElementById('headerAdminLink');
    const roleBadge = document.getElementById('userRoleBadge');
    if (currentUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: customer } = await supabaseClient
                .from('customers')
                .select('is_admin, full_name')
                .eq('id', currentUser.id)
                .single();

            if (customer?.is_admin) {
                if (adminLink) adminLink.style.display = 'flex';
                if (roleBadge) {
                    roleBadge.style.display = 'inline-block';
                    roleBadge.textContent = 'Admin';
                    roleBadge.className = 'user-role-badge badge-admin';
                }
            } else {
                if (adminLink) adminLink.style.display = 'none';
                if (roleBadge) {
                    roleBadge.style.display = 'inline-block';
                    roleBadge.textContent = 'Customer';
                    roleBadge.className = 'user-role-badge badge-customer';
                }
            }
        } catch (e) {
            console.error('Error checking admin status:', e);
        }
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
    
    const { data, error } = await supabaseClient
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
    const { data: existingCart } = await supabaseClient
        .from('cart')
        .select('*')
        .eq('customer_id', currentUser.id)
        .eq('product_id', productId)
        .single();
    
    if (existingCart) {
        // Update quantity
        const { error } = await supabaseClient
            .from('cart')
            .update({ quantity: existingCart.quantity + quantity })
            .eq('id', existingCart.id);
        
        if (error) {
            showNotification('Error updating cart', 'error');
            return;
        }
    } else {
        // Insert new item
        const { error } = await supabaseClient
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
    const { data: products, error } = await supabaseClient
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
