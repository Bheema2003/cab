const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://ubiquitous-stardust-274b3c.netlify.app';

// Middleware
app.use(cors({ 
    origin: FRONTEND_ORIGIN === '*' ? '*' : [
        FRONTEND_ORIGIN, 
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'https://ubiquitous-stardust-274b3c.netlify.app'
    ], 
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
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'avbcabz@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password-here'
    }
});

// Email notification function
async function sendBookingNotification(bookingData) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'avbcabz@gmail.com',
            to: process.env.EMAIL_USER || 'avbcabz@gmail.com',
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
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Service Type:</td>
                                <td style="padding: 10px;">${bookingData.serviceType}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Pickup From:</td>
                                <td style="padding: 10px;">${bookingData.pickupFrom}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Destination:</td>
                                <td style="padding: 10px;">${bookingData.destination}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Pickup Date:</td>
                                <td style="padding: 10px;">${bookingData.pickupDate}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Pickup Time:</td>
                                <td style="padding: 10px;">${bookingData.pickupTime}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 10px; font-weight: bold; color: #667eea;">Contact Number:</td>
                                <td style="padding: 10px;">${bookingData.contactNumber}</td>
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
        console.log('📧 Email notification sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email notification failed:', error);
        return false;
    }
}

// Fallback local JSON storage (if MongoDB unavailable)
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureDataFile() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
        if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
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
                return res.json({ success: true, message: 'Booking saved locally', bookingId: fallback.id });
            }
        } else {
            const newBooking = new Booking(bookingData);
            await newBooking.save();
            savedBooking = newBooking;
            console.log('✅ Booking saved to MongoDB Atlas:', bookingData);
            
            // Send email notification
            await sendBookingNotification(savedBooking);
            
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
        const newReview = new Review(reviewData);
        await newReview.save();
        console.log('⭐ Review saved:', reviewData);
        res.json({ success: true, message: 'Review submitted successfully!', reviewId: newReview._id });
    } catch (error) {
        console.error('❌ Error saving review:', error);
        res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 }).limit(10);
        const averageRating = await Review.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        
        res.json({ 
            success: true, 
            reviews,
            averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB Atlas: Connected to cluster0.g7du51j.mongodb.net`);
});
