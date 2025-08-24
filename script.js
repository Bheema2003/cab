// Simple notification system
function showNotification(message, type = 'success') {
    alert(message); // Simple fallback
}

// API base - supports localhost and Netlify
function resolveApiBase() {
    // For local development, use localhost:3000
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    // For Netlify/production, use the meta tag
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content && meta.content.trim().length > 0) {
        return meta.content.trim().replace(/\/$/, '');
    }
    // Fallback
    return 'https://cab-9wdp.onrender.com';
}

const API_BASE = resolveApiBase();
console.log('🌐 API_BASE resolved to:', API_BASE);
console.log('📍 Current location:', location.href);

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'avbcabz',
    password: 'avbcabz2025'
};

// Handle form submission
async function handleBookingSubmission(formData, formType) {
    try {
        console.log('🚀 Starting booking submission...');
        console.log('📤 Form data:', formData);
        
        showNotification('Submitting booking...', 'info');
        
        const response = await fetch(`${API_BASE}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                serviceType: formType
            })
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', response.headers);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('📥 Response text:', responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            throw new Error('Invalid response from server');
        }

        console.log('📥 Parsed result:', result);

        if (result.success) {
            showNotification('Thank you for booking a cab. We will assign a cab for you shortly.', 'success');
            
            // Reset form
            const form = document.getElementById(formType.toLowerCase() + 'Form');
            if (form) {
                form.reset();
            }
        } else {
            throw new Error(result.message || 'Failed to save booking');
        }
        
    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        showNotification(`Booking failed: ${error.message}`, 'error');
    }
}

// Admin modal functions
function openAdminLoginModal() {
    console.log('🚪 Opening admin login modal...');
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('adminLoginForm');
        if (form) form.reset();
    }
}

function openAdminDashboard() {
    console.log('📊 Opening admin dashboard...');
    const modal = document.getElementById('adminDashboardModal');
    if (modal) {
        modal.style.display = 'block';
        loadAdminBookings();
    }
}

function closeAdminDashboard() {
    const modal = document.getElementById('adminDashboardModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Admin login handler
function handleAdminLogin(e) {
    e.preventDefault();
    console.log('🔐 Admin login attempt...');
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        console.log('✅ Admin login successful!');
        closeAdminLoginModal();
        openAdminDashboard();
        showNotification('Admin login successful!', 'success');
    } else {
        console.log('❌ Admin login failed');
        showNotification('Invalid username or password!', 'error');
    }
}

// Load admin bookings
async function loadAdminBookings() {
    try {
        console.log('🔄 Loading admin bookings...');
        
        const response = await fetch(`${API_BASE}/api/bookings`);
        
        console.log('📥 Admin response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('📥 Admin response text:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Admin JSON parse error:', parseError);
            throw new Error('Invalid response from server');
        }

        console.log('📥 Admin parsed data:', data);

        if (data.success) {
            displayAdminBookings(data.bookings);
            updateAdminStats(data.bookings);
        } else {
            throw new Error(data.message || 'Failed to load bookings');
        }
    } catch (error) {
        console.error('❌ Error loading admin bookings:', error);
        const container = document.getElementById('adminBookingsContainer');
        if (container) {
            container.innerHTML = `<div class="error">Failed to load bookings: ${error.message}</div>`;
        }
    }
}

// Display admin bookings
function displayAdminBookings(bookings) {
    const container = document.getElementById('adminBookingsContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = `<div class="no-bookings">No bookings found</div>`;
        return;
    }

    let tableHTML = `
        <table class="bookings-table">
            <thead>
                <tr>
                    <th>Service Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Contact</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
    `;

    bookings.forEach(booking => {
        const createdDate = new Date(booking.createdAt).toLocaleString();
        const pickupDate = new Date(booking.pickupDate).toLocaleDateString();
        
        tableHTML += `
            <tr>
                <td><strong>${booking.serviceType}</strong></td>
                <td>${booking.pickupFrom}</td>
                <td>${booking.destination}</td>
                <td>${pickupDate}</td>
                <td>${booking.pickupTime}</td>
                <td>${booking.contactNumber}</td>
                <td>${createdDate}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// Update admin statistics
function updateAdminStats(bookings) {
    console.log('🔄 Updating admin stats with bookings:', bookings);
    
    const totalBookings = bookings.length;
    
    const today = new Date().toDateString();
    const todayBookings = bookings.filter(booking => 
        new Date(booking.createdAt).toDateString() === today
    ).length;
    
    const airportBookings = bookings.filter(booking => 
        booking.serviceType === 'Airport'
    ).length;

    // Update the statistics in the admin dashboard
    const totalElement = document.getElementById('totalBookings');
    const todayElement = document.getElementById('todayBookings');
    const airportElement = document.getElementById('airportBookings');
    
    console.log('🔍 Looking for stat elements:', {
        totalElement: !!totalElement,
        todayElement: !!todayElement,
        airportElement: !!airportElement
    });
    
    if (totalElement) {
        totalElement.textContent = totalBookings;
        console.log('✅ Updated totalBookings to:', totalBookings);
    } else {
        console.error('❌ totalBookings element not found!');
    }
    
    if (todayElement) {
        todayElement.textContent = todayBookings;
        console.log('✅ Updated todayBookings to:', todayBookings);
    } else {
        console.error('❌ todayBookings element not found!');
    }
    
    if (airportElement) {
        airportElement.textContent = airportBookings;
        console.log('✅ Updated airportBookings to:', airportBookings);
    } else {
        console.error('❌ airportBookings element not found!');
    }
    
    console.log('📊 Stats updated:', { totalBookings, todayBookings, airportBookings });
}

// Delete booking function
async function deleteBooking(id) {
    if (!id || !confirm('Delete this booking?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/bookings/${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const responseText = await res.text();
        console.log('📥 Delete response text:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Delete JSON parse error:', parseError);
            throw new Error('Invalid response from server');
        }

        if (data.success) {
            showNotification('Booking deleted', 'success');
            await loadAdminBookings();
        } else {
            throw new Error(data.message || 'Delete failed');
        }
    } catch (err) {
        console.error('Error deleting booking:', err);
        showNotification(`Failed to delete: ${err.message}`, 'error');
    }
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded successfully');
    
    // Airport form submission
    const airportForm = document.getElementById('airportForm');
    console.log('🔍 Looking for airportForm:', airportForm);
    
    if (airportForm) {
        console.log('✅ Found airportForm, adding submit listener');
        airportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Form submitted!');
            
            const bookingData = {
                pickupFrom: document.getElementById('airportPickupFrom').value,
                destination: document.getElementById('airportDestination').value,
                pickupDate: document.getElementById('airportPickupDate').value,
                pickupTime: document.getElementById('airportPickupTime').value,
                contactNumber: document.getElementById('airportContactNumber').value
            };
            
            console.log('📊 Form data:', bookingData);
            await handleBookingSubmission(bookingData, 'Airport');
        });
    } else {
        console.error('❌ airportForm not found!');
    }

    // Admin login button
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    console.log('🔍 Looking for adminLoginBtn:', adminLoginBtn);
    
    if (adminLoginBtn) {
        console.log('✅ Found adminLoginBtn, adding click listener');
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👆 Admin login button clicked!');
            openAdminLoginModal();
        });
    } else {
        console.error('❌ adminLoginBtn not found!');
    }

    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    console.log('🔍 Looking for adminLoginForm:', adminLoginForm);
    
    if (adminLoginForm) {
        console.log('✅ Found adminLoginForm, adding submit listener');
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    } else {
        console.error('❌ adminLoginForm not found!');
    }

    // Close buttons
    const closeAdminModal = document.getElementById('closeAdminModal');
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', closeAdminLoginModal);
    }

    const closeAdminDashboardBtn = document.getElementById('closeAdminDashboard');
    if (closeAdminDashboardBtn) {
        closeAdminDashboardBtn.addEventListener('click', closeAdminDashboard);
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const adminLoginModal = document.getElementById('adminLoginModal');
        const adminDashboardModal = document.getElementById('adminDashboardModal');
        
        if (e.target === adminLoginModal) {
            closeAdminLoginModal();
        }
        if (e.target === adminDashboardModal) {
            closeAdminDashboard();
        }
    });

    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}); 