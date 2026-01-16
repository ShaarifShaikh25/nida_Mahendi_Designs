# Nida Mahendi Designs - Organic Henna Business Website

A responsive, professional business website for Nida Mahendi Designs, showcasing premium organic henna products with pan-India delivery.

## Features

✨ **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
🎨 **Modern UI** - Clean, professional design with smooth animations
🌿 **Product Showcase** - Beautiful product cards with detailed information
📱 **Mobile-Friendly** - Fully optimized mobile navigation and layout
📧 **Contact Form** - Integrated form with validation
🚀 **Fast Loading** - Optimized performance with pure HTML, CSS, JS
♿ **Accessible** - ARIA labels and semantic HTML

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS Grid & Flexbox
- **JavaScript** - Interactive features and form validation
- **Font Awesome** - Icons

## Project Structure

```
Mahendi Web/
│
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styles and responsive design
├── js/
│   └── script.js           # Interactive functionality
├── images/
│   └── README.md           # Image guidelines and specifications
└── README.md               # This file
```

## Website Sections

1. **Header & Navigation** - Sticky navigation with mobile menu
2. **Hero Section** - Eye-catching banner with call-to-action
3. **Features** - Key benefits (100% Organic, Pan-India Delivery, etc.)
4. **Products** - 6 product cards with pricing and order buttons
5. **About** - Company story with statistics
6. **Ingredients** - Natural ingredients breakdown
7. **Testimonials** - Customer reviews
8. **Contact** - Contact form with validation
9. **Footer** - Links, newsletter, and social media

## Products Featured

1. Organic Henna Powder (₹299)
2. Henna Cones Pack of 10 (₹499)
3. Bridal Special Henna (₹799)
4. After-Care Oil (₹199)
5. Design Stencils Set (₹349)
6. Complete Starter Kit (₹999)

## Setup Instructions

1. **Download/Clone the project**
   ```
   No build process required!
   ```

2. **Add Product Images**
   - Place your product images in the `images/` folder
   - See `images/README.md` for specifications
   - Images will auto-display when filenames match

3. **Open the Website**
   - Simply open `index.html` in any modern web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve
     ```

4. **Customize Content**
   - Edit contact information in `index.html`
   - Modify colors in CSS variables (top of `styles.css`)
   - Update product details and pricing

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #2d7a3e;    /* Main green */
    --secondary-color: #8b4513;   /* Brown */
    --accent-color: #d4af37;      /* Gold */
}
```

### Contact Information
Update in `index.html` (Contact Section):
- Phone number
- Email address
- Social media links
- WhatsApp number (in `script.js` if enabled)

### Products
Modify product cards in `index.html`:
- Product names
- Descriptions
- Prices
- Images

## Interactive Features

- **Mobile Menu** - Hamburger menu for mobile devices
- **Smooth Scrolling** - Smooth navigation between sections
- **Form Validation** - Email and phone number validation
- **Active Navigation** - Highlights current section
- **Scroll to Top** - Quick return to top button
- **Product Quick Order** - Click product button → auto-fills contact form
- **Animated Counters** - Statistics animate on scroll
- **Image Fallback** - Gradient placeholders for missing images

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- No external dependencies (except Font Awesome CDN)
- Optimized CSS with minimal file size
- Efficient JavaScript with event delegation
- CSS animations for smooth UX

## SEO Features

- Semantic HTML5 structure
- Meta descriptions
- Proper heading hierarchy
- Alt text for images
- Mobile-friendly design

## Future Enhancements

Consider adding:
- [ ] Image gallery/lightbox for products
- [ ] Shopping cart functionality
- [ ] Payment gateway integration
- [ ] Customer login/registration
- [ ] Blog section for henna tips
- [ ] Live chat support
- [ ] Multi-language support
- [ ] Product reviews system

## Contact Form Integration

The contact form currently shows a success message. To make it functional:

1. **Using Formspree** (easiest):
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

2. **Using EmailJS** (free):
   - Sign up at emailjs.com
   - Add EmailJS SDK
   - Configure in `script.js`

3. **Using Backend**:
   - Create API endpoint (Node.js, PHP, etc.)
   - Update form submission in `script.js`

## License

This project is free to use for personal and commercial purposes.

## Support

For questions or support:
- Email: info@nidamahendidesigns.com
- Phone: +91 98765 43210

---

**Built with ❤️ for Nida Mahendi Designs**

*Natural Beauty • Organic Henna • Traditional Artistry*
