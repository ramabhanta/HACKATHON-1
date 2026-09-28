# 🌾 AgriConnect AI — REST API & OpenAPI Specification

Version: `1.0.0`  
Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Roles (`/api/auth`)

### `POST /api/auth/register`
Creates a new user profile with personal and location information.
- **Request Body**:
  ```json
  {
    "name": "Ramesh Patel",
    "phone": "+91 98480 12345",
    "email": "farmer@agriconnect.com",
    "password": "password123",
    "role": "FARMER",
    "village": "Kadiri Rural",
    "district": "Sri Sathya Sai",
    "state": "Andhra Pradesh"
  }
  ```
- **Response**: `201 Created` with JWT token and sanitized user object.

### `POST /api/auth/login`
Authenticates existing credentials and returns JWT bearer token.

### `POST /api/auth/demo-switch`
Switches active role for seamless demonstration:
- Supported roles: `FARMER`, `VENDOR`, `BUYER`, `EXPERT`, `ADMIN`

---

## 2. AI Agricultural Gateway (`/api/ai`)

### `POST /api/ai/chat`
Context-aware conversational agricultural assistant supporting English, Telugu, and Hindi.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "message": "What fertilizer should I use for groundnut flowering?",
    "language": "en",
    "farmId": "farm-1",
    "cropId": "crop-1"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "reply": "...",
    "language": "en",
    "suggestedActions": ["Foliar Spray 19-19-19", "Apply Gypsum"],
    "matchedProducts": [...]
  }
  ```

### `POST /api/ai/crop-disease`
Uploads crop leaf image for deep learning disease screening.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `image`: Image file (max 10MB)
  - `cropName`: `Groundnut`, `Tomato`, `Rice`, etc.
- **Response**:
  ```json
  {
    "id": "diag-1a2b",
    "cropName": "Groundnut",
    "suspectedIssue": "Early Leaf Spot (Tikka Disease)",
    "confidenceScore": 87.5,
    "severity": "MODERATE",
    "symptomsEvidence": [...],
    "culturalControl": [...],
    "biologicalControl": [...],
    "chemicalControlSafe": [...],
    "safetyWarnings": [...],
    "products": [...]
  }
  ```

### `POST /api/ai/soil-analysis`
Evaluates laboratory or manual soil fertility parameters (pH, N, P, K, Organic Carbon, EC).

### `GET /api/ai/weather`
Fetches live micro-weather with agricultural advisories.

---

## 3. Marketplace & Orders (`/api/products` & `/api/orders`)

### `GET /api/products`
Query parameters: `search`, `category`, `crop`, `organic`, `maxPrice`, `inStock`.

### `POST /api/orders`
Places multi-item agricultural orders, calculates delivery fees, updates vendor godown inventory, and creates initial tracking records.

### `PATCH /api/orders/:id/status`
Updates lifecycle status: `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.

---

## 4. Farmer Produce Mandi (`/api/produce`)

### `GET /api/produce`
Lists available farmer harvest lots.

### `POST /api/produce`
Farmer creates a new produce lot.

### `POST /api/produce/:id/requests`
Trader submits a purchase offer.
