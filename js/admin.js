// ==========================================
// CORETRANSIT ADMIN DASHBOARD LOGIC
// ==========================================

// Current shipments data
let shipmentsData = [];
let currentEditId = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 Admin Dashboard initialized');

    // Load shipments on page load
    loadShipments();

    // Set up create shipment form
    setupCreateForm();

    // Set up edit shipment form
    setupEditForm();

    // Check Supabase connection
    checkConnection();
});

// Check Supabase connection status
function checkConnection() {
    if (isSupabaseAvailable()) {
        console.log('✅ Supabase connected - using live database');
        showToast('Connected to database', 'success');
    } else {
        console.log('⚠️ Using mock data - Supabase not configured');
        showToast('Using demo mode - configure Supabase for live data', 'info');
    }
}

// Load all shipments
async function loadShipments() {
    const tableBody = document.getElementById('shipments-table-body');

    try {
        let data = null;

        if (isSupabaseAvailable() && supabaseClient) {
            const { data: supabaseData, error } = await supabaseClient
                .from('shipments')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            data = supabaseData;
        } else {
            // Use mock data with simulated delay
            await new Promise(resolve => setTimeout(resolve, 500));
            data = MOCK_ALL_SHIPMENTS || [];
        }

        shipmentsData = data || [];
        renderShipmentsTable(shipmentsData);
        updateStats(shipmentsData);

    } catch (error) {
        console.error('Error loading shipments:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-red-500">
                    <i class="fa-solid fa-circle-exclamation text-2xl mb-2"></i>
                    <p>Failed to load shipments. Please try again.</p>
                    <button onclick="loadShipments()" class="mt-4 text-accent hover:underline">Retry</button>
                </td>
            </tr>
        `;
    }
}

// Render shipments table
function renderShipmentsTable(shipments) {
    const tableBody = document.getElementById('shipments-table-body');

    if (!shipments || shipments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fa-solid fa-box-open text-3xl mb-3 opacity-30"></i>
                    <p>No shipments found. Create your first shipment above.</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = shipments.map(shipment => `
        <tr class="admin-table-row hover:bg-gray-50 transition">
            <td class="px-6 py-4">
                <span class="font-mono font-semibold text-primary">${shipment.tracking_id || 'N/A'}</span>
            </td>
            <td class="px-6 py-4 text-gray-700">${shipment.sender_name || 'N/A'}</td>
            <td class="px-6 py-4 text-gray-700">${shipment.receiver_name || 'N/A'}</td>
            <td class="px-6 py-4">
                <span class="status-badge ${getStatusClass(shipment.status)}">${shipment.status || 'Pending'}</span>
            </td>
            <td class="px-6 py-4 text-gray-600">${shipment.location || 'N/A'}</td>
            <td class="px-6 py-4 text-gray-500 text-sm">${formatDate(shipment.updated_at) || 'Just now'}</td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                    <button onclick='openEditModal(${JSON.stringify(shipment)})' 
                        class="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center justify-center"
                        title="Edit">
                        <i class="fa-solid fa-pen text-xs"></i>
                    </button>
                    <button onclick="deleteShipment('${shipment.id}', '${shipment.tracking_id}')" 
                        class="w-8 h-8 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                        title="Delete">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update statistics cards
function updateStats(shipments) {
    const total = shipments.length;
    const inTransit = shipments.filter(s => s.status === 'In Transit').length;
    const delivered = shipments.filter(s => s.status === 'Delivered').length;
    const pending = shipments.filter(s => s.status === 'Pending').length;

    document.getElementById('total-shipments').textContent = total;
    document.getElementById('in-transit-count').textContent = inTransit;
    document.getElementById('delivered-count').textContent = delivered;
    document.getElementById('pending-count').textContent = pending;
}

// Get status CSS class
function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('delivered')) return 'status-delivered';
    if (statusLower.includes('transit')) return 'status-transit';
    if (statusLower.includes('out for delivery')) return 'status-outfordelivery';
    return 'status-pending';
}

// Set up create shipment form
function setupCreateForm() {
    const form = document.getElementById('create-shipment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const trackingId = document.getElementById('new-tracking-id').value.trim().toUpperCase();
        const sender = document.getElementById('new-sender').value.trim();
        const receiver = document.getElementById('new-receiver').value.trim();
        const status = document.getElementById('new-status').value;
        const location = document.getElementById('new-location').value.trim();

        if (!trackingId || !sender || !receiver || !status || !location) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        const newShipment = {
            tracking_id: trackingId,
            sender_name: sender,
            receiver_name: receiver,
            status: status,
            location: location,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        try {
            if (isSupabaseAvailable() && supabaseClient) {
                const { data, error } = await supabaseClient
                    .from('shipments')
                    .insert([newShipment])
                    .select();

                if (error) throw error;

                // Add to local data
                if (data && data[0]) {
                    shipmentsData.unshift(data[0]);
                }
            } else {
                // Mock creation
                newShipment.id = 'mock-' + Date.now();
                shipmentsData.unshift(newShipment);
            }

            // Refresh table
            renderShipmentsTable(shipmentsData);
            updateStats(shipmentsData);

            // Reset form
            form.reset();

            showToast(`Shipment ${trackingId} created successfully!`, 'success');

        } catch (error) {
            console.error('Error creating shipment:', error);
            showToast('Failed to create shipment. Please try again.', 'error');
        }
    });
}

// Open edit modal
function openEditModal(shipment) {
    currentEditId = shipment.id;

    document.getElementById('edit-id').value = shipment.id;
    document.getElementById('edit-tracking-id').value = shipment.tracking_id || '';
    document.getElementById('edit-sender').value = shipment.sender_name || '';
    document.getElementById('edit-receiver').value = shipment.receiver_name || '';
    document.getElementById('edit-status').value = shipment.status || 'Pending';
    document.getElementById('edit-location').value = shipment.location || '';

    document.getElementById('edit-modal').classList.remove('hidden');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
    currentEditId = null;
}

// Set up edit shipment form
function setupEditForm() {
    const form = document.getElementById('edit-shipment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;
        const trackingId = document.getElementById('edit-tracking-id').value.trim().toUpperCase();
        const sender = document.getElementById('edit-sender').value.trim();
        const receiver = document.getElementById('edit-receiver').value.trim();
        const status = document.getElementById('edit-status').value;
        const location = document.getElementById('edit-location').value.trim();

        const updatedShipment = {
            tracking_id: trackingId,
            sender_name: sender,
            receiver_name: receiver,
            status: status,
            location: location,
            updated_at: new Date().toISOString()
        };

        try {
            if (isSupabaseAvailable() && supabaseClient) {
                const { error } = await supabaseClient
                    .from('shipments')
                    .update(updatedShipment)
                    .eq('id', id);

                if (error) throw error;
            }

            // Update local data
            const index = shipmentsData.findIndex(s => s.id == id);
            if (index !== -1) {
                shipmentsData[index] = { ...shipmentsData[index], ...updatedShipment };
            }

            // Refresh table
            renderShipmentsTable(shipmentsData);
            updateStats(shipmentsData);

            closeEditModal();
            showToast(`Shipment ${trackingId} updated successfully!`, 'success');

        } catch (error) {
            console.error('Error updating shipment:', error);
            showToast('Failed to update shipment. Please try again.', 'error');
        }
    });
}

// Delete shipment
async function deleteShipment(id, trackingId) {
    if (!confirm(`Are you sure you want to delete shipment ${trackingId}? This action cannot be undone.`)) {
        return;
    }

    try {
        if (isSupabaseAvailable() && supabaseClient) {
            const { error } = await supabaseClient
                .from('shipments')
                .delete()
                .eq('id', id);

            if (error) throw error;
        }

        // Remove from local data
        shipmentsData = shipmentsData.filter(s => s.id != id);

        // Refresh table
        renderShipmentsTable(shipmentsData);
        updateStats(shipmentsData);

        showToast(`Shipment ${trackingId} deleted successfully!`, 'success');

    } catch (error) {
        console.error('Error deleting shipment:', error);
        showToast('Failed to delete shipment. Please try again.', 'error');
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            ${type === 'success' ? '<i class="fa-solid fa-check-circle text-green-500"></i>' : ''}
            ${type === 'error' ? '<i class="fa-solid fa-exclamation-circle text-red-500"></i>' : ''}
            ${type === 'info' ? '<i class="fa-solid fa-info-circle text-blue-500"></i>' : ''}
            <span class="text-gray-700">${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

// Close modal on escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
});

// Export functions for global use
window.loadShipments = loadShipments;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.deleteShipment = deleteShipment;