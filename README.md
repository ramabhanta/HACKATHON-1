# 🌾 AgriConnect AI — Agriculture Super App

> **“AI for Every Farmer — Diagnose, Decide, Buy, Sell and Grow.”**

AgriConnect AI is an end-to-end full-stack agricultural ecosystem connecting:
**Farmers ↔ AI Agriculture Assistant ↔ Vendors ↔ Agricultural Shops ↔ Transporters ↔ Agricultural Experts ↔ Platform Admin**

---

## 🌟 Key Features & Functional Modules

1. **🌾 My Farm & Rural Dashboard**:
   - Multi-farm and multi-field management (soil type, borewell/drip irrigation, acreage).
   - Standing crops with health monitors (Groundnut Kadiri-6, Tomato Arka Rakshak).
   - Real-time weather card (Open-Meteo API) with automated agronomic weather advisories.
2. **🤖 AI Farming Assistant**:
   - Context-aware natural language Q&A taking active crop, soil, and growth stage into account.
   - Multilingual support across **English**, **Telugu (తెలుగు)**, and **Hindi (हिंदी)**.
   - Integrated voice assistant (Speech-to-Text & Text-to-Speech).
3. **📷 Deep Learning Crop Disease Scanner**:
   - Image validation and preprocessing pipeline (MobileNetV3 / EfficientNet architecture).
   - Detects disease, calculates confidence score, presents visual evidence.
   - Safety-first guidance: cultural management, biological control (Trichoderma, Neem oil), safe chemical control with strict label warnings.
   - Enforces minimum 60% confidence threshold to prevent incorrect pesticide prescriptions.
4. **🌱 Soil Health & Fertilizer Balancer**:
   - Evaluates pH, available Nitrogen, Phosphorus, Potassium, Organic Carbon, and EC.
   - Generates split Urea guidance, DAP basal application, Gypsum pod filling recommendations, and FYM organic matter enrichment.
5. **🛒 Agricultural Input Marketplace**:
   - Real products: Neem Coated Urea, DAP 18-46-0, Coromandel Gromor 28-28-0, NPK 19-19-19 foliar spray, Certified K6 Groundnut seeds, Tomato seeds, Balwaan 16L Knapsack Sprayer.
   - Intelligent search ("urea near me", "groundnut seeds", "gromor", "organic").
   - Full product specifications, chemical composition, dosage guidance, safety sheets.
6. **🛍️ Cart & Multi-Vendor Checkout**:
   - Quantity controls, vendor grouping, subtotal, free delivery above ₹1,500.
   - Payment modes: UPI (with simulated QR code & VPA), Cards, Cash on Delivery (COD).
7. **🚚 Live Order Tracking Pipeline**:
   - Status transitions: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
8. **📍 Nearby Agricultural Input Shops**:
   - Geolocation discovery around Kadiri & Anantapur with Haversine distance calculations, opening hours, verified vendor badges, and in-stock counts.
9. **📦 Farmer Produce Mandi ("Sell My Produce")**:
   - Farmers list harvested lots without middleman commissions.
   - Wholesalers submit purchase offers and negotiate delivery.
10. **📋 Farm Operations & Expense Tracker**:
    - Task scheduler with priority alerts.
    - Expense tracker calculating total cost, projected harvest revenue, and estimated net profit.
11. **💬 Real-Time Messaging & Expert Consultation**:
    - Direct communication between farmers, local agri dealers, and agricultural scientists (Dr. K. Swaminathan).
12. **🏪 Vendor & Admin Dashboards**:
    - Vendor inventory management, stock alerts, order status fulfillment.
    - Admin KYC verification, product moderation, and AI diagnostic telemetry audit logs.

---

## 🚀 Running AgriConnect AI Locally

### Quick Start (Both Servers Already Live!)
The backend and frontend are already running:
- **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)

### Manual Start Commands:

#### 1. Backend Server:
```bash
cd backend
npm install
npm run seed     # Seeds realistic crops, fertilizers, shops, and demo users
npm run dev      # Runs on port 5000
```

#### 2. Frontend Web App:
```bash
cd frontend
npm install
npm run dev      # Runs on port 5173
```

#### 3. Machine Learning Microservice (Optional Standalone):
```bash
cd ml
pip install -r requirements.txt
python test_inference.py   # Run automated pipeline tests
uvicorn app.main:app --port 8000
```

#### 4. Multi-Container Docker Deployment:
```bash
docker-compose up --build
```

---

## 🔑 Demo Logins & Instant Role Switcher
You can use the **Role Switcher** pill at the top right of the navigation bar to switch between all roles with one click:

| Role | Email | Password | Details |
|---|---|---|---|
| **Farmer** | `farmer@agriconnect.com` | `password123` | Ramesh Patel (Kadiri, AP) |
| **Vendor** | `vendor@agriconnect.com` | `password123` | Sri Lakshmi Agri Inputs Depot |
| **Produce Buyer** | `buyer@agriconnect.com` | `password123` | Kisan Mandi Wholesalers |
| **Agri Expert** | `expert@agriconnect.com` | `password123` | Dr. K. Swaminathan (ANGRAU) |
| **Admin** | `admin@agriconnect.com` | `admin123` | Platform Administrator |
