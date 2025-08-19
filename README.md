# AVB Cabs Booking System

A modern cab booking website. By default it uses simple file-based storage (`data/bookings.json`) so no database is required.

## 🚀 Features

- **Airport Booking Form** - Complete booking functionality
- **File-based Storage** - Bookings saved to `data/bookings.json`
- **WhatsApp Integration** - Automatic message generation
- **Success Popup** - User-friendly confirmation
- **Form Validation** - Comprehensive input validation
- **Responsive Design** - Works on all devices

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Data Storage

No setup needed. The server writes bookings to `data/bookings.json`. The file is created automatically on first run.

### 3. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 4. Access the Application
Open your browser and go to: `http://localhost:3000`

## 📊 Database Schema

The booking data is stored with the following structure:

```javascript
{
  serviceType: "Airport",
  pickupFrom: "Pickup Location",
  destination: "Drop Location", 
  pickupDate: "2024-01-15",
  pickupTime: "10:00",
  contactNumber: "9876543210",
  createdAt: "2024-01-15T10:00:00.000Z"
}
```

## 🔌 API Endpoints

- `POST /api/bookings` - Save new booking
- `GET /api/bookings` - Retrieve all bookings

## 🎯 How It Works

1. User fills out the Airport booking form
2. Form data is validated
3. Data is sent to backend API and written to `data/bookings.json`
4. Success popup appears with confirmation message
5. Form resets automatically

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Storage**: JSON file on disk (no database required)
- **Styling**: Custom CSS with gradients and animations

## 📱 WhatsApp Integration

The system automatically generates a formatted WhatsApp message with:
- Service type
- Pickup and drop locations
- Date and time
- Contact number
- Booking timestamp

## 🎨 Features

- **Responsive Design** - Works on mobile, tablet, and desktop
- **Smooth Animations** - CSS transitions and keyframe animations
- **Form Validation** - Real-time validation with error messages
- **Auto-close Popups** - User-friendly notifications
- **Loading States** - Visual feedback during form submission

## 🔒 Security

- Input validation and sanitization
- CORS enabled for cross-origin requests
- Error handling for database operations

## 📞 Support

For any issues or questions, please contact the development team.

---

**Made with ❤️ for AVB Cabs** 