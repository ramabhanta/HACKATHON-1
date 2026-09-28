# ☁️ How to Connect Supabase to AgriDex

AgriDex is built with native cloud support for **Supabase (PostgreSQL)**. With Supabase connected, your platform gets cloud persistence, real-time database synchronization, and scalable cloud storage for farmer listings and crop images.

---

## ⚡ Quick 5-Minute Setup Guide

### Step 1: Create a Free Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and click **"Start your project"**.
2. Sign in with GitHub or your email.
3. Click **"New Project"**.
4. Set:
   - **Name**: `agridex-db`
   - **Database Password**: Choose a strong password (save it safely).
   - **Region**: Choose the closest region (e.g. `ap-south-1` / **Mumbai, India** for fastest latency).
5. Click **"Create new project"** and wait ~1 minute for deployment.

---

### Step 2: Run the AgriDex Database Schema (1-Click)
1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar (icon `>_`).
2. Click **"New query"**.
3. In AgriDex, open the **"Connect Supabase"** modal (click the **⚡ Supabase** button in the top navigation bar or Admin Portal).
4. Click **"Copy Schema SQL"** (or open the file [`backend/src/database/supabase_schema.sql`](file:///C:/Users/yugan/.gemini/antigravity/scratch/agriconnect-ai/backend/src/database/supabase_schema.sql) and copy all text).
5. Paste the entire SQL script into the Supabase SQL Editor and click **"Run"** (or press `Ctrl + Enter`).
6. You will see:
   ```
   Success. No rows returned.
   ```
   All 17 tables (`users`, `farms`, `crops`, `soil_tests`, `products`, `produce_listings`, `vendor_deal_requests`, `market_prices`, `orders`, `notifications`, etc.) are now created with proper indexes!

---

### Step 3: Copy Your Supabase API Keys
1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon at the bottom of the left sidebar).
2. Click **"API"**.
3. Under **Project API keys**, you will see:
   - **Project URL**: e.g., `https://abcdefghijklm.supabase.co`
   - **anon public**: e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role secret** *(optional, for full backend admin sync)*: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### Step 4: Connect in AgriDex (2 Easy Ways)

#### Option A: Direct In-App Setup (Easiest)
1. In AgriDex, click the **⚡ Supabase** button in the top navigation bar.
2. In **Step 3: Enter Your Supabase API Keys**, paste:
   - **Project URL**
   - **Anon Public Key**
3. Click **"Save & Connect to Supabase"**.
4. The status badge will instantly turn green: **`✓ Connected to Supabase Cloud`**!
5. Click **"Sync Local Data"** to automatically push all existing farmers, products, produce listings, and mandi prices straight into your cloud Supabase database!

#### Option B: Configure via `.env` File
Open [`backend/.env`](file:///C:/Users/yugan/.gemini/antigravity/scratch/agriconnect-ai/backend/.env) and set:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
Restart the backend or run:
```bash
npm run dev
```

---

## 🤖 How to Enable Real AI with Google Gemini (Free API Key)

To get exact, real AI answers for any agricultural question and multimodal deep vision analysis for crop disease photos:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with any Google account and click **"Create API Key"** (100% Free, no credit card required).
3. In AgriDex, click **"⚡ AI Key"** in the top navigation bar or **"AI Settings"** inside the AI Assistant.
4. Paste your key and click **"Save & Activate"**.
5. You can also save it directly in [`backend/.env`](file:///C:/Users/yugan/.gemini/antigravity/scratch/agriconnect-ai/backend/.env):
   ```bash
   GEMINI_API_KEY=AIzaSy...
   ```

### Free Tier Limits:
- **Google Gemini 1.5 Flash**: 15 requests per minute, 1,500 requests per day (Completely Free).
- If no key is entered, AgriDex automatically falls back to its **Live Knowledge Engine** (real Wikipedia botanical retrieval + Open-Meteo micro-weather + Mandi price feeds).
