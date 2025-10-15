// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#1e3a8a'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
}

// Success popup system
function showSuccessPopup(message) {
    console.log('showSuccessPopup called with message:', message);
    
    // Remove existing popups
    const existingPopups = document.querySelectorAll('.success-popup');
    existingPopups.forEach(popup => popup.remove());

    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    // Create popup content
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Booking Successful!</h3>
            <p>${message}</p>
            <button class="popup-close-btn">OK</button>
        </div>
    `;
    popup.style.cssText = `
        background: rgba(0, 0, 0, 0.6);
        padding: 2rem;
        border-radius: 15px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: popupSlideIn 0.3s ease;
    `;

    // Add to page
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Close functionality
    const closeBtn = popup.querySelector('.popup-close-btn');
    const closePopup = () => {
        overlay.style.animation = 'fadeOut 0.3s ease';
        popup.style.animation = 'popupSlideOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    };

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });

    // Auto close after 8 seconds
    setTimeout(closePopup, 8000);
}

// Form validation
function validateBookingForm(data, formType) {
    if (formType === 'Airport') {
        if (!data.customerName || data.customerName.trim() === '') {
            showNotification('Please enter your name.', 'error');
            return false;
        }
        if (!data.pickupFrom || data.pickupFrom.trim() === '') {
            showNotification('Please enter pickup location.', 'error');
            return false;
        }
        
        if (!data.destination || data.destination.trim() === '') {
            showNotification('Please enter your drop location.', 'error');
            return false;
        }
        
        if (!data.contactNumber || data.contactNumber.trim() === '') {
            showNotification('Please enter your contact number.', 'error');
            return false;
        }
        
        // Validate phone number format
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(data.contactNumber.replace(/\s/g, ''))) {
            showNotification('Please enter a valid 10-digit contact number.', 'error');
            return false;
        }
    }
    
    // Common validations
    const dateField = data.pickupDate || data.departureDate;
    if (!dateField) {
        showNotification('Please select date.', 'error');
        return false;
    }
    
    const timeField = data.pickupTime || data.departureTime;
    if (!timeField) {
        showNotification('Please select time.', 'error');
        return false;
    }
    
    // Validate date
    const pickupDate = new Date(dateField);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (pickupDate < today) {
        showNotification('Date cannot be in the past.', 'error');
        return false;
    }
    
    return true;
}

// Function to format booking message for WhatsApp
function formatBookingMessage(data, formType) {
    let message = `🚕 *NEW CAB BOOKING REQUEST* 🚕\n\n`;
    message += `*Service Type:* ${formType}\n\n`;
    
    if (formType === 'Airport') {
        message += `*Pickup Location:* ${data.pickupFrom}\n`;
        message += `*Drop Location:* ${data.destination}\n`;
        message += `*Pickup Date:* ${data.pickupDate}\n`;
        message += `*Pickup Time:* ${data.pickupTime}\n`;
        message += `*Contact Number:* ${data.contactNumber}\n`;
    }
    
    message += `\n*Booking Time:* ${new Date().toLocaleString('en-IN')}\n`;
    message += `*Website:* AVB Cabs - www.avbcabs.com`;
    
    return message;
}

// Production optimizations
const IS_PROD_SITE = (() => {
    try {
        const h = location.hostname;
        return h.endsWith('.netlify.app') || h.endsWith('avbcabs.com') || h.endsWith('www.avbcabs.com') || h === 'avbcab.netlify.app';
    } catch {
        return false;
    }
})();

if (IS_PROD_SITE) {
    ['log','debug','trace'].forEach(k => {
        try { console[k] = () => {}; } catch {}
    });
}

// API base resolution
function resolveApiBase() {
    const hostname = location.hostname;
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // Production domains - use same-origin for proxy
    const isNetlify = hostname.endsWith('.netlify.app') || hostname === 'avbcab.netlify.app';
    const isProdDomain = hostname.endsWith('avbcabs.com') || hostname.endsWith('www.avbcabs.com');
    if (isNetlify || isProdDomain) {
        return '';
    }

    // Use meta tag or fallback
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta?.content?.trim()) {
        return meta.content.trim().replace(/\/$/, '');
    }
    
    return 'https://cab-9wdp.onrender.com';
}

const API_BASE = resolveApiBase();

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'avbcabz',
    password: 'avbcabz2025'
};

// Handle form submission
let isSubmitting = false; // Prevent multiple submissions

async function handleBookingSubmission(formData, formType) {
    // Prevent multiple submissions
    if (isSubmitting) {
        showNotification('Please wait, your booking is being processed...', 'info');
        return;
    }
    
    try {
        isSubmitting = true;
        showNotification('Submitting booking...', 'info');
        
        // Disable submit button and show loading state
        const submitBtn = document.querySelector(`#${formType.toLowerCase()}Form .submit-btn`);
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SUBMITTING...';
        }
        
        const response = await fetch(`${API_BASE}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, serviceType: formType })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            showNotification('Thank you for booking a cab. We will assign a cab for you shortly.', 'success');
            
            // Reset form with delay to ensure success message is shown
            setTimeout(() => {
                const form = document.getElementById(formType.toLowerCase() + 'Form');
                if (form) {
                    form.reset();
                    // Clear any remaining values manually
                    const inputs = form.querySelectorAll('input, textarea, select');
                    inputs.forEach(input => {
                        if (input.type === 'date' || input.type === 'time') {
                            input.value = '';
                        } else if (input.type === 'text' || input.type === 'tel') {
                            input.value = '';
                        } else if (input.type === 'textarea') {
                            input.value = '';
                        }
                    });
                    
                    // Reset default time value for airport form
                    const timeInput = form.querySelector('input[type="time"]');
                    if (timeInput && formType === 'Airport') {
                        timeInput.value = '14:30';
                    }
                }
            }, 1000);
        } else {
            throw new Error(result.message || 'Failed to save booking');
        }
        
    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        showNotification(`Booking failed: ${error.message}`, 'error');
    } finally {
        // Always reset the submission flag and button state
        isSubmitting = false;
        
        // Re-enable submit button
        const submitBtn = document.querySelector(`#${formType.toLowerCase()}Form .submit-btn`);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-search"></i> FIND CAB NEAR ME';
        }
    }
}

// Admin modal functions
function openAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.style.display = 'block';
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
    const modal = document.getElementById('adminDashboardModal');
    if (modal) {
        modal.style.display = 'block';
        loadAdminBookings();
    }
}

function closeAdminDashboard() {
    const modal = document.getElementById('adminDashboardModal');
    if (modal) modal.style.display = 'none';
}

// Admin login handler
function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
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
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

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
                    <th>Name</th>
                    <th>Service Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Contact</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    bookings.forEach(booking => {
        const createdDate = new Date(booking.createdAt).toLocaleString();
        const pickupDate = new Date(booking.pickupDate).toLocaleDateString();
        
        tableHTML += `
            <tr>
                <td>${booking.customerName || '-'}</td>
                <td><strong>${booking.serviceType}</strong></td>
                <td>${booking.pickupFrom}</td>
                <td>${booking.destination}</td>
                <td>${pickupDate}</td>
                <td>${booking.pickupTime}</td>
                <td>${booking.contactNumber}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="delete-btn" data-id="${booking._id || booking.id}">Delete</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;

    // Wire up delete buttons
    const deleteButtons = container.querySelectorAll('.delete-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            await deleteBooking(id);
        });
    });
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

    // Update the statistics in the admin dashboard
    const totalElement = document.getElementById('totalBookings');
    const todayElement = document.getElementById('todayBookings');
    const airportElement = document.getElementById('airportBookings');
    
    if (totalElement) totalElement.textContent = totalBookings;
    if (todayElement) todayElement.textContent = todayBookings;
    if (airportElement) airportElement.textContent = airportBookings;
}

// Delete booking function
async function deleteBooking(id) {
    if (!id || !confirm('Delete this booking?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/bookings/${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

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

// Review System Functions
function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'block';
        // Reset form
        const form = document.getElementById('reviewForm');
        if (form) form.reset();
        updateCharCount();
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateCharCount() {
    const textarea = document.getElementById('comment');
    const charCount = document.getElementById('charCount');
    if (textarea && charCount) {
        charCount.textContent = textarea.value.length;
    }
}

async function submitReview(e) {
    e.preventDefault();
    
    const formData = {
        customerName: document.getElementById('customerName').value,
        serviceType: document.getElementById('serviceType').value,
        rating: parseInt(document.querySelector('input[name="rating"]:checked')?.value || 0),
        comment: document.getElementById('comment').value
    };
    
    // Validation
    if (!formData.customerName.trim()) {
        showNotification('Please enter your name.', 'error');
        return;
    }
    
    if (!formData.serviceType) {
        showNotification('Please select a service type.', 'error');
        return;
    }
    
    if (!formData.rating) {
        showNotification('Please select a rating.', 'error');
        return;
    }
    
    if (!formData.comment.trim()) {
        showNotification('Please enter your review.', 'error');
        return;
    }
    
    try {
        showNotification('Submitting review...', 'info');
        
        const response = await fetch(`${API_BASE}/api/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Thank you for your review!', 'success');
            closeReviewModal();
            loadReviews();
        } else {
            throw new Error(result.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('❌ Error submitting review:', error);
        showNotification(`Review submission failed: ${error.message}`, 'error');
    }
}

async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE}/api/reviews`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayReviews(data.reviews, data.averageRating);
        } else {
            throw new Error(data.message || 'Failed to load reviews');
        }
    } catch (error) {
        console.error('❌ Error loading reviews:', error);
        const container = document.getElementById('reviewsList');
        if (container) {
            container.innerHTML = `<div class="error">Failed to load reviews: ${error.message}</div>`;
        }
    }
}

function displayReviews(reviews, averageRating) {
    const container = document.getElementById('reviewsList');
    const averageRatingEl = document.getElementById('averageRating');
    const averageStarsEl = document.getElementById('averageStars');
    
    if (!container) return;
    
    // Update average rating
    if (averageRatingEl) {
        averageRatingEl.textContent = averageRating.toFixed(1);
    }
    
    if (averageStarsEl) {
        averageStarsEl.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('i');
            star.className = 'fas fa-star';
            star.style.color = i <= averageRating ? '#ffd700' : '#e2e8f0';
            averageStarsEl.appendChild(star);
        }
    }
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="no-reviews">
                <i class="fas fa-star" style="font-size: 3rem; color: #e2e8f0; margin-bottom: 20px;"></i>
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience with AVB Cabs!</p>
            </div>
        `;
        return;
    }
    
    const reviewsHTML = reviews.map(review => {
        const stars = Array.from({ length: 5 }, (_, i) => 
            `<i class="fas fa-star" style="color: ${i < review.rating ? '#ffd700' : '#e2e8f0'}"></i>`
        ).join('');
        
        const avatar = review.customerName.charAt(0).toUpperCase();
        const date = new Date(review.createdAt).toLocaleDateString();
        
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">${avatar}</div>
                        <div class="reviewer-details">
                            <h4>${review.customerName}</h4>
                            <div class="service-type">${review.serviceType}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${stars}
                    </div>
                </div>
                <div class="review-content">
                    ${review.comment}
                </div>
                <div class="review-date">
                    ${date}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = reviewsHTML;
}

// Performance optimization: Throttle scroll events
let scrollTimeout;
function throttleScroll(callback, delay = 16) {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
        callback();
        scrollTimeout = null;
    }, delay);
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded successfully');
    
    // Optimize scroll performance
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                // Disable heavy animations during scroll
                document.body.style.setProperty('--scroll-active', '1');
                isScrolling = false;
            });
            isScrolling = true;
        }
    }, { passive: true });
    
    // Re-enable animations after scroll ends
    window.addEventListener('scroll', throttleScroll(() => {
        document.body.style.setProperty('--scroll-active', '0');
    }, 150), { passive: true });
    // Optimized hero slider init
    (function initHeroSlider(){
        const slides = Array.from(document.querySelectorAll('.hero-section .slide'));
        const indicators = Array.from(document.querySelectorAll('.slider-indicators .indicator'));
        if (!slides.length) return;
        let current = 0;
        let timerId;
        let isScrolling = false;
        
        function showSlide(i){
            // Use requestAnimationFrame for smooth transitions
            requestAnimationFrame(() => {
                slides.forEach((s,idx)=> s.classList.toggle('active', idx===i));
                indicators.forEach((d,idx)=> d.classList.toggle('active', idx===i));
                current = i;
            });
        }
        function next(){ showSlide((current+1)%slides.length); }
        function start(){ 
            if (!isScrolling) { // Don't start if user is scrolling
                stop(); 
                timerId = setInterval(next, 4000); // Slower for better performance
            }
        }
        function stop(){ if(timerId) clearInterval(timerId); }
        
        indicators.forEach((dot,idx)=> dot.addEventListener('click', ()=>{ showSlide(idx); start(); }));
        const hero = document.querySelector('.hero-section');
        if (hero){ 
            hero.addEventListener('mouseenter', stop); 
            hero.addEventListener('mouseleave', start); 
        }
        
        // Pause slider during scroll
        window.addEventListener('scroll', throttleScroll(() => {
            isScrolling = true;
            stop();
            setTimeout(() => { isScrolling = false; start(); }, 1000);
        }, 100), { passive: true });
        
        showSlide(0); start();
    })();
    
    // Google Places (disabled for better performance - can be enabled if needed)
    const GOOGLE_MAPS_API_KEY = (document.querySelector('meta[name="google-maps-api-key"]')?.content || '').trim();

    function loadGoogleMapsPlacesApi() {
        return new Promise((resolve) => {
            // Disable Google Maps API loading for better performance
            // Can be re-enabled by uncommenting the code below if needed
            resolve(null);
            
            /* Uncomment to enable Google Maps autocomplete:
            if (window.google && window.google.maps && window.google.maps.places) {
                resolve(window.google);
                return;
            }
            if (!GOOGLE_MAPS_API_KEY) {
                console.warn('Google Maps API key not provided. Autocomplete disabled.');
                resolve(null);
                return;
            }
            const existing = document.getElementById('gmaps-places');
            if (existing) {
                existing.addEventListener('load', () => resolve(window.google));
                existing.addEventListener('error', reject);
                return;
            }
            const script = document.createElement('script');
            script.id = 'gmaps-places';
            script.async = true;
            script.defer = true;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&loading=async`;
            script.onload = () => resolve(window.google);
            script.onerror = reject;
            document.head.appendChild(script);
            */
        });
    }

    function initPlacesAutocomplete() {
        try {
            const pickupInput = document.getElementById('airportPickupFrom');
            const dropInput = document.getElementById('airportDestination');
            if (!(window.google && window.google.maps && window.google.maps.places)) return;
            if (!pickupInput || !dropInput) return;

            const options = {
                fields: ['formatted_address', 'geometry', 'name', 'place_id'],
                types: ['geocode'],
                componentRestrictions: { country: ['in'] }
            };
            const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
            const dropAutocomplete = new google.maps.places.Autocomplete(dropInput, options);

            pickupAutocomplete.addListener('place_changed', () => {
                const place = pickupAutocomplete.getPlace();
                if (place && place.formatted_address) pickupInput.value = place.formatted_address;
            });
            dropAutocomplete.addListener('place_changed', () => {
                const place = dropAutocomplete.getPlace();
                if (place && place.formatted_address) dropInput.value = place.formatted_address;
            });

            // Prevent Enter key from prematurely submitting the form while selecting from suggestions
            [pickupInput, dropInput].forEach((el) => {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') e.preventDefault();
                });
            });
        } catch (e) {
            console.error('Failed to init Places Autocomplete:', e);
        }
    }

    loadGoogleMapsPlacesApi().then(() => {
        initPlacesAutocomplete();
    }).catch((err) => {
        console.error('Google Maps API load error:', err);
    });

    // Form submissions
    const airportForm = document.getElementById('airportForm');
    const localForm = document.getElementById('localForm');
    const onewayForm = document.getElementById('onewayForm');
    const roundtripForm = document.getElementById('roundtripForm');
    
    if (airportForm) {
        // Enforce date/time constraints (no past date; time not in past when date is today)
        const dateInput = document.getElementById('airportPickupDate');
        const timeInput = document.getElementById('airportPickupTime');

        function toYMD(d){
            const y = d.getFullYear();
            const m = String(d.getMonth()+1).padStart(2,'0');
            const dd = String(d.getDate()).padStart(2,'0');
            return `${y}-${m}-${dd}`;
        }
        function toHM(d){
            const hh = String(d.getHours()).padStart(2,'0');
            const mm = String(d.getMinutes()).padStart(2,'0');
            return `${hh}:${mm}`;
        }
        function updateConstraints(){
            if (!dateInput || !timeInput) return;
            const now = new Date();
            const todayStr = toYMD(now);
            dateInput.min = todayStr;
            if (!dateInput.value || dateInput.value < todayStr){
                // keep user value but UI prevents selecting past
            }
            if (dateInput.value === todayStr){
                timeInput.min = toHM(now);
            } else {
                timeInput.removeAttribute('min');
            }
        }
        updateConstraints();
        if (dateInput){
            dateInput.addEventListener('change', updateConstraints);
        }
        // Inject Name field if missing (for deployed pages with cached HTML)
        if (!document.getElementById('airportCustomerName')) {
            const contactGroup = document.getElementById('airportContactNumber')?.closest('.form-group');
            const destinationGroup = document.getElementById('airportDestination')?.closest('.form-group');
            const nameGroup = document.createElement('div');
            nameGroup.className = 'form-group';
            nameGroup.innerHTML = `
                <label for="airportCustomerName">Your Name:</label>
                <input type="text" id="airportCustomerName" name="customerName" placeholder="Enter your name" required>
            `;
            // Place it after pickup location, before drop location if possible
            if (destinationGroup && destinationGroup.parentNode) {
                destinationGroup.parentNode.insertBefore(nameGroup, destinationGroup);
            } else if (contactGroup && contactGroup.parentNode) {
                contactGroup.parentNode.insertBefore(nameGroup, contactGroup);
            } else {
                airportForm.insertBefore(nameGroup, airportForm.querySelector('.submit-btn'));
            }
        }
        airportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const nameInputEl = document.getElementById('airportCustomerName');
            const bookingData = {
                pickupFrom: document.getElementById('airportPickupFrom').value,
                destination: document.getElementById('airportDestination').value,
                pickupDate: document.getElementById('airportPickupDate').value,
                pickupTime: document.getElementById('airportPickupTime').value,
                customerName: nameInputEl ? nameInputEl.value : '',
                contactNumber: document.getElementById('airportContactNumber').value
            };

            if (validateBookingForm(bookingData, 'Airport')) {
                await handleBookingSubmission(bookingData, 'Airport');
            }
        });
    }

    // Tab switching
    document.querySelectorAll('.booking-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.booking-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.getAttribute('data-type');
            document.querySelectorAll('.booking-form').forEach(f => f.classList.remove('active'));
            if (type === 'airport') document.getElementById('airportForm').classList.add('active');
            if (type === 'local') document.getElementById('localForm').classList.add('active');
            if (type === 'oneway') document.getElementById('onewayForm').classList.add('active');
            if (type === 'roundtrip') document.getElementById('roundtripForm').classList.add('active');
        });
    });

    function gatherAndSubmitLocal(e){
        e.preventDefault();
        const data = {
            pickupFrom: document.getElementById('localPickupFrom').value,
            destination: document.getElementById('localDestination').value,
            pickupDate: document.getElementById('localPickupDate').value,
            pickupTime: document.getElementById('localPickupTime').value,
            customerName: document.getElementById('localCustomerName')?.value || document.getElementById('airportCustomerName')?.value || '',
            contactNumber: document.getElementById('localContactNumber')?.value || document.getElementById('airportContactNumber')?.value || ''
        };
        if (validateBookingForm(data, 'Local')) {
            handleBookingSubmission(data, 'Local');
        }
    }

    function gatherAndSubmitOneway(e){
        e.preventDefault();
        const data = {
            pickupFrom: document.getElementById('onewayPickupFrom').value,
            destination: document.getElementById('onewayDestination').value,
            pickupDate: document.getElementById('onewayPickupDate').value,
            pickupTime: document.getElementById('onewayPickupTime').value,
            customerName: document.getElementById('onewayCustomerName')?.value || document.getElementById('airportCustomerName')?.value || '',
            contactNumber: document.getElementById('onewayContactNumber')?.value || document.getElementById('airportContactNumber')?.value || ''
        };
        if (validateBookingForm(data, 'One Way')) {
            handleBookingSubmission(data, 'One Way');
        }
    }

    function gatherAndSubmitRound(e){
        e.preventDefault();
        const data = {
            pickupFrom: document.getElementById('roundPickupFrom').value,
            destination: document.getElementById('roundDestination').value,
            pickupDate: document.getElementById('roundPickupDate').value,
            pickupTime: document.getElementById('roundPickupTime').value,
            returnDate: document.getElementById('roundReturnDate').value,
            customerName: document.getElementById('roundCustomerName')?.value || document.getElementById('airportCustomerName')?.value || '',
            contactNumber: document.getElementById('roundContactNumber')?.value || document.getElementById('airportContactNumber')?.value || ''
        };
        if (validateBookingForm(data, 'Round Trip')) {
            handleBookingSubmission(data, 'Round Trip');
        }
    }

    if (localForm) localForm.addEventListener('submit', gatherAndSubmitLocal);
    if (onewayForm) onewayForm.addEventListener('submit', gatherAndSubmitOneway);
    if (roundtripForm) roundtripForm.addEventListener('submit', gatherAndSubmitRound);

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
        
        if (e.target === adminLoginModal) closeAdminLoginModal();
        if (e.target === adminDashboardModal) closeAdminDashboard();
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

    // Review form functionality
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', submitReview);

    // Character count for review textarea
    const commentTextarea = document.getElementById('comment');
    if (commentTextarea) commentTextarea.addEventListener('input', updateCharCount);

    // Close review modal when clicking outside
    window.addEventListener('click', function(e) {
        const reviewModal = document.getElementById('reviewModal');
        if (e.target === reviewModal) closeReviewModal();
    });

    // Load reviews on page load
    loadReviews();

    // --- New booking notifications (admin/user side) ---
    const NOTIFY_KEY = 'avb_last_notified_booking_time';
    function playChime(){
        try{
            const ctx = new (window.AudioContext||window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880; // A5
            g.gain.value = 0.001; // very soft
            o.connect(g); g.connect(ctx.destination);
            o.start();
            setTimeout(()=>{o.stop();ctx.close();}, 300);
        }catch(_){/* ignore */}
    }

    async function requestDesktopPermission(){
        try {
            if ('Notification' in window && Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        } catch(_){}
    }

    async function checkNewBookingsAndNotify(){
        try{
            const res = await fetch(`${API_BASE}/api/bookings`);
            if(!res.ok) return;
            const data = await res.json();
            if(!data.success || !Array.isArray(data.bookings)) return;
            if(data.bookings.length === 0) return;
            const latest = data.bookings[0]; // server returns sorted desc
            const latestTime = new Date(latest.createdAt).getTime();
            const last = parseInt(localStorage.getItem(NOTIFY_KEY) || '0', 10);
            if (latestTime > last){
                // Update marker first to avoid duplicate spam
                localStorage.setItem(NOTIFY_KEY, String(latestTime));
                showNotification(`New booking: ${latest.pickupFrom} → ${latest.destination} at ${latest.pickupTime}`, 'success');
                playChime();
                if ('Notification' in window && Notification.permission === 'granted'){
                    new Notification('AVB Cabs - New Booking', { body: `${latest.pickupFrom} → ${latest.destination} • ${latest.pickupDate} ${latest.pickupTime}` });
                }
            }
        }catch(_){/* network errors ignored */}
    }

    requestDesktopPermission();
    // Start polling every 60s (reduced frequency for better performance)
    setInterval(checkNewBookingsAndNotify, 60000);
    // Run once at startup
    checkNewBookingsAndNotify();
}); 