import { Router, Response } from 'express';
import { optionalAuthenticate, authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { AiService } from '../services/aiService.js';
import { fetchWeather } from '../services/weatherService.js';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { uploadScanImageToStorage, getSupabase } from '../database/supabaseClient.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function getOrCreateDefaultFarmerId(): Promise<string> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) {
        return data.id;
      }
      const defaultUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      await supabase.from('profiles').upsert({
        id: defaultUuid,
        name: 'nani',
        phone: 'yugandharreddy350@gmail.com',
        role: 'farmer'
      });
      return defaultUuid;
    } catch (err) {
      console.error('Supabase scan insert error: Failed to get/create default farmer ID:', err);
    }
  }
  return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
}

export const aiRouter = Router();

// 1. Natural language conversational assistant
aiRouter.post('/chat', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { message, language, farmId, cropId } = req.body;

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
      }
    );

    return res.json(response);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI chat service error' });
  }
});

// 1b. Real-time streaming conversational assistant for sub-second latency
aiRouter.post('/chat/stream', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { message, language, farmId, cropId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const farm = farmId ? db.findById('farms', farmId) : db.findOne('farms', f => f.userId === userId);
    const crop = cropId ? db.findById('crops', cropId) : (farm ? db.findOne('crops', c => c.farmId === farm.id) : undefined);
    const soil = farm ? db.findOne('soil_tests', s => s.farmId === farm.id) : undefined;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    for await (const chunk of AiService.streamGeminiChat(message, language || req.user?.language || 'en', { farm, crop, soil })) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (err: any) {
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'AI streaming error' });
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    return res.end();
  }
});

aiRouter.post('/crop-disease', optionalAuthenticate, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'usr-farmer-1';
    const { cropName, farmId, photoMetadata, imageUrl: bodyImageUrl } = req.body;

    const supabase = getSupabase();
    let publicUrl = bodyImageUrl || '';

    // a) Immediately when an image is received:
    // Upload image buffer directly to Supabase Storage bucket ('crop-scans' / 'scan-images')
    if (req.file) {
      try {
        const filePath = req.file.path || path.join(config.uploadDir, req.file.filename);
        let fileBuffer: Buffer | null = null;
        if (req.file.buffer) {
          fileBuffer = req.file.buffer;
        } else if (fs.existsSync(filePath)) {
          fileBuffer = fs.readFileSync(filePath);
        }

        if (fileBuffer) {
          const cleanName = (req.file.originalname || req.file.filename || 'leaf_scan.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
          const { uploadToStorage } = await import('../database/supabaseClient.js');
          publicUrl = await uploadToStorage('crop-scans', fileBuffer, cleanName, req.file.mimetype || 'image/jpeg');
          console.log('✅ [SUPABASE STORAGE] Scan image uploaded to crop-scans bucket:', publicUrl);
        }
      } catch (storageException: any) {
        console.error('Supabase scan upload exception:', storageException);
      }
    }

    let parsedMetadata = undefined;
    if (photoMetadata) {
      try {
        parsedMetadata = typeof photoMetadata === 'string' ? JSON.parse(photoMetadata) : photoMetadata;
      } catch {
        // use raw or fallback
      }
    }

    // Run deep learning multimodal diagnosis
    const diagnosis = await AiService.diagnoseDisease(
      userId,
      req.file,
      cropName,
      farmId,
      parsedMetadata
    );

    if (publicUrl) {
      diagnosis.imageUrl = publicUrl;
    }

    // Format remedies and standard snake_case fields
    const remediesList = [
      ...(diagnosis.culturalControl || []),
      ...(diagnosis.biologicalControl || []),
      ...(diagnosis.chemicalControlSafe || [])
    ];
    const remediesText = remediesList.length > 0
      ? remediesList.map(r => `• ${r}`).join('\n')
      : (diagnosis.remedies || 'Consult local Krishi Vigyan Kendra (KVK)');

    diagnosis.detected_disease = diagnosis.detected_disease || diagnosis.suspectedIssue || 'Plant Foliar Condition';
    diagnosis.confidence = diagnosis.confidence !== undefined
      ? diagnosis.confidence
      : (diagnosis.confidenceScore > 1 ? Number((diagnosis.confidenceScore / 100).toFixed(2)) : diagnosis.confidenceScore);
    diagnosis.remedies = diagnosis.remedies || remediesText;

    // b) After Gemini returns the diagnosis, perform a real database insert (only for valid crop plants):
    if (supabase && diagnosis.isCropPlant !== false) {
      try {
        let farmer_id = req.body.farmer_id || req.user?.id;
        if (!farmer_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(farmer_id)) {
          farmer_id = await getOrCreateDefaultFarmerId();
        }

        const scanId = crypto.randomUUID();
        const scanPayload: any = {
          id: scanId,
          farmer_id,
          image_url: publicUrl || diagnosis.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910a455?w=500',
          detected_disease: diagnosis.detected_disease,
          confidence_score: diagnosis.confidence,
          treatment_recommendations: diagnosis.remedies,
          created_at: new Date().toISOString()
        };

        console.log(`[SUPABASE] Awaiting supabase.from('disease_scans').insert(...) using service role client...`, scanPayload);
        let { data, error } = await supabase.from('disease_scans').insert(scanPayload).select();

        if (error) {
          if (error.code === 'PGRST204' || error.message?.includes('confidence') || error.message?.includes('remedies')) {
            const alternatePayload: any = {
              id: scanId,
              farmer_id,
              image_url: scanPayload.image_url,
              detected_disease: diagnosis.detected_disease,
              confidence: diagnosis.confidence,
              remedies: diagnosis.remedies,
              created_at: scanPayload.created_at
            };
            const retry = await supabase.from('disease_scans').insert(alternatePayload).select();
            data = retry.data;
            error = retry.error;
          }
        }

        if (error) {
          console.error('Supabase scan insert error:', error);
        } else {
          console.log(`[SUPABASE SUCCESS] Scan row created with ID: ${scanId}`);
        }
      } catch (insertError: any) {
        console.error('Supabase scan insert error:', insertError);
      }
    } else {
      console.warn('[SUPABASE] Supabase client not available, skipping cloud disease_scans insert.');
    }

    // Save to local cache as well
    try {
      await SupabaseDataService.saveDiagnosis(diagnosis);
    } catch {
      // ignore local mirror err
    }

    // Fetch matched verified inputs from instant in-memory cache
    const allProducts = db.getTable('products');
    const matchedProducts = allProducts.filter(p => diagnosis.recommendedProductIds.includes(p.id));

    return res.status(201).json({
      ...diagnosis,
      products: matchedProducts
    });
  } catch (err: any) {
    console.error('Crop disease diagnostic route error:', err);
    return res.status(500).json({ error: err.message || 'Crop disease diagnostic failed' });
  }
});

// 3. AI Engine Configuration status & settings
aiRouter.get('/config', (_req, res) => {
  const hasServerKey = Boolean(config.geminiApiKey && config.geminiApiKey.length > 5);
  return res.json({
    hasServerKey,
    activeModel: hasServerKey ? 'Google Gemini 3.5 Flash' : 'AgroDex Live Knowledge Engine',
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
    activeModel: 'Google Gemini 3.5 Flash'
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

    let reportUrl: string | undefined = undefined;
    if (req.file) {
      try {
        const filePath = req.file.path || path.join(config.uploadDir, req.file.filename);
        let fileBuffer: Buffer | null = null;
        if (req.file.buffer) fileBuffer = req.file.buffer;
        else if (fs.existsSync(filePath)) fileBuffer = fs.readFileSync(filePath);

        if (fileBuffer) {
          const { uploadToStorage } = await import('../database/supabaseClient.js');
          const cleanName = (req.file.originalname || `soil_report_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
          reportUrl = await uploadToStorage('soil-reports', fileBuffer, cleanName, req.file.mimetype || 'application/pdf');
        }
      } catch (e) {
        console.warn('Soil report upload warning:', e);
      }
    }

    if (reportUrl) {
      result.summary = `${result.summary} (Attached report: ${reportUrl})`;
    }

    await SupabaseDataService.saveSoilTest(result);
    return res.status(201).json(result);
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
