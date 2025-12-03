const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://ubiquitous-stardust-274b3c.netlify.app';

// Middleware
// CORS: allow configured origin, localhost, and all Netlify sites
const allowedOrigins = FRONTEND_ORIGIN === '*' ? '*' : [
    FRONTEND_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://ubiquitous-stardust-274b3c.netlify.app',
    'https://avbcab.netlify.app',
    /^https:\/\/.*\.netlify\.app$/, // Allow all Netlify subdomains
    /^https:\/\/.*\.netlify\.com$/  // Allow Netlify preview deployments
];
app.use(cors({ 
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // If FRONTEND_ORIGIN is '*', allow all origins
        if (FRONTEND_ORIGIN === '*') {
            return callback(null, true);
        }
        
        // Check each allowed origin
        for (const allowed of allowedOrigins) {
            if (allowed === '*') {
                return callback(null, true);
            }
            
            // Check exact string match
            if (typeof allowed === 'string' && allowed === origin) {
                return callback(null, true);
            }
            
            // Check regex pattern match
            if (allowed instanceof RegExp && allowed.test(origin)) {
                return callback(null, true);
            }
        }
        
        // Default: allow the request (permissive for production)
        callback(null, true);
    },
    credentials: false 
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Atlas Connection
// TIP: update to your actual cluster host and include a DB name if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://avbcabz:avbcabz@cluster0.g7du51j.mongodb.net/avbcabs?retryWrites=true&w=majority';
let isMongoReady = false;

mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 2000,
    })
    .then(() => {
        isMongoReady = true;
        console.log('✅ Connected to MongoDB Atlas successfully!');
    })
    .catch((error) => {
        isMongoReady = false;
        console.error('❌ MongoDB connection error (fallback to file storage will be used):', error.message);
    });

mongoose.connection.on('disconnected', () => {
    isMongoReady = false;
});
mongoose.connection.on('connected', () => {
    isMongoReady = true;
});

// Booking Schema
const bookingSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    serviceType: {
        type: String,
        required: true
    },
    pickupFrom: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    pickupDate: {
        type: String,
        required: true
    },
    pickupTime: {
        type: String,
        required: true
    },
    returnDate: {
        type: String,
        required: false
    },
    contactNumber: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 500
    },
    serviceType: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Review = mongoose.model('Review', reviewSchema);

// Email Configuration
const EMAIL_USER = process.env.EMAIL_USER || 'avbcabz@gmail.com';
// Remove spaces from App Password (Gmail App Passwords should be used without spaces)
const EMAIL_PASS = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    // Additional Gmail settings for better reliability
    tls: {
        rejectUnauthorized: false
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
});

let isEmailReady = false;
async function verifyEmailTransporter(){
    try {
        if (!EMAIL_USER || !EMAIL_PASS) {
            console.warn('⚠️ Email credentials missing; email notifications will be skipped');
            console.warn('   EMAIL_USER:', EMAIL_USER || 'NOT SET');
            console.warn('   EMAIL_PASS:', EMAIL_PASS ? 'SET (hidden)' : 'NOT SET');
            console.warn('   📝 To enable email, set EMAIL_USER and EMAIL_PASS environment variables');
            isEmailReady = false;
            return;
        }
        console.log('🔍 Verifying email transporter...');
        console.log('   Email User:', EMAIL_USER);
        console.log('   Email To:', EMAIL_TO);
        await transporter.verify();
        isEmailReady = true;
        console.log('✅ Email transporter verified successfully');
        console.log('   Ready to send emails to:', EMAIL_TO);
    } catch (e) {
        isEmailReady = false;
        console.error('❌ Email transporter verification failed:', e?.message || e);
        if (e.code === 'EAUTH') {
            console.error('   ⚠️ Authentication error - Invalid email credentials');
            console.error('   💡 Make sure you are using an App Password, not your regular Gmail password');
            console.error('   💡 App Password should be 16 characters without spaces');
        } else if (e.code === 'ECONNECTION') {
            console.error('   ⚠️ Connection error - Check internet connection');
        }
    }
}
// Verify email on startup and retry after 5 seconds if it fails
verifyEmailTransporter();
setTimeout(() => {
    if (!isEmailReady) {
        console.log('🔄 Retrying email verification...');
        verifyEmailTransporter();
    }
}, 5000);

// Email notification function
async function sendBookingNotification(bookingData) {
    // Check if email credentials are available
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.warn('✉️ Email credentials not configured - skipping email notification');
        console.warn('   EMAIL_USER:', EMAIL_USER || 'NOT SET');
        console.warn('   EMAIL_PASS:', EMAIL_PASS ? 'SET (hidden)' : 'NOT SET');
        console.warn('   💡 To enable emails, set EMAIL_USER and EMAIL_PASS environment variables');
        return false;
    }

    try {
        // Try to verify transporter if not already verified, but don't block sending
        if (!isEmailReady) {
            console.log('⚠️ Email transporter not verified yet, attempting to send anyway...');
            try {
                await transporter.verify();
                isEmailReady = true;
                console.log('✅ Email transporter verified during send attempt');
            } catch (verifyError) {
                console.warn('⚠️ Email verification failed, but attempting to send anyway:', verifyError.message);
            }
        }
        
        console.log('📧 Attempting to send booking email...');
        console.log('   From:', EMAIL_USER);
        console.log('   To:', EMAIL_TO);
        console.log('   Booking:', bookingData.customerName || 'N/A', '-', bookingData.serviceType || 'N/A');
        
        const mailOptions = {
            from: `"AVB Cabs" <${EMAIL_USER}>`,
            to: EMAIL_TO,
            subject: '🚕 New Cab Booking Received - AVB Cabs',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">🚕 AVB Cabs</h1>
                        <p style="margin: 10px 0 0 0;">New Booking Notification</p>
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333;">📋 Booking Details</h2>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            ${bookingData.customerName ? `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Customer Name:</td>
                                <td style="padding: 10px;">${bookingData.customerName}</td>
                            </tr>` : ''}
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Service Type:</td>
                                <td style="padding: 10px;">${bookingData.serviceType || 'N/A'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Pickup From:</td>
                                <td style="padding: 10px;">${bookingData.pickupFrom || 'N/A'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Destination:</td>
                                <td style="padding: 10px;">${bookingData.destination || 'N/A'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Pickup Date:</td>
                                <td style="padding: 10px;">${bookingData.pickupDate || 'N/A'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Pickup Time:</td>
                                <td style="padding: 10px;">${bookingData.pickupTime || 'N/A'}</td>
                            </tr>
                            ${bookingData.returnDate ? `
                            <tr style=\"border-bottom: 1px solid #eee;\">
                                <td style=\"padding: 10px; font-weight: bold; color: #667eea;\">Return Date:</td>
                                <td style=\"padding: 10px;\">${bookingData.returnDate}</td>
                            </tr>` : ''}
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Contact Number:</td>
                                <td style="padding: 10px;">${bookingData.contactNumber || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Booking Time:</td>
                                <td style="padding: 10px;">${new Date().toLocaleString()}</td>
                            </tr>
                        </table>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                            <p style="margin: 0; color: #666;">
                                <strong>📞 Contact Numbers:</strong><br>
                                • 9591128048<br>
                                • 8073166031<br>
                                • 7338653351
                            </p>
                        </div>
                        <div style="text-align: center; margin-top: 20px;">
                            <p style="color: #666; font-size: 14px;">
                                This is an automated notification from AVB Cabs booking system.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email notification sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   To:', EMAIL_TO);
        console.log('   From:', EMAIL_USER);
        isEmailReady = true; // Mark as ready after successful send
        return true;
    } catch (error) {
        console.error('❌ Email notification failed:', error.message);
        console.error('   Error code:', error.code);
        if (error.response) {
            console.error('   Error response:', error.response);
        }
        
        // Common Gmail errors with helpful messages
        if (error.code === 'EAUTH') {
            console.error('   ⚠️ Authentication failed - Invalid email credentials');
            console.error('   💡 Make sure you are using a Gmail App Password, not your regular password');
            console.error('   💡 Generate App Password: Google Account → Security → App Passwords');
            console.error('   💡 EMAIL_USER should be your full Gmail address');
            console.error('   💡 EMAIL_PASS should be the 16-character App Password (without spaces)');
        } else if (error.code === 'ECONNECTION') {
            console.error('   ⚠️ Connection failed - Check internet connection');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('   ⚠️ Connection timeout - Gmail servers may be slow');
        } else {
            console.error('   Full error details:', error);
        }
        
        return false;
    }
}

// WhatsApp (Meta Cloud API) notification
async function sendWhatsAppNotification(bookingData) {
    try {
        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_ID; // e.g. '123456789012345'
        const toNumber = process.env.WHATSAPP_TO; // e.g. '+91xxxxxxxxxx'
        if (!token || !phoneNumberId || !toNumber) {
            return { ok: false, skipped: true };
        }

        const payload = JSON.stringify({
            messaging_product: 'whatsapp',
            to: toNumber,
            type: 'text',
            text: {
                preview_url: false,
                body: `🚕 AVB Cabs - New Booking\n\nName: ${bookingData.customerName || '-'}\nFrom: ${bookingData.pickupFrom}\nTo: ${bookingData.destination}\nDate: ${bookingData.pickupDate}\nTime: ${bookingData.pickupTime}\nContact: ${bookingData.contactNumber}`
            }
        });

        const options = {
            hostname: 'graph.facebook.com',
            path: `/v20.0/${phoneNumberId}/messages`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                res.on('data', () => {});
                res.on('end', () => resolve());
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });
        console.log('✅ WhatsApp notification sent');
        return { ok: true };
    } catch (err) {
        console.error('❌ WhatsApp notification failed:', err?.message || err);
        return { ok: false, error: err };
    }
}

// Fallback local JSON storage (if MongoDB unavailable)
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
        if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
        if (!fs.existsSync(REVIEWS_FILE)) fs.writeFileSync(REVIEWS_FILE, '[]', 'utf-8');
    } catch (e) {
        console.error('❌ Failed to prepare local data file:', e);
    }
}

async function saveBookingLocally(bookingData) {
    ensureDataFile();
    try {
        const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const local = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ...bookingData, createdAt: new Date().toISOString() };
        list.push(local);
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return { ok: true, id: local.id };
    } catch (e) {
        console.error('❌ Local save failed:', e);
        return { ok: false, error: e };
    }
}

async function deleteLocalBookingById(id) {
    try {
        ensureDataFile();
        const raw = await fs.promises.readFile(DATA_FILE, 'utf-8');
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const newList = list.filter(b => String(b.id) !== String(id));
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(newList, null, 2), 'utf-8');
        return { ok: list.length !== newList.length };
    } catch (e) {
        console.error('❌ Local delete failed:', e);
        return { ok: false, error: e };
    }
}

async function saveReviewLocally(reviewData) {
    ensureDataFile();
    try {
        const raw = await fs.promises.readFile(REVIEWS_FILE, 'utf-8');
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const local = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, ...reviewData, createdAt: new Date().toISOString() };
        list.push(local);
        await fs.promises.writeFile(REVIEWS_FILE, JSON.stringify(list, null, 2), 'utf-8');
        return { ok: true, id: local.id };
    } catch (e) {
        console.error('❌ Local review save failed:', e);
        return { ok: false, error: e };
    }
}

async function getLocalReviews() {
    try {
        ensureDataFile();
        const raw = await fs.promises.readFile(REVIEWS_FILE, 'utf-8');
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
        console.error('❌ Local reviews read failed:', e);
        return [];
    }
}

// API Routes
app.post('/api/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        let savedBooking = null;
        
        if (!isMongoReady) {
            const fallback = await saveBookingLocally(bookingData || {});
            if (fallback.ok) {
                savedBooking = { id: fallback.id, ...bookingData };
                // Send email notification
                await sendBookingNotification(savedBooking);
                // Send WhatsApp notification
                await sendWhatsAppNotification(savedBooking);
                return res.json({ success: true, message: 'Booking saved locally', bookingId: fallback.id });
            }
        } else {
            const newBooking = new Booking(bookingData);
            await newBooking.save();
            savedBooking = newBooking;
            console.log('✅ Booking saved to MongoDB Atlas:', bookingData);
            
            // Send email notification
            await sendBookingNotification(savedBooking);
            // Send WhatsApp notification
            await sendWhatsAppNotification(savedBooking);
            
            return res.json({ success: true, message: 'Booking saved successfully!', bookingId: newBooking._id });
        }
        res.status(500).json({ success: false, message: 'Failed to save booking' });
    } catch (error) {
        console.error('❌ Save failed, attempting local save:', error?.message || error);
        const fb = await saveBookingLocally(req.body || {});
        if (fb.ok) {
            // Send email notification even for local saves
            await sendBookingNotification({ id: fb.id, ...req.body });
            return res.json({ success: true, message: 'Booking saved locally', bookingId: fb.id });
        }
        res.status(500).json({ success: false, message: 'Failed to save booking', error: error.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        if (isMongoReady) {
            const bookings = await Booking.find().sort({ createdAt: -1 });
            return res.json({ success: true, bookings });
        }
        // Fallback to local file if Mongo not ready
        ensureDataFile();
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        return res.json({ success: true, bookings: list });
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

// Delete all bookings (admin tool)
app.delete('/api/bookings', async (req, res) => {
    try {
        try {
            await Booking.deleteMany({});
        } catch (mongoErr) {
            console.error('❌ Mongo deleteMany failed:', mongoErr?.message || mongoErr);
        }

        // Also clear local fallback file
        try {
            ensureDataFile();
            await fs.promises.writeFile(DATA_FILE, '[]', 'utf-8');
        } catch (localErr) {
            console.error('❌ Local file clear failed:', localErr?.message || localErr);
        }

        res.json({ success: true, message: 'All bookings deleted' });
    } catch (error) {
        console.error('❌ Error deleting bookings:', error);
        res.status(500).json({ success: false, message: 'Failed to delete bookings', error: error.message });
    }
});

// Delete single booking by id
app.delete('/api/bookings/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let deleted = false;
        try {
            if (isMongoReady) {
                const doc = await Booking.findByIdAndDelete(id);
                if (doc) deleted = true;
            }
        } catch (mongoErr) {
            console.error('⚠️ Mongo single delete failed:', mongoErr?.message || mongoErr);
        }

        if (!deleted) {
            const local = await deleteLocalBookingById(id);
            if (!local.ok) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }
        }
        res.json({ success: true, message: 'Booking deleted' });
    } catch (error) {
        console.error('❌ Error deleting booking:', error);
        res.status(500).json({ success: false, message: 'Failed to delete booking', error: error.message });
    }
});

// Review API Routes
app.post('/api/reviews', async (req, res) => {
    try {
        const reviewData = req.body;
        let savedReview = null;
        
        if (!isMongoReady) {
            const fallback = await saveReviewLocally(reviewData || {});
            if (fallback.ok) {
                savedReview = { id: fallback.id, ...reviewData };
                return res.json({ success: true, message: 'Review submitted successfully!', reviewId: fallback.id });
            }
        } else {
            const newReview = new Review(reviewData);
            await newReview.save();
            savedReview = newReview;
            console.log('⭐ Review saved to MongoDB:', reviewData);
            return res.json({ success: true, message: 'Review submitted successfully!', reviewId: newReview._id });
        }
        res.status(500).json({ success: false, message: 'Failed to submit review' });
    } catch (error) {
        console.error('❌ Error saving review, attempting local save:', error?.message || error);
        const fb = await saveReviewLocally(req.body || {});
        if (fb.ok) {
            return res.json({ success: true, message: 'Review submitted successfully!', reviewId: fb.id });
        }
        res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        if (isMongoReady) {
            const reviews = await Review.find().sort({ createdAt: -1 }).limit(10);
            const averageRating = await Review.aggregate([
                { $group: { _id: null, avgRating: { $avg: '$rating' } } }
            ]);
            
            return res.json({ 
                success: true, 
                reviews,
                averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0
            });
        }
        
        // Fallback to local file if Mongo not ready
        const reviews = await getLocalReviews();
        const averageRating = reviews.length > 0 ? 
            reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
        
        res.json({ 
            success: true, 
            reviews: reviews.slice(0, 10),
            averageRating: Math.round(averageRating * 10) / 10
        });
    } catch (error) {
        console.error('❌ Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health endpoint
app.get('/api/health', async (req, res) => {
    res.json({
        success: true,
        mongo: isMongoReady,
        email: isEmailReady,
        emailUser: EMAIL_USER ? EMAIL_USER.replace(/(.{2}).+(@.*)?$/, '$1***$2') : null
    });
});

// Test email endpoint (no body needed)
app.post('/api/test-email', async (req, res) => {
    try {
        if (!EMAIL_USER || !EMAIL_PASS) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email credentials not configured',
                details: {
                    EMAIL_USER: EMAIL_USER ? 'Set' : 'Missing',
                    EMAIL_PASS: EMAIL_PASS ? 'Set' : 'Missing'
                }
            });
        }
        
        console.log('🧪 Test email requested - attempting to send...');
        const info = await transporter.sendMail({
            from: `"AVB Cabs" <${EMAIL_USER}>`,
            to: EMAIL_TO,
            subject: 'AVB Cabs - Test Email',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>✅ Test Email Successful!</h2>
                    <p>This is a test email from AVB Cabs server to verify email delivery.</p>
                    <p><strong>Server Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
            `
        });
        console.log('✅ Test email sent successfully! Message ID:', info.messageId);
        isEmailReady = true; // Mark as ready after successful test
        res.json({ 
            success: true, 
            message: 'Test email sent successfully',
            messageId: info.messageId,
            to: EMAIL_TO
        });
    } catch (e) {
        console.error('❌ Test email failed:', e.message);
        res.status(500).json({ 
            success: false, 
            message: e?.message || 'Failed to send test email',
            error: e.code || 'Unknown error',
            details: e.code === 'EAUTH' ? 'Authentication failed - Check EMAIL_USER and EMAIL_PASS' : e.message
        });
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB Atlas: ${isMongoReady ? 'Connected' : 'Not connected (using local storage)'}`);
    console.log(`📧 Email: ${isEmailReady ? 'Ready' : 'Not configured'}`);
    console.log(`🌐 Frontend Origin: ${FRONTEND_ORIGIN}`);
    console.log(`\n✅ Server is ready! Open http://localhost:${PORT} in your browser`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
        console.error(`💡 Try: netstat -ano | findstr :${PORT} to find the process using the port`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
    }
});
