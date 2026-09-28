import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';

export const shopRouter = Router();

// Haversine distance formula in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET nearby agricultural shops
shopRouter.get('/nearby', (req: Request, res: Response) => {
  const userLat = req.query.lat ? parseFloat(req.query.lat as string) : 14.1165;
  const userLon = req.query.lon ? parseFloat(req.query.lon as string) : 78.1634;
  const maxDistanceKm = req.query.radius ? parseFloat(req.query.radius as string) : 35;
  const search = req.query.search ? (req.query.search as string).toLowerCase() : '';

  const vendors = db.getTable('vendor_profiles');
  const products = db.getTable('products');

  // Realistic nearby agricultural shops in Rayalaseema / Kadiri region
  const demoShops = [
    {
      id: 'shop-1',
      name: 'Sri Lakshmi Agri Inputs & Seeds Depot',
      ownerName: 'Sri Lakshmi Agri Traders',
      phone: '+91 98490 54321',
      address: 'Shop #14, Main Bazaar, Near Old Bus Stand, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1120,
      longitude: 78.1601,
      rating: 4.8,
      reviews: 142,
      isVerified: true,
      openingHours: '07:30 AM - 08:30 PM (Mon-Sat)',
      featuredInputs: ['Neem Coated Urea', 'DAP 18:46:0', 'Coromandel Gromor 28-28-0', 'Groundnut K6 Seeds'],
      inStockCount: 28,
      distanceKm: calculateDistance(userLat, userLon, 14.1120, 78.1601)
    },
    {
      id: 'shop-2',
      name: 'Kisan Seva Kendra & Fertilizer Hub',
      ownerName: 'Anantha Farmers Cooperative',
      phone: '+91 94411 77889',
      address: 'Court Road, Opposite Rythu Bharosa Kendra, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1205,
      longitude: 78.1680,
      rating: 4.6,
      reviews: 98,
      isVerified: true,
      openingHours: '08:00 AM - 07:00 PM',
      featuredInputs: ['Organic Compost', 'Bio-fertilizers', 'Knapsack Sprayers', 'Drip Lateral Pipes'],
      inStockCount: 19,
      distanceKm: calculateDistance(userLat, userLon, 14.1205, 78.1680)
    },
    {
      id: 'shop-3',
      name: 'Balaji Agro-Chemicals & Plant Health Clinic',
      ownerName: 'Balaji Agro Enterprises',
      phone: '+91 98485 22334',
      address: 'NH 42 Junction, Tanakal Road, Kadiri Bypass',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.0950,
      longitude: 78.1450,
      rating: 4.7,
      reviews: 64,
      isVerified: true,
      openingHours: '07:00 AM - 09:00 PM',
      featuredInputs: ['Trichoderma Viride', 'Neem Oil 10,000 PPM', 'NPK 19-19-19', 'Tomato Hybrid Seeds'],
      inStockCount: 34,
      distanceKm: calculateDistance(userLat, userLon, 14.0950, 78.1450)
    },
    {
      id: 'shop-4',
      name: 'Rythu Mitra Agri Super Center',
      ownerName: 'Chaitanya Reddy',
      phone: '+91 99890 33445',
      address: 'Mudigubba Road, Kadiri West',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1350,
      longitude: 78.1820,
      rating: 4.5,
      reviews: 51,
      isVerified: true,
      openingHours: '08:00 AM - 08:00 PM',
      featuredInputs: ['MOP Fertilizer', 'SSP Single Super Phosphate', 'Drip Filters', 'Tarpaulins'],
      inStockCount: 22,
      distanceKm: calculateDistance(userLat, userLon, 14.1350, 78.1820)
    }
  ];

  let filtered = demoShops.filter(s => s.distanceKm <= maxDistanceKm);

  if (search) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.address.toLowerCase().includes(search) ||
      s.featuredInputs.some(i => i.toLowerCase().includes(search))
    );
  }

  filtered.sort((a, b) => a.distanceKm - b.distanceKm);
  return res.json(filtered);
});
