import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { Farm, Crop } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const farmRouter = Router();

// GET all farms for current user
farmRouter.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const farms = db.find('farms', f => f.userId === userId);
  const crops = db.find('crops');
  const soilTests = db.find('soil_tests');

  const farmsWithDetails = farms.map(farm => ({
    ...farm,
    crops: crops.filter(c => c.farmId === farm.id),
    latestSoilTest: soilTests.filter(s => s.farmId === farm.id).slice(-1)[0] || null
  }));

  return res.json(farmsWithDetails);
});

// POST create new farm
farmRouter.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
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

  db.insert('farms', newFarm);
  return res.status(201).json(newFarm);
});

// POST add crop to farm
farmRouter.post('/:farmId/crops', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { farmId } = req.params;
  const { cropName, variety, sowingDate, expectedHarvestDate, growthStage, areaPlanted, previousCrop, currentProblems } = req.body;

  if (!cropName) {
    return res.status(400).json({ error: 'Crop name is required' });
  }

  const farm = db.findById('farms', farmId);
  if (!farm || farm.userId !== req.user!.id) {
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

  db.insert('crops', newCrop);
  return res.status(201).json(newCrop);
});

// PUT edit crop
farmRouter.put('/crops/:cropId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { cropId } = req.params;
  const crop = db.findById('crops', cropId);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });

  const farm = db.findById('farms', crop.farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized to edit this crop' });
  }

  const { cropName, variety, growthStage, healthStatus, areaPlanted, expectedHarvestDate, currentProblems } = req.body;
  const updated = db.update('crops', cropId, {
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

// DELETE crop
farmRouter.delete('/crops/:cropId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { cropId } = req.params;
  const crop = db.findById('crops', cropId);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });

  const farm = db.findById('farms', crop.farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized to delete this crop' });
  }

  db.delete('crops', cropId);
  return res.json({ success: true, message: 'Crop deleted' });
});

// DELETE farm
farmRouter.delete('/:farmId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { farmId } = req.params;
  const farm = db.findById('farms', farmId);
  if (!farm || (farm.userId !== req.user!.id && req.user!.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized or farm not found' });
  }

  // Delete associated crops
  const farmCrops = db.find('crops', c => c.farmId === farmId);
  farmCrops.forEach(c => db.delete('crops', c.id));

  db.delete('farms', farmId);
  return res.json({ success: true, message: 'Farm deleted' });
});
