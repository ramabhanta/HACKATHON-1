import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import { db } from '../database/db.js';
import { Farm, Crop } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const farmRouter = Router();

// GET all farms for current user (queries directly from Supabase)
farmRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const farms = await SupabaseDataService.getFarms(userId);
  const crops = await SupabaseDataService.getCrops();
  const soilTests = await SupabaseDataService.getSoilTests();

  const farmsWithDetails = farms.map(farm => ({
    ...farm,
    crops: crops.filter(c => c.farmId === farm.id),
    latestSoilTest: soilTests.filter(s => s.farmId === farm.id).slice(-1)[0] || null
  }));

  return res.json(farmsWithDetails);
});

// POST create new farm (persists directly to Supabase)
farmRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { name, location, district, state, totalArea, areaUnit, soilType, irrigationSource, waterAvailability } = req.body;
  
  if (!name || !totalArea) {
    return res.status(400).json({ error: 'Farm name and total area are required' });
  }

  const newFarm: Farm = {
    id: `farm-${uuidv4().substring(0, 8)}`,
    userId: req.user!.id,
    name,
    location: location || 'Kadiri Mandal',
    district: district || req.user!.district || 'Sri Sathya Sai',
    state: state || req.user!.state || 'Andhra Pradesh',
    totalArea: parseFloat(totalArea),
    areaUnit: areaUnit || 'ACRE',
    soilType: soilType || 'RED_LOAM',
    irrigationSource: irrigationSource || 'BOREWELL',
    waterAvailability: waterAvailability || 'MODERATE',
    createdAt: new Date().toISOString()
  };

  const created = await SupabaseDataService.createFarm(newFarm);
  return res.status(201).json(created);
});

// POST add crop to farm (persists directly to Supabase)
farmRouter.post('/:farmId/crops', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { farmId } = req.params;
  const { cropName, variety, sowingDate, expectedHarvestDate, growthStage, areaPlanted, previousCrop, currentProblems } = req.body;

  if (!cropName) {
    return res.status(400).json({ error: 'Crop name is required' });
  }

  const farm = db.findById('farms', farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(404).json({ error: 'Farm not found or unauthorized' });
  }

  const newCrop: Crop = {
    id: `crop-${uuidv4().substring(0, 8)}`,
    farmId,
    cropName,
    variety: variety || 'Standard Local Hybrid',
    sowingDate: sowingDate || new Date().toISOString(),
    expectedHarvestDate: expectedHarvestDate || new Date(Date.now() + 90 * 86400000).toISOString(),
    growthStage: growthStage || 'VEGETATIVE',
    areaPlanted: parseFloat(areaPlanted) || farm.totalArea,
    previousCrop,
    currentProblems,
    healthStatus: 'HEALTHY',
    createdAt: new Date().toISOString()
  };

  const created = await SupabaseDataService.createCrop(newCrop);
  return res.status(201).json(created);
});

// PUT edit crop (updates in Supabase)
farmRouter.put('/crops/:cropId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { cropId } = req.params;
  const crop = db.findById('crops', cropId);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });

  const farm = db.findById('farms', crop.farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized to edit this crop' });
  }

  const { cropName, variety, growthStage, healthStatus, areaPlanted, expectedHarvestDate, currentProblems } = req.body;
  const updated = await SupabaseDataService.updateCrop(cropId, {
    cropName: cropName ?? crop.cropName,
    variety: variety ?? crop.variety,
    growthStage: growthStage ?? crop.growthStage,
    healthStatus: healthStatus ?? crop.healthStatus,
    areaPlanted: areaPlanted ? parseFloat(areaPlanted) : crop.areaPlanted,
    expectedHarvestDate: expectedHarvestDate ?? crop.expectedHarvestDate,
    currentProblems: currentProblems ?? crop.currentProblems
  });

  return res.json(updated);
});

// DELETE crop (deletes from Supabase)
farmRouter.delete('/crops/:cropId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { cropId } = req.params;
  const crop = db.findById('crops', cropId);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });

  const farm = db.findById('farms', crop.farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized to delete this crop' });
  }

  await SupabaseDataService.deleteCrop(cropId);
  return res.json({ success: true, message: 'Crop deleted' });
});

// DELETE farm (deletes from Supabase)
farmRouter.delete('/:farmId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { farmId } = req.params;
  const farm = db.findById('farms', farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized or farm not found' });
  }

  await SupabaseDataService.deleteFarm(farmId);
  return res.json({ success: true, message: 'Farm deleted' });
});

