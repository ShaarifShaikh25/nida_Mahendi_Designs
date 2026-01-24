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
        showLoginSection();
        return false;
    }
    
    // Check if user has admin role
    const { data: customer, error } = await supabaseClient
        .from('customers')
        .select('*')
        .eq('id', session.user.id)
        .single();
    
    if (error || !customer || !customer.is_admin) {
        alert('Access denied. Admin privileges required.');
        await supabaseClient.auth.signOut();
        showLoginSection();
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
    showLoginSection();
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
}

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
            <td><img src="${product.image_url}" alt="${product.name}" class="product-image-thumb"></td>
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
    if (e.target === modal) {
        closeProductModal();
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
