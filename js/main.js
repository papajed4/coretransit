// ==========================================
// CORETRANSIT MAIN APPLICATION
// ==========================================

// Global application state
const AppState = {
    isInitialized: false,
    currentPage: 'home',
    isLoading: false,
    supabaseConnected: false
};

// Initialize the application
async function initApp() {
    if (AppState.isInitialized) return;
    
    console.log('🚀 Initializing CoreTransit...');
    
    // Initialize AOS (Animate on Scroll)
    initAOS();
    
    // Check Supabase connection
    AppState.supabaseConnected = isSupabaseAvailable();
    
    // Set up global event listeners
    setupGlobalListeners();
    
    // Initialize newsletter form
    initNewsletterForm();
    
    // Set up intersection observers for lazy loading
    setupLazyLoading();
    
    // Check for pre-filled tracking ID from homepage
    checkPrefillTracking();
    
    AppState.isInitialized = true;
    
    console.log('✅ CoreTransit initialized successfully');
    console.log(`📊 Supabase: ${AppState.supabaseConnected ? 'Connected' : 'Using Mock Data'}`);
}

// Initialize AOS animation library
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100,
            disable: false,
            easing: 'ease-out-cubic'
        });
        
        // Refresh on dynamic content loads
        window.addEventListener('pageLoaded', () => {
            setTimeout(() => AOS.refresh(), 100);
        });
    }
}

// Set up global event listeners
function setupGlobalListeners() {
    // Smooth scroll for anchor links
    document.addEventListener('click', function(e) {
        const anchor = e.target.closest('a[href^="#"]');
        if (anchor && anchor.getAttribute('href') !== '#') {
            e.preventDefault();
            const targetId = anchor.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals and mobile menu
        if (e.key === 'Escape') {
            closeAllModals();
            closeMobileMenu();
        }
    });
    
    // Handle online/offline status
    window.addEventListener('online', function() {
        showToast('You are back online!', 'success');
    });
    
    window.addEventListener('offline', function() {
        showToast('You are offline. Some features may be limited.', 'error');
    });
}

// Initialize newsletter subscription form
function initNewsletterForm() {
    document.addEventListener('submit', function(e) {
        const newsletterForm = e.target.closest('.newsletter-form');
        if (newsletterForm) {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                const email = emailInput.value;
                
                // Save to Supabase if connected
                if (AppState.supabaseConnected && supabase) {
                    supabase.from('newsletter_subscribers').insert([{ 
                        email: email,
                        subscribed_at: new Date()
                    }]).then(({ error }) => {
                        if (error) {
                            console.error('Newsletter subscription error:', error);
                            showToast('Subscription failed. Please try again.', 'error');
                        } else {
                            showToast('Successfully subscribed to newsletter!', 'success');
                            emailInput.value = '';
                        }
                    });
                } else {
                    // Mock success
                    setTimeout(() => {
                        showToast('Successfully subscribed to newsletter!', 'success');
                        emailInput.value = '';
                    }, 500);
                }
            }
        }
    });
}

// Set up lazy loading for images
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-src');
                    
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Check for pre-filled tracking ID from homepage
function checkPrefillTracking() {
    const prefillId = sessionStorage.getItem('prefill_tracking_id');
    if (prefillId) {
        const trackingInput = document.getElementById('tracking-id-input');
        if (trackingInput) {
            trackingInput.value = prefillId;
            sessionStorage.removeItem('prefill_tracking_id');
            
            // Auto-submit if on tracking page
            const trackBtn = document.getElementById('track-btn');
            if (trackBtn) {
                setTimeout(() => trackBtn.click(), 500);
            }
        }
    }
}

// Close all open modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    
    // Remove modal backdrop if exists
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.remove();
    }
}

// Utility: Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility: Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Utility: Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Utility: Get status color class
function getStatusColorClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) return 'status-delivered';
    if (statusLower.includes('transit')) return 'status-transit';
    if (statusLower.includes('out for delivery')) return 'status-outfordelivery';
    if (statusLower.includes('pending')) return 'status-pending';
    return 'status-pending';
}

// Utility: Generate random tracking ID
function generateTrackingId() {
    const prefix = 'COR';
    const number = Math.floor(Math.random() * 90000) + 10000;
    return `${prefix}-${number}`;
}

// Utility: Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Failed to copy', 'error');
        return false;
    }
}

// Utility: Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility: Validate phone format
function isValidPhone(phone) {
    const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

// Error handling wrapper for async functions
async function safeAsync(fn, errorMessage = 'An error occurred') {
    try {
        return await fn();
    } catch (error) {
        console.error(errorMessage, error);
        showToast(errorMessage, 'error');
        return null;
    }
}

// Performance monitoring (development only)
// Performance monitoring (development only)
if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.debug) {
    // Log page load performance
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
            console.log(`📊 Page Load: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
        }
    });
    
    // Track navigation timing
    window.addEventListener('pageLoaded', (e) => {
        console.log(`📄 Page loaded: ${e.detail.page}`);
    });
}

// Service Worker registration (for PWA support)
if ('serviceWorker' in navigator && APP_CONFIG.environment === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('📱 ServiceWorker registered:', registration.scope);
        }).catch(error => {
            console.log('📱 ServiceWorker registration failed:', error);
        });
    });
}

// Handle visibility change (pause animations when tab not visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations or polling
        console.log('📴 Page hidden - pausing updates');
    } else {
        // Resume animations or polling
        console.log('👁️ Page visible - resuming updates');
        AOS.refresh();
    }
});

// Export utilities to window for global use
window.formatDate = formatDate;
window.getStatusColorClass = getStatusColorClass;
window.generateTrackingId = generateTrackingId;
window.copyToClipboard = copyToClipboard;
window.isValidEmail = isValidEmail;
window.isValidPhone = isValidPhone;
window.safeAsync = safeAsync;
window.debounce = debounce;
window.throttle = throttle;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Handle before unload (save state if needed)
window.addEventListener('beforeunload', () => {
    // Clean up any pending operations
    if (AppState.isLoading) {
        // Show warning if there are unsaved changes
    }
});

// Log app ready
console.log(`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║         🚀 CORETRANSIT READY          ║
    ║                                       ║
    ║    Premium Logistics Management       ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
`);