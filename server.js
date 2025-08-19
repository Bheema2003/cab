const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://ubiquitous-stardust-274b3c.netlify.app';

// Middleware
app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? '*' : [FRONTEND_ORIGIN], credentials: false }));
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
        if (!isMongoReady) {
            const fallback = await saveBookingLocally(bookingData || {});
            if (fallback.ok) {
                return res.json({ success: true, message: 'Booking saved locally', bookingId: fallback.id });
            }
        } else {
            const newBooking = new Booking(bookingData);
            await newBooking.save();
            console.log('✅ Booking saved to MongoDB Atlas:', bookingData);
            return res.json({ success: true, message: 'Booking saved successfully!', bookingId: newBooking._id });
        }
        res.status(500).json({ success: false, message: 'Failed to save booking' });
    } catch (error) {
        console.error('❌ Save failed, attempting local save:', error?.message || error);
        const fb = await saveBookingLocally(req.body || {});
        if (fb.ok) return res.json({ success: true, message: 'Booking saved locally', bookingId: fb.id });
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

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 MongoDB Atlas: Connected to cluster0.g7du51j.mongodb.net`);
});
