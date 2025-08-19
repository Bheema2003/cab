# 🚀 Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Start the Server
```bash
npm start
```

## Step 3: Open the Website
Go to: `http://localhost:3000`

## ✅ That's it! Your booking system is ready!

### What happens when someone books:
1. ✅ Form data is validated
2. ✅ Data is saved to `data/bookings.json`
3. ✅ Success popup appears
4. ✅ Form resets for next booking

### Storage Details:
- File: `data/bookings.json` (auto-created)
- Fields: serviceType, pickupFrom, destination, pickupDate, pickupTime, contactNumber, createdAt

---
**Need help?** Check the main README.md for detailed info.

## 🔧 Deploying Frontend on Netlify

The site is static, so you can deploy `index.html`, `styles.css`, and `script.js` on Netlify.

To connect to your backend API:
1. Deploy your Node backend (this `server.js`) on a host that supports Node (Render, Railway, Fly.io, etc.)
2. Set the frontend to use that backend:
   - In `index.html`, set the meta api-base tag to your backend origin, e.g.
     `<meta name="api-base" content="https://your-backend.example.com">`
   - Alternatively, create a Netlify `_redirects` file mapping `/api/*` to your backend:
     `/api/*  https://your-backend.example.com/api/:splat  200`
3. If your backend blocks CORS, set `FRONTEND_ORIGIN` env var on the backend to your Netlify URL.

After this, the admin dashboard and booking form will work via the deployed API.
