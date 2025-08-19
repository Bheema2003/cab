// Email Configuration for Car Booking Website
// This file contains the email setup instructions and configuration

// ============================================================================
// EMAIL SETUP INSTRUCTIONS
// ============================================================================

/*
To enable email functionality for your car booking website, follow these steps:

1. EMAILJS SETUP (Recommended):
   - Go to https://www.emailjs.com/
   - Sign up for a free account
   - Create an email service (Gmail, Outlook, etc.)
   - Create an email template
   - Get your User ID, Service ID, and Template ID

2. Update the sendEmail function in script.js with your credentials:
*/

// Example EmailJS configuration
const EMAIL_CONFIG = {
    // Replace these with your actual EmailJS credentials
    USER_ID: "YOUR_EMAILJS_USER_ID",
    SERVICE_ID: "YOUR_EMAILJS_SERVICE_ID", 
    TEMPLATE_ID: "YOUR_EMAILJS_TEMPLATE_ID",
    TO_EMAIL: "your-email@example.com" // Your email where bookings will be sent
};

// ============================================================================
// EMAIL TEMPLATE EXAMPLE
// ============================================================================

/*
EmailJS Template Variables:
- {{to_email}} - Your email address
- {{customer_name}} - Customer's full name
- {{customer_email}} - Customer's email
- {{customer_phone}} - Customer's phone number
- {{car_type}} - Selected car type
- {{pickup_date}} - Pickup date
- {{return_date}} - Return date
- {{pickup_location}} - Pickup location
- {{total_cost}} - Total cost of booking
- {{duration}} - Duration in days
- {{special_requests}} - Special requests (if any)
- {{booking_date}} - Date when booking was submitted

Example Email Template:
Subject: New Car Booking Request - {{customer_name}}

Dear Admin,

A new car booking request has been submitted:

CUSTOMER DETAILS:
Name: {{customer_name}}
Email: {{customer_email}}
Phone: {{customer_phone}}

BOOKING DETAILS:
Car Type: {{car_type}}
Pickup Date: {{pickup_date}}
Return Date: {{return_date}}
Pickup Location: {{pickup_location}}
Duration: {{duration}} days
Total Cost: ${{total_cost}}

Special Requests: {{special_requests}}

Booking submitted on: {{booking_date}}

Please contact the customer to confirm the booking.

Best regards,
Luxury Car Rentals
*/

// ============================================================================
// ALTERNATIVE EMAIL SERVICES
// ============================================================================

/*
ALTERNATIVE 1: FORMSPREE
- Go to https://formspree.io/
- Create a new form
- Get your form endpoint
- Update the form action in index.html:

<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
    <input type="hidden" name="_subject" value="New Car Booking Request">
    <input type="hidden" name="_next" value="https://yourwebsite.com/thank-you.html">
    <!-- Your existing form fields -->
</form>

ALTERNATIVE 2: NETLIFY FORMS
- Deploy your website to Netlify
- Add netlify attribute to your form:
<form netlify>
    <!-- Your existing form fields -->
</form>

ALTERNATIVE 3: GOOGLE APPS SCRIPT
- Create a Google Apps Script
- Deploy as a web app
- Use the web app URL as your form action
*/

// ============================================================================
// IMPLEMENTATION GUIDE
// ============================================================================

/*
STEP 1: Choose your email service
STEP 2: Follow the setup instructions above
STEP 3: Update the sendEmail function in script.js
STEP 4: Test the form submission
STEP 5: Check your email for booking notifications

For EmailJS implementation, replace the sendEmail function in script.js with:

async function sendEmail(bookingData) {
    // Initialize EmailJS
    emailjs.init(EMAIL_CONFIG.USER_ID);
    
    // Calculate total days and cost
    const pickupDate = new Date(bookingData.pickupDate);
    const returnDate = new Date(bookingData.returnDate);
    const daysDiff = Math.ceil((returnDate - pickupDate) / (1000 * 60 * 60 * 24));
    
    const carPrices = {
        'Luxury Sedan': 150,
        'Sports Car': 300,
        'SUV': 200
    };
    
    const dailyPrice = carPrices[bookingData.carType] || 150;
    const totalCost = daysDiff * dailyPrice;

    // Send email
    try {
        const response = await emailjs.send(EMAIL_CONFIG.SERVICE_ID, EMAIL_CONFIG.TEMPLATE_ID, {
            to_email: EMAIL_CONFIG.TO_EMAIL,
            customer_name: bookingData.name,
            customer_email: bookingData.email,
            customer_phone: bookingData.phone,
            car_type: bookingData.carType,
            pickup_date: bookingData.pickupDate,
            return_date: bookingData.returnDate,
            pickup_location: bookingData.pickupLocation,
            total_cost: totalCost,
            duration: daysDiff,
            special_requests: bookingData.specialRequests || 'None',
            booking_date: new Date().toLocaleString()
        });
        
        return response;
    } catch (error) {
        console.error('EmailJS Error:', error);
        throw error;
    }
}
*/

// Export configuration (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EMAIL_CONFIG;
} 