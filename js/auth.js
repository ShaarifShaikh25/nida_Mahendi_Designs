// ===================================
// Authentication Functions
// ===================================

// Sign Up
async function signUp(email, password, fullName) {
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: fullName
            },
            emailRedirectTo: window.location.origin
        }
    });
    
    if (error) {
        showNotification(error.message, 'error');
        return null;
    }
    
    // Customer record is automatically created by database trigger
    // No need to manually insert into customers table
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
        showNotification('Sign up successful! Please check your email to verify your account before signing in.', 'success');
    } else {
        showNotification('Sign up successful! You can now sign in.', 'success');
    }
    
    return data;
}

// Sign In
async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        // Provide more helpful error messages
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            showNotification('Please verify your email first! Check your inbox for the confirmation link.', 'error');
        } else if (error.message.includes('Invalid login credentials')) {
            showNotification('Invalid email or password. Please try again.', 'error');
        } else {
            showNotification(error.message, 'error');
        }
        return null;
    }
    
    showNotification('Welcome back!', 'success');

    const { data: customer } = await supabaseClient
        .from('customers')
        .select('is_admin, full_name, email')
        .eq('id', data.user.id)
        .single();

    if (customer?.is_admin) {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'user-dashboard.html';
    }

    return data;
}

// Sign Out
async function signOut() {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
        showNotification(error.message, 'error');
        return;
    }
    
    showNotification('Signed out successfully', 'success');
    window.location.href = 'login.html?mode=signin';
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
            let product = null;
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                try {
                    const { data } = await supabaseClient
                        .from('products')
                        .select('*')
                        .eq('id', item.productId)
                        .single();
                    product = data;
                } catch (e) {}
            }
            
            // Fallback to local default catalog
            if (!product && typeof window.getProductById === 'function') {
                product = window.getProductById(item.productId);
            }
            
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
        const { data } = await supabaseClient
            .from('cart')
            .select(`
                *,
                product:products(*)
            `)
            .eq('customer_id', currentUser.id);
        
        if (data) {
            cartItems = data.map(item => {
                if (!item.product && typeof window.getProductById === 'function') {
                    item.product = window.getProductById(item.product_id);
                }
                return item;
            }).filter(item => item.product);
            total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
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
                <img src="${product.image_url || 'images/1.jpeg'}" alt="${product.name}" onerror="this.src='images/1.jpeg'; this.onerror=null;">
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
        const { error } = await supabaseClient
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
        const { error } = await supabaseClient
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
    
    const { data: existing } = await supabaseClient
        .from('wishlist')
        .select('*')
        .eq('customer_id', currentUser.id)
        .eq('product_id', productId)
        .single();
    
    if (existing) {
        // Remove from wishlist
        const { error } = await supabaseClient
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
        const { error } = await supabaseClient
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
// Checkout & Order Placement System
// ===================================

let activeCheckoutItems = [];
let activeCheckoutTotal = 0;

async function proceedToCheckout() {
    let cartItems = [];
    let total = 0;

    if (!currentUser) {
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length === 0) {
            showNotification('Your cart is empty! Please add some products.', 'info');
            return;
        }

        for (const item of guestCart) {
            let product = null;
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                try {
                    const { data } = await supabaseClient
                        .from('products')
                        .select('*')
                        .eq('id', item.productId)
                        .single();
                    product = data;
                } catch(e) {}
            }
            if (!product && typeof window.getProductById === 'function') {
                product = window.getProductById(item.productId);
            }
            if (product) {
                cartItems.push({
                    ...item,
                    product: product
                });
                total += product.price * item.quantity;
            }
        }
    } else {
        const { data } = await supabaseClient
            .from('cart')
            .select(`*, product:products(*)`)
            .eq('customer_id', currentUser.id);

        if (!data || data.length === 0) {
            showNotification('Your cart is empty! Please add some products.', 'info');
            return;
        }

        cartItems = data.map(item => {
            if (!item.product && typeof window.getProductById === 'function') {
                item.product = window.getProductById(item.product_id);
            }
            return item;
        }).filter(item => item.product);

        total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }

    if (cartItems.length === 0) {
        showNotification('Your cart is empty!', 'info');
        return;
    }

    activeCheckoutItems = cartItems;
    activeCheckoutTotal = total;

    closeCartModal();
    openCheckoutModal();
}
window.proceedToCheckout = proceedToCheckout;

function openCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;

    if (currentUser) {
        const emailInput = document.getElementById('checkout-email');
        const nameInput = document.getElementById('checkout-name');
        if (emailInput && currentUser.email) emailInput.value = currentUser.email;
        if (nameInput && currentUser.user_metadata?.full_name) {
            nameInput.value = currentUser.user_metadata.full_name;
        }
    }

    const previewContainer = document.getElementById('checkoutItemsPreview');
    if (previewContainer) {
        previewContainer.innerHTML = activeCheckoutItems.map(item => {
            const p = item.product;
            return `
                <div class="checkout-item-mini">
                    <img src="${p.image_url || 'images/1.jpeg'}" alt="${p.name}" onerror="this.src='images/1.jpeg'; this.onerror=null;">
                    <div class="checkout-item-mini-info">
                        <h4>${p.name}</h4>
                        <p>Qty: ${item.quantity} ${p.weight ? `• ${p.weight}` : ''}</p>
                    </div>
                    <div class="checkout-item-mini-price">
                        ₹${p.price * item.quantity}
                    </div>
                </div>
            `;
        }).join('');
    }

    const subtotalEl = document.getElementById('checkoutSubtotal');
    const totalEl = document.getElementById('checkoutTotal');
    const submitBtn = document.getElementById('submitOrderBtn');

    if (subtotalEl) subtotalEl.textContent = `₹${activeCheckoutTotal}`;
    if (totalEl) totalEl.textContent = `₹${activeCheckoutTotal}`;
    if (submitBtn) {
        submitBtn.innerHTML = `<i class="fas fa-lock"></i> Place Cash on Delivery Order (₹${activeCheckoutTotal})`;
    }

    modal.style.display = 'flex';
}
window.openCheckoutModal = openCheckoutModal;

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
}
window.closeCheckoutModal = closeCheckoutModal;

function updatePaymentSelection(radioInput) {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    if (radioInput && radioInput.closest('.payment-option')) {
        radioInput.closest('.payment-option').classList.add('selected');
    }

    const submitBtn = document.getElementById('submitOrderBtn');
    if (!submitBtn) return;

    if (radioInput.value === 'COD') {
        submitBtn.innerHTML = `<i class="fas fa-lock"></i> Place Cash on Delivery Order (₹${activeCheckoutTotal})`;
    } else if (radioInput.value === 'UPI') {
        submitBtn.innerHTML = `<i class="fas fa-qrcode"></i> Proceed to Pay via UPI (₹${activeCheckoutTotal})`;
    } else if (radioInput.value === 'WhatsApp') {
        submitBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Confirm & Place on WhatsApp (₹${activeCheckoutTotal})`;
    }
}
window.updatePaymentSelection = updatePaymentSelection;

async function handlePlaceOrder(e) {
    e.preventDefault();

    const form = document.getElementById('checkoutForm');
    const submitBtn = document.getElementById('submitOrderBtn');
    if (!form || !submitBtn) return;

    const formData = new FormData(form);
    const fullName = formData.get('full_name')?.trim();
    const phone = formData.get('phone')?.trim();
    const email = formData.get('email')?.trim();
    const address = formData.get('address')?.trim();
    const city = formData.get('city')?.trim();
    const state = formData.get('state')?.trim();
    const pincode = formData.get('pincode')?.trim();
    const paymentMethod = formData.get('payment_method') || 'COD';

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid 10-digit Indian phone number.', 'error');
        return;
    }

    const pinRegex = /^[1-9]\d{5}$/;
    if (!pinRegex.test(pincode)) {
        showNotification('Please enter a valid 6-digit PIN code.', 'error');
        return;
    }

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';

    const orderNumber = `NMD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    const shippingAddress = {
        full_name: fullName,
        phone: phone,
        email: email,
        address: address,
        city: city,
        state: state,
        pincode: pincode
    };

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const orderPayload = {
                order_number: orderNumber,
                total_amount: activeCheckoutTotal,
                status: 'pending',
                shipping_address: shippingAddress,
                payment_method: paymentMethod
            };

            if (currentUser && currentUser.id) {
                orderPayload.customer_id = currentUser.id;
            }

            const { data: orderData, error: orderError } = await supabaseClient
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();

            if (!orderError && orderData) {
                const orderItemsPayload = activeCheckoutItems.map(item => ({
                    order_id: orderData.id,
                    product_id: item.productId || item.product_id,
                    quantity: item.quantity,
                    price: item.product.price
                }));

                await supabaseClient.from('order_items').insert(orderItemsPayload);
            }
        } catch (dbErr) {
            console.warn('Database order logging note:', dbErr);
        }
    }

    const localOrders = JSON.parse(localStorage.getItem('user_orders') || '[]');
    localOrders.unshift({
        order_number: orderNumber,
        items: activeCheckoutItems.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price })),
        total: activeCheckoutTotal,
        payment_method: paymentMethod,
        shipping: shippingAddress,
        date: new Date().toISOString()
    });
    localStorage.setItem('user_orders', JSON.stringify(localOrders));

    localStorage.removeItem('guestCart');
    if (currentUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
        await supabaseClient.from('cart').delete().eq('customer_id', currentUser.id);
    }
    updateCartCount(0);

    const itemsSummaryText = activeCheckoutItems.map(i => `• ${i.product.name} (Qty: ${i.quantity}) - ₹${i.product.price * i.quantity}`).join('%0A');
    const waText = `🌿 *NEW ORDER - Nida Mahendi Designs*%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `📦 *Order ID:* ${orderNumber}%0A` +
        `👤 *Name:* ${encodeURIComponent(fullName)}%0A` +
        `📞 *Phone:* ${phone}%0A` +
        `📍 *Address:* ${encodeURIComponent(address + ', ' + city + ', ' + state + ' - ' + pincode)}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `🛍️ *Items Ordered:*%0A${itemsSummaryText}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `💰 *Total Amount:* ₹${activeCheckoutTotal} (FREE Pan-India Shipping)%0A` +
        `💳 *Payment Mode:* ${paymentMethod}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `Please confirm my order and share dispatch tracking. Thank you!`;

    const whatsappUrl = `https://wa.me/917057167751?text=${waText}`;

    document.getElementById('successOrderNumber').textContent = orderNumber;
    document.getElementById('successCustomerName').textContent = fullName;
    document.getElementById('successDeliveryAddress').textContent = `${address}, ${city}, ${state} - ${pincode}`;
    document.getElementById('successPaymentMethod').textContent = paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : (paymentMethod === 'UPI' ? 'UPI / Online Pay' : 'Direct WhatsApp Order');
    document.getElementById('successTotalAmount').textContent = `₹${activeCheckoutTotal}`;

    const successWhatsAppBtn = document.getElementById('successWhatsAppBtn');
    if (successWhatsAppBtn) {
        successWhatsAppBtn.href = whatsappUrl;
    }

    closeCheckoutModal();
    openOrderSuccessModal();

    if (paymentMethod === 'WhatsApp') {
        window.open(whatsappUrl, '_blank');
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    form.reset();
}
window.handlePlaceOrder = handlePlaceOrder;

function openOrderSuccessModal() {
    const modal = document.getElementById('orderSuccessModal');
    if (modal) modal.style.display = 'flex';
}
window.openOrderSuccessModal = openOrderSuccessModal;

function closeOrderSuccessModal() {
    const modal = document.getElementById('orderSuccessModal');
    if (modal) modal.style.display = 'none';
}
window.closeOrderSuccessModal = closeOrderSuccessModal;

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
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const authModal = document.getElementById('authModal');
        const cartModal = document.getElementById('cartModal');
        const checkoutModal = document.getElementById('checkoutModal');
        const orderSuccessModal = document.getElementById('orderSuccessModal');
        
        if (e.target === authModal) {
            closeAuthModal();
        }
        if (e.target === cartModal) {
            closeCartModal();
        }
        if (e.target === checkoutModal) {
            closeCheckoutModal();
        }
        if (e.target === orderSuccessModal) {
            closeOrderSuccessModal();
        }
    });

    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.querySelector('.user-dropdown');
        if (!userMenu || !dropdown) return;

        if (!userMenu.contains(e.target)) {
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
        }
    });
});
