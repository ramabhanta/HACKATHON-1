import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { config } from '../config/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { User, UserRole } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseDataService } from '../database/supabaseDataService.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, role, language, village, district, state, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await SupabaseDataService.getUserByEmailOrPhone(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: `usr-${uuidv4().substring(0, 8)}`,
      name,
      phone: phone || '',
      email: email.toLowerCase(),
      passwordHash,
      role: (role as UserRole) || 'FARMER',
      language: language || 'en',
      village,
      district: district || 'Sri Sathya Sai',
      state: state || 'Andhra Pradesh',
      pincode: pincode || '515591',
      latitude: 14.1165,
      longitude: 78.1634,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await SupabaseDataService.createUser(newUser);

    // Create profile based on selected role
    if (newUser.role === 'FARMER') {
      await SupabaseDataService.createFarmerProfile({
        id: `prof-${uuidv4().substring(0, 8)}`,
        userId: newUser.id,
        totalAcreage: req.body.totalAcreage ? parseFloat(req.body.totalAcreage) : 3.0,
        primaryCrops: req.body.primaryCrops ? (Array.isArray(req.body.primaryCrops) ? req.body.primaryCrops : [req.body.primaryCrops]) : ['Groundnut'],
        farmingExperienceYears: req.body.farmingExperienceYears ? parseInt(req.body.farmingExperienceYears, 10) : 5,
        farmingType: req.body.farmingType || 'INTEGRATED',
        soilTypeDefault: req.body.soilTypeDefault || 'RED_LOAM',
        hasSoilCard: false,
        irrigationType: req.body.irrigationType || 'BOREWELL'
      });
    } else if (newUser.role === 'VENDOR') {
      await SupabaseDataService.createVendorProfile({
        id: `prof-${uuidv4().substring(0, 8)}`,
        userId: newUser.id,
        shopName: req.body.shopName || `${name}'s Agri Center`,
        licenseNumber: req.body.licenseNumber || `AP/LIC/${Math.floor(1000 + Math.random() * 9000)}`,
        gstNumber: req.body.gstNumber || '',
        verificationStatus: 'PENDING',
        address: req.body.address || `${village || 'Main Road'}, ${district || 'Kadiri'}`,
        district: district || 'Sri Sathya Sai',
        state: state || 'Andhra Pradesh',
        pincode: pincode || '515591',
        latitude: 14.1120,
        longitude: 78.1601,
        rating: 5.0,
        reviewCount: 0,
        deliveryRadiusKm: 25,
        contactPhone: phone || '',
        openingHours: '08:00 AM - 08:00 PM'
      });
    } else if (newUser.role === 'EXPERT') {
      db.insert('expert_profiles', {
        id: `prof-${uuidv4().substring(0, 8)}`,
        userId: newUser.id,
        qualification: req.body.qualification || 'Agricultural Specialist',
        institution: req.body.institution || 'State Agricultural University',
        specialization: req.body.specialization ? [req.body.specialization] : ['Crop Protection'],
        isVerified: false,
        experienceYears: req.body.experienceYears ? parseInt(req.body.experienceYears, 10) : 5,
        bio: req.body.bio || 'Qualified agricultural consultant.'
      });
    }

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, config.jwtSecret, {
      expiresIn: '7d'
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return res.status(201).json({ user: userSafe, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, phone, identifier: rawIdentifier } = req.body;
    const identifier = (rawIdentifier || email || phone || '').toLowerCase().trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email or phone number and password are required' });
    }

    // Match by email OR phone directly from Supabase / db
    const user = await SupabaseDataService.getUserByEmailOrPhone(identifier);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email, phone number, or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email, phone number, or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: '7d'
    });

    const { passwordHash: _, ...userSafe } = user;
    return res.json({ user: userSafe, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { passwordHash: _, ...userSafe } = req.user;
  
  let profile: any = null;
  if (req.user.role === 'FARMER') {
    profile = await SupabaseDataService.getFarmerProfile(req.user.id);
  } else if (req.user.role === 'VENDOR') {
    profile = await SupabaseDataService.getVendorProfile(req.user.id);
  } else if (req.user.role === 'EXPERT') {
    profile = db.findOne('expert_profiles', p => p.userId === req.user!.id);
  }

  return res.json({ user: userSafe, profile });
});

// Demo Role Switcher endpoint to easily test Farmer, Vendor, Buyer, Expert, Admin workflows
authRouter.post('/demo-switch', async (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };
  const users = await SupabaseDataService.getUsers(role);
  const user = users && users.length > 0 ? users[0] : db.findOne('users', u => u.role === role);
  if (!user) {
    return res.status(404).json({ error: `Demo user for role ${role} not found` });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: '7d'
  });

  const { passwordHash: _, ...userSafe } = user;
  return res.json({ user: userSafe, token });
});

