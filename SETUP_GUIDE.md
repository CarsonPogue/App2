# MOOVE - Quick Setup Guide

## 🚀 Get Your Database Connection String

Your Supabase project is already set up! You just need to get the connection string:

### Option 1: Via Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **iyfyvaarmensgxsmbisu**
3. Click **Settings** (gear icon in sidebar)
4. Click **Database**
5. Scroll to **Connection String** section
6. Select **Connection pooling** tab
7. Copy the connection string (it will look like):
   ```
   postgresql://postgres.iyfyvaarmensgxsmbisu:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

### Option 2: Direct Supabase Client (Alternative)
If you can't access the pooler connection, use the Supabase JavaScript client by updating the backend configuration.

---

## 📝 Update Backend Configuration

1. **Open** `/moove/backend/.env`
2. **Replace** the `DATABASE_URL` line with your actual connection string
3. **Save** the file

Example `.env` file:
```bash
NODE_ENV=development
PORT=3001

# Replace with your actual connection string from Supabase
DATABASE_URL=postgresql://postgres.iyfyvaarmensgxsmbisu:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# JWT Secrets (generate secure ones for production)
JWT_SECRET=moove-dev-jwt-secret-key-please-change-in-production-32chars-minimum
JWT_REFRESH_SECRET=moove-dev-jwt-refresh-secret-key-please-change-in-production-32chars-minimum

# Frontend URL for CORS
FRONTEND_URL=http://localhost:8081
```

---

## ✅ Start the Backend Server

```bash
cd moove/backend
npm run dev
```

You should see:
```
========================================
Configuration loaded successfully
========================================
  Environment: development
  Port: 3001
  Database: ✓ configured
  ...

Server running on port 3001
```

---

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T...",
  "database": "connected"
}
```

### Register a New User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@moove.app",
    "username": "demouser",
    "displayName": "Demo User",
    "password": "SecurePassword123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@moove.app",
    "password": "SecurePassword123!"
  }'
```

Save the `accessToken` from the response to test authenticated endpoints.

---

## 📱 Start the Mobile App

### Install Dependencies
```bash
cd moove/mobile
npm install
```

### Update API Endpoint
1. **Open** `/moove/mobile/src/services/api.ts`
2. **Update** the API_URL:
   - For local testing: `http://YOUR_COMPUTER_IP:3001/api/v1`
   - Example: `http://192.168.1.100:3001/api/v1`
   - To find your IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Start Expo
```bash
npm start
```

### Test on Device
1. Install **Expo Go** from App Store or Play Store
2. Scan the QR code from the terminal
3. The app will load on your device

---

## 🎯 What You Can Test

### Authentication
- ✅ Register new users
- ✅ Login/logout
- ✅ View user profile
- ✅ Update profile (avatar, bio, preferences)

### Events
- ✅ Browse events (will be empty until you add API keys or create custom events)
- ✅ RSVP to events (going/interested/not going)
- ✅ Add emoji reactions to RSVPs
- ✅ Comment on events
- ✅ Bookmark/save events

### Social Features
- ✅ Search for users
- ✅ Send friend requests
- ✅ Accept/decline friend requests
- ✅ View friend suggestions
- ✅ Block/unblock users
- ✅ Invite friends to events

### Notifications
- ✅ Receive notifications for friend requests, invites, comments
- ✅ Mark notifications as read
- ✅ View unread count

---

## 🔑 Optional: Add Event Discovery APIs

To populate events automatically, add these API keys to `/moove/backend/.env`:

### Ticketmaster API (Concerts, Sports, Theater)
1. Go to https://developer.ticketmaster.com/
2. Create a free account
3. Get your API key
4. Add to `.env`: `TICKETMASTER_API_KEY=your_key_here`

### Google Places API (Restaurants, Bars, Nightlife)
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable **Places API**
4. Create credentials (API Key)
5. Add to `.env`: `GOOGLE_PLACES_API_KEY=your_key_here`

### SeatGeek API (Additional Events)
1. Go to https://seatgeek.com/account/develop
2. Create a free app
3. Get your Client ID and Secret
4. Add to `.env`:
   ```
   SEATGEEK_CLIENT_ID=your_client_id
   SEATGEEK_CLIENT_SECRET=your_secret
   ```

After adding API keys, restart the backend to start fetching events automatically.

---

## 🐛 Troubleshooting

### Backend won't start
- Check that DATABASE_URL is correct
- Make sure port 3001 is not in use: `lsof -i :3001`
- Check logs for detailed errors

### Mobile app can't connect
- Ensure backend is running on port 3001
- Use your computer's local IP, not `localhost`
- Check that phone and computer are on same WiFi network
- Disable any VPN or firewall that might block connections

### Database errors
- Verify connection string from Supabase dashboard
- Check that Supabase project is active
- Ensure you have the correct password

---

## 📚 Next Steps

1. **Create sample events** manually via the database to test the app
2. **Add API keys** to automatically populate events from Ticketmaster/Google
3. **Test social features** by creating multiple user accounts
4. **Explore real-time** features with WebSocket connections
5. **Customize** the mobile UI to match your brand

---

## 🎉 You're All Set!

Your MOOVE app is fully functional with:
- ✅ Complete authentication system
- ✅ Secure database with RLS policies
- ✅ Social networking features
- ✅ Event discovery and management
- ✅ Real-time notifications
- ✅ Mobile app ready to deploy

Happy testing! 🚀
