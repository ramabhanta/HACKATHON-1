# 🚀 Yugandhar App — Publishing & Deployment Guide

This guide explains how to publish **Yugandhar App** to the internet so that anyone can access it on their computer, tablet, or smartphone.

---

## ⚡ Option 1: Instant Public Access (Active Right Now!)

A live internet tunnel is currently running for your local development instance:

- **Public Live URL**: [https://huge-hands-dance.loca.lt](https://huge-hands-dance.loca.lt)
- **One-time Tunnel Password / IP**: `202.62.74.198`

> **How to use**:
> 1. Open [https://huge-hands-dance.loca.lt](https://huge-hands-dance.loca.lt) on any phone, laptop, or tablet.
> 2. Paste `202.62.74.198` into the password prompt and click **Submit**.
> 3. **Yugandhar App** will load live with all features (diagnose, mandi prices, store, orders)!

---

## 🌐 Option 2: 100% Free Cloud Deployment on Render.com (Recommended for Production)

[Render.com](https://render.com) offers free hosting with automated SSL, continuous deployment, and zero server maintenance.

### Step 1: Initialize Git and Push to GitHub
Open your terminal in the project directory:
```bash
git init
git add .
git commit -m "Publish Yugandhar App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yugandhar-app.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and create a free account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository `yugandhar-app`.
4. Render will detect the configuration:
   - **Name**: `yugandhar-app`
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
5. Click **Create Web Service**.
6. Within 2-3 minutes, your app will be live at:
   ```
   https://yugandhar-app.onrender.com
   ```

*(The repository already includes `render.yaml` pre-configured!)*

---

## 📱 Option 3: Install as Mobile App (PWA on Android & iOS)

**Yugandhar App** is built as a Progressive Web App (PWA) with offline caching and standalone display.

### On Android (Chrome / Brave / Edge):
1. Open the website URL in mobile Chrome.
2. Tap the three dots menu (**⋮**) in the top right corner.
3. Tap **"Install App"** (or **"Add to Home Screen"**).
4. The **🌾 Yugandhar App** icon will appear on your phone's home screen and open in full-screen app mode like a native Play Store app!

### On iPhone / iPad (Safari):
1. Open the website URL in mobile Safari.
2. Tap the **Share** button (**⎋**) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. The **Yugandhar App** icon will be installed on your iOS home screen!

---

## 🚂 Option 4: Deploy on Railway / Koyeb / Fly.io

### Deploy on Railway:
1. Go to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `yugandhar-app`.
4. Railway will automatically build and deploy the app.
5. In the service settings, click **Generate Domain** to get your public URL (e.g. `https://yugandhar-app.up.railway.app`).

---

## 🐳 Option 5: Deploy with Docker

To run the complete production containerized stack locally or on any VPS:
```bash
docker compose up --build -d
```
The app will be available on port `80` (HTTP) and `5000` (API).

---

## 🔑 Demo Login Accounts

| Role | Email / Phone | Password | Name |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@agriconnect.com` or `9848012345` | `password123` | Ramesh Patel (Kadiri, AP) |
| **Vendor** | `vendor@agriconnect.com` or `9848012346` | `password123` | Sri Lakshmi Agri Inputs Depot |
| **Produce Buyer** | `buyer@agriconnect.com` or `9848012347` | `password123` | Kisan Mandi Wholesalers |
| **Agri Expert** | `expert@agriconnect.com` or `9848012348` | `password123` | Dr. K. Swaminathan (ANGRAU) |
| **Admin** | `admin@agriconnect.com` or `9848012349` | `admin123` | Platform Administrator |
