// ===================================
// Loading Screen - Quick and Clean
// ===================================
(function() {
    function hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 600);
        }
    }
    
    // Hide after a short delay
    setTimeout(hideLoader, 800);
    
    // Also hide when page fully loads
    window.addEventListener('load', hideLoader);
})();

// ===================================
// Mobile Menu Toggle
// ===================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });

    // Close menu when clicking on nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
}

// ===================================
// Active Navigation on Scroll
// ===================================
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');
const header = document.querySelector('.header');

function setActiveNav() {
    const scrollY = window.pageYOffset;
    let isHomeSection = scrollY < 100;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            // Update active nav link
            navLinksAll.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
            
            // Check if we're in home section
            if (sectionId === 'home') {
                isHomeSection = true;
            } else {
                isHomeSection = false;
            }
        }
    });
    
    // Toggle header background color
    if (isHomeSection) {
        header.classList.remove('scrolled');
    } else {
        header.classList.add('scrolled');
    }
}

window.addEventListener('scroll', setActiveNav);

// ===================================
// Smooth Scrolling for Anchor Links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Scroll to Top Button
// ===================================
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
});

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===================================
// Contact Form Handling with Web3Forms
// ===================================
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(contactForm);
        
        // Basic validation
        const phone = formData.get('phone');
        const email = formData.get('email');
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Phone validation (Indian format)
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10 || !phoneRegex.test(cleanPhone)) {
            showMessage('Please enter a valid 10-digit phone number.', 'error');
            return;
        }

        // Disable submit button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        try {
            // Send form using Web3Forms
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showMessage('Thank you! Your message has been sent successfully. We will contact you soon.', 'success');
                contactForm.reset();
                
                // Also send WhatsApp notification option
                const whatsappMsg = `New inquiry from ${formData.get('name')}! Check your email for details.`;
                console.log('WhatsApp notification:', whatsappMsg);
            } else {
                showMessage('Oops! Something went wrong. Please try again or contact us directly via WhatsApp.', 'error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('Oops! Something went wrong. Please try again or contact us directly via WhatsApp.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';

    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 8000);
}

// ===================================
// Product Order Buttons
// ===================================
const productButtons = document.querySelectorAll('.btn-product');

productButtons.forEach(button => {
    button.addEventListener('click', function() {
        const productName = this.getAttribute('data-product');
        
        // Scroll to contact form
        const contactSection = document.getElementById('contact');
        const headerOffset = 80;
        const elementPosition = contactSection.offsetTop;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // Pre-fill the product field
        setTimeout(() => {
            const productSelect = document.getElementById('product');
            if (productSelect) {
                // Find matching option
                for (let i = 0; i < productSelect.options.length; i++) {
                    if (productSelect.options[i].value === productName) {
                        productSelect.selectedIndex = i;
                        break;
                    }
                }
                // Add highlight effect
                productSelect.style.boxShadow = '0 0 0 3px rgba(45, 122, 62, 0.3)';
                setTimeout(() => {
                    productSelect.style.boxShadow = '';
                }, 2000);
            }
        }, 800);
    });
});

// ===================================
// Newsletter Form Handling
// ===================================
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        // Disable button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            const formData = new FormData(newsletterForm);
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert('Thank you for subscribing! You will receive our latest updates and offers.');
                emailInput.value = '';
            } else {
                alert('Oops! Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            alert('Oops! Something went wrong. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
        }
    });
}

// ===================================
// Intersection Observer for Animations
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
const animateElements = document.querySelectorAll('.product-card, .feature-card, .testimonial-card, .ingredient-card');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===================================
// Header Background on Scroll
// ===================================
// Header styling is now handled by the setActiveNav function above

// ===================================
// Image Error Handling with Placeholder Images
// ===================================
const images = document.querySelectorAll('img');

images.forEach(img => {
    // Skip logo images
    if (img.classList.contains('logo-img') || 
        img.classList.contains('footer-logo') || 
        img.classList.contains('loader-logo') ||
        img.parentElement?.classList.contains('about-logo')) {
        return;
    }
    
    img.addEventListener('error', function() {
        const altText = this.alt || 'Placeholder';
        const width = this.width || 800;
        const height = this.height || 600;
        
        // Use placeholder.com service for beautiful placeholder images
        this.src = `https://via.placeholder.com/${width}x${height}/e8f5e9/2d7a3e?text=${encodeURIComponent(altText)}`;
        this.onerror = null; // Prevent infinite loop
    });
});

// ===================================
// WhatsApp Quick Order (Optional)
// ===================================
function createWhatsAppButton() {
    const whatsappBtn = document.createElement('a');
    whatsappBtn.href = 'https://wa.me/917057167751?text=Hi, I would like to know more about your henna products';
    whatsappBtn.className = 'whatsapp-float';
    whatsappBtn.target = '_blank';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
    whatsappBtn.setAttribute('aria-label', 'Contact on WhatsApp');
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .whatsapp-float {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: #25D366;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 998;
            transition: all 0.3s ease;
        }
        .whatsapp-float:hover {
            transform: scale(1.1);
            background: #128C7E;
        }
        @media (max-width: 768px) {
            .whatsapp-float {
                width: 50px;
                height: 50px;
                bottom: 90px;
                right: 20px;
                font-size: 1.5rem;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(whatsappBtn);
}

// Uncomment to enable WhatsApp button
createWhatsAppButton();

// ===================================
// Counter Animation for Stats
// ===================================
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    const originalText = element.textContent;
    const hasPlus = originalText.includes('+');
    const hasPercent = originalText.includes('%');
    const suffix = hasPercent ? '%' : (hasPlus ? '+' : '');

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

// Observe stats section for counter animation
const statsSection = document.querySelector('.about-stats');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stats = entry.target.querySelectorAll('.stat h3');
                stats.forEach(stat => {
                    const text = stat.textContent;
                    const number = parseInt(text.replace(/\D/g, ''));
                    animateCounter(stat, number);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statsObserver.observe(statsSection);
}

// ===================================
// Console Welcome Message
// ===================================
console.log('%cWelcome to Nida Mahendi Designs! 🌿', 'color: #2d7a3e; font-size: 20px; font-weight: bold;');
console.log('%cOrganic Henna Products for Natural Beauty', 'color: #8b4513; font-size: 14px;');

// ===================================
// Logo Animation Effects
// ===================================
// Add parallax effect to hero logo watermark
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroLogo = document.querySelector('.hero-logo-watermark');
    
    if (heroLogo && scrolled < window.innerHeight) {
        heroLogo.style.transform = `translate(-50%, -50%) rotate(${scrolled * 0.05}deg) scale(${1 + scrolled * 0.0002})`;
    }
});

// Add pulse effect to logos on hover
const allLogos = document.querySelectorAll('.logo-img, .footer-logo, .about-logo img');
allLogos.forEach(logo => {
    logo.addEventListener('mouseenter', function() {
        this.style.animation = 'logoPulse 0.6s ease';
    });
    
    logo.addEventListener('animationend', function() {
        this.style.animation = '';
    });
});

// Add CSS for logo pulse animation dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes logoPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);

