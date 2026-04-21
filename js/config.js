// ==========================================
// CORETRANSIT CONFIGURATION
// ==========================================

// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://iodjosnaoybffmgkmbht.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGpvc25hb3liZmZtZ2ttYmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3Nzc5NTYsImV4cCI6MjA5MjM1Mzk1Nn0.2zaHGxbJK4IXCP8A0RKnup1LOBoqd1a5rIv4tkpKf34'
};

// App Configuration
const APP_CONFIG = {
    name: 'CoreTransit',
    version: '1.0.0',
    environment: 'development',
    enableMockData: false,
    debug: true
};

// Mock Data for Development
const MOCK_SHIPMENTS = {
    'COR-84729': {
        id: '1',
        tracking_id: 'COR-84729',
        sender_name: 'GlobalTech Industries',
        receiver_name: 'Acme Corp Ltd.',
        status: 'In Transit',
        location: 'Dubai Logistics Hub, UAE',
        updated_at: new Date().toLocaleString(),
        progress: 60
    },
    'COR-19384': {
        id: '2',
        tracking_id: 'COR-19384',
        sender_name: 'Samsung Electronics',
        receiver_name: 'Retail Partners Inc.',
        status: 'Delivered',
        location: 'New York Distribution Center, USA',
        updated_at: new Date(Date.now() - 86400000).toLocaleString(),
        progress: 100
    },
    'COR-56192': {
        id: '3',
        tracking_id: 'COR-56192',
        sender_name: 'Philips Healthcare',
        receiver_name: 'MediCare Solutions',
        status: 'Pending',
        location: 'Amsterdam Warehouse, Netherlands',
        updated_at: new Date().toLocaleString(),
        progress: 10
    },
    'COR-72941': {
        id: '4',
        tracking_id: 'COR-72941',
        sender_name: 'ASICS Corporation',
        receiver_name: 'Sports Direct UK',
        status: 'Out for Delivery',
        location: 'London Distribution Center, UK',
        updated_at: new Date().toLocaleString(),
        progress: 85
    }
};

// All shipments list for admin dashboard
const MOCK_ALL_SHIPMENTS = [
    {
        id: '1',
        tracking_id: 'COR-84729',
        sender_name: 'GlobalTech Industries',
        receiver_name: 'Acme Corp Ltd.',
        status: 'In Transit',
        location: 'Dubai Logistics Hub, UAE',
        updated_at: new Date().toLocaleString()
    },
    {
        id: '2',
        tracking_id: 'COR-19384',
        sender_name: 'Samsung Electronics',
        receiver_name: 'Retail Partners Inc.',
        status: 'Delivered',
        location: 'New York Distribution Center, USA',
        updated_at: new Date(Date.now() - 86400000).toLocaleString()
    },
    {
        id: '3',
        tracking_id: 'COR-56192',
        sender_name: 'Philips Healthcare',
        receiver_name: 'MediCare Solutions',
        status: 'Pending',
        location: 'Amsterdam Warehouse, Netherlands',
        updated_at: new Date().toLocaleString()
    },
    {
        id: '4',
        tracking_id: 'COR-72941',
        sender_name: 'ASICS Corporation',
        receiver_name: 'Sports Direct UK',
        status: 'Out for Delivery',
        location: 'London Distribution Center, UK',
        updated_at: new Date().toLocaleString()
    },
    {
        id: '5',
        tracking_id: 'COR-38265',
        sender_name: 'Sony Entertainment',
        receiver_name: 'GameStop Distribution',
        status: 'In Transit',
        location: 'Tokyo Logistics Center, Japan',
        updated_at: new Date(Date.now() - 43200000).toLocaleString()
    }
];

// Status Options for Dropdowns
const SHIPMENT_STATUSES = [
    { value: 'Pending', label: 'Pending', color: 'status-pending' },
    { value: 'In Transit', label: 'In Transit', color: 'status-transit' },
    { value: 'Out for Delivery', label: 'Out for Delivery', color: 'status-outfordelivery' },
    { value: 'Delivered', label: 'Delivered', color: 'status-delivered' }
];

// Initialize Supabase Client
let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase SDK not loaded.');
        return false;
    }

    try {
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client initialized');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        return false;
    }
}

function isSupabaseAvailable() {
    return supabaseClient !== null;
}

function getSupabase() {
    return supabaseClient;
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function () {
    initSupabase();
    console.log(`🚀 ${APP_CONFIG.name} v${APP_CONFIG.version} initialized`);
});