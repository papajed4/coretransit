// ==========================================
// CORETRANSIT NAVIGATION & ROUTING
// ==========================================

// Available routes/pages in the application
const ROUTES = {
    home: {
        title: 'CoreTransit Logistics | Moving What Matters',
        file: 'pages/home.html',
        default: true
    },
    about: {
        title: 'About Us | CoreTransit Logistics',
        file: 'pages/about.html'
    },
    services: {
        title: 'Our Services | CoreTransit Logistics',
        file: 'pages/services.html'
    },
    contact: {
        title: 'Contact Us | CoreTransit Logistics',
        file: 'pages/contact.html'
    },
    track: {
        title: 'Track Shipment | CoreTransit Logistics',
        file: 'track.html',
        external: true
    }
};

// Current active page
let currentPage = 'home';

// Content cache for better performance
const pageCache = {};

// Navigation function - loads page content
async function navigate(pageId) {
    // Handle external pages (like track.html)
    if (ROUTES[pageId] && ROUTES[pageId].external) {
        window.location.href = ROUTES[pageId].file;
        return;
    }
    
    // Check if page exists in routes
    if (!ROUTES[pageId]) {
        console.error(`Page "${pageId}" not found`);
        return;
    }
    
    const route = ROUTES[pageId];
    
    // Update current page
    currentPage = pageId;
    
    // Update page title
    document.title = route.title;
    
    // Update URL hash without scrolling
    history.pushState(null, null, `#${pageId}`);
    
    // Show loading state (optional)
    showLoading();
    
    try {
        // Check cache first
        let html;
        if (pageCache[pageId]) {
            html = pageCache[pageId];
        } else {
            // Fetch the page content
            const response = await fetch(route.file);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status}`);
            }
            html = await response.text();
            pageCache[pageId] = html;
        }
        
        // Insert content into app container
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = html;
            appContent.classList.add('page-transition');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                appContent.classList.remove('page-transition');
            }, 500);
        }
        
        // Update active nav links
        updateActiveNavLink(pageId);
        
        // Close mobile menu if open
        closeMobileMenu();
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Initialize page-specific scripts
        initializePageScripts(pageId);
        
        // Refresh AOS animations for new content
        if (typeof AOS !== 'undefined') {
            setTimeout(() => AOS.refresh(), 100);
        }
        
        // Trigger custom event for page loaded
        window.dispatchEvent(new CustomEvent('pageLoaded', { detail: { page: pageId } }));
        
    } catch (error) {
        console.error('Navigation error:', error);
        showError('Failed to load page. Please try again.');
    } finally {
        hideLoading();
    }
}

// Update active state in navigation links
function updateActiveNavLink(pageId) {
    const navLinks = document.querySelectorAll('[data-nav-link]');
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-nav-link');
        if (linkPage === pageId) {
            link.classList.add('text-accent', 'font-bold');
            link.classList.remove('text-gray-700');
        } else {
            link.classList.remove('text-accent', 'font-bold');
            link.classList.add('text-gray-700');
        }
    });
}

// Close mobile menu
function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// Show loading indicator
function showLoading() {
    // Create loading element if it doesn't exist
    let loader = document.getElementById('page-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center';
        loader.innerHTML = `
            <div class="bg-white rounded-2xl p-8 shadow-xl text-center">
                <div class="loader mx-auto mb-4"></div>
                <p class="text-gray-600 font-medium">Loading...</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.style.display = 'flex';
    }
}

// Hide loading indicator
function hideLoading() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Show error message
function showError(message) {
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center p-8">
                    <div class="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
                    <p class="text-gray-600">${message}</p>
                    <button onclick="navigate('home')" class="mt-6 bg-accent text-white px-6 py-2 rounded-full font-semibold hover:bg-accentHover transition">
                        Go to Homepage
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize page-specific scripts
function initializePageScripts(pageId) {
    switch(pageId) {
        case 'home':
            initHomePage();
            break;
        case 'about':
            initAboutPage();
            break;
        case 'services':
            initServicesPage();
            break;
        case 'contact':
            initContactPage();
            break;
    }
}

// Home page specific initialization
function initHomePage() {
    // Hero track button
    const heroTrackBtn = document.getElementById('hero-track-btn');
    const heroTrackInput = document.getElementById('hero-track-input');
    
    if (heroTrackBtn && heroTrackInput) {
        heroTrackBtn.addEventListener('click', function() {
            const trackingId = heroTrackInput.value.trim();
            if (trackingId) {
                // Store in session storage for tracking page
                sessionStorage.setItem('prefill_tracking_id', trackingId);
            }
            window.location.href = 'track.html';
        });
        
        // Allow Enter key to trigger track
        heroTrackInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                heroTrackBtn.click();
            }
        });
    }
    
    // Animate stats counters when visible
    animateStatsOnScroll();
}

// About page specific initialization
function initAboutPage() {
    // Any about page specific scripts
    console.log('About page loaded');
}

// Services page specific initialization
function initServicesPage() {
    // Any services page specific scripts
    console.log('Services page loaded');
}

// Contact page specific initialization
function initContactPage() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            
            // Show success message
            showToast('Thank you! We will contact you shortly.', 'success');
            
            // Reset form
            contactForm.reset();
            
            // In production, send to Supabase or email API
            console.log('Contact form submitted:', data);
        });
    }
}

// Animate statistics counters when they come into view
function animateStatsOnScroll() {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const value = parseInt(target.getAttribute('data-value') || target.textContent);
                animateCounter(target, value);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => observer.observe(stat));
}

// Animate individual counter
function animateCounter(element, targetValue) {
    let current = 0;
    const duration = 2000;
    const increment = targetValue / (duration / 16);
    const isDecimal = targetValue % 1 !== 0;
    
    const updateCounter = () => {
        current += increment;
        if (current < targetValue) {
            element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue;
        }
    };
    
    requestAnimationFrame(updateCounter);
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            ${type === 'success' ? '<i class="fa-solid fa-check-circle text-green-500"></i>' : ''}
            ${type === 'error' ? '<i class="fa-solid fa-exclamation-circle text-red-500"></i>' : ''}
            ${type === 'info' ? '<i class="fa-solid fa-info-circle text-blue-500"></i>' : ''}
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    const hash = window.location.hash.substring(1);
    if (hash && ROUTES[hash]) {
        navigate(hash);
    } else {
        navigate('home');
    }
});

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check for hash in URL
    const hash = window.location.hash.substring(1);
    const initialPage = (hash && ROUTES[hash]) ? hash : 'home';
    
    // Load initial page
    navigate(initialPage);
    
    // Set up navigation listeners
    setupNavigationListeners();
    
    // Set up mobile menu
    setupMobileMenu();
    
    // Set up back to top button
    setupBackToTop();
});

// Set up navigation link listeners
function setupNavigationListeners() {
    // Attach click handlers to all navigation links
    document.addEventListener('click', function(e) {
        const navLink = e.target.closest('[data-nav-link]');
        if (navLink) {
            e.preventDefault();
            const page = navLink.getAttribute('data-nav-link');
            navigate(page);
        }
    });
}

// Set up mobile menu
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        const mobileMenu = document.getElementById('mobile-menu');
        const menuBtn = document.getElementById('mobile-menu-btn');
        
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
}

// Set up back to top button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const nav = document.getElementById('navbar');
    const logo = document.getElementById('nav-logo-text');
    const links = document.querySelectorAll('.nav-link');
    const menuBtn = document.getElementById('mobile-menu-btn');
    
    if (!nav) return;
    
    const isHomePage = currentPage === 'home';
    const isAtTop = window.scrollY < 50;
    
    if (isHomePage && isAtTop) {
        nav.classList.remove('bg-white/95', 'backdrop-blur-md', 'shadow-lg');
        nav.classList.add('bg-transparent');
        if (logo) {
            logo.classList.remove('text-primary');
            logo.classList.add('text-white');
        }
        links.forEach(l => {
            l.classList.remove('text-gray-700');
            l.classList.add('text-white');
        });
        if (menuBtn) {
            menuBtn.classList.replace('text-primary', 'text-white');
        }
    } else {
        nav.classList.add('bg-white/95', 'backdrop-blur-md', 'shadow-lg');
        nav.classList.remove('bg-transparent');
        if (logo) {
            logo.classList.remove('text-white');
            logo.classList.add('text-primary');
        }
        links.forEach(l => {
            l.classList.remove('text-white');
            l.classList.add('text-gray-700');
        });
        if (menuBtn) {
            menuBtn.classList.replace('text-white', 'text-primary');
        }
    }
});

// Export functions for global use
window.navigate = navigate;
window.showToast = showToast;