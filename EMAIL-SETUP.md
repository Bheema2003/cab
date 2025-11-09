# 📧 Email Setup Checklist for Production

## ⚠️ Critical: Email Will NOT Work Without This Setup

Email notifications require environment variables to be set on your backend server (Render.com).

## ✅ Quick Checklist

### 1. Get Gmail App Password
- [ ] Enable 2-Step Verification on Gmail
- [ ] Generate App Password at: https://myaccount.google.com/apppasswords
- [ ] Copy the 16-character password

### 2. Set Environment Variables on Render.com
Go to your Render service → Environment tab → Add these variables:

- [ ] `EMAIL_USER=avbcabz@gmail.com`
- [ ] `EMAIL_PASS=your_16_character_app_password` ⚠️ **CRITICAL**
- [ ] `EMAIL_TO=avbcabz@gmail.com` (optional, defaults to EMAIL_USER)
- [ ] `FRONTEND_ORIGIN=*` (or your Netlify URL)

### 3. Verify Setup
- [ ] Check Render logs for: `✅ Email transporter verified successfully`
- [ ] Test booking from Netlify site
- [ ] Check email inbox for booking notification

## 🔍 How to Verify Email is Working

1. **Check Render Logs**:
   ```
   ✅ Email transporter verified successfully
   ✅ Email notification sent successfully!
   ```

2. **Test Health Endpoint**:
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Should return: `"email": true`

3. **Test Email Endpoint** (optional):
   ```bash
   curl -X POST https://your-backend.onrender.com/api/test-email
   ```

## 🐛 Common Issues

### Issue: "Email credentials missing"
**Solution**: Set `EMAIL_USER` and `EMAIL_PASS` in Render environment variables

### Issue: "Authentication failed"
**Solution**: 
- Use Gmail App Password, not regular password
- Make sure 2-Step Verification is enabled
- Verify the password is correct (no spaces)

### Issue: Emails not received
**Solution**:
- Check spam folder
- Verify `EMAIL_TO` is set correctly
- Check Render logs for errors
- Verify email is being sent (check logs)

## 📝 Important Notes

1. **Never commit passwords** to GitHub
2. **Use App Passwords** for Gmail (more secure)
3. **Environment variables** must be set on Render, not in code
4. **Restart service** after setting environment variables

## 🔗 Related Files

- `RENDER-DEPLOYMENT.md` - Full deployment guide
- `server.js` - Email configuration code
- Render Dashboard - Where to set environment variables

---

**After setting environment variables, restart your Render service for changes to take effect!**

