# 🚀 Backend Deployment Guide for Render.com

## 📋 Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **Gmail App Password**: Required for email notifications
3. **MongoDB Atlas**: Already configured

## 🔧 Step 1: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** → **2-Step Verification** (enable if not enabled)
3. Go to **App passwords**: https://myaccount.google.com/apppasswords
4. Create a new app password:
   - Select **Mail** as app
   - Select **Other (Custom name)** as device
   - Name it "AVB Cabs Backend"
   - Click **Generate**
5. **Copy the 16-character password** (you'll need this for Render)

## 🚀 Step 2: Deploy Backend to Render.com

### Option A: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin master
   ```

2. **Go to Render.com Dashboard**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub account if not already connected
   - Select your repository: `Bheema2003/cab`

3. **Configure the Service**:
   - **Name**: `avb-cabs-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `master` (or your main branch)
   - **Root Directory**: Leave empty (or `backend-package` if you have separate backend)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or upgrade for better performance)

4. **Set Environment Variables** (CRITICAL):
   Click on **"Environment"** tab and add these variables:

   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://avbcabz:avbcabz@cluster0.g7du51j.mongodb.net/avbcabs?retryWrites=true&w=majority
   EMAIL_USER=avbcabz@gmail.com
   EMAIL_PASS=your_16_character_app_password_here
   EMAIL_TO=avbcabz@gmail.com
   FRONTEND_ORIGIN=*
   ```

   ⚠️ **IMPORTANT**: 
   - Replace `your_16_character_app_password_here` with the Gmail App Password you generated
   - Use `*` for `FRONTEND_ORIGIN` to allow all origins, or specify your Netlify URL

5. **Click "Create Web Service"**
   - Render will start building and deploying your backend
   - Wait for deployment to complete (usually 2-5 minutes)

### Option B: Deploy Manually

1. **Create a new Web Service** on Render
2. **Upload your files** or connect via Git
3. **Follow the same configuration steps** as above

## ✅ Step 3: Verify Deployment

1. **Check Render Logs**:
   - Go to your service dashboard
   - Click on **"Logs"** tab
   - Look for: `✅ Email transporter verified successfully`
   - Look for: `✅ Connected to MongoDB Atlas successfully!`
   - Look for: `🚀 Server running on http://localhost:10000`

2. **Test the Health Endpoint**:
   ```bash
   curl https://your-service-name.onrender.com/api/health
   ```
   
   Expected response:
   ```json
   {
     "success": true,
     "mongo": true,
     "email": true,
     "emailUser": "av***"
   }
   ```

3. **Test Email** (optional):
   ```bash
   curl -X POST https://your-service-name.onrender.com/api/test-email
   ```

## 🔄 Step 4: Update Frontend Configuration

1. **Update `index.html`**:
   ```html
   <meta name="api-base" content="https://your-service-name.onrender.com">
   ```

2. **Update `netlify.toml`** (optional, for redirects):
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://your-service-name.onrender.com/api/:splat"
     status = 200
   ```

3. **Redeploy Frontend to Netlify**:
   - Push changes to GitHub
   - Netlify will auto-deploy

## 🐛 Troubleshooting

### Issue 1: Email Not Sending

**Symptoms**: Bookings are saved but no email received

**Solutions**:
1. Check Render logs for email errors
2. Verify `EMAIL_USER` and `EMAIL_PASS` are set correctly
3. Make sure you're using Gmail App Password, not regular password
4. Check if 2-Step Verification is enabled on Gmail
5. Verify `EMAIL_TO` is set correctly

### Issue 2: CORS Errors

**Symptoms**: Frontend can't connect to backend

**Solutions**:
1. Set `FRONTEND_ORIGIN=*` in Render environment variables
2. Or set `FRONTEND_ORIGIN=https://your-netlify-site.netlify.app`
3. Check backend logs for CORS errors

### Issue 3: MongoDB Connection Failed

**Symptoms**: Backend can't connect to database

**Solutions**:
1. Verify `MONGODB_URI` is correct in Render environment variables
2. Check MongoDB Atlas network access (allow all IPs or add Render IPs)
3. Verify MongoDB Atlas credentials are correct

### Issue 4: Service Keeps Crashing

**Symptoms**: Render service stops working

**Solutions**:
1. Check Render logs for errors
2. Verify all environment variables are set
3. Make sure `package.json` has correct start script
4. Check if port is set correctly (Render uses port from `PORT` env var)

## 📊 Monitoring

1. **Render Dashboard**: Monitor service health and logs
2. **Render Logs**: Check for errors and warnings
3. **Health Endpoint**: Regularly check `/api/health` endpoint
4. **Email Logs**: Check for email sending success/failure

## 🔒 Security Notes

1. **Never commit** `.env` files or passwords to GitHub
2. **Use App Passwords** for Gmail, not regular passwords
3. **Rotate passwords** periodically
4. **Monitor logs** for suspicious activity
5. **Use HTTPS** only (Render provides this automatically)

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables are set
3. Test endpoints individually
4. Check MongoDB Atlas connection
5. Verify Gmail App Password is correct

## 🎯 Expected Result

After deployment, you should have:
- ✅ Backend running on Render: `https://your-service-name.onrender.com`
- ✅ Frontend on Netlify: `https://your-site.netlify.app`
- ✅ Email notifications working
- ✅ MongoDB connection working
- ✅ All API endpoints responding

---

**Made with ❤️ for AVB Cabs**

