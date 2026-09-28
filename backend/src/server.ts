import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { authRouter } from './routes/authRoutes.js';
import { farmRouter } from './routes/farmRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';
import { productRouter } from './routes/productRoutes.js';
import { orderRouter } from './routes/orderRoutes.js';
import { produceRouter } from './routes/produceRoutes.js';
import { shopRouter } from './routes/shopRoutes.js';
import { farmManagementRouter } from './routes/farmManagementRoutes.js';
import { chatRouter } from './routes/chatRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { priceRouter } from './routes/priceRoutes.js';
import { supabaseRouter } from './routes/supabaseRoutes.js';
import { seedDatabase } from './database/seed.js';
import { db } from './database/db.js';

const app = express();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Global middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static file hosting for uploaded images
app.use('/uploads', express.static(config.uploadDir));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'AgriDex Backend API',
    tagline: 'AI for Every Farmer — Diagnose, Decide, Buy, Sell and Grow.',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount modular REST routes
app.use('/api/auth', authRouter);
app.use('/api/farms', farmRouter);
app.use('/api/ai', aiRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/produce', produceRouter);
app.use('/api/shops', shopRouter);
app.use('/api/farm', farmManagementRouter);
app.use('/api/messages', chatRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/prices', priceRouter);
app.use('/api/supabase', supabaseRouter);

// Production: Serve compiled frontend if frontend/dist exists
const frontendDistPaths = [
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), 'dist/frontend')
];
const foundFrontendDist = frontendDistPaths.find(p => fs.existsSync(p));

if (foundFrontendDist) {
  console.log(`📦 Serving compiled AgriDex frontend from: ${foundFrontendDist}`);
  app.use(express.static(foundFrontendDist));
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(foundFrontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error occurred',
    details: config.nodeEnv === 'development' ? err.stack : undefined
  });
});

// Auto-seed initial demo/production data and trigger Supabase sync
const shouldSeed = db.getTable('users').length === 0 ||
  db.getTable('crops').length < 3 ||
  db.getTable('ai_diagnoses').length === 0;

if (shouldSeed) {
  console.log('🌱 Populating initial database tables (profiles, farms, crops, marketplace_products, disease_scans)...');
  seedDatabase().catch(console.error);
}

app.listen(config.port, () => {
  console.log(`🌾 AgriDex Backend Server is live on http://localhost:${config.port}`);
  console.log(`🚀 Agricultural REST endpoints ready at http://localhost:${config.port}/api`);
});
