# 📋 Step-by-Step: Enable Email Notifications on Netlify

## 🎯 Goal
Make booking emails work when someone books a cab from your Netlify website.

---

## Step 1: Get Gmail App Password (5 minutes)

### 1.1 Enable 2-Step Verification (if not already enabled)
1. Go to: https://myaccount.google.com/security
2. Find **"2-Step Verification"**
3. Click and enable it (follow the prompts)

### 1.2 Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. Click **"Select app"** dropdown → Choose **"Mail"**
4. Click **"Select device"** dropdown → Choose **"Other (Custom name)"**
5. Type: `AVB Cabs Backend`
6. Click **"Generate"**
7. **COPY the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **IMPORTANT**: Copy this password now! You won't see it again.
   - Remove spaces when using it (use: `abcdefghijklmnop`)

---

## Step 2: Set Environment Variables on Render.com (10 minutes)

### 2.1 Open Your Render Dashboard
1. Go to: https://render.com
2. Sign in to your account
3. Find your backend service (probably named `cab-9wdp` or similar)
   - If you don't have one, see "Step 3: Deploy Backend" below

### 2.2 Add Environment Variables
1. Click on your backend service
2. Click on **"Environment"** tab (left sidebar)
3. Click **"Add Environment Variable"** button
4. Add these variables ONE BY ONE:

   **Variable 1:**
   - Key: `EMAIL_USER`
   - Value: `avbcabz@gmail.com`
   - Click **"Save"**

   **Variable 2:**
   - Key: `EMAIL_PASS`
   - Value: `your_16_character_app_password` (the one you copied from Step 1)
   - Click **"Save"**
   - ⚠️ **NO SPACES** in the password

   **Variable 3:**
   - Key: `EMAIL_TO`
   - Value: `avbcabz@gmail.com`
   - Click **"Save"**

   **Variable 4:**
   - Key: `FRONTEND_ORIGIN`
   - Value: `*`
   - Click **"Save"**

### 2.3 Restart Your Service
1. After adding all variables, go to **"Manual Deploy"** tab
2. Click **"Clear build cache & deploy"** or **"Deploy latest commit"**
3. Wait for deployment to complete (2-5 minutes)

---

## Step 3: Deploy Backend (If Not Already Deployed)

### 3.1 Connect GitHub to Render
1. Go to: https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account (if not connected)
4. Select repository: **`Bheema2003/cab`**

### 3.2 Configure Service
1. **Name**: `avb-cabs-backend` (or any name)
2. **Environment**: `Node`
3. **Region**: Choose closest to you
4. **Branch**: `master`
5. **Root Directory**: Leave empty
6. **Build Command**: `npm install`
7. **Start Command**: `npm start`
8. **Instance Type**: `Free`

### 3.3 Add Environment Variables
Before clicking "Create Web Service", add environment variables:
- Click **"Advanced"** → **"Add Environment Variable"**
- Add all variables from Step 2.2 above
- Also add:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `MONGODB_URI=mongodb+srv://avbcabz:avbcabz@cluster0.g7du51j.mongodb.net/avbcabs?retryWrites=true&w=majority`

### 3.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Copy your service URL (e.g., `https://avb-cabs-backend.onrender.com`)

---

## Step 4: Update Frontend Configuration (2 minutes)

### 4.1 Update index.html
1. Open `index.html` in your project
2. Find this line (around line 7):
   ```html
   <meta name="api-base" content="https://cab-9wdp.onrender.com">
   ```
3. Replace with your Render backend URL:
   ```html
   <meta name="api-base" content="https://your-backend-url.onrender.com">
   ```
4. Save the file

### 4.2 Push to GitHub
```bash
git add index.html
git commit -m "Update backend URL"
git push origin master
```

### 4.3 Netlify Auto-Deploys
- Netlify will automatically deploy your changes
- Wait 1-2 minutes for deployment

---

## Step 5: Test Everything (5 minutes)

### 5.1 Check Render Logs
1. Go to Render dashboard → Your service → **"Logs"** tab
2. Look for these messages:
   - ✅ `Email transporter verified successfully`
   - ✅ `Connected to MongoDB Atlas successfully!`
   - ✅ `Server running on http://localhost:10000`

### 5.2 Test Health Endpoint
1. Open browser
2. Go to: `https://your-backend-url.onrender.com/api/health`
3. You should see:
   ```json
   {
     "success": true,
     "mongo": true,
     "email": true,
     "emailUser": "av***"
   }
   ```
4. If `"email": false`, check your environment variables

### 5.3 Test Booking from Netlify
1. Go to your Netlify website
2. Fill out a booking form
3. Submit the booking
4. Check your email inbox (`avbcabz@gmail.com`)
5. You should receive a booking confirmation email!

### 5.4 Test Email Endpoint (Optional)
```bash
curl -X POST https://your-backend-url.onrender.com/api/test-email
```

---

## ✅ Success Checklist

- [ ] Gmail App Password generated
- [ ] Environment variables set on Render:
  - [ ] `EMAIL_USER`
  - [ ] `EMAIL_PASS`
  - [ ] `EMAIL_TO`
  - [ ] `FRONTEND_ORIGIN`
- [ ] Render service restarted/deployed
- [ ] Render logs show: `✅ Email transporter verified successfully`
- [ ] Health endpoint shows: `"email": true`
- [ ] Test booking sends email successfully
- [ ] Email received in inbox

---

## 🐛 Troubleshooting

### Problem: "Email credentials missing" in logs
**Solution**: 
- Go to Render → Environment tab
- Make sure `EMAIL_USER` and `EMAIL_PASS` are set
- Check for typos
- Restart service

### Problem: "Authentication failed"
**Solution**:
- Make sure you're using Gmail App Password, not regular password
- Remove any spaces from the password
- Make sure 2-Step Verification is enabled
- Generate a new App Password and try again

### Problem: Health endpoint shows `"email": false`
**Solution**:
- Check Render logs for error messages
- Verify environment variables are set correctly
- Make sure service was restarted after adding variables
- Check if App Password is correct

### Problem: Emails not received
**Solution**:
- Check spam folder
- Verify `EMAIL_TO` is set correctly
- Check Render logs for email sending errors
- Test with `/api/test-email` endpoint

### Problem: CORS errors
**Solution**:
- Set `FRONTEND_ORIGIN=*` in Render environment variables
- Or set it to your exact Netlify URL: `https://your-site.netlify.app`
- Restart service

---

## 📞 Need Help?

1. **Check Render Logs**: Most errors are visible in logs
2. **Check Health Endpoint**: `https://your-backend.onrender.com/api/health`
3. **Test Email Endpoint**: `curl -X POST https://your-backend.onrender.com/api/test-email`
4. **Verify Environment Variables**: Make sure all are set correctly

---

## 🎉 Done!

Once all steps are completed, your Netlify website will send booking emails automatically!

**Your setup:**
- ✅ Frontend: Netlify (auto-deploys from GitHub)
- ✅ Backend: Render.com (handles API and emails)
- ✅ Database: MongoDB Atlas (stores bookings)
- ✅ Email: Gmail (sends notifications)

---

**Last Updated**: After setting environment variables, always restart your Render service!

