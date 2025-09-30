// Simple notification system
function showNotification(message, type = 'success') {
    alert(message); // Simple fallback
}

// API base - supports localhost and Netlify
function resolveApiBase() {
    console.log('🔍 Resolving API base...');
    console.log('📍 Current hostname:', location.hostname);
    
    // For local development, use localhost:3000
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log('🏠 Using localhost for development');
        return 'http://localhost:3000';
    }
    
    // If running on Netlify or a custom production domain, prefer same-origin
    // so that Netlify `_redirects` can proxy `/api/*` to the backend and avoid CORS
    const isNetlify = location.hostname.endsWith('.netlify.app');
    const isProdDomain = location.hostname.endsWith('avbcabs.com') || location.hostname.endsWith('www.avbcabs.com');
    if (isNetlify || isProdDomain) {
        console.log('🛰️ Detected Netlify/prod domain; using same-origin proxy for API');
        return '';
    }

    // For Netlify/production, use the meta tag
    const meta = document.querySelector('meta[name="api-base"]');
    console.log('🏷️ Meta tag found:', meta);
    if (meta && meta.content && meta.content.trim().length > 0) {
        const apiBase = meta.content.trim().replace(/\/$/, '');
        console.log('🌐 Using meta tag API base:', apiBase);
        return apiBase;
    }
    
    // Fallback
    console.log('🔄 Using fallback API base');
    return 'https://cab-9wdp.onrender.com';
}

const API_BASE = resolveApiBase();
console.log('🌐 Final API_BASE resolved to:', API_BASE);
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
        console.log('🌐 Calling API URL:', `${API_BASE}/api/bookings`);
        
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
        console.log('🌐 Calling API URL:', `${API_BASE}/api/bookings`);
        
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
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Thank you for your review!', 'success');
            closeReviewModal();
            loadReviews(); // Reload reviews
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

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded successfully');
    // Hero slider init
    (function initHeroSlider(){
        const slides = Array.from(document.querySelectorAll('.hero-section .slide'));
        const indicators = Array.from(document.querySelectorAll('.slider-indicators .indicator'));
        if (!slides.length) return;
        let current = 0;
        let timerId;
        function showSlide(i){
            slides.forEach((s,idx)=> s.classList.toggle('active', idx===i));
            indicators.forEach((d,idx)=> d.classList.toggle('active', idx===i));
            current = i;
        }
        function next(){ showSlide((current+1)%slides.length); }
        function start(){ stop(); timerId = setInterval(next, 3000); }
        function stop(){ if(timerId) clearInterval(timerId); }
        indicators.forEach((dot,idx)=> dot.addEventListener('click', ()=>{ showSlide(idx); start(); }));
        const hero = document.querySelector('.hero-section');
        if (hero){ hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', start); }
        showSlide(0); start();
    })();
    
    // Google Places (manual-only unless key present)
    const GOOGLE_MAPS_API_KEY = (document.querySelector('meta[name="google-maps-api-key"]')?.content || '').trim();

    function loadGoogleMapsPlacesApi() {
        return new Promise((resolve, reject) => {
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

    // Airport form submission
    const airportForm = document.getElementById('airportForm');
    const localForm = document.getElementById('localForm');
    const onewayForm = document.getElementById('onewayForm');
    const roundtripForm = document.getElementById('roundtripForm');
    console.log('🔍 Looking for airportForm:', airportForm);
    
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
        console.log('✅ Found airportForm, adding submit listener');
        airportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('📝 Form submitted!');
            
            const nameInputEl = document.getElementById('airportCustomerName');
            const bookingData = {
                pickupFrom: document.getElementById('airportPickupFrom').value,
                destination: document.getElementById('airportDestination').value,
                pickupDate: document.getElementById('airportPickupDate').value,
                pickupTime: document.getElementById('airportPickupTime').value,
                customerName: nameInputEl ? nameInputEl.value : '',
                contactNumber: document.getElementById('airportContactNumber').value
            };
            
            console.log('📊 Form data:', bookingData);

            // Validate fields before submitting
            if (typeof validateBookingForm === 'function') {
                const valid = validateBookingForm(bookingData, 'Airport');
                if (!valid) return;
            }
            await handleBookingSubmission(bookingData, 'Airport');
        });
    } else {
        console.error('❌ airportForm not found!');
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
        if (typeof validateBookingForm === 'function') {
            const valid = validateBookingForm(data, 'Local');
            if (!valid) return;
        }
        handleBookingSubmission(data, 'Local');
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
        if (typeof validateBookingForm === 'function') {
            const valid = validateBookingForm(data, 'One Way');
            if (!valid) return;
        }
        handleBookingSubmission(data, 'One Way');
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
        if (typeof validateBookingForm === 'function') {
            const valid = validateBookingForm(data, 'Round Trip');
            if (!valid) return;
        }
        handleBookingSubmission(data, 'Round Trip');
    }

    if (localForm) localForm.addEventListener('submit', gatherAndSubmitLocal);
    if (onewayForm) onewayForm.addEventListener('submit', gatherAndSubmitOneway);
    if (roundtripForm) roundtripForm.addEventListener('submit', gatherAndSubmitRound);

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
    // Start polling every 20s
    setInterval(checkNewBookingsAndNotify, 20000);
    // Run once at startup
    checkNewBookingsAndNotify();
}); 