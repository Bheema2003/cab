// Mobile Navigation Toggle (responsive)
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

// Notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

// API base - supports filesystem, localhost, and Netlify
function resolveApiBase() {
    // 1) <meta name="api-base" content="https://api.example.com">
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content && meta.content.trim().length > 0) {
        return meta.content.trim().replace(/\/$/, '');
    }
    // 2) If hosted on Netlify (or any domain), assume same-origin backend only if it serves the API
    // Most static hosts cannot serve the API, so default to localhost in dev
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return location.origin;
    }
    // 3) Fallback to a relative proxy path if configured via Netlify redirects
    // e.g., set a Netlify _redirects rule: /api/*  http://localhost:3000/api/:splat  200
    return '';
}

const API_BASE = resolveApiBase();

// Form validation function
function validateBookingForm(data, formType) {
    const errors = [];
    
    if (!data.pickupFrom || data.pickupFrom.trim() === '') {
        errors.push('Pickup location is required');
    }
    
    if (!data.destination || data.destination.trim() === '') {
        errors.push('Destination is required');
    }
    
    if (!data.pickupDate) {
        errors.push('Pickup date is required');
    } else {
        const selectedDate = new Date(data.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            errors.push('Pickup date cannot be in the past');
        }
    }
    
    if (!data.pickupTime || data.pickupTime.trim() === '') {
        errors.push('Pickup time is required');
    } else {
        // Basic time format validation (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(data.pickupTime)) {
            errors.push('Please enter time in HH:MM format (e.g., 14:30)');
        }
    }
    
    if (!data.contactNumber || data.contactNumber.trim() === '') {
        errors.push('Contact number is required');
    } else {
        // Basic phone number validation
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(data.contactNumber.replace(/\s/g, ''))) {
            errors.push('Please enter a valid contact number');
        }
    }
    
    return errors;
}

// Format booking message for display
function formatBookingMessage(data, formType) {
    return `
        <strong>${formType} Booking Confirmed!</strong><br>
        <strong>From:</strong> ${data.pickupFrom}<br>
        <strong>To:</strong> ${data.destination}<br>
        <strong>Date:</strong> ${data.pickupDate}<br>
        <strong>Time:</strong> ${data.pickupTime}<br>
        <strong>Contact:</strong> ${data.contactNumber}<br><br>
        We'll contact you shortly to confirm your booking!
    `;
}

// Handle form submission
async function handleBookingSubmission(formData, formType) {
    try {
        // Show fast, unobtrusive loading message
        showNotification('Submitting booking...', 'info');
        
        // Send data to server
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

        const result = await response.json();

        if (result.success) {
            // Show success popup with a clear confirmation message
            const confirmationText = 'Thank you for booking a cab. We will assign a cab for you shortly.';
            if (typeof showSuccessPopup === 'function') {
                showSuccessPopup(confirmationText);
            } else {
                // Fallback to toast notification if popup system not available
                showNotification(confirmationText, 'success');
            }
            
            // Reset form
            const form = document.getElementById(formType.toLowerCase() + 'Form');
            if (form) {
                form.reset();
            }
            
            // Log success
            console.log('✅ Booking saved successfully:', result);
            // If admin dashboard is open, refresh it
            if (document.getElementById('adminDashboardModal')?.style.display === 'block') {
                try { await loadAdminBookings(); } catch (_) {}
            }
        } else {
            throw new Error(result.message || 'Failed to save booking');
        }
        
    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        showNotification(`Booking failed: ${error.message}`, 'error');
    }
}

// Admin authentication
const ADMIN_CREDENTIALS = {
    username: 'avbcabz',
    password: 'avbcabz2025'
};

let isAdminLoggedIn = false;

// Admin modal functionality
function openAdminLoginModal() {
    document.getElementById('adminLoginModal').style.display = 'block';
}

function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').style.display = 'none';
    // Clear form
    document.getElementById('adminLoginForm').reset();
}

function openAdminDashboard() {
    document.getElementById('adminDashboardModal').style.display = 'block';
    loadAdminBookings();
}

function closeAdminDashboard() {
    document.getElementById('adminDashboardModal').style.display = 'none';
}

// Admin login form handler
function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdminLoggedIn = true;
        closeAdminLoginModal();
        openAdminDashboard();
        showNotification('Admin login successful!', 'success');
    } else {
        showNotification('Invalid username or password!', 'error');
    }
}

// Load admin bookings
async function loadAdminBookings() {
    try {
        const response = await fetch(`${API_BASE}/api/bookings`);
        const data = await response.json();

        if (data.success) {
            displayAdminBookings(data.bookings);
            updateAdminStats(data.bookings);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading admin bookings:', error);
        document.getElementById('adminBookingsContainer').innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                Failed to load bookings: ${error.message}
            </div>
        `;
    }
}

// Removed delete-all functionality per request

// Delete single booking
async function deleteBooking(id) {
    if (!id) return;
    if (!confirm('Delete this booking?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/bookings/${id}`, { method: 'DELETE' });
        const data = await res.json();
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

// Display admin bookings
function displayAdminBookings(bookings) {
    const container = document.getElementById('adminBookingsContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-inbox"></i>
                No bookings found
            </div>
        `;
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
                    <th>Status</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
    `;

    bookings.forEach(booking => {
        const createdDate = new Date(booking.createdAt).toLocaleString();
        const pickupDate = new Date(booking.pickupDate).toLocaleDateString();
        const id = booking._id || booking.id;
        
        tableHTML += `
            <tr>
                <td><strong>${booking.serviceType}</strong></td>
                <td>${booking.pickupFrom}</td>
                <td>${booking.destination}</td>
                <td>${pickupDate}</td>
                <td>${booking.pickupTime}</td>
                <td>${booking.contactNumber}</td>
                <td><span class="status-badge status-new">New</span></td>
                <td>
                    ${createdDate}
                    <div style="margin-top:6px">
                        <button class="refresh-btn" style="background:#ef4444" onclick="deleteBooking('${id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
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
    const totalBookings = bookings.length;
    
    const today = new Date().toDateString();
    const todayBookings = bookings.filter(booking => 
        new Date(booking.createdAt).toDateString() === today
    ).length;
    
    const airportBookings = bookings.filter(booking => 
        booking.serviceType === 'Airport'
    ).length;

    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('todayBookings').textContent = todayBookings;
    document.getElementById('airportBookings').textContent = airportBookings;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded successfully');
    
    // Handle Airport booking form submission
    const airportForm = document.getElementById('airportForm');
    if (airportForm) {
        airportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect form data
            const bookingData = {
                pickupFrom: document.getElementById('airportPickupFrom').value,
                destination: document.getElementById('airportDestination').value,
                pickupDate: document.getElementById('airportPickupDate').value,
                pickupTime: document.getElementById('airportPickupTime').value,
                contactNumber: document.getElementById('airportContactNumber').value
            };
            
            // Validate form data
            const errors = validateBookingForm(bookingData, 'Airport');
            if (errors.length > 0) {
                showNotification(`Please fix the following errors:\n${errors.join('\n')}`, 'error');
                return;
            }
            
            // Submit booking
            await handleBookingSubmission(bookingData, 'Airport');
        });
    }

    // Slider functionality
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    function showSlide(index) {
        // Hide all slides
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Show current slide
        if (slides[index]) {
            slides[index].classList.add('active');
        }
        if (indicators[index]) {
            indicators[index].classList.add('active');
        }
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // Initialize slider
    if (slides.length > 0) {
        showSlide(0);
        
        // Auto slide every 5 seconds
        setInterval(nextSlide, 5000);

        // Event listeners for slider buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
        }

        // Indicator clicks
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });
    }

    // Booking tabs functionality
    const bookingTabs = document.querySelectorAll('.booking-tab');
    const bookingForms = document.querySelectorAll('.booking-form');

    bookingTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const formType = tab.getAttribute('data-type');
            
            // Remove active class from all tabs and forms
            bookingTabs.forEach(t => t.classList.remove('active'));
            bookingForms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding form
            const targetForm = document.getElementById(formType + 'Form');
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    // Swap button functionality for Airport form
    function initializeSwapButton(fromInputId, toInputId, swapBtnSelector) {
        const swapBtn = document.querySelector(swapBtnSelector);
        const fromInput = document.getElementById(fromInputId);
        const toInput = document.getElementById(toInputId);
        
        if (swapBtn && fromInput && toInput) {
            swapBtn.addEventListener('click', () => {
                const fromValue = fromInput.value;
                const toValue = toInput.value;
                
                if (toValue.trim()) {
                    fromInput.value = toValue;
                    toInput.value = fromValue;
                }
            });
        }
    }

    // Initialize swap button for Airport form
    initializeSwapButton('airportPickupFrom', 'airportDestination', '#airportForm .swap-btn');

    // Date validation for Airport form
    const dateInput = document.getElementById('airportPickupDate');
    if (dateInput) {
        // Set minimum date for pickup to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Enhanced smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight - 20; // Extra 20px padding
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            } else if (targetId === '#home') {
                // Special handling for HOME link - scroll to very top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add some interactive animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-item, .route-column, .footer-section');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Floating icons functionality
    const floatingIcons = document.querySelectorAll('.floating-icon');
    floatingIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            // Allow default behavior to open WhatsApp/phone
        });
    });

    // Read more button functionality
    const readMoreBtn = document.querySelector('.read-more-btn');
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', () => {
            showNotification('More information about our services will be available soon!', 'info');
        });
    }

    // Admin login button
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAdminLoginModal();
        });
    }

    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }

    // Close admin login modal
    const closeAdminModal = document.getElementById('closeAdminModal');
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', closeAdminLoginModal);
    }

    // Close admin dashboard
    const closeAdminDashboardBtn = document.getElementById('closeAdminDashboard');
    if (closeAdminDashboardBtn) {
        closeAdminDashboardBtn.addEventListener('click', () => closeAdminDashboard());
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
});

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add loading animation for page
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}); 