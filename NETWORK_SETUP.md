# Network Setup Guide

## 🌐 Localhost Configuration Changed

Your MealBridge application is now configured for **network access** instead of localhost-only.

---

## 📍 Your Network Details

- **Your Machine IP:** `192.168.29.84`
- **Frontend Port:** `5173`
- **Backend Port:** `5000`

---

## 🔧 Configuration Changes Made

### 1. Backend (`server/.env`)
```env
CLIENT_URL=http://192.168.29.84:5173
```
- Allows frontend from network IP to connect
- CORS configured for network access

### 2. Frontend (`client/.env`)
```env
VITE_API_URL=http://192.168.29.84:5000/api
VITE_SOCKET_URL=http://192.168.29.84:5000
```
- Points to backend using network IP
- Socket.io connects via network

### 3. Backend Server (`server/src/index.js`)
```javascript
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Network access: http://192.168.29.84:${PORT}`);
});
```
- Binds to `0.0.0.0` (all network interfaces)
- Shows both localhost and network URLs

### 4. Frontend Server (`client/vite.config.js`)
```javascript
server: {
  port: 5173,
  host: true  // Already configured for network access
}
```

---

## 🚀 How to Run with Network Access

### Start Backend
```bash
cd server
npm run dev
```

**Expected Output:**
```
✓ Database connected successfully
✓ Socket.io server initialized
✓ Server running on http://localhost:5000
✓ Network access: http://192.168.29.84:5000
```

### Start Frontend
```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.29.84:5173/
```

---

## 📱 Access Points

### On Your Machine (localhost)
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### On Other Devices (same network)
- **Frontend:** http://192.168.29.84:5173
- **Backend:** http://192.168.29.84:5000/api
- **Health Check:** http://192.168.29.84:5000/api/health

---

## 📱 Testing from Mobile Device

1. **Connect mobile to same WiFi network**
2. **Open browser on mobile**
3. **Go to:** `http://192.168.29.84:5173`
4. **Register/Login and test the app**

---

## 🔄 Switch Back to Localhost

If you want to use localhost only:

### Backend (`server/.env`)
```env
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Backend Server (`server/src/index.js`)
```javascript
// Remove HOST constant and change to:
server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
```

Then restart both servers.

---

## 🔒 Firewall Configuration

If other devices can't connect, you may need to allow the ports:

### Ubuntu/Linux
```bash
# Allow port 5000 (backend)
sudo ufw allow 5000/tcp

# Allow port 5173 (frontend)
sudo ufw allow 5173/tcp

# Check status
sudo ufw status
```

### Check if ports are listening
```bash
sudo netstat -tulpn | grep -E '5000|5173'
```

---

## 🌐 Different Network Scenarios

### Scenario 1: Your IP Changed
If your IP address changes (e.g., router restart):

1. Find new IP:
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. Update both `.env` files with new IP

3. Restart servers

### Scenario 2: Using Custom Domain (Advanced)
If you have a domain or want to use mDNS:

1. **Option A - Add to `/etc/hosts`:**
   ```bash
   sudo nano /etc/hosts
   # Add line:
   192.168.29.84   mealbridge.local
   ```

2. **Update .env files:**
   ```env
   CLIENT_URL=http://mealbridge.local:5173
   VITE_API_URL=http://mealbridge.local:5000/api
   ```

3. Access via: `http://mealbridge.local:5173`

### Scenario 3: Production Deployment
For production with a real domain:

1. **Backend `.env`:**
   ```env
   CLIENT_URL=https://mealbridge.com
   NODE_ENV=production
   ```

2. **Frontend `.env`:**
   ```env
   VITE_API_URL=https://api.mealbridge.com/api
   VITE_SOCKET_URL=https://api.mealbridge.com
   ```

3. Use nginx/Apache as reverse proxy
4. Add SSL certificate (Let's Encrypt)

---

## 🐛 Troubleshooting Network Access

### Problem: "Cannot connect from other device"

**Check 1: Both devices on same network?**
```bash
# On your machine
ip addr show

# On mobile, check WiFi settings - should be same network name
```

**Check 2: Firewall blocking?**
```bash
# Temporarily disable firewall to test
sudo ufw disable

# If it works, re-enable and add rules
sudo ufw enable
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
```

**Check 3: Server listening on all interfaces?**
```bash
# Should show 0.0.0.0:5000, not 127.0.0.1:5000
sudo netstat -tulpn | grep 5000
```

### Problem: "CORS error in browser"

**Check:** `CLIENT_URL` in `server/.env` matches the frontend URL exactly
```env
# If accessing from 192.168.29.84:5173
CLIENT_URL=http://192.168.29.84:5173

# Not: http://localhost:5173
```

### Problem: "Socket.io not connecting"

**Check:** `VITE_SOCKET_URL` in `client/.env` matches backend
```env
VITE_SOCKET_URL=http://192.168.29.84:5000
```

**In browser console, should see:**
```
Socket.io connected
```

---

## 📊 Network vs Localhost Comparison

| Feature | Localhost | Network IP |
|---------|-----------|------------|
| **Access** | This machine only | Any device on network |
| **URL** | `http://localhost:5173` | `http://192.168.29.84:5173` |
| **Mobile Testing** | ❌ Not possible | ✅ Possible |
| **Speed** | Slightly faster | Very similar |
| **Security** | More secure | Less secure (local network only) |
| **Firewall** | Not needed | May need rules |

---

## ✅ Verification Steps

After starting servers, verify:

1. **Backend accessible:**
   ```bash
   curl http://192.168.29.84:5000/api/health
   # Should return: {"status":"ok","database":"connected"}
   ```

2. **Frontend accessible:**
   - Open: http://192.168.29.84:5173
   - Should see login page

3. **From another device:**
   - Connect to same WiFi
   - Open: http://192.168.29.84:5173
   - Should load the app

4. **Socket.io working:**
   - Open browser console (F12)
   - Should see: "Socket.io connected"

---

Your application is now configured for network access! 🎉
