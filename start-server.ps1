# AVB Cabs Server Startup Script
# This script sets the email password and starts the server

Write-Host "🚀 Starting AVB Cabs Server..." -ForegroundColor Green
Write-Host ""

# Set email password (update this if you change your App Password)
$env:EMAIL_PASS = "vxxivtfwzmwpxvow"
$env:EMAIL_USER = "avbcabz@gmail.com"

Write-Host "📧 Email Configuration:" -ForegroundColor Cyan
Write-Host "   EMAIL_USER: $env:EMAIL_USER"
Write-Host "   EMAIL_PASS: Set (hidden)"
Write-Host ""

# Start the server
Write-Host "Starting server..." -ForegroundColor Yellow
npm start

