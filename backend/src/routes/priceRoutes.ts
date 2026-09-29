import { Router, Request, Response } from 'express';
import { optionalAuthenticate, authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { MarketPrice, MandiCommodityType } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const priceRouter = Router();

// 100% Comprehensive All-India States & Districts Hierarchy
import { ALL_INDIA_REGIONS } from '../services/panIndiaMandiData.js';
export { ALL_INDIA_REGIONS };


// Built-in seed data with authentic realistic All-India mandi prices including Flowers
const INITIAL_MARKET_PRICES: MarketPrice[] = [
  // --- FLOWERS ---
  {
    id: 'pr-flw-1',
    state: 'Andhra Pradesh',
    district: 'Sri Sathya Sai',
    market: 'Kadiri Mandi',
    commodity: 'Jasmine (Mallipoo / మల్లెపూలు)',
    commodityType: 'FLOWER',
    variety: 'Local Fresh Bud',
    unit: 'KG',
    minPrice: 380,
    maxPrice: 520,
    modalPrice: 450,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 40,
    reportedByName: 'Kadiri Flower Growers Association',
    createdAt: '2026-09-27T06:00:00.000Z'
  },
  {
    id: 'pr-flw-2',
    state: 'Tamil Nadu',
    district: 'Madurai',
    market: 'Mattuthavani Flower Market (Madurai)',
    commodity: 'Madurai Malli (GI Tag Jasmine)',
    commodityType: 'FLOWER',
    variety: 'GI Certified Premium Fragrant',
    unit: 'KG',
    minPrice: 500,
    maxPrice: 750,
    modalPrice: 620,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 65,
    reportedByName: 'Madurai Flower Traders Union',
    createdAt: '2026-09-27T06:15:00.000Z'
  },
  {
    id: 'pr-flw-3',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    market: 'KR Market Flower Yard (Bengaluru)',
    commodity: 'Cut Dutch Rose (Gulab)',
    commodityType: 'FLOWER',
    variety: 'Top Secret / Red Romance (20 stems)',
    unit: 'BUNDLE',
    minPrice: 220,
    maxPrice: 360,
    modalPrice: 280,
    priceDate: '2026-09-27',
    trend: 'STABLE',
    changeAmount: 0,
    reportedByName: 'South India Floriculture Consortium',
    createdAt: '2026-09-27T06:30:00.000Z'
  },
  {
    id: 'pr-flw-4',
    state: 'Andhra Pradesh',
    district: 'Anantapur',
    market: 'Anantapur Market Yard',
    commodity: 'Chrysanthemum (Chamanti / చామంతి)',
    commodityType: 'FLOWER',
    variety: 'Yellow & White Local Hybrid',
    unit: 'KG',
    minPrice: 120,
    maxPrice: 190,
    modalPrice: 160,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 20,
    reportedByName: 'Rayalaseema Florists Guild',
    createdAt: '2026-09-27T07:00:00.000Z'
  },
  {
    id: 'pr-flw-5',
    state: 'Karnataka',
    district: 'Kolar',
    market: 'Devanahalli Flower Mandi',
    commodity: 'Marigold (Bantipoolu / Genda)',
    commodityType: 'FLOWER',
    variety: 'African Orange & Golden Yellow',
    unit: 'KG',
    minPrice: 45,
    maxPrice: 85,
    modalPrice: 65,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 12,
    reportedByName: 'Kolar-Devanahalli Agro Yard',
    createdAt: '2026-09-27T07:15:00.000Z'
  },
  {
    id: 'pr-flw-6',
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Market Yard Pune (Gultekdi)',
    commodity: 'Marigold (Genda Phool)',
    commodityType: 'FLOWER',
    variety: 'Calcutta Orange',
    unit: 'KG',
    minPrice: 50,
    maxPrice: 90,
    modalPrice: 70,
    priceDate: '2026-09-27',
    trend: 'STABLE',
    changeAmount: 2,
    reportedByName: 'Pune APMC Flower Division',
    createdAt: '2026-09-27T07:30:00.000Z'
  },
  {
    id: 'pr-flw-7',
    state: 'Delhi',
    district: 'East Delhi',
    market: 'Ghazipur Flower & Vegetable Mandi',
    commodity: 'Gladiolus & Tuberose (Rajnigandha)',
    commodityType: 'FLOWER',
    variety: 'Single & Double Stem',
    unit: 'BUNDLE',
    minPrice: 180,
    maxPrice: 320,
    modalPrice: 250,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 25,
    reportedByName: 'Delhi Ghazipur Phool Board',
    createdAt: '2026-09-27T07:45:00.000Z'
  },
  {
    id: 'pr-flw-8',
    state: 'Telangana',
    district: 'Hyderabad',
    market: 'Gudimalkapur Flower Market (Hyd)',
    commodity: 'Crossandra (Kanakambaram / కనకాంబరం)',
    commodityType: 'FLOWER',
    variety: 'Deep Orange Heavy Bloom',
    unit: 'KG',
    minPrice: 420,
    maxPrice: 650,
    modalPrice: 540,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 50,
    reportedByName: 'Hyderabad Wholesale Florists',
    createdAt: '2026-09-27T08:00:00.000Z'
  },
  {
    id: 'pr-flw-9',
    state: 'West Bengal',
    district: 'Howrah',
    market: 'Mallick Ghat Flower Market (Howrah)',
    commodity: 'Lotus & Marigold Garlands',
    commodityType: 'FLOWER',
    variety: 'Pink Sacred Lotus (100 buds)',
    unit: '100_FLOWERS',
    minPrice: 250,
    maxPrice: 450,
    modalPrice: 350,
    priceDate: '2026-09-27',
    trend: 'STABLE',
    changeAmount: 0,
    reportedByName: 'Howrah Riverbank Flower Mandi',
    createdAt: '2026-09-27T08:15:00.000Z'
  },

  // --- CROPS & GRAINS ---
  {
    id: 'pr-crp-1',
    state: 'Andhra Pradesh',
    district: 'Sri Sathya Sai',
    market: 'Kadiri Mandi',
    commodity: 'Groundnut (Peanut / వేరుశనగ)',
    commodityType: 'OILSEED',
    variety: 'Kadiri-6 (High Oil 48%)',
    unit: 'QUINTAL',
    minPrice: 6800,
    maxPrice: 7750,
    modalPrice: 7420,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 110,
    reportedByName: 'Kadiri Market Committee',
    createdAt: '2026-09-27T06:00:00.000Z'
  },
  {
    id: 'pr-crp-2',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    market: 'Guntur Mirchi Yard',
    commodity: 'Dry Red Chilli (ఎండు మిర్చి)',
    commodityType: 'SPICE',
    variety: 'Teja S17 (Grade A Hot)',
    unit: 'QUINTAL',
    minPrice: 19500,
    maxPrice: 23800,
    modalPrice: 21600,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 450,
    reportedByName: 'Guntur APMC Yard',
    createdAt: '2026-09-27T06:30:00.000Z'
  },
  {
    id: 'pr-crp-3',
    state: 'Telangana',
    district: 'Warangal',
    market: 'Enumamula Warangal Mandi',
    commodity: 'Cotton (Kapas / పత్తి)',
    commodityType: 'CROP',
    variety: 'Shankar-6 Long Staple',
    unit: 'QUINTAL',
    minPrice: 7100,
    maxPrice: 7850,
    modalPrice: 7520,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 80,
    reportedByName: 'Warangal Enumamula APMC',
    createdAt: '2026-09-27T06:45:00.000Z'
  },
  {
    id: 'pr-crp-4',
    state: 'Karnataka',
    district: 'Kolar',
    market: 'Kolar APMC Tomato Market',
    commodity: 'Tomato (టమోటా)',
    commodityType: 'VEGETABLE',
    variety: 'Hybrid 1057 / Arka Rakshak (15 kg Crate)',
    unit: 'CRATE',
    minPrice: 280,
    maxPrice: 420,
    modalPrice: 350,
    priceDate: '2026-09-27',
    trend: 'DOWN',
    changeAmount: -30,
    reportedByName: 'Kolar Tomato Yard',
    createdAt: '2026-09-27T07:00:00.000Z'
  },
  {
    id: 'pr-crp-5',
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Lasalgaon Onion Mandi (Nashik)',
    commodity: 'Onion (Kanda / ఉల్లి)',
    commodityType: 'VEGETABLE',
    variety: 'Red Lasalgaon Medium',
    unit: 'QUINTAL',
    minPrice: 1850,
    maxPrice: 2650,
    modalPrice: 2280,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 140,
    reportedByName: 'Lasalgaon APMC',
    createdAt: '2026-09-27T07:15:00.000Z'
  },
  {
    id: 'pr-crp-6',
    state: 'Madhya Pradesh',
    district: 'Indore',
    market: 'Indore APMC Mandi (Chhavani)',
    commodity: 'Soybean (Yellow)',
    commodityType: 'OILSEED',
    variety: 'JS-9560 / JS-335',
    unit: 'QUINTAL',
    minPrice: 4350,
    maxPrice: 4920,
    modalPrice: 4680,
    priceDate: '2026-09-27',
    trend: 'STABLE',
    changeAmount: 15,
    reportedByName: 'Indore Mandi Samiti',
    createdAt: '2026-09-27T07:30:00.000Z'
  },
  {
    id: 'pr-crp-7',
    state: 'Punjab',
    district: 'Khanna',
    market: 'Khanna Grain Market (Asia largest)',
    commodity: 'Paddy / Basmati Rice (వరి)',
    commodityType: 'CROP',
    variety: 'Pusa 1121 Extra Long',
    unit: 'QUINTAL',
    minPrice: 3800,
    maxPrice: 4650,
    modalPrice: 4320,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 60,
    reportedByName: 'Punjab Mandi Board',
    createdAt: '2026-09-27T07:45:00.000Z'
  },
  {
    id: 'pr-crp-8',
    state: 'Gujarat',
    district: 'Rajkot',
    market: 'Gondal APMC Mandi',
    commodity: 'Cumin Seed (Jeera / జీలకర్ర)',
    commodityType: 'SPICE',
    variety: 'Gondal Premium Machine Cleaned',
    unit: 'QUINTAL',
    minPrice: 24500,
    maxPrice: 31000,
    modalPrice: 28400,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 350,
    reportedByName: 'Gondal APMC Traders',
    createdAt: '2026-09-27T08:00:00.000Z'
  },
  {
    id: 'pr-crp-9',
    state: 'Uttar Pradesh',
    district: 'Agra',
    market: 'Agra Potato Market',
    commodity: 'Potato (Aloo / బంగాళాదుంప)',
    commodityType: 'VEGETABLE',
    variety: 'Kufri Pukhraj / Jyoti',
    unit: 'QUINTAL',
    minPrice: 1200,
    maxPrice: 1650,
    modalPrice: 1450,
    priceDate: '2026-09-27',
    trend: 'DOWN',
    changeAmount: -40,
    reportedByName: 'Agra Mandi Parishad',
    createdAt: '2026-09-27T08:15:00.000Z'
  },
  {
    id: 'pr-crp-10',
    state: 'Rajasthan',
    district: 'Kota',
    market: 'Kota Bhamashah Mandi',
    commodity: 'Mustard (Sarson / ఆవాలు)',
    commodityType: 'OILSEED',
    variety: 'Pusa Bold High Oil (42%)',
    unit: 'QUINTAL',
    minPrice: 5200,
    maxPrice: 5850,
    modalPrice: 5540,
    priceDate: '2026-09-27',
    trend: 'STABLE',
    changeAmount: 20,
    reportedByName: 'Kota Krishi Upaj Mandi',
    createdAt: '2026-09-27T08:30:00.000Z'
  },
  {
    id: 'pr-crp-11',
    state: 'Andhra Pradesh',
    district: 'Kurnool',
    market: 'Kurnool Agricultural Market',
    commodity: 'Bengal Gram (Chana / శనగలు)',
    commodityType: 'PULSE',
    variety: 'Desi Bold Chana',
    unit: 'QUINTAL',
    minPrice: 5900,
    maxPrice: 6600,
    modalPrice: 6280,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 90,
    reportedByName: 'Kurnool Mandi Yard',
    createdAt: '2026-09-27T08:45:00.000Z'
  },
  {
    id: 'pr-crp-12',
    state: 'Tamil Nadu',
    district: 'Erode',
    market: 'Erode Turmeric Market',
    commodity: 'Turmeric (Haldi / పసుపు)',
    commodityType: 'SPICE',
    variety: 'Finger Turmeric Salem Bulbs',
    unit: 'QUINTAL',
    minPrice: 14200,
    maxPrice: 17800,
    modalPrice: 16100,
    priceDate: '2026-09-27',
    trend: 'UP',
    changeAmount: 220,
    reportedByName: 'Erode Regulated Market Committee',
    createdAt: '2026-09-27T09:00:00.000Z'
  }
];

import { MandiPriceService, normalizeCategory } from '../services/mandiPriceService.js';

// Helper to seed prices into database if table is empty
function ensurePricesSeeded() {
  const existing = db.getTable('market_prices');
  if (!existing || existing.length === 0) {
    INITIAL_MARKET_PRICES.forEach(item => db.insert('market_prices', item));
  }
}

// 1. GET /api/prices/states (and /api/market-prices/states) — Hierarchy of states, districts, and mandis
priceRouter.get('/states', (_req: Request, res: Response) => {
  const regionsList = Object.entries(ALL_INDIA_REGIONS).map(([state, info]) => ({
    state,
    districts: info.districts,
    mandis: info.mandis
  }));

  return res.json({
    states: regionsList,
    stateNames: Object.keys(ALL_INDIA_REGIONS),
    hierarchy: ALL_INDIA_REGIONS
  });
});

// 2. GET /api/prices/summary (and /api/market-prices/summary) — Ticker & KPI metrics
priceRouter.get('/summary', (_req: Request, res: Response) => {
  const allPrices = MandiPriceService.getPrices({});

  const flowerCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'FLOWER').length;
  const cropCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'CROP').length;
  const vegCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'VEGETABLE').length;
  const grainCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'GRAIN').length;
  const fruitCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'FRUIT').length;
  const pulseCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'PULSE').length;
  const spiceCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'SPICE').length;
  const oilseedCount = allPrices.filter(p => normalizeCategory(p.commodityType) === 'OILSEED').length;
  const risingCount = allPrices.filter(p => p.trend === 'UP').length;

  const states = Array.from(new Set(allPrices.map(p => p.state)));
  const markets = Array.from(new Set(allPrices.map(p => p.market)));

  // Top gainers
  const topGainers = [...allPrices]
    .filter(p => (p.changeAmount || 0) > 0)
    .sort((a, b) => (b.changeAmount || 0) - (a.changeAmount || 0))
    .slice(0, 4);

  return res.json({
    totalPrices: allPrices.length,
    flowerCount,
    cropCount,
    vegCount,
    grainCount,
    fruitCount,
    pulseCount,
    spiceCount,
    oilseedCount,
    risingCount,
    activeStatesCount: states.length,
    activeMarketsCount: markets.length,
    topGainers
  });
});

// 3. GET /api/prices (and /api/market-prices) — Search, filter, and dynamic district fallback
priceRouter.get('/', (req: Request, res: Response) => {
  const { state, district, market, commodity, type, category, search, refresh, date } = req.query;

  const effectiveCat = (category || type) as string | undefined;

  let prices = MandiPriceService.getPrices({
    state: state as string,
    district: district as string,
    category: effectiveCat,
    date: date as string,
    search: (search || commodity) as string,
    refresh: refresh === 'true'
  });

  // If specific market yard requested, filter further
  if (market && (market as string).trim() !== '' && (market as string).toLowerCase() !== 'all') {
    const m = (market as string).toLowerCase().trim();
    prices = prices.filter(p => p.market.toLowerCase().includes(m));
  }

  // Include any user-contributed market prices from local db if matching filters
  const userContributed = db.getTable('market_prices');
  if (userContributed && userContributed.length > 0) {
    const extra = userContributed.filter(p => {
      if (state && (state as string).toLowerCase() !== 'all' && p.state.toLowerCase() !== (state as string).toLowerCase().trim()) return false;
      if (district && (district as string).toLowerCase() !== 'all' && p.district.toLowerCase() !== (district as string).toLowerCase().trim()) return false;
      if (effectiveCat && effectiveCat.toLowerCase() !== 'all' && normalizeCategory(p.commodityType) !== normalizeCategory(effectiveCat)) return false;
      return true;
    });
    // Add user contributed if not duplicate
    for (const u of extra) {
      if (!prices.some(existing => existing.commodity.toLowerCase() === u.commodity.toLowerCase() && existing.market.toLowerCase() === u.market.toLowerCase())) {
        prices.unshift({
          ...u,
          name: u.commodity,
          category: u.commodityType,
          min_price: u.minPrice,
          max_price: u.maxPrice,
          modal_price: u.modalPrice,
          date: u.priceDate
        });
      }
    }
  }

  // Ensure every item has both camelCase and snake_case properties for full client compatibility
  const responseData = prices.map(p => ({
    ...p,
    name: p.name || p.commodity,
    category: p.category || p.commodityType,
    min_price: p.minPrice,
    max_price: p.maxPrice,
    modal_price: p.modalPrice,
    date: p.priceDate || p.date,
    arrivals: p.arrivals || '150 Tonnes'
  }));

  return res.json(responseData);
});

// 4. POST /api/prices — Add new market price entry (Contributed by farmer, trader, or mandi officer)
priceRouter.post('/', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    state,
    district,
    market,
    commodity,
    commodityType,
    variety,
    unit,
    minPrice,
    maxPrice,
    modalPrice,
    priceDate,
    trend,
    changeAmount
  } = req.body;

  if (!state || !district || !market || !commodity) {
    return res.status(400).json({ error: 'State, District, Market name, and Commodity are required.' });
  }

  const parsedMin = parseFloat(minPrice);
  const parsedMax = parseFloat(maxPrice);
  const parsedModal = parseFloat(modalPrice);

  if (isNaN(parsedModal) || parsedModal <= 0) {
    return res.status(400).json({ error: 'A valid modal trading price greater than ₹0 is required.' });
  }

  const effectiveMin = !isNaN(parsedMin) && parsedMin > 0 ? parsedMin : Math.round(parsedModal * 0.92);
  const effectiveMax = !isNaN(parsedMax) && parsedMax > 0 ? parsedMax : Math.round(parsedModal * 1.08);

  const reporterName = req.user?.name || 'Local Mandi Informer';

  const newEntry: MarketPrice = {
    id: `pr-${uuidv4().substring(0, 8)}`,
    state: state.trim(),
    district: district.trim(),
    market: market.trim(),
    commodity: commodity.trim(),
    commodityType: (commodityType as MandiCommodityType) || 'CROP',
    variety: variety ? variety.trim() : 'Local Standard',
    unit: unit || 'QUINTAL',
    minPrice: effectiveMin,
    maxPrice: effectiveMax,
    modalPrice: parsedModal,
    priceDate: priceDate || new Date().toISOString().split('T')[0],
    trend: trend || (parsedModal >= effectiveMin ? 'UP' : 'STABLE'),
    changeAmount: changeAmount ? parseFloat(changeAmount) : 0,
    reportedBy: req.user?.id || 'public',
    reportedByName: reporterName,
    createdAt: new Date().toISOString()
  };

  db.insert('market_prices', newEntry);
  return res.status(201).json(newEntry);
});
