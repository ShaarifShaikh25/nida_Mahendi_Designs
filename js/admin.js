// Admin Authentication and Management

let adminUser = null;

// Upload Product Image to Supabase Storage
async function uploadProductImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
        .from('product-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });
    
    if (error) {
        return { error: error.message };
    }
    
    // Get public URL
    const { data: urlData } = supabaseClient.storage
        .from('product-images')
        .getPublicUrl(filePath);
    
    return { url: urlData.publicUrl };
}

// Preview image when selected
document.getElementById('productImage')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `
                <div style="margin-top: 10px;">
                    <img src="${e.target.result}" style="max-width: 200px; border-radius: 8px; box-shadow: var(--shadow-md);" alt="Preview">
                    <p style="margin-top: 5px; color: var(--text-light); font-size: 14px;">Image ready to upload</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
});

// Check if user is admin
async function checkAdminAuth() {
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        return false;
    }
    
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html?mode=signin';
        return false;
    }
    
    // Check if user has admin role
    const { data: customer, error } = await supabaseClient
        .from('customers')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    if (error || !customer || !customer.is_admin) {
        window.location.href = 'user-dashboard.html';
        return false;
    }
    
    adminUser = session.user;
    showDashboard();
    loadDashboardData();
    return true;
}

// Admin Login
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        alert('Login failed: ' + error.message);
        return;
    }
    
    // Check admin status
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        alert('You do not have admin access.');
    }
});

// Admin Logout
async function adminLogout() {
    await supabaseClient.auth.signOut();
    adminUser = null;
    window.location.href = 'login.html?mode=signin';
}

// Show/Hide Sections
function showLoginSection() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
}

// Load Dashboard Data
async function loadDashboardData() {
    // Load statistics
    const { data: products } = await supabaseClient.from('products').select('*');
    const { data: orders } = await supabaseClient.from('orders').select('*');
    const { data: customers } = await supabaseClient.from('customers').select('*');
    
    document.getElementById('totalProducts').textContent = products?.length || 0;
    document.getElementById('activeProducts').textContent = products?.filter(p => p.in_stock).length || 0;
    document.getElementById('totalOrders').textContent = orders?.length || 0;
    document.getElementById('totalCustomers').textContent = customers?.length || 0;
    
    // Load products table
    loadProducts();
    loadOrders();
}

// Active cached orders
let cachedOrders = [];

// Load Orders
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    let ordersList = [];

    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                ordersList = data;
            }
        } catch (e) {
            console.warn('Error fetching orders from Supabase:', e);
        }
    }

    // Fallback to local storage recent orders if database is empty/fresh
    if (ordersList.length === 0) {
        const local = JSON.parse(localStorage.getItem('user_orders') || '[]');
        ordersList = local.map(o => ({
            id: o.order_number,
            order_number: o.order_number,
            shipping_address: o.shipping,
            total_amount: o.total,
            payment_method: o.payment_method,
            status: o.status || 'pending',
            created_at: o.date,
            items: o.items || []
        }));
    }

    cachedOrders = ordersList;

    if (ordersList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-light);">No customer orders yet. When customers place orders on your website, they will appear here live!</td></tr>';
        return;
    }

    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) totalOrdersEl.textContent = ordersList.length;

    tbody.innerHTML = ordersList.map(order => {
        const addr = order.shipping_address || {};
        const customerName = addr.full_name || 'Guest Customer';
        const phone = addr.phone || 'N/A';
        const fullAddress = `${addr.address || ''}, ${addr.city || ''} ${addr.pincode ? `(${addr.pincode})` : ''}`;
        const payment = order.payment_method || 'Online Prepaid';
        const status = order.status || 'pending';
        const orderKey = order.id || order.order_number;

        return `
            <tr>
                <td><strong>${order.order_number || 'N/A'}</strong></td>
                <td>${customerName}</td>
                <td>
                    ${phone !== 'N/A' ? `
                        <a href="tel:${phone}" style="color: var(--primary-color); font-weight: 600;"><i class="fas fa-phone"></i> ${phone}</a>
                        <br>
                        <a href="https://wa.me/91${phone.replace(/\D/g,'')}" target="_blank" style="color: #25D366; font-size: 12px;"><i class="fab fa-whatsapp"></i> Chat</a>
                    ` : 'N/A'}
                </td>
                <td style="max-width: 220px; font-size: 13px;">${fullAddress}</td>
                <td><strong>₹${order.total_amount}</strong></td>
                <td><span class="badge" style="background: #e8f5e9; color: #1b5e20;">${payment}</span></td>
                <td>
                    <select onchange="updateOrderStatus('${orderKey}', this.value)" style="padding: 4px 8px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 12px; font-weight: 600;">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                        <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>✅ Confirmed</option>
                        <option value="shipped" ${status === 'shipped' ? 'selected' : ''}>🚚 Shipped</option>
                        <option value="delivered" ${status === 'delivered' ? 'selected' : ''}>🎉 Delivered</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                    </select>
                </td>
                <td>
                    <button class="btn-edit" style="padding: 6px 12px; font-size: 12px;" onclick="viewOrderDetails('${order.order_number}')">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
window.loadOrders = loadOrders;

// Update Order Status
async function updateOrderStatus(orderKey, newStatus) {
    if (supabaseClient) {
        try {
            // Try updating by id or order_number
            await supabaseClient
                .from('orders')
                .update({ status: newStatus })
                .or(`id.eq.${orderKey},order_number.eq.${orderKey}`);
        } catch (e) {
            console.warn('Status update db notice:', e);
        }
    }

    // Also update in local storage backup
    const local = JSON.parse(localStorage.getItem('user_orders') || '[]');
    const target = local.find(o => o.order_number === orderKey);
    if (target) {
        target.status = newStatus;
        localStorage.setItem('user_orders', JSON.stringify(local));
    }

    alert(`✅ Order ${orderKey} status changed to ${newStatus.toUpperCase()}`);
    loadOrders();
}
window.updateOrderStatus = updateOrderStatus;

// View Order Details Modal
async function viewOrderDetails(orderNumber) {
    const order = cachedOrders.find(o => o.order_number === orderNumber);
    if (!order) {
        alert('Order details not found');
        return;
    }

    document.getElementById('detailOrderNumber').textContent = order.order_number;

    let items = order.items || [];
    if (items.length === 0 && supabaseClient && order.id) {
        try {
            const { data } = await supabaseClient
                .from('order_items')
                .select(`*, product:products(*)`)
                .eq('order_id', order.id);
            if (data && data.length > 0) items = data;
        } catch (e) {}
    }

    const addr = order.shipping_address || {};
    const phone = addr.phone || '';
    const cleanPhone = phone.replace(/\D/g, '');

    const itemsHtml = items.length > 0 ? items.map(i => {
        const name = i.name || i.product?.name || 'Organic Henna Item';
        const qty = i.qty || i.quantity || 1;
        const price = i.price || i.product?.price || 0;
        return `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-color); font-size: 13.5px;">
                <span>• ${name} (x${qty})</span>
                <strong>₹${price * qty}</strong>
            </div>
        `;
    }).join('') : '<p style="color: var(--text-light); font-size: 13px;">Item details archived.</p>';

    document.getElementById('orderDetailsContent').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: var(--light-bg); padding: 14px; border-radius: 12px;">
                <h4 style="margin: 0 0 8px; color: var(--primary-color); font-size: 14px;"><i class="fas fa-user"></i> Customer Info</h4>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Name:</strong> ${addr.full_name || 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Phone:</strong> ${addr.phone || 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 13px;"><strong>Email:</strong> ${addr.email || 'N/A'}</p>
            </div>
            <div style="background: var(--light-bg); padding: 14px; border-radius: 12px;">
                <h4 style="margin: 0 0 8px; color: var(--primary-color); font-size: 14px;"><i class="fas fa-map-marker-alt"></i> Shipping Address</h4>
                <p style="margin: 3px 0; font-size: 13px;">${addr.address || 'N/A'}</p>
                <p style="margin: 3px 0; font-size: 13px;">${addr.city || ''}, ${addr.state || ''} - <strong>${addr.pincode || ''}</strong></p>
            </div>
        </div>

        <div style="background: #fff; border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 10px; color: var(--primary-color); font-size: 14px;"><i class="fas fa-box"></i> Ordered Products</h4>
            ${itemsHtml}
            <div style="display: flex; justify-content: space-between; margin-top: 12px; font-size: 15px;">
                <strong>Grand Total:</strong>
                <strong style="color: var(--primary-color); font-size: 18px;">₹${order.total_amount}</strong>
            </div>
            <div style="margin-top: 6px; font-size: 12.5px; color: var(--text-light);">
                Payment Mode: <strong>${order.payment_method || 'Online Prepaid'}</strong> • Status: <strong>${(order.status || 'pending').toUpperCase()}</strong>
            </div>
        </div>
    `;

    const waBtn = document.getElementById('detailWhatsAppBtn');
    if (waBtn && cleanPhone) {
        waBtn.href = `https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(addr.full_name || 'there')}%2C%20regarding%20your%20Nida%20Mahendi%20Designs%20Order%20%23${order.order_number}%3A`;
    }

    document.getElementById('orderDetailsModal').style.display = 'flex';
}
window.viewOrderDetails = viewOrderDetails;

function closeOrderDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) modal.style.display = 'none';
}
window.closeOrderDetailsModal = closeOrderDetailsModal;

// Load Products
async function loadProducts() {
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading products:', error);
        return;
    }
    
    const tbody = document.getElementById('productsTableBody');
    
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No products found</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td><img src="${product.image_url || 'images/1.jpeg'}" alt="${product.name}" class="product-image-thumb" onerror="this.src='images/1.jpeg'; this.onerror=null;"></td>
            <td><strong>${product.name}</strong></td>
            <td>₹${product.price}${product.original_price ? ` <small style="text-decoration: line-through; color: #999;">₹${product.original_price}</small>` : ''}</td>
            <td>${product.category || 'N/A'}</td>
            <td><span class="badge ${product.in_stock ? 'badge-active' : 'badge-inactive'}">${product.in_stock ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>${product.featured ? '⭐ Yes' : 'No'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${product.id}', '${product.name}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Open Product Modal
function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    
    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Product';
    
    modal.style.display = 'flex';
}

// Close Product Modal
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Edit Product
async function editProduct(productId) {
    const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (error || !product) {
        alert('Error loading product');
        return;
    }
    
    // Fill form with product data
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productOriginalPrice').value = product.original_price || '';
    document.getElementById('productWeight').value = product.weight || '';
    document.getElementById('productCategory').value = product.category || 'powder';
    document.getElementById('productBadge').value = product.badge || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productImageUrl').value = product.image_url;
    document.getElementById('productInStock').checked = product.in_stock;
    document.getElementById('productFeatured').checked = product.featured;
    
    // Show current image preview
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `
        <div style="margin-top: 10px;">
            <p style="color: var(--text-light); font-size: 14px; margin-bottom: 5px;">Current Image:</p>
            <img src="${product.image_url}" style="max-width: 200px; border-radius: 8px; box-shadow: var(--shadow-md);" alt="Current">
            <p style="margin-top: 5px; color: var(--text-light); font-size: 12px;">Upload new image to replace</p>
        </div>
    `;
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productModal').style.display = 'flex';
}

// Delete Product
async function deleteProduct(productId, productName) {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
        return;
    }
    
    const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', productId);
    
    if (error) {
        alert('Error deleting product: ' + error.message);
        return;
    }
    
    alert('Product deleted successfully!');
    loadProducts();
    loadDashboardData();
}

// Save Product (Add or Update)
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const imageFile = document.getElementById('productImage').files[0];
    
    // Upload image if new file is selected
    let imageUrl = document.getElementById('productImageUrl').value;
    
    if (imageFile) {
        const uploadResult = await uploadProductImage(imageFile);
        if (uploadResult.error) {
            alert('Error uploading image: ' + uploadResult.error);
            return;
        }
        imageUrl = uploadResult.url;
    }
    
    if (!imageUrl) {
        alert('Please upload a product image');
        return;
    }
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        original_price: document.getElementById('productOriginalPrice').value ? parseFloat(document.getElementById('productOriginalPrice').value) : null,
        weight: document.getElementById('productWeight').value,
        image_url: imageUrl,
        category: document.getElementById('productCategory').value,
        badge: document.getElementById('productBadge').value || null,
        in_stock: document.getElementById('productInStock').checked,
        featured: document.getElementById('productFeatured').checked
    };
    
    let error;
    
    if (productId) {
        // Update existing product
        const result = await supabaseClient
            .from('products')
            .update(productData)
            .eq('id', productId);
        error = result.error;
    } else {
        // Insert new product
        const result = await supabaseClient
            .from('products')
            .insert([productData]);
        error = result.error;
    }
    
    if (error) {
        alert('Error saving product: ' + error.message);
        return;
    }
    
    alert('Product saved successfully!');
    closeProductModal();
    loadProducts();
    loadDashboardData();
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('productModal');
    const orderModal = document.getElementById('orderDetailsModal');
    if (e.target === modal) {
        closeProductModal();
    }
    if (e.target === orderModal) {
        closeOrderDetailsModal();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for supabase to be ready
    const checkSupabase = setInterval(() => {
        if (supabaseClient) {
            clearInterval(checkSupabase);
            checkAdminAuth();
        }
    }, 100);
});
