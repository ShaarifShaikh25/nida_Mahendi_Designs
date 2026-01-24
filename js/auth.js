// ===================================
// Authentication Functions
// ===================================

// Sign Up
async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName
            }
        }
    });
    
    if (error) {
        showNotification(error.message, 'error');
        return null;
    }
    
    // Create customer record
    if (data.user) {
        const { error: customerError } = await supabase
            .from('customers')
            .insert([
                {
                    id: data.user.id,
                    email: email,
                    full_name: fullName
                }
            ]);
        
        if (customerError) {
            console.error('Error creating customer:', customerError);
        }
    }
    
    showNotification('Sign up successful! Please check your email to verify.', 'success');
    return data;
}

// Sign In
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        showNotification(error.message, 'error');
        return null;
    }
    
    showNotification('Welcome back!', 'success');
    return data;
}

// Sign Out
async function signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        showNotification(error.message, 'error');
        return;
    }
    
    showNotification('Signed out successfully', 'success');
    window.location.reload();
}

// ===================================
// Modal Functions
// ===================================

function openAuthModal(mode = 'signin') {
    const modal = document.getElementById('authModal');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    
    if (mode === 'signin') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
    
    modal.style.display = 'flex';
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
}

function switchAuthMode(mode) {
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    
    if (mode === 'signin') {
        signinForm.style.display = 'block';
        signupForm.style.display = 'none';
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
    }
}

// ===================================
// Cart Modal Functions
// ===================================

async function openCartModal() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'flex';
    await loadCartItems();
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    modal.style.display = 'none';
}

async function loadCartItems() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total-amount');
    
    if (!cartItemsContainer) return;
    
    let cartItems = [];
    let total = 0;
    
    if (!currentUser) {
        // Load guest cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        
        // Get product details for each cart item
        for (const item of guestCart) {
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', item.productId)
                .single();
            
            if (product) {
                cartItems.push({
                    ...item,
                    product: product
                });
                total += product.price * item.quantity;
            }
        }
    } else {
        // Load user cart from database
        const { data } = await supabase
            .from('cart')
            .select(`
                *,
                product:products(*)
            `)
            .eq('customer_id', currentUser.id);
        
        if (data) {
            cartItems = data;
            total = data.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        }
    }
    
    // Render cart items
    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        if (cartTotal) cartTotal.textContent = '₹0';
        return;
    }
    
    cartItemsContainer.innerHTML = cartItems.map(item => {
        const product = item.product;
        return `
            <div class="cart-item" data-item-id="${item.productId || item.product_id}">
                <img src="${product.image_url}" alt="${product.name}">
                <div class="cart-item-details">
                    <h4>${product.name}</h4>
                    <p class="cart-item-price">₹${product.price}</p>
                </div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartQuantity('${item.productId || item.product_id}', ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.productId || item.product_id}', ${item.quantity + 1})">+</button>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.productId || item.product_id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    if (cartTotal) {
        cartTotal.textContent = `₹${total.toFixed(2)}`;
    }
}

async function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        await removeFromCart(productId);
        return;
    }
    
    if (!currentUser) {
        // Update guest cart
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        const item = guestCart.find(i => i.productId === productId);
        if (item) {
            item.quantity = newQuantity;
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
        }
    } else {
        // Update database cart
        const { error } = await supabase
            .from('cart')
            .update({ quantity: newQuantity })
            .eq('customer_id', currentUser.id)
            .eq('product_id', productId);
        
        if (error) {
            showNotification('Error updating cart', 'error');
            return;
        }
    }
    
    await loadCartItems();
    await loadCartCount();
}

async function removeFromCart(productId) {
    if (!currentUser) {
        // Remove from guest cart
        let guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        guestCart = guestCart.filter(item => item.productId !== productId);
        localStorage.setItem('guestCart', JSON.stringify(guestCart));
        updateCartCount(guestCart.length);
    } else {
        // Remove from database cart
        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('customer_id', currentUser.id)
            .eq('product_id', productId);
        
        if (error) {
            showNotification('Error removing from cart', 'error');
            return;
        }
        
        await loadCartCount();
    }
    
    await loadCartItems();
    showNotification('Item removed from cart', 'success');
}

// ===================================
// Wishlist Functions
// ===================================

async function addToWishlist(productId) {
    if (!currentUser) {
        showNotification('Please sign in to add to wishlist', 'info');
        openAuthModal('signin');
        return;
    }
    
    const { data: existing } = await supabase
        .from('wishlist')
        .select('*')
        .eq('customer_id', currentUser.id)
        .eq('product_id', productId)
        .single();
    
    if (existing) {
        // Remove from wishlist
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('id', existing.id);
        
        if (error) {
            showNotification('Error removing from wishlist', 'error');
            return;
        }
        
        showNotification('Removed from wishlist', 'success');
        updateWishlistButton(productId, false);
    } else {
        // Add to wishlist
        const { error } = await supabase
            .from('wishlist')
            .insert([
                { customer_id: currentUser.id, product_id: productId }
            ]);
        
        if (error) {
            showNotification('Error adding to wishlist', 'error');
            return;
        }
        
        showNotification('Added to wishlist!', 'success');
        updateWishlistButton(productId, true);
    }
}

function updateWishlistButton(productId, isInWishlist) {
    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
        const wishlistBtn = productCard.querySelector('.btn-wishlist');
        if (wishlistBtn) {
            if (isInWishlist) {
                wishlistBtn.classList.add('active');
                wishlistBtn.querySelector('i').classList.remove('far');
                wishlistBtn.querySelector('i').classList.add('fas');
            } else {
                wishlistBtn.classList.remove('active');
                wishlistBtn.querySelector('i').classList.remove('fas');
                wishlistBtn.querySelector('i').classList.add('far');
            }
        }
    }
}

// ===================================
// Checkout Function
// ===================================

function proceedToCheckout() {
    if (!currentUser) {
        closeCartModal();
        showNotification('Please sign in to checkout', 'info');
        openAuthModal('signin');
        return;
    }
    
    // Here you would typically redirect to a checkout page
    // For now, we'll show a message
    showNotification('Checkout functionality coming soon! Please contact us to complete your order.', 'info');
}

// Toggle user dropdown
function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.opacity = dropdown.style.opacity === '1' ? '0' : '1';
        dropdown.style.visibility = dropdown.style.visibility === 'visible' ? 'hidden' : 'visible';
    }
}

// ===================================
// Event Listeners
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Sign In Form
    const signinFormEl = document.querySelector('#signinForm form');
    if (signinFormEl) {
        signinFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.querySelector('[name="email"]').value;
            const password = e.target.querySelector('[name="password"]').value;
            
            const result = await signIn(email, password);
            if (result) {
                closeAuthModal();
            }
        });
    }
    
    // Sign Up Form
    const signupFormEl = document.querySelector('#signupForm form');
    if (signupFormEl) {
        signupFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = e.target.querySelector('[name="fullname"]').value;
            const email = e.target.querySelector('[name="email"]').value;
            const password = e.target.querySelector('[name="password"]').value;
            
            const result = await signUp(email, password, fullName);
            if (result) {
                closeAuthModal();
            }
        });
    }
    
    // Add to cart buttons
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.closest('[data-product-id]').dataset.productId;
            addToCart(productId);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const authModal = document.getElementById('authModal');
        const cartModal = document.getElementById('cartModal');
        
        if (e.target === authModal) {
            closeAuthModal();
        }
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
});
