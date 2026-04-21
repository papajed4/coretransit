// ==========================================
// CORETRANSIT TRACKING LOGIC
// ==========================================

// Current tracking data
let currentShipment = null;

// Initialize tracking page
document.addEventListener('DOMContentLoaded', function () {
    console.log('📍 Tracking page initialized');

    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });
    }

    // Set up tracking form
    setupTrackingForm();

    // Set up mobile menu
    setupMobileMenu();

    // Set up back to top button
    setupBackToTop();

    // Check for pre-filled tracking ID
    checkForPrefill();
});

// Set up tracking form submission
function setupTrackingForm() {
    const form = document.getElementById('tracking-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const trackingId = document.getElementById('tracking-id-input').value.trim().toUpperCase();

        if (!trackingId) {
            showTrackingError('Please enter a tracking number');
            return;
        }

        await trackShipment(trackingId);
    });

    // Allow Enter key in input
    const input = document.getElementById('tracking-id-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                form.dispatchEvent(new Event('submit'));
            }
        });
    }
}

// Main tracking function
async function trackShipment(trackingId) {
    const btnText = document.querySelector('#track-btn span');
    const loader = document.getElementById('track-loader');
    const btnIcon = document.querySelector('#track-btn i');
    const resultDiv = document.getElementById('track-result');
    const errorDiv = document.getElementById('track-error');

    // Show loading state
    btnText.style.opacity = '0.5';
    if (btnIcon) btnIcon.style.display = 'none';
    if (loader) loader.style.display = 'block';
    resultDiv?.classList.add('hidden');
    errorDiv?.classList.add('hidden');

    try {
        let shipmentData = null;

        // Try Supabase first
        if (isSupabaseAvailable() && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('shipments')
                .select('*')
                .eq('tracking_id', trackingId)
                .single();

            if (error) {
                console.log('Supabase error:', error.message);
                // Fall back to mock data
                shipmentData = getMockShipment(trackingId);
            } else {
                shipmentData = data;
            }
        } else {
            // Use mock data with simulated delay
            await new Promise(resolve => setTimeout(resolve, 800));
            shipmentData = getMockShipment(trackingId);
        }

        if (shipmentData) {
            currentShipment = shipmentData;
            displayTrackingResult(shipmentData);

            // Save to recent searches (localStorage)
            saveRecentSearch(trackingId, shipmentData.status);

            // Update URL with tracking ID (optional)
            updateUrlWithTracking(trackingId);
        } else {
            showTrackingError('Tracking ID not found');
        }

    } catch (err) {
        console.error('Tracking error:', err);
        showTrackingError('An error occurred. Please try again.');
    } finally {
        // Restore button state
        if (loader) loader.style.display = 'none';
        if (btnIcon) btnIcon.style.display = 'inline-block';
        btnText.style.opacity = '1';
    }
}

// Get mock shipment data
function getMockShipment(trackingId) {
    // Check if we have this ID in our mock database
    if (MOCK_SHIPMENTS && MOCK_SHIPMENTS[trackingId]) {
        return MOCK_SHIPMENTS[trackingId];
    }

    // Generate a generic mock for demo purposes
    const mockIds = ['COR-84729', 'COR-19384', 'COR-56192', 'COR-72941'];
    if (mockIds.includes(trackingId) || trackingId.startsWith('COR-')) {
        return {
            tracking_id: trackingId,
            status: ['In Transit', 'Pending', 'Out for Delivery', 'Delivered'][Math.floor(Math.random() * 4)],
            location: ['Dubai Logistics Hub, UAE', 'Singapore Port, Singapore', 'Rotterdam Warehouse, Netherlands', 'Los Angeles Distribution, USA'][Math.floor(Math.random() * 4)],
            sender_name: ['GlobalTech Industries', 'Samsung Electronics', 'Philips Healthcare', 'ASICS Corporation'][Math.floor(Math.random() * 4)],
            receiver_name: ['Acme Corp Ltd.', 'Retail Partners Inc.', 'MediCare Solutions', 'Sports Direct UK'][Math.floor(Math.random() * 4)],
            updated_at: new Date().toLocaleString(),
            progress: Math.floor(Math.random() * 100)
        };
    }

    return null;
}

// Display tracking result
function displayTrackingResult(shipment) {
    const resultDiv = document.getElementById('track-result');
    if (!resultDiv) return;

    // Update tracking ID
    const idElement = document.getElementById('res-id');
    if (idElement) idElement.textContent = shipment.tracking_id;

    // Update location
    const locationElement = document.getElementById('res-location');
    if (locationElement) locationElement.textContent = shipment.location || 'Location unavailable';

    // Update sender
    const senderElement = document.getElementById('res-sender');
    if (senderElement) senderElement.textContent = shipment.sender_name || 'N/A';

    // Update receiver
    const receiverElement = document.getElementById('res-receiver');
    if (receiverElement) receiverElement.textContent = shipment.receiver_name || 'N/A';

    // Update timestamp
    const updatedElement = document.getElementById('res-updated');
    if (updatedElement) {
        updatedElement.textContent = shipment.updated_at || new Date().toLocaleString();
    }

    // Update status badge
    updateStatusBadge(shipment.status);

    // Update timeline and progress
    updateTimeline(shipment.status, shipment.progress || 50);

    // Show result
    resultDiv.classList.remove('hidden');

    // Scroll to result
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    // Refresh AOS for new elements
    if (typeof AOS !== 'undefined') {
        setTimeout(() => AOS.refresh(), 100);
    }
}

// Update status badge
function updateStatusBadge(status) {
    const badge = document.getElementById('res-status-badge');
    if (!badge) return;

    const statusLower = status.toLowerCase();
    const dotColor = statusLower.includes('delivered') ? 'bg-green-500' :
        statusLower.includes('transit') ? 'bg-blue-500' :
            statusLower.includes('out for delivery') ? 'bg-purple-500' : 'bg-orange-500';

    badge.innerHTML = `
        <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 ${dotColor}"></span>
        </span>
        ${status}
    `;

    // Reset classes
    badge.className = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold';

    // Add status-specific classes
    if (statusLower.includes('delivered')) {
        badge.classList.add('bg-green-100', 'text-green-700');
    } else if (statusLower.includes('transit')) {
        badge.classList.add('bg-blue-100', 'text-blue-700');
    } else if (statusLower.includes('out for delivery')) {
        badge.classList.add('bg-purple-100', 'text-purple-700');
    } else {
        badge.classList.add('bg-orange-100', 'text-orange-700');
    }
}

// Update timeline stepper
function updateTimeline(status, progressPercent) {
    const progressBar = document.getElementById('res-progress');
    if (progressBar) {
        setTimeout(() => {
            progressBar.style.width = `${progressPercent}%`;
        }, 100);
    }

    const steps = document.querySelectorAll('.timeline-step');
    if (steps.length === 0) return;

    const statusLower = status.toLowerCase();
    let activeStepIndex = 2; // Default to In Transit

    if (statusLower.includes('pending')) activeStepIndex = 0;
    else if (statusLower.includes('processing')) activeStepIndex = 1;
    else if (statusLower.includes('transit')) activeStepIndex = 2;
    else if (statusLower.includes('out for delivery')) activeStepIndex = 3;
    else if (statusLower.includes('delivered')) activeStepIndex = 4;

    steps.forEach((step, index) => {
        step.classList.remove('completed', 'active');

        const icon = step.querySelector('.step-icon');
        const label = step.querySelector('p');

        if (index < activeStepIndex) {
            // Completed step
            step.classList.add('completed');
            if (icon) {
                icon.innerHTML = '<i class="fa-solid fa-check text-sm"></i>';
                icon.classList.add('bg-accent', 'text-white', 'border-accent');
                icon.classList.remove('bg-white', 'border-accent', 'text-accent', 'shadow-[0_0_0_4px_rgba(249,115,22,0.2)]');
            }
            if (label) {
                label.classList.add('text-primary');
                label.classList.remove('text-accent', 'text-gray-400');
            }
        } else if (index === activeStepIndex) {
            // Active step
            step.classList.add('active');
            if (icon) {
                icon.innerHTML = getStepIcon(index);
                icon.classList.add('bg-white', 'border-accent', 'text-accent', 'shadow-[0_0_0_4px_rgba(249,115,22,0.2)]');
                icon.classList.remove('bg-accent', 'text-white');
            }
            if (label) {
                label.classList.add('text-accent');
                label.classList.remove('text-primary', 'text-gray-400');
            }
        } else {
            // Future step
            if (icon) {
                icon.innerHTML = '<i class="fa-regular fa-circle text-gray-400"></i>';
                icon.classList.add('bg-gray-100', 'border-gray-200');
                icon.classList.remove('bg-accent', 'text-white', 'border-accent', 'shadow-[0_0_0_4px_rgba(249,115,22,0.2)]');
            }
            if (label) {
                label.classList.add('text-gray-400');
                label.classList.remove('text-primary', 'text-accent');
            }
        }
    });
}

// Get icon for active step
function getStepIcon(stepIndex) {
    const icons = ['fa-clipboard-list', 'fa-gear', 'fa-truck-fast', 'fa-box', 'fa-circle-check'];
    return `<i class="fa-solid ${icons[stepIndex] || 'fa-truck'}"></i>`;
}

// Show tracking error
function showTrackingError(message) {
    const errorDiv = document.getElementById('track-error');
    if (!errorDiv) return;

    const messageElement = errorDiv.querySelector('p');
    if (messageElement) {
        messageElement.textContent = message;
    }

    errorDiv.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// Fill demo tracking ID
function fillDemoId(id) {
    const input = document.getElementById('tracking-id-input');
    if (input) {
        input.value = id;
        // Auto submit
        document.getElementById('tracking-form')?.dispatchEvent(new Event('submit'));
    }
}

// Copy tracking link to clipboard
function copyTrackingLink() {
    if (!currentShipment) return;

    const url = `${window.location.origin}${window.location.pathname}?tracking=${currentShipment.tracking_id}`;
    copyToClipboard(url);
}

// Save to recent searches
function saveRecentSearch(trackingId, status) {
    try {
        let recent = JSON.parse(localStorage.getItem('recent_tracking') || '[]');

        // Add new search to beginning
        recent.unshift({
            id: trackingId,
            status: status,
            timestamp: new Date().toISOString()
        });

        // Keep only last 5 searches
        recent = recent.slice(0, 5);

        localStorage.setItem('recent_tracking', JSON.stringify(recent));
    } catch (e) {
        console.warn('Could not save recent search:', e);
    }
}

// Update URL with tracking ID
function updateUrlWithTracking(trackingId) {
    if (history.pushState) {
        const newUrl = `${window.location.pathname}?tracking=${trackingId}`;
        window.history.pushState({ trackingId }, '', newUrl);
    }
}

// Check for pre-filled tracking ID
function checkForPrefill() {
    // Check URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const urlTrackingId = urlParams.get('tracking');

    if (urlTrackingId) {
        const input = document.getElementById('tracking-id-input');
        if (input) {
            input.value = urlTrackingId;
            // Auto-submit
            setTimeout(() => {
                document.getElementById('tracking-form')?.dispatchEvent(new Event('submit'));
            }, 300);
        }
        return;
    }

    // Check session storage (from homepage)
    const prefillId = sessionStorage.getItem('prefill_tracking_id');
    if (prefillId) {
        const input = document.getElementById('tracking-id-input');
        if (input) {
            input.value = prefillId;
            sessionStorage.removeItem('prefill_tracking_id');

            // Auto-submit
            setTimeout(() => {
                document.getElementById('tracking-form')?.dispatchEvent(new Event('submit'));
            }, 300);
        }
    }
}

// Mobile menu setup
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileMenu.classList.contains('hidden') &&
                !mobileMenu.contains(e.target) &&
                !menuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
}

// Back to top button setup
function setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Export for global use
window.trackShipment = trackShipment;
window.fillDemoId = fillDemoId;
window.copyTrackingLink = copyTrackingLink;