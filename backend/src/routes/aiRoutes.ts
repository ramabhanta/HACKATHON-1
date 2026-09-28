import { Router, Response } from 'express';
import { optionalAuthenticate, authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { AiService } from '../services/aiService.js';
import { fetchWeather } from '../services/weatherService.js';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { uploadScanImageToStorage } from '../database/supabaseClient.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import fs from 'fs';
import path from 'path';

export const aiRouter = Router();

// 1. Natural language conversational assistant
aiRouter.post('/chat', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { message, language, farmId, cropId, apiKey } = req.body;
    const clientApiKey = (req.headers['x-gemini-key'] as string) || apiKey;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const response = await AiService.processChat(
      userId,
      {
        message,
        language: language || req.user?.language || 'en',
        farmId,
        cropId
      },
      clientApiKey
    );

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI chat service error' });
  }
});

// 2. Deep Learning Crop Disease Scan
aiRouter.post('/crop-disease', optionalAuthenticate, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { cropName, farmId, photoMetadata, apiKey } = req.body;
    const clientApiKey = (req.headers['x-gemini-key'] as string) || apiKey;

    let parsedMetadata = undefined;
    if (photoMetadata) {
      try {
        parsedMetadata = typeof photoMetadata === 'string' ? JSON.parse(photoMetadata) : photoMetadata;
      } catch {
        // use raw or fallback
      }
    }

    // 1. If an image file was uploaded, upload directly to Supabase Storage 'scan-images'
    let supabaseImageUrl: string | undefined = undefined;
    if (req.file) {
      try {
        const filePath = req.file.path || path.join(config.uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          const fileBuf = fs.readFileSync(filePath);
          supabaseImageUrl = await uploadScanImageToStorage(
            fileBuf,
            req.file.originalname || req.file.filename,
            req.file.mimetype || 'image/jpeg'
          );
        }
      } catch (uploadErr) {
        console.warn('Direct Supabase image upload note:', uploadErr);
      }
    }

    const diagnosis = await AiService.diagnoseDisease(
      userId,
      req.file,
      cropName,
      farmId,
      parsedMetadata,
      clientApiKey
    );

    // If Supabase storage returned a public URL, store that in diagnosis
    if (supabaseImageUrl && supabaseImageUrl.startsWith('http')) {
      diagnosis.imageUrl = supabaseImageUrl;
    }

    // Persist diagnosis directly to Supabase ai_diagnoses table
    await SupabaseDataService.saveDiagnosis(diagnosis);

    // Fetch details of matched products from Supabase products table
    const allProducts = await SupabaseDataService.getProducts();
    const matchedProducts = allProducts.filter(p => diagnosis.recommendedProductIds.includes(p.id));

    return res.json({
      ...diagnosis,
      products: matchedProducts
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Crop disease diagnostic failed' });
  }
});

// 3. AI Engine Configuration status & settings
aiRouter.get('/config', (_req, res) => {
  const hasServerKey = Boolean(config.geminiApiKey && config.geminiApiKey.length > 5);
  return res.json({
    hasServerKey,
    activeModel: hasServerKey ? 'Google Gemini 1.5 Flash' : 'AgriDex Live Knowledge Engine',
    visionCapable: true,
    supportedLanguages: ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or']
  });
});

aiRouter.post('/config', optionalAuthenticate, (req, res) => {
  const { geminiApiKey } = req.body;
  if (!geminiApiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  config.geminiApiKey = geminiApiKey.trim();
  process.env.GEMINI_API_KEY = geminiApiKey.trim();

  // Save to .env on disk
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${geminiApiKey.trim()}`);
    } else {
      envContent += `\nGEMINI_API_KEY=${geminiApiKey.trim()}`;
    }
    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  } catch (e) {
    console.error('Failed to write .env file:', e);
  }

  return res.json({
    success: true,
    message: 'Google Gemini API key saved successfully',
    activeModel: 'Google Gemini 1.5 Flash'
  });
});

// 4. Soil Analysis Engine
aiRouter.post('/soil-analysis', optionalAuthenticate, upload.single('report'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { farmId, sourceType, ph, nitrogen, phosphorus, potassium, organicCarbon, electricalConductivity, soilMoisture, soilType } = req.body;

    const targetFarmId = farmId || 'farm-1';
    const result = AiService.analyzeSoil(userId, targetFarmId, {
      sourceType: sourceType || (req.file ? 'LAB_REPORT' : 'MANUAL_ENTRY'),
      ph: ph ? parseFloat(ph) : undefined,
      nitrogen: nitrogen ? parseFloat(nitrogen) : undefined,
      phosphorus: phosphorus ? parseFloat(phosphorus) : undefined,
      potassium: potassium ? parseFloat(potassium) : undefined,
      organicCarbon: organicCarbon ? parseFloat(organicCarbon) : undefined,
      electricalConductivity: electricalConductivity ? parseFloat(electricalConductivity) : undefined,
      soilMoisture: soilMoisture ? parseFloat(soilMoisture) : undefined,
      soilType
    });

    await SupabaseDataService.saveSoilTest(result);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Soil analysis service failed' });
  }
});

// 5. Weather API integration
aiRouter.get('/weather', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 14.1165;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 78.1634;
    const location = (req.query.location as string) || 'Kadiri, Andhra Pradesh';

    const weather = await fetchWeather(lat, lon, location);
    return res.json(weather);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Weather fetch failed' });
  }
});

// 6. History of diagnoses for user (directly from Supabase)
aiRouter.get('/diagnoses', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const diagnoses = await SupabaseDataService.getDiagnoses(req.user!.id);
  return res.json(diagnoses);
});
