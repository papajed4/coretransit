// ==========================================
// CORETRANSIT TRACKING – Robust & Error‑Free
// ==========================================

let currentShipment = null;

document.addEventListener('DOMContentLoaded', function () {
    console.log('📍 Tracking page ready');
    if (typeof AOS !== 'undefined') AOS.init({ duration: 800, once: true, offset: 100 });
    setupTrackingForm();
    setupMobileMenu();
    setupBackToTop();
    checkForPrefill();
});

// ---------- FORM SETUP ----------
function setupTrackingForm() {
    const form = document.getElementById('tracking-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('tracking-id-input');
        const trackingId = input ? input.value.trim().toUpperCase() : '';
        if (!trackingId) {
            showTrackingError('Please enter a tracking number');
            return;
        }
        await trackShipment(trackingId);
    });

    const input = document.getElementById('tracking-id-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') form.dispatchEvent(new Event('submit'));
        });
    }
}

// ---------- MAIN TRACKING FUNCTION ----------
async function trackShipment(trackingId) {
    const btn = document.getElementById('track-btn');
    const loader = document.getElementById('track-loader');
    const resultDiv = document.getElementById('track-result');
    const errorDiv = document.getElementById('track-error');

    // Disable button & show loader
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
    }
    if (loader) loader.style.display = 'inline-block';
    if (resultDiv) resultDiv.classList.add('hidden');
    if (errorDiv) errorDiv.classList.add('hidden');

    try {
        let shipmentData = null;

        // Try Supabase only if available AND not forced to mock
        if (typeof isSupabaseAvailable === 'function' && isSupabaseAvailable() && typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { data, error } = await supabaseClient
                    .from('shipments')
                    .select('*')
                    .eq('tracking_id', trackingId)
                    .single();
                if (!error && data) shipmentData = data;
                else shipmentData = getMockShipment(trackingId);
            } catch (supabaseErr) {
                console.warn('Supabase error, using mock:', supabaseErr.message);
                shipmentData = getMockShipment(trackingId);
            }
        } else {
            // Mock only – simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 600));
            shipmentData = getMockShipment(trackingId);
        }

        if (shipmentData) {
            currentShipment = shipmentData;
            displayTrackingResult(shipmentData);
            saveRecentSearch(trackingId, shipmentData.status);
            updateUrlWithTracking(trackingId);
        } else {
            showTrackingError(`Tracking ID "${trackingId}" not found. Please check and try again.`);
        }
    } catch (err) {
        console.error('Tracking error:', err);
        showTrackingError('Unable to track shipment. Please try again later.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
        if (loader) loader.style.display = 'none';
    }
}

// ---------- MOCK DATA (full demo set) ----------
function getMockShipment(trackingId) {
    // Predefined mock data for the four demo IDs
    const mockDb = {
        'COR-84729': {
            tracking_id: 'COR-84729',
            status: 'In Transit',
            location: 'Dubai Logistics Hub, UAE',
            sender_name: 'GlobalTech Industries',
            receiver_name: 'Acme Corp Ltd.',
            updated_at: new Date().toLocaleString(),
            progress: 60
        },
        'COR-19384': {
            tracking_id: 'COR-19384',
            status: 'Delivered',
            location: 'New York Distribution Center, USA',
            sender_name: 'Samsung Electronics',
            receiver_name: 'Retail Partners Inc.',
            updated_at: new Date(Date.now() - 86400000).toLocaleString(),
            progress: 100
        },
        'COR-56192': {
            tracking_id: 'COR-56192',
            status: 'Pending',
            location: 'Amsterdam Warehouse, Netherlands',
            sender_name: 'Philips Healthcare',
            receiver_name: 'MediCare Solutions',
            updated_at: new Date().toLocaleString(),
            progress: 10
        },
        'COR-72941': {
            tracking_id: 'COR-72941',
            status: 'Out for Delivery',
            location: 'London Distribution Center, UK',
            sender_name: 'ASICS Corporation',
            receiver_name: 'Sports Direct UK',
            updated_at: new Date().toLocaleString(),
            progress: 85
        }
    };
    if (mockDb[trackingId]) return mockDb[trackingId];
    // Any other COR-***** gets a random realistic status
    if (trackingId.startsWith('COR-')) {
        const statuses = ['Pending', 'In Transit', 'Out for Delivery', 'Delivered'];
        const locations = ['Los Angeles Hub, USA', 'Rotterdam Port, Netherlands', 'Singapore Logistics Centre', 'Sydney Warehouse, Australia'];
        const senders = ['Techtronics Inc.', 'Global Pharma Ltd.', 'AutoParts Co.', 'Fashion Retail Group'];
        const receivers = ['BestBuy Distribution', 'Walmart Logistics', 'Amazon Fulfillment', 'Target Supply Chain'];
        return {
            tracking_id: trackingId,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            location: locations[Math.floor(Math.random() * locations.length)],
            sender_name: senders[Math.floor(Math.random() * senders.length)],
            receiver_name: receivers[Math.floor(Math.random() * receivers.length)],
            updated_at: new Date().toLocaleString(),
            progress: Math.floor(Math.random() * 100)
        };
    }
    return null; // No match
}

// ---------- DISPLAY RESULTS (safe DOM updates) ----------
function displayTrackingResult(shipment) {
    const resultDiv = document.getElementById('track-result');
    if (!resultDiv) return;

    // Tracking ID
    const idElem = document.getElementById('res-id');
    if (idElem) idElem.textContent = shipment.tracking_id;

    // Location
    const locElem = document.getElementById('res-location');
    if (locElem) locElem.textContent = shipment.location || 'Location unknown';

    // Sender / Receiver
    const senderElem = document.getElementById('res-sender');
    if (senderElem) senderElem.textContent = shipment.sender_name || 'N/A';
    const receiverElem = document.getElementById('res-receiver');
    if (receiverElem) receiverElem.textContent = shipment.receiver_name || 'N/A';

    // Timestamp
    const updatedElem = document.getElementById('res-updated');
    if (updatedElem) updatedElem.textContent = shipment.updated_at || new Date().toLocaleString();

    // Status badge & timeline
    updateStatusBadge(shipment.status);
    updateTimeline(shipment.status, shipment.progress || 50);

    resultDiv.classList.remove('hidden');
    setTimeout(() => resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    if (typeof AOS !== 'undefined') setTimeout(() => AOS.refresh(), 150);
}

function updateStatusBadge(status) {
    const badge = document.getElementById('res-status-badge');
    if (!badge) return;

    const s = status.toLowerCase();
    let bgClass = 'bg-orange-100 text-orange-700';
    let dotColor = 'bg-orange-500';
    if (s.includes('delivered')) { bgClass = 'bg-green-100 text-green-700'; dotColor = 'bg-green-500'; }
    else if (s.includes('transit')) { bgClass = 'bg-blue-100 text-blue-700'; dotColor = 'bg-blue-500'; }
    else if (s.includes('out for delivery')) { bgClass = 'bg-purple-100 text-purple-700'; dotColor = 'bg-purple-500'; }

    badge.className = `inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold ${bgClass}`;
    badge.innerHTML = `
        <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 ${dotColor}"></span>
        </span>
        ${status}
    `;
}

function updateTimeline(status, progressPercent) {
    const progressBar = document.getElementById('res-progress');
    if (progressBar) setTimeout(() => progressBar.style.width = `${progressPercent}%`, 50);

    const steps = document.querySelectorAll('.timeline-step');
    if (!steps.length) return;

    const s = status.toLowerCase();
    let activeIndex = 2; // default In Transit
    if (s.includes('pending')) activeIndex = 0;
    else if (s.includes('processing')) activeIndex = 1;
    else if (s.includes('transit')) activeIndex = 2;
    else if (s.includes('out for delivery')) activeIndex = 3;
    else if (s.includes('delivered')) activeIndex = 4;

    steps.forEach((step, idx) => {
        step.classList.remove('completed', 'active');
        const icon = step.querySelector('.step-icon');
        const label = step.querySelector('p');
        if (idx < activeIndex) {
            step.classList.add('completed');
            if (icon) { icon.innerHTML = '<i class="fa-solid fa-check text-sm"></i>'; icon.classList.add('bg-[#d40511]', 'text-white', 'border-[#d40511]'); icon.classList.remove('bg-white', 'border-[#d40511]', 'text-[#d40511]'); }
            if (label) label.classList.add('text-black');
        } else if (idx === activeIndex) {
            step.classList.add('active');
            if (icon) { icon.innerHTML = getStepIcon(idx); icon.classList.add('bg-white', 'border-[#d40511]', 'text-[#d40511]'); icon.classList.remove('bg-[#d40511]', 'text-white'); }
            if (label) label.classList.add('text-[#d40511]');
        } else {
            if (icon) { icon.innerHTML = '<i class="fa-regular fa-circle text-gray-400"></i>'; icon.classList.add('bg-gray-100', 'border-gray-200'); icon.classList.remove('bg-[#d40511]', 'text-white', 'border-[#d40511]'); }
            if (label) label.classList.add('text-gray-400');
        }
    });
}

function getStepIcon(stepIndex) {
    const icons = ['fa-clipboard-list', 'fa-gear', 'fa-truck-fast', 'fa-box', 'fa-circle-check'];
    return `<i class="fa-solid ${icons[stepIndex] || 'fa-truck'}"></i>`;
}

// ---------- ERROR DISPLAY ----------
function showTrackingError(message) {
    const errorDiv = document.getElementById('track-error');
    if (errorDiv) {
        const msgElem = errorDiv.querySelector('p');
        if (msgElem) msgElem.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    } else {
        alert(message); // fallback
    }
}

// ---------- UTILITIES ----------
function fillDemoId(id) {
    const input = document.getElementById('tracking-id-input');
    if (input) {
        input.value = id;
        const form = document.getElementById('tracking-form');
        if (form) form.dispatchEvent(new Event('submit'));
    }
}

function copyTrackingLink() {
    if (!currentShipment) return;
    const url = `${window.location.origin}${window.location.pathname}?tracking=${currentShipment.tracking_id}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => alert('Tracking link copied!')).catch(() => alert('Failed to copy'));
    } else {
        alert('Press Ctrl+C to copy: ' + url);
    }
}

function saveRecentSearch(trackingId, status) {
    try {
        let recent = JSON.parse(localStorage.getItem('recent_tracking') || '[]');
        recent.unshift({ id: trackingId, status, timestamp: new Date().toISOString() });
        recent = recent.slice(0, 5);
        localStorage.setItem('recent_tracking', JSON.stringify(recent));
    } catch (e) { /* ignore */ }
}

function updateUrlWithTracking(trackingId) {
    if (history.pushState) {
        const newUrl = `${window.location.pathname}?tracking=${trackingId}`;
        history.pushState({ trackingId }, '', newUrl);
    }
}

function checkForPrefill() {
    const urlParams = new URLSearchParams(window.location.search);
    let trackingId = urlParams.get('tracking');
    if (trackingId) {
        const input = document.getElementById('tracking-id-input');
        if (input) input.value = trackingId;
        setTimeout(() => {
            const form = document.getElementById('tracking-form');
            if (form) form.dispatchEvent(new Event('submit'));
        }, 300);
        return;
    }
    trackingId = sessionStorage.getItem('prefill_tracking_id');
    if (trackingId) {
        const input = document.getElementById('tracking-id-input');
        if (input) input.value = trackingId;
        sessionStorage.removeItem('prefill_tracking_id');
        setTimeout(() => {
            const form = document.getElementById('tracking-form');
            if (form) form.dispatchEvent(new Event('submit'));
        }, 300);
    }
}

// ---------- MOBILE MENU & BACK TO TOP ----------
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        document.addEventListener('click', (e) => {
            if (!mobileMenu.classList.contains('hidden') && !mobileMenu.contains(e.target) && !menuBtn.contains(e.target))
                mobileMenu.classList.add('hidden');
        });
    }
}

function setupBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) btn.classList.add('visible');
        else btn.classList.remove('visible');
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// Expose functions globally
window.trackShipment = trackShipment;
window.fillDemoId = fillDemoId;
window.copyTrackingLink = copyTrackingLink;