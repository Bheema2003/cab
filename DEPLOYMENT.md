# 🚀 AVB Cabs Deployment Guide

## 📋 **Current Status**
- ✅ **Frontend**: Ready for Netlify deployment
- ❌ **Backend**: Needs deployment to Render.com
- ✅ **Database**: MongoDB Atlas (already configured)

## 🔧 **Backend Deployment to Render.com**

### **Step 1: Prepare Backend for Deployment**

1. **Create a new repository for backend** (separate from frontend):
   ```bash
   mkdir avb-cabs-backend
   cd avb-cabs-backend
   git init
   ```

2. **Copy these files to backend repository**:
   - `server.js`
   - `package.json`
   - `package-lock.json`
   - `data/` folder (if using local fallback)

3. **Update package.json for production**:
   ```json
   {
     "name": "avb-cabs-backend",
     "version": "1.0.0",
     "main": "server.js",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "cors": "^2.8.5",
       "express": "^4.18.2",
       "mongoose": "^7.8.7",
       "nodemailer": "^7.0.5"
     }
   }
   ```

### **Step 2: Deploy to Render.com**

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Create New Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Select your backend repository

3. **Configure Render Service**:
   - **Name**: `avb-cabs-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or upgrade for better performance)

4. **Set Environment Variables in Render**:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   WHATSAPP_TOKEN=your_whatsapp_token
   WHATSAPP_PHONE_ID=your_phone_id
   ```

5. **Deploy**: Click "Create Web Service"

### **Step 3: Update Frontend Configuration**

After backend deployment, update the redirect URL:

1. **In your frontend repository**, update `_redirects`:
   ```
   /api/*  https://avb-cabs-backend.onrender.com/api/:splat  200
   ```

2. **Update `netlify.toml`** (already done):
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://avb-cabs-backend.onrender.com/api/:splat"
     status = 200
   ```

### **Step 4: Deploy Frontend to Netlify**

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Fix Netlify deployment configuration"
   git push origin main
   ```

2. **Netlify will auto-deploy** from your GitHub repository

## 🔍 **Testing Deployment**

### **Backend Test**:
```bash
curl https://avb-cabs-backend.onrender.com/api/bookings
```

### **Frontend Test**:
1. Visit your Netlify URL
2. Try submitting a booking form
3. Check if data appears in MongoDB Atlas

## 🚨 **Common Issues & Solutions**

### **Issue 1: CORS Errors**
- **Solution**: Backend already has CORS configured for all origins

### **Issue 2: Environment Variables**
- **Solution**: Ensure all env vars are set in Render.com dashboard

### **Issue 3: MongoDB Connection**
- **Solution**: Verify MongoDB Atlas connection string and network access

### **Issue 4: Email Notifications**
- **Solution**: Check Gmail app password and email configuration

## 📞 **Support**
If you encounter issues:
1. Check Render.com logs for backend errors
2. Check Netlify deploy logs for frontend errors
3. Verify all environment variables are set correctly

## 🎯 **Expected Result**
- ✅ Frontend: `https://your-site.netlify.app`
- ✅ Backend: `https://avb-cabs-backend.onrender.com`
- ✅ Database: MongoDB Atlas (working)
- ✅ Forms: Submit and reset properly
- ✅ Notifications: Email and WhatsApp working
