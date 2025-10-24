// Mobile Menu Functionality
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

// Debug logging to verify elements are found
console.log('Mobile Menu Elements:', {
    mobileMenuBtn: mobileMenuBtn ? 'Found' : 'Not Found',
    mobileMenuClose: mobileMenuClose ? 'Found' : 'Not Found',
    mobileMenu: mobileMenu ? 'Found' : 'Not Found',
    mobileMenuOverlay: mobileMenuOverlay ? 'Found' : 'Not Found',
    mobileNavLinks: mobileNavLinks.length
});

// Open mobile menu
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        console.log('Opening mobile menu');
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
} else {
    console.error('Mobile menu button not found');
}

// Close mobile menu
function closeMobileMenu() {
    console.log('Closing mobile menu');
    mobileMenu.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
} else {
    console.error('Mobile menu close button not found');
}

if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
} else {
    console.error('Mobile menu overlay not found');
}

// Close menu when clicking on a link
mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
        console.log('Mobile nav link clicked');
        // Add a small delay to allow the click to register before closing
        setTimeout(closeMobileMenu, 300);
    });
});

// Close menu with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .pricing-card, .payment-card, .roi-card, .section-header').forEach(el => {
    observer.observe(el);
});

// Prevent body scroll when mobile menu is open (additional safety)
document.addEventListener('touchmove', function(e) {
    if (mobileMenu.classList.contains('active')) {
        e.preventDefault();
    }
}, { passive: false });

console.log('MediQueue Pro JavaScript loaded successfully');