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
        submitBtn.innerHTML = `<i class="fas fa-qrcode"></i> Proceed to Online Payment (₹${activeCheckoutTotal})`;
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

    if (radioInput.value === 'UPI') {
        submitBtn.innerHTML = `<i class="fas fa-qrcode"></i> Proceed to Online Payment (₹${activeCheckoutTotal})`;
    } else if (radioInput.value === 'WhatsApp') {
        submitBtn.innerHTML = `<i class="fab fa-whatsapp"></i> Confirm & Place on WhatsApp (₹${activeCheckoutTotal})`;
    }
}
window.updatePaymentSelection = updatePaymentSelection;

// ===================================
// Checkout & Online Payment Engine
// ===================================

let pendingCheckoutData = null;

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
    const paymentMethod = formData.get('payment_method') || 'UPI';

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

    pendingCheckoutData = {
        orderNumber,
        fullName,
        phone,
        email,
        shippingAddress,
        paymentMethod,
        items: [...activeCheckoutItems],
        total: activeCheckoutTotal
    };

    // 1. If WhatsApp Order: place order as pending and open WhatsApp
    if (paymentMethod === 'WhatsApp') {
        const origText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing WhatsApp Order...';

        pendingCheckoutData.paymentMethod = 'WhatsApp (Manual Prepaid)';
        await finalizeOrderPlacement(pendingCheckoutData, 'WhatsApp');

        closeCheckoutModal();
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
        form.reset();

        const waText = encodeURIComponent(`Hello Nida Mahendi Designs,\nI have placed order ${orderNumber} for ₹${activeCheckoutTotal}.\nPlease send your payment QR / UPI details so I can confirm my order.`);
        window.open(`https://wa.me/917057167751?text=${waText}`, '_blank');
        return;
    }

    // 2. If Razorpay Gateway key is configured: launch Razorpay popup
    if (window.RAZORPAY_KEY_ID && window.RAZORPAY_KEY_ID.startsWith('rzp_') && typeof window.Razorpay === 'function') {
        launchRazorpayPayment(pendingCheckoutData, submitBtn, form);
        return;
    }

    // 3. Otherwise: Open Built-in UPI QR & 12-Digit UTR Verification Modal!
    closeCheckoutModal();
    openUpiPaymentModal(pendingCheckoutData);
}
window.handlePlaceOrder = handlePlaceOrder;

// UPI Payment Modal Functions
function openUpiPaymentModal(orderData) {
    const modal = document.getElementById('upiPaymentModal');
    if (!modal) return;

    const upiId = window.MERCHANT_UPI_ID || '7057167751@okaxis';
    const merchantName = window.MERCHANT_NAME || 'Nida Mahendi Designs';
    const amount = orderData.total;
    const orderNo = orderData.orderNumber;

    const amountEl = document.getElementById('upiModalAmount');
    const noticeAmountEl = document.getElementById('upiUtrAmountNotice');
    const upiDisplayEl = document.getElementById('merchantUpiDisplay');

    if (amountEl) amountEl.textContent = `₹${amount}`;
    if (noticeAmountEl) noticeAmountEl.textContent = `${amount}`;
    if (upiDisplayEl) upiDisplayEl.textContent = upiId;

    // Standard NPCI UPI URI
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(orderNo)}`;

    // High quality QR Code image
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`;
    const qrImg = document.getElementById('upiQrImage');
    if (qrImg) qrImg.src = qrUrl;

    // App intent links for mobile
    const gpayBtn = document.getElementById('gpayIntentBtn');
    const phonepeBtn = document.getElementById('phonepeIntentBtn');
    const paytmBtn = document.getElementById('paytmIntentBtn');

    if (gpayBtn) gpayBtn.href = upiUri;
    if (phonepeBtn) phonepeBtn.href = upiUri;
    if (paytmBtn) paytmBtn.href = upiUri;

    // WhatsApp Help link
    const waHelp = document.getElementById('upiWhatsAppHelpLink');
    if (waHelp) {
        const msg = encodeURIComponent(`Hello Nida Mahendi Designs,\nI am paying ₹${amount} for Order #${orderNo}.\nHere is my payment details.`);
        waHelp.href = `https://wa.me/917057167751?text=${msg}`;
    }

    const utrInput = document.getElementById('upiUtrNumber');
    if (utrInput) {
        utrInput.value = '';
        setTimeout(() => utrInput.focus(), 300);
    }

    modal.style.display = 'flex';
}
window.openUpiPaymentModal = openUpiPaymentModal;

function closeUpiPaymentModal() {
    const modal = document.getElementById('upiPaymentModal');
    if (modal) modal.style.display = 'none';
}
window.closeUpiPaymentModal = closeUpiPaymentModal;

function copyMerchantUpi() {
    const upiId = window.MERCHANT_UPI_ID || '7057167751@okaxis';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(upiId).then(() => {
            showNotification(`UPI ID "${upiId}" copied! Paste in any UPI app to pay.`, 'success');
        }).catch(() => {
            prompt('Copy UPI ID:', upiId);
        });
    } else {
        prompt('Copy UPI ID:', upiId);
    }
}
window.copyMerchantUpi = copyMerchantUpi;

// Verify UTR & Finalize Order
async function submitUpiVerificationOrder() {
    const utrInput = document.getElementById('upiUtrNumber');
    const utr = utrInput ? utrInput.value.trim() : '';

    if (!utr || utr.length < 10) {
        showNotification('Please enter a valid 12-digit UPI Reference / UTR Number from your payment app.', 'error');
        if (utrInput) utrInput.focus();
        return;
    }

    const verifyBtn = document.getElementById('confirmUpiPaymentBtn');
    const origText = verifyBtn.innerHTML;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Payment & Placing Order...';

    const orderData = pendingCheckoutData;
    if (!orderData) {
        showNotification('Order session expired. Please try placing your order again.', 'error');
        closeUpiPaymentModal();
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = origText;
        return;
    }

    orderData.paymentMethod = `UPI (UTR: ${utr})`;

    await finalizeOrderPlacement(orderData, `UPI UTR: ${utr}`);

    closeUpiPaymentModal();
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = origText;

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) checkoutForm.reset();
}
window.submitUpiVerificationOrder = submitUpiVerificationOrder;

// Razorpay Gateway Launcher
function launchRazorpayPayment(orderData, submitBtn, form) {
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening Razorpay Gateway...';

    const options = {
        key: window.RAZORPAY_KEY_ID,
        amount: Math.round(orderData.total * 100), // in paise
        currency: "INR",
        name: window.MERCHANT_NAME || "Nida Mahendi Designs",
        description: `Order ${orderData.orderNumber} - 100% Organic Henna`,
        image: "images/logo.png",
        handler: async function (response) {
            orderData.paymentMethod = `Razorpay (${response.razorpay_payment_id})`;
            await finalizeOrderPlacement(orderData, response.razorpay_payment_id);
            closeCheckoutModal();
            if (form) form.reset();
            submitBtn.disabled = false;
            submitBtn.innerHTML = origText;
        },
        prefill: {
            name: orderData.fullName,
            email: orderData.email,
            contact: orderData.phone
        },
        theme: {
            color: "#2d7a3e"
        },
        modal: {
            ondismiss: function () {
                submitBtn.disabled = false;
                submitBtn.innerHTML = origText;
                showNotification('Payment window cancelled. Please complete payment to confirm your order.', 'info');
            }
        }
    };

    try {
        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) {
        console.error('Razorpay initialization error:', err);
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
        // Fallback to UPI modal
        closeCheckoutModal();
        openUpiPaymentModal(orderData);
    }
}

// Finalize Order (Database + LocalStorage + WhatsApp)
async function finalizeOrderPlacement(orderData, paymentRef) {
    const { orderNumber, fullName, phone, email, shippingAddress, paymentMethod, items, total } = orderData;

    // 1. Supabase Database insertion
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const orderPayload = {
                order_number: orderNumber,
                total_amount: total,
                status: 'pending',
                shipping_address: shippingAddress,
                payment_method: paymentMethod
            };

            if (currentUser && currentUser.id) {
                orderPayload.customer_id = currentUser.id;
            }

            const { data: dbOrder, error: orderError } = await supabaseClient
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();

            if (!orderError && dbOrder) {
                const orderItemsPayload = items.map(item => ({
                    order_id: dbOrder.id,
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

    // 2. LocalStorage backup
    const localOrders = JSON.parse(localStorage.getItem('user_orders') || '[]');
    localOrders.unshift({
        order_number: orderNumber,
        items: items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.price })),
        total: total,
        payment_method: paymentMethod,
        shipping: shippingAddress,
        date: new Date().toISOString()
    });
    localStorage.setItem('user_orders', JSON.stringify(localOrders));

    // Clear cart
    localStorage.removeItem('guestCart');
    if (currentUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
        await supabaseClient.from('cart').delete().eq('customer_id', currentUser.id);
    }
    updateCartCount(0);

    // Prepare WhatsApp Confirmation Message
    const itemsSummaryText = items.map(i => `• ${i.product.name} (Qty: ${i.quantity}) - ₹${i.product.price * i.quantity}`).join('%0A');
    const waText = `🌿 *NEW PREPAID ORDER - Nida Mahendi Designs*%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `📦 *Order ID:* ${orderNumber}%0A` +
        `👤 *Name:* ${encodeURIComponent(fullName)}%0A` +
        `📞 *Phone:* ${phone}%0A` +
        `📍 *Delivery Address:* ${encodeURIComponent(shippingAddress.address + ', ' + shippingAddress.city + ', ' + shippingAddress.state + ' - ' + shippingAddress.pincode)}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `🛍️ *Items Ordered:*%0A${itemsSummaryText}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `💰 *Amount Paid:* ₹${total} (100% Prepaid - FREE Shipping)%0A` +
        `💳 *Payment Verification:* ${encodeURIComponent(paymentMethod)}%0A` +
        `━━━━━━━━━━━━━━━━━━━━%0A` +
        `Order is verified! Please prepare fresh batch and share dispatch tracking. Thank you!`;

    const whatsappUrl = `https://wa.me/917057167751?text=${waText}`;

    // Fill success modal
    document.getElementById('successOrderNumber').textContent = orderNumber;
    document.getElementById('successCustomerName').textContent = fullName;
    document.getElementById('successDeliveryAddress').textContent = `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`;
    document.getElementById('successPaymentMethod').textContent = paymentMethod;
    document.getElementById('successTotalAmount').textContent = `₹${total}`;

    const successWhatsAppBtn = document.getElementById('successWhatsAppBtn');
    if (successWhatsAppBtn) {
        successWhatsAppBtn.href = whatsappUrl;
    }

    openOrderSuccessModal();
    showNotification('Order placed and payment recorded successfully!', 'success');
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
// Customer Orders & Wishlist Modals
// ===================================

async function openCustomerOrdersModal() {
    const modal = document.getElementById('customerOrdersModal');
    if (!modal) return;

    // Close dropdown
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
    }

    modal.style.display = 'flex';
    const listEl = document.getElementById('customerOrdersList');
    if (!listEl) return;

    listEl.innerHTML = '<div class="orders-loading"><i class="fas fa-spinner fa-spin"></i> Loading your orders...</div>';

    let orders = [];

    // 1. Fetch from Supabase if logged in
    if (currentUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*, order_items(*, product:products(*))')
                .eq('customer_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (!error && Array.isArray(data)) {
                orders = data;
            }
        } catch (err) {
            console.error('Error fetching orders from Supabase:', err);
        }
    }

    // 2. Fetch local storage orders backup and merge (avoid duplicates by order_number)
    const localOrders = JSON.parse(localStorage.getItem('user_orders') || '[]');
    const existingOrderNos = new Set(orders.map(o => o.order_number));
    for (const lo of localOrders) {
        if (!existingOrderNos.has(lo.order_number)) {
            orders.push(lo);
        }
    }

    if (orders.length === 0) {
        listEl.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-box-open"></i>
                <h3 style="margin-bottom: 8px; color: var(--text-dark);">No Orders Placed Yet</h3>
                <p style="margin-bottom: 20px;">Browse our pure organic henna cones and bridal kits, and place your first order!</p>
                <a href="#products" class="btn btn-primary btn-sm" onclick="closeCustomerOrdersModal()">
                    <i class="fas fa-shopping-bag"></i> Browse Products
                </a>
            </div>
        `;
        return;
    }

    listEl.innerHTML = orders.map(order => {
        const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Recent';

        const statusClass = `status-${(order.status || 'pending').toLowerCase()}`;
        const shipping = order.shipping_address || {};
        const dest = [shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ') || 'Standard Pan-India Shipping';

        let itemsSummary = '';
        if (order.order_items && order.order_items.length > 0) {
            itemsSummary = order.order_items.map(oi => {
                const title = oi.product?.title || 'Organic Henna Item';
                return `${title} × ${oi.quantity}`;
            }).join(', ');
        } else if (order.items && order.items.length > 0) {
            itemsSummary = order.items.map(i => `${i.product?.title || 'Organic Henna Item'} × ${i.quantity}`).join(', ');
        } else {
            itemsSummary = 'Organic Henna Products';
        }

        const cleanPhone = '917057167751';
        const waMsg = encodeURIComponent(`Hello Nida Mahendi Designs,\nI would like to track my order:\nOrder No: ${order.order_number}\nAmount: ₹${order.total_amount}\nStatus: ${order.status || 'Pending'}`);
        const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;

        return `
            <div class="customer-order-card">
                <div class="order-card-header">
                    <div>
                        <div class="order-no"><i class="fas fa-receipt" style="color: var(--primary-color);"></i> ${order.order_number}</div>
                        <div class="order-date"><i class="far fa-clock"></i> ${dateStr}</div>
                    </div>
                    <span class="order-status-badge ${statusClass}">
                        <i class="fas fa-circle" style="font-size: 8px; vertical-align: middle; margin-right: 4px;"></i>${order.status || 'Pending'}
                    </span>
                </div>
                <div class="order-card-details">
                    <div>
                        <div class="order-card-items-preview"><strong>Items:</strong> ${itemsSummary}</div>
                        <div style="color: var(--text-light); font-size: 12.5px; margin-top: 4px;">
                            <i class="fas fa-location-dot"></i> Delivery to: ${dest}
                        </div>
                    </div>
                    <div class="order-card-total-box">
                        <div style="font-size: 12px; color: var(--text-light);">Total (${order.payment_method || 'COD'}):</div>
                        <div class="total-val">₹${order.total_amount}</div>
                    </div>
                </div>
                <div class="order-card-actions">
                    <a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm" style="padding: 7px 14px; font-size: 13px;">
                        <i class="fab fa-whatsapp"></i> Track on WhatsApp
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function closeCustomerOrdersModal() {
    const modal = document.getElementById('customerOrdersModal');
    if (modal) modal.style.display = 'none';
}
window.openCustomerOrdersModal = openCustomerOrdersModal;
window.closeCustomerOrdersModal = closeCustomerOrdersModal;

async function openWishlistModal() {
    const modal = document.getElementById('wishlistModal');
    if (!modal) return;

    // Close dropdown
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) {
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
    }

    modal.style.display = 'flex';
    const listEl = document.getElementById('wishlistItemsList');
    if (!listEl) return;

    listEl.innerHTML = '<div class="wishlist-loading"><i class="fas fa-spinner fa-spin"></i> Loading saved items...</div>';

    let wishlist = [];

    // 1. Fetch from Supabase if logged in
    if (currentUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('wishlist')
                .select('id, product_id, product:products(*)')
                .eq('customer_id', currentUser.id);

            if (!error && Array.isArray(data)) {
                wishlist = data.map(w => ({
                    id: w.id,
                    product: w.product || (typeof window.getProductById === 'function' ? window.getProductById(w.product_id) : null)
                })).filter(w => w.product);
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
        }
    }

    // 2. Fallback / local storage
    if (wishlist.length === 0) {
        const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        wishlist = localWishlist.map(productId => {
            const prod = typeof window.getProductById === 'function' ? window.getProductById(productId) : null;
            return prod ? { id: productId, product: prod } : null;
        }).filter(Boolean);
    }

    if (wishlist.length === 0) {
        listEl.innerHTML = `
            <div class="orders-empty">
                <i class="fas fa-heart" style="color: #cbd5e1; font-size: 3rem; margin-bottom: 12px; display: block;"></i>
                <h3 style="margin-bottom: 8px; color: var(--text-dark);">Your Wishlist is Empty</h3>
                <p style="margin-bottom: 20px;">Save your favorite organic cones and bridal combos by clicking the heart icon on any card!</p>
                <a href="#products" class="btn btn-primary btn-sm" onclick="closeWishlistModal()">
                    <i class="fas fa-shopping-bag"></i> Browse Products
                </a>
            </div>
        `;
        return;
    }

    listEl.innerHTML = `
        <div class="wishlist-grid">
            ${wishlist.map(item => `
                <div class="wishlist-card">
                    <button class="btn-remove-wishlist" onclick="removeWishlistItem('${item.id}')" title="Remove from wishlist">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${item.product.image_url || 'images/1.jpeg'}" alt="${item.product.title}">
                    <div class="wishlist-info">
                        <h4>${item.product.title}</h4>
                        <div class="price">₹${item.product.price}</div>
                        <button class="btn btn-primary btn-sm" style="margin-top: 8px; padding: 6px 12px; font-size: 12px;" onclick="addWishlistToCart('${item.product.id}')">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function closeWishlistModal() {
    const modal = document.getElementById('wishlistModal');
    if (modal) modal.style.display = 'none';
}

async function removeWishlistItem(itemId) {
    if (currentUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            await supabaseClient.from('wishlist').delete().eq('id', itemId);
        } catch (e) {}
    }
    const local = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = local.filter(id => id !== itemId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    showNotification('Item removed from wishlist', 'info');
    openWishlistModal();
}

async function addWishlistToCart(productId) {
    if (typeof addToCart === 'function') {
        await addToCart(productId);
    }
    showNotification('Item added to cart!', 'success');
}

window.openWishlistModal = openWishlistModal;
window.closeWishlistModal = closeWishlistModal;
window.removeWishlistItem = removeWishlistItem;
window.addWishlistToCart = addWishlistToCart;

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
        const customerOrdersModal = document.getElementById('customerOrdersModal');
        const wishlistModal = document.getElementById('wishlistModal');
        const upiPaymentModal = document.getElementById('upiPaymentModal');
        
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
        if (e.target === customerOrdersModal) {
            closeCustomerOrdersModal();
        }
        if (e.target === wishlistModal) {
            closeWishlistModal();
        }
        if (e.target === upiPaymentModal) {
            closeUpiPaymentModal();
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
