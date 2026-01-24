# 🚀 Quick Setup - Nida Mahendi E-Commerce

## ⚡ 5-Minute Setup

### 1️⃣ Create Supabase Project (2 min)
```
1. Go to: https://supabase.com
2. Sign Up → New Project
3. Name: nida-mahendi-shop
4. Region: Singapore
5. Wait for creation...
```

### 2️⃣ Create Database (2 min)
```
1. Dashboard → SQL Editor
2. Copy SQL from SUPABASE-SETUP.md (Step 3 & 4)
3. Paste → Run
4. Success! ✅
```

### 3️⃣ Get Credentials (30 sec)
```
1. Settings → API
2. Copy:
   - Project URL
   - anon public key
```

### 4️⃣ Configure Code (30 sec)
```
1. Open: js/supabase-config.js
2. Replace YOUR_SUPABASE_PROJECT_URL
3. Replace YOUR_SUPABASE_ANON_KEY
4. Save
```

### 5️⃣ Test (1 min)
```
1. Open index.html
2. Click "Sign Up"
3. Create account
4. Add product to cart
5. Done! 🎉
```

---

## 📋 Features Checklist

### ✅ Implemented
- [x] User Sign Up / Sign In
- [x] Shopping Cart (Guest & User)
- [x] Add to Cart
- [x] Update Quantities
- [x] Remove from Cart
- [x] Cart Count Badge
- [x] Wishlist
- [x] Product Ratings Display
- [x] User Menu/Dropdown
- [x] Authentication Modals
- [x] Real-time Cart Updates
- [x] Supabase Integration

### 🔜 Next to Implement
- [ ] Checkout Page
- [ ] Payment Gateway (Razorpay)
- [ ] Order Confirmation
- [ ] Order History
- [ ] Email Notifications
- [ ] Admin Dashboard
- [ ] Product Search
- [ ] Customer Reviews (write)
- [ ] Discount Codes

---

## 🗂️ File Changes

### New Files:
```
js/supabase-config.js    ← Supabase setup & cart logic
js/auth.js               ← Authentication & modals
SUPABASE-SETUP.md        ← Complete setup guide
ECOMMERCE-GUIDE.md       ← Feature documentation
QUICK-SETUP.md           ← This file
```

### Modified Files:
```
index.html               ← Added modals, cart, auth UI
css/styles.css           ← Added e-commerce styles
```

---

## 🎨 New UI Elements

### Navigation Bar:
```
- Cart Icon (with count badge)
- Sign In / Sign Up buttons
- User dropdown menu
```

### Product Cards:
```
- Wishlist heart button
- Star ratings
- Review counts
- "Add to Cart" button
```

### Modals:
```
- Authentication Modal (Sign In / Sign Up)
- Cart Modal (View & manage cart)
```

---

## 📞 Important Functions

### Add to Cart:
```javascript
addToCart('product-1')
```

### Add to Wishlist:
```javascript
addToWishlist('product-1')
```

### Open Cart:
```javascript
openCartModal()
```

### Sign Out:
```javascript
signOut()
```

---

## 🔑 Database Tables

| Table | Purpose |
|-------|---------|
| products | Product catalog |
| customers | User accounts |
| orders | Order records |
| order_items | Items in orders |
| cart | Shopping cart |
| wishlist | Saved items |
| reviews | Product reviews |

---

## 🌐 URLs to Remember

| Service | URL |
|---------|-----|
| Supabase Dashboard | https://app.supabase.com |
| Your Project | https://xxxxx.supabase.co |
| Supabase Docs | https://supabase.com/docs |
| Razorpay (Payment) | https://razorpay.com |

---

## 🐛 Common Issues

### Cart not working?
```javascript
// Check in browser console:
console.log(supabase);
console.log(currentUser);
```

### Can't sign in?
```
1. Check email verification
2. Check spam folder
3. Wait 5-10 minutes for email
```

### Product IDs not matching?
```
Products use: product-1, product-2, etc.
Update in Supabase if needed
```

---

## 💡 Pro Tips

1. **Test with private/incognito** window for guest cart
2. **Check browser console** for errors (F12)
3. **Use Supabase Table Editor** to view data live
4. **Enable email authentication** in Supabase Auth settings
5. **Add your domain** to Supabase URL Configuration

---

## 📱 Mobile Friendly
✅ Responsive design maintained
✅ Touch-friendly buttons
✅ Mobile cart/auth modals

---

## 🎯 Next Step: Payment Integration

### Razorpay Setup (Recommended for India):
```
1. Sign up at razorpay.com
2. Get API keys
3. Add checkout flow
4. Test payments
5. Go live!
```

---

## 📊 Supabase Dashboard Quick Access

**View Data:**
```
Dashboard → Table Editor → Select Table
```

**Check Auth:**
```
Dashboard → Authentication → Users
```

**Monitor API:**
```
Dashboard → API → Logs
```

---

## ⚠️ Security Reminder

```
❌ Don't commit: js/supabase-config.js (with real keys)
✅ Do commit: Everything else

For GitHub:
1. Add to .gitignore:
   js/supabase-config.js
2. Create: js/supabase-config.example.js
3. Replace keys with placeholders
```

---

**Need Help?** Check:
1. ECOMMERCE-GUIDE.md (detailed features)
2. SUPABASE-SETUP.md (step-by-step setup)
3. Browser console (for errors)
4. Supabase docs (for advanced features)

---

**Version:** 2.0  
**Last Updated:** January 24, 2026  
**Status:** Production Ready 🚀
