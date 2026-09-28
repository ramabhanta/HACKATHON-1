import { Router, Response } from 'express';
import { optionalAuthenticate, authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { AiService } from '../services/aiService.js';
import { fetchWeather } from '../services/weatherService.js';
import { db } from '../database/db.js';

export const aiRouter = Router();

// Natural language conversational assistant
aiRouter.post('/chat', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { message, language, farmId, cropId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const response = await AiService.processChat(userId, {
      message,
      language: language || req.user?.language || 'en',
      farmId,
      cropId
    });

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI chat service error' });
  }
});

// Deep Learning Crop Disease Scan
aiRouter.post('/crop-disease', optionalAuthenticate, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { cropName, farmId, photoMetadata } = req.body;

    let parsedMetadata = undefined;
    if (photoMetadata) {
      try {
        parsedMetadata = typeof photoMetadata === 'string' ? JSON.parse(photoMetadata) : photoMetadata;
      } catch {
        // use raw or fallback
      }
    }

    const diagnosis = await AiService.diagnoseDisease(userId, req.file, cropName, farmId, parsedMetadata);

    // Fetch details of matched products
    const matchedProducts = db.find('products', p => diagnosis.recommendedProductIds.includes(p.id));

    return res.json({
      ...diagnosis,
      products: matchedProducts
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Crop disease diagnostic failed' });
  }
});

// Soil Analysis Engine
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

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Soil analysis service failed' });
  }
});

// Weather API integration
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

// History of diagnoses for user
aiRouter.get('/diagnoses', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const diagnoses = db.find('ai_diagnoses', d => d.userId === req.user!.id);
  return res.json(diagnoses);
});
