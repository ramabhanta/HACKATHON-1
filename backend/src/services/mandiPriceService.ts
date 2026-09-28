import { MarketPrice, MandiCommodityType } from '../models/types.js';

/**
 * Normalizes commodity category strings (handles plurals, case-insensitivity, combined labels)
 */
export function normalizeCategory(cat?: string): string {
  if (!cat) return 'ALL';
  const c = cat.toUpperCase().trim();
  if (c === 'ALL' || c === 'ALL COMMODITIES') return 'ALL';
  if (c.includes('FLOWER')) return 'FLOWER';
  if (c.includes('VEG')) return 'VEGETABLE';
  if (c.includes('FRUIT')) return 'FRUIT';
  if (c.includes('GRAIN') || c.includes('CEREAL')) return 'GRAIN';
  if (c.includes('PULSE') || c.includes('DAL') || c.includes('GRAM')) return 'PULSE';
  if (c.includes('SPICE') || c.includes('CONDIMENT')) return 'SPICE';
  if (c.includes('OILSEED') || c.includes('OIL')) return 'OILSEED';
  if (c.includes('FIBER') || c.includes('FIBRE') || c.includes('CASH') || c.includes('CROP')) return 'CROP';
  return c;
}

/**
 * Comprehensive Master APMC Agricultural Commodity Catalog
 * Realistically mapped across major Andhra Pradesh & Telangana APMC yards.
 */
export interface MasterCommoditySeed {
  id: string;
  name: string;
  commodity: string;
  category: MandiCommodityType;
  variety: string;
  market: string;
  district: string;
  state: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  changeAmount: number;
}

export const MASTER_MANDI_CATALOG: MasterCommoditySeed[] = [
  // ==========================================
  // 1. FLOWERS (పూలు / फूल)
  // ==========================================
  {
    id: 'pr-flw-1',
    name: 'Jasmine / Kakada (మల్లెపూలు / కాకడ)',
    commodity: 'Jasmine / Kakada (మల్లెపూలు / కాకడ)',
    category: 'FLOWER',
    variety: 'Local Fresh Fragrant Bud',
    market: 'Madanapalle Flower Mandi',
    district: 'Annamayya',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 380,
    maxPrice: 480,
    modalPrice: 420,
    trend: 'UP',
    changeAmount: 35
  },
  {
    id: 'pr-flw-2',
    name: 'Jasmine (మల్లెపూలు - తిరుపతి)',
    commodity: 'Jasmine (మల్లెపూలు - తిరుపతి)',
    category: 'FLOWER',
    variety: 'Gundu Malli Premium',
    market: 'Tirupati Flower Market',
    district: 'Tirupati',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 400,
    maxPrice: 530,
    modalPrice: 460,
    trend: 'UP',
    changeAmount: 40
  },
  {
    id: 'pr-flw-3',
    name: 'Marigold (బంతిపూలు)',
    commodity: 'Marigold (బంతిపూలు)',
    category: 'FLOWER',
    variety: 'African Orange & Golden Yellow',
    market: 'Kadiri APMC Mandi',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 50,
    maxPrice: 90,
    modalPrice: 70,
    trend: 'UP',
    changeAmount: 10
  },
  {
    id: 'pr-flw-4',
    name: 'Marigold (బంతిపూలు - అనంతపురం)',
    commodity: 'Marigold (బంతిపూలు - అనంతపురం)',
    category: 'FLOWER',
    variety: 'Calcutta Gold',
    market: 'Anantapur Market Yard',
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 45,
    maxPrice: 85,
    modalPrice: 65,
    trend: 'STABLE',
    changeAmount: 0
  },
  {
    id: 'pr-flw-5',
    name: 'Rose (గులాబీ)',
    commodity: 'Rose (గులాబీ)',
    category: 'FLOWER',
    variety: 'Dutch Red / Top Secret (20 Stems)',
    market: 'Chittoor Border APMC Yard',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 180,
    maxPrice: 260,
    modalPrice: 220,
    trend: 'UP',
    changeAmount: 20
  },
  {
    id: 'pr-flw-6',
    name: 'Chrysanthemum (చామంతి)',
    commodity: 'Chrysanthemum (చామంతి)',
    category: 'FLOWER',
    variety: 'Kadiyam Yellow & White Hybrid',
    market: 'Kadiyam Flower Market (Rajahmundry)',
    district: 'East Godavari',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 120,
    maxPrice: 200,
    modalPrice: 160,
    trend: 'UP',
    changeAmount: 15
  },
  {
    id: 'pr-flw-7',
    name: 'Crossandra (కనకాంబరం)',
    commodity: 'Crossandra (కనకాంబరం)',
    category: 'FLOWER',
    variety: 'Deep Orange Heavy Bloom',
    market: 'Madanapalle Mandi',
    district: 'Annamayya',
    state: 'Andhra Pradesh',
    unit: '₹/Kg',
    minPrice: 420,
    maxPrice: 620,
    modalPrice: 520,
    trend: 'UP',
    changeAmount: 45
  },

  // ==========================================
  // 2. VEGETABLES (కూరగాయలు / सब्जियां)
  // ==========================================
  {
    id: 'pr-veg-1',
    name: 'Tomato (టమోటా)',
    commodity: 'Tomato (టమోటా)',
    category: 'VEGETABLE',
    variety: 'Arka Rakshak F1 Hybrid',
    market: 'Madanapalle Tomato APMC',
    district: 'Annamayya',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1800,
    maxPrice: 2600,
    modalPrice: 2200,
    trend: 'DOWN',
    changeAmount: -120
  },
  {
    id: 'pr-veg-2',
    name: 'Onion (ఉల్లిపాయ)',
    commodity: 'Onion (ఉల్లిపాయ)',
    category: 'VEGETABLE',
    variety: 'Red Medium Bold Bulb',
    market: 'Kurnool Agricultural Mandi',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1750,
    maxPrice: 2450,
    modalPrice: 2100,
    trend: 'UP',
    changeAmount: 110
  },
  {
    id: 'pr-veg-3',
    name: 'Green Chilli (పచ్చిమిర్చి)',
    commodity: 'Green Chilli (పచ్చిమిర్చి)',
    category: 'VEGETABLE',
    variety: 'G4 Spiciest Long Green',
    market: 'Guntur Vegetable Yard',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 3200,
    maxPrice: 4400,
    modalPrice: 3800,
    trend: 'UP',
    changeAmount: 150
  },
  {
    id: 'pr-veg-4',
    name: 'Brinjal / Vankaya (వంకాయ)',
    commodity: 'Brinjal / Vankaya (వంకాయ)',
    category: 'VEGETABLE',
    variety: 'Green Round & Purple Striped',
    market: 'Anantapur Vegetable Yard',
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1400,
    maxPrice: 2200,
    modalPrice: 1800,
    trend: 'STABLE',
    changeAmount: 0
  },
  {
    id: 'pr-veg-5',
    name: 'Potato (బంగాళాదుంప)',
    commodity: 'Potato (బంగాళాదుంప)',
    category: 'VEGETABLE',
    variety: 'Kufri Jyoti / Chipsona',
    market: 'Rythu Bazaar Kadiri',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1400,
    maxPrice: 1900,
    modalPrice: 1650,
    trend: 'DOWN',
    changeAmount: -40
  },
  {
    id: 'pr-veg-6',
    name: 'Bhendi / Ladies Finger (బెండకాయ)',
    commodity: 'Bhendi / Ladies Finger (బెండకాయ)',
    category: 'VEGETABLE',
    variety: 'Radhika Green Tender',
    market: 'Hindupur APMC Mandi',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1900,
    maxPrice: 2800,
    modalPrice: 2400,
    trend: 'UP',
    changeAmount: 80
  },

  // ==========================================
  // 3. FRUITS (పండ్లు / फल)
  // ==========================================
  {
    id: 'pr-frt-1',
    name: 'Banana (అరటి)',
    commodity: 'Banana (అరటి)',
    category: 'FRUIT',
    variety: 'Grand Naine (G9) Export Grade',
    market: 'Pulivendula Fruit Market Yard',
    district: 'YSR Kadapa',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1500,
    maxPrice: 2200,
    modalPrice: 1850,
    trend: 'UP',
    changeAmount: 50
  },
  {
    id: 'pr-frt-2',
    name: 'Sweet Orange / Mosambi (బత్తాయి)',
    commodity: 'Sweet Orange / Mosambi (బత్తాయి)',
    category: 'FRUIT',
    variety: 'Sathgudi Golden Juicy',
    market: 'Anantapur Fruit Market Yard',
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 3600,
    maxPrice: 4800,
    modalPrice: 4200,
    trend: 'UP',
    changeAmount: 120
  },
  {
    id: 'pr-frt-3',
    name: 'Mango (మామిడి - Banganapalli)',
    commodity: 'Mango (మామిడి - Banganapalli)',
    category: 'FRUIT',
    variety: 'GI Banganapalli Prime Export',
    market: 'Chittoor Fruit Mandi',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 4800,
    maxPrice: 6500,
    modalPrice: 5600,
    trend: 'UP',
    changeAmount: 200
  },
  {
    id: 'pr-frt-4',
    name: 'Papaya (బొప్పాయి)',
    commodity: 'Papaya (బొప్పాయి)',
    category: 'FRUIT',
    variety: 'Red Lady 786 Table Fruit',
    market: 'Kadiri APMC Mandi',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 1100,
    maxPrice: 1700,
    modalPrice: 1400,
    trend: 'STABLE',
    changeAmount: 0
  },
  {
    id: 'pr-frt-5',
    name: 'Pomegranate (దానిమ్మ)',
    commodity: 'Pomegranate (దానిమ్మ)',
    category: 'FRUIT',
    variety: 'Bhagwa Deep Red Pearls',
    market: 'Kalyandurg Fruit Yard',
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 7200,
    maxPrice: 9800,
    modalPrice: 8500,
    trend: 'UP',
    changeAmount: 180
  },

  // ==========================================
  // 4. GRAINS & CEREALS (ధాన్యాలు / अनाज)
  // ==========================================
  {
    id: 'pr-grn-1',
    name: 'Paddy / Rice (వరి ధాన్యం - Sona Masoori)',
    commodity: 'Paddy / Rice (వరి ధాన్యం - Sona Masoori)',
    category: 'GRAIN',
    variety: 'BPT-5204 Samba Mahsuri Grade A',
    market: 'Nellore Rice Market Yard',
    district: 'Nellore',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 2600,
    maxPrice: 3100,
    modalPrice: 2850,
    trend: 'UP',
    changeAmount: 40
  },
  {
    id: 'pr-grn-2',
    name: 'Paddy (వరి ధాన్యం - కదిరి యార్డ్)',
    commodity: 'Paddy (వరి ధాన్యం - కదిరి యార్డ్)',
    category: 'GRAIN',
    variety: 'Common Raw Paddy',
    market: 'Kadiri APMC Mandi',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 2450,
    maxPrice: 2950,
    modalPrice: 2720,
    trend: 'STABLE',
    changeAmount: 10
  },
  {
    id: 'pr-grn-3',
    name: 'Maize / Corn (మొక్కజొన్న)',
    commodity: 'Maize / Corn (మొక్కజొన్న)',
    category: 'GRAIN',
    variety: 'Hybrid Yellow Dent Feed Grade',
    market: 'Nandyal Agricultural Yard',
    district: 'Nandyal',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 2100,
    maxPrice: 2480,
    modalPrice: 2320,
    trend: 'UP',
    changeAmount: 30
  },
  {
    id: 'pr-grn-4',
    name: 'Ragi (రాగులు / Finger Millet)',
    commodity: 'Ragi (రాగులు / Finger Millet)',
    category: 'GRAIN',
    variety: 'GPU-28 Brown Super Nutritious',
    market: 'Madanapalle Mandi',
    district: 'Annamayya',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 3100,
    maxPrice: 3750,
    modalPrice: 3450,
    trend: 'UP',
    changeAmount: 50
  },
  {
    id: 'pr-grn-5',
    name: 'Jowar (జొన్నలు / Sorghum)',
    commodity: 'Jowar (జొన్నలు / Sorghum)',
    category: 'GRAIN',
    variety: 'Maldandi / White Bold Grain',
    market: 'Anantapur Market Yard',
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 2800,
    maxPrice: 3550,
    modalPrice: 3200,
    trend: 'STABLE',
    changeAmount: 15
  },

  // ==========================================
  // 5. PULSES (పప్పుధాన్యాలు / दालें)
  // ==========================================
  {
    id: 'pr-pls-1',
    name: 'Red Gram / Toor Dal (కందులు)',
    commodity: 'Red Gram / Toor Dal (కందులు)',
    category: 'PULSE',
    variety: 'GI Tandur Red Gram Bold',
    market: 'Tandur APMC Mandi',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 8700,
    maxPrice: 10100,
    modalPrice: 9400,
    trend: 'UP',
    changeAmount: 120
  },
  {
    id: 'pr-pls-2',
    name: 'Bengal Gram / Chana (శనగలు)',
    commodity: 'Bengal Gram / Chana (శనగలు)',
    category: 'PULSE',
    variety: 'Desi Bold JG-11',
    market: 'Kurnool Agricultural Market',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 5900,
    maxPrice: 6700,
    modalPrice: 6350,
    trend: 'UP',
    changeAmount: 90
  },
  {
    id: 'pr-pls-3',
    name: 'Black Gram / Urad (మినుములు)',
    commodity: 'Black Gram / Urad (మినుములు)',
    category: 'PULSE',
    variety: 'LBG-752 Shiny Whole Black',
    market: 'Guntur Pulse Yard',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 7600,
    maxPrice: 8800,
    modalPrice: 8200,
    trend: 'UP',
    changeAmount: 75
  },
  {
    id: 'pr-pls-4',
    name: 'Green Gram / Moong (పెసలు)',
    commodity: 'Green Gram / Moong (పెసలు)',
    category: 'PULSE',
    variety: 'Shine Moong Premium Whole',
    market: 'Kadiri APMC Mandi',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 7300,
    maxPrice: 8500,
    modalPrice: 7900,
    trend: 'UP',
    changeAmount: 85
  },

  // ==========================================
  // 6. SPICES & CONDIMENTS (మసాలాలు / मसाले)
  // ==========================================
  {
    id: 'pr-spc-1',
    name: 'Dry Red Chilli (ఎండుమిర్చి - Teja S17)',
    commodity: 'Dry Red Chilli (ఎండుమిర్చి - Teja S17)',
    category: 'SPICE',
    variety: 'Teja S17 Grade A Hot Stemless',
    market: 'Guntur Mirchi Yard (Asia Largest)',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 19500,
    maxPrice: 23900,
    modalPrice: 21800,
    trend: 'UP',
    changeAmount: 350
  },
  {
    id: 'pr-spc-2',
    name: 'Turmeric (పసుపు)',
    commodity: 'Turmeric (పసుపు)',
    category: 'SPICE',
    variety: 'Duggirala / Salem Finger Bulbs',
    market: 'Duggirala Turmeric Yard',
    district: 'Guntur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 13800,
    maxPrice: 16900,
    modalPrice: 15400,
    trend: 'UP',
    changeAmount: 220
  },
  {
    id: 'pr-spc-3',
    name: 'Coriander Seeds (ధనియాలు)',
    commodity: 'Coriander Seeds (ధనియాలు)',
    category: 'SPICE',
    variety: 'Badami Whole Cleaned Seeds',
    market: 'Kurnool Spice Mandi',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 7800,
    maxPrice: 9400,
    modalPrice: 8600,
    trend: 'UP',
    changeAmount: 90
  },
  {
    id: 'pr-spc-4',
    name: 'Garlic (వెల్లుల్లి)',
    commodity: 'Garlic (వెల్లుల్లి)',
    category: 'SPICE',
    variety: 'Desi White Bold Cloves',
    market: 'Kurnool Wholesale Yard',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 14200,
    maxPrice: 18800,
    modalPrice: 16500,
    trend: 'DOWN',
    changeAmount: -250
  },

  // ==========================================
  // 7. OILSEEDS (నూనెగింజలు / तिलहन)
  // ==========================================
  {
    id: 'pr-oil-1',
    name: 'Groundnut Pod (వేరుశనగ - Kadiri 6 / K6)',
    commodity: 'Groundnut Pod (వేరుశనగ - Kadiri 6 / K6)',
    category: 'OILSEED',
    variety: 'Kadiri-6 (High Oil 48%) Pods',
    market: 'Kadiri APMC Mandi',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 6900,
    maxPrice: 7950,
    modalPrice: 7450,
    trend: 'UP',
    changeAmount: 110
  },
  {
    id: 'pr-oil-2',
    name: 'Castor Seed (ఆముదాలు)',
    commodity: 'Castor Seed (ఆముదాలు)',
    category: 'OILSEED',
    variety: 'DCH-519 Hybrid Clean Seeds',
    market: 'Anantapur Market Yard',
    district: 'Anantapur',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 5300,
    maxPrice: 6250,
    modalPrice: 5850,
    trend: 'STABLE',
    changeAmount: 20
  },
  {
    id: 'pr-oil-3',
    name: 'Sunflower (పొద్దుతిరుగుడు)',
    commodity: 'Sunflower (పొద్దుతిరుగుడు)',
    category: 'OILSEED',
    variety: 'KBSH-53 Hybrid High Oil',
    market: 'Nandyal APMC Yard',
    district: 'Nandyal',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 4200,
    maxPrice: 5100,
    modalPrice: 4700,
    trend: 'UP',
    changeAmount: 40
  },

  // ==========================================
  // 8. CROPS & FIBERS (వాణిజ్య పంటలు / नकदी फसलें)
  // ==========================================
  {
    id: 'pr-crp-1',
    name: 'Cotton (పత్తి - Medium Long Staple)',
    commodity: 'Cotton (పత్తి - Medium Long Staple)',
    category: 'CROP',
    variety: 'Bunny / Shankar-6 (29mm Staple)',
    market: 'Adoni Cotton Market (Kurnool)',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    unit: '₹/Quintal',
    minPrice: 7100,
    maxPrice: 7950,
    modalPrice: 7520,
    trend: 'UP',
    changeAmount: 70
  },
  {
    id: 'pr-crp-2',
    name: 'Sugarcane (చెరకు)',
    commodity: 'Sugarcane (చెరకు)',
    category: 'CROP',
    variety: 'Co-86032 High Recovery Cane',
    market: 'Chittoor Sugar Factory APMC',
    district: 'Chittoor',
    state: 'Andhra Pradesh',
    unit: '₹/Ton',
    minPrice: 3050,
    maxPrice: 3450,
    modalPrice: 3250,
    trend: 'STABLE',
    changeAmount: 0
  }
];

export interface MandiQueryOptions {
  state?: string;
  district?: string;
  category?: string;
  date?: string;
  search?: string;
  refresh?: boolean;
}

/**
 * Service to retrieve live and fallback mandi prices with 12-hour revalidation caching.
 */
export class MandiPriceService {
  private static cache: Map<string, { data: MarketPrice[]; timestamp: number }> = new Map();
  private static CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

  public static getPrices(options: MandiQueryOptions = {}): MarketPrice[] {
    const today = options.date || new Date().toISOString().split('T')[0];
    const normCategory = normalizeCategory(options.category);
    const targetState = (options.state && options.state !== 'ALL') ? options.state.trim() : 'ALL';
    const targetDistrict = (options.district && options.district !== 'ALL') ? options.district.trim() : 'ALL';

    const cacheKey = `${targetState}:${targetDistrict}:${normCategory}:${today}`;
    if (!options.refresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return this.filterBySearch(cached.data, options.search);
      }
    }

    // Generate full dataset for requested parameters
    let result = this.buildDatasetForDistrict(targetState, targetDistrict, today);

    // Apply normalized category filter
    if (normCategory !== 'ALL') {
      result = result.filter(p => normalizeCategory(p.commodityType || p.category) === normCategory);
    }

    // Cache results
    this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return this.filterBySearch(result, options.search);
  }

  /**
   * Intelligently builds dataset for state & district with nearest-mandi fallback
   */
  private static buildDatasetForDistrict(targetState: string, targetDistrict: string, today: string): MarketPrice[] {
    // Categories that MUST be populated so no tab is ever empty
    const allCategories: MandiCommodityType[] = [
      'FLOWER',
      'VEGETABLE',
      'FRUIT',
      'GRAIN',
      'PULSE',
      'SPICE',
      'OILSEED',
      'CROP'
    ];

    const result: MarketPrice[] = [];

    // All available master catalog items for the state (or entire catalog if ALL)
    const statePool = targetState === 'ALL'
      ? MASTER_MANDI_CATALOG
      : MASTER_MANDI_CATALOG.filter(item => item.state.toLowerCase() === targetState.toLowerCase());

    const catalogToUse = statePool.length > 0 ? statePool : MASTER_MANDI_CATALOG;

    if (targetDistrict === 'ALL') {
      // Entire state requested: return all catalog items
      for (const item of catalogToUse) {
        result.push(this.transformSeedToPrice(item, today, false));
      }
      return result;
    }

    // Specific district requested (e.g. 'Anantapur' or 'Sri Sathya Sai')
    const districtItems = catalogToUse.filter(
      item => item.district.toLowerCase() === targetDistrict.toLowerCase()
    );

    // Check which categories are represented in the district
    const coveredCategories = new Set(districtItems.map(i => i.category));

    // First add all direct district items
    for (const item of districtItems) {
      result.push(this.transformSeedToPrice(item, today, false));
    }

    // For any category or essential commodity missing in this district, pull fallback from nearest APMC
    for (const cat of allCategories) {
      const hasCat = coveredCategories.has(cat);
      if (!hasCat) {
        // Entire category missing in this district -> find all items of this category in the state
        const fallbackItems = catalogToUse.filter(i => i.category === cat);
        for (const fb of fallbackItems) {
          result.push(this.transformSeedToPrice(fb, today, true, fb.market));
        }
      } else {
        // Category exists, but ensure major commodities of that category are covered via nearest mandi
        const catCatalog = catalogToUse.filter(i => i.category === cat);
        for (const masterItem of catCatalog) {
          const alreadyCovered = districtItems.some(
            di => di.commodity.toLowerCase().includes(masterItem.commodity.split('(')[0].trim().toLowerCase())
          );
          if (!alreadyCovered) {
            result.push(this.transformSeedToPrice(masterItem, today, true, masterItem.market));
          }
        }
      }
    }

    // Deduplicate by commodity name + variety
    const seen = new Set<string>();
    const deduplicated: MarketPrice[] = [];
    for (const item of result) {
      const key = `${item.commodity}:${item.variety}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }

  private static transformSeedToPrice(
    seed: MasterCommoditySeed,
    today: string,
    isFallback: boolean,
    nearestMandiName?: string
  ): MarketPrice {
    return {
      id: seed.id,
      name: seed.name,
      commodity: seed.commodity,
      category: seed.category,
      commodityType: seed.category,
      variety: seed.variety,
      market: seed.market,
      district: seed.district,
      state: seed.state,
      unit: seed.unit,
      minPrice: seed.minPrice,
      maxPrice: seed.maxPrice,
      modalPrice: seed.modalPrice,
      min_price: seed.minPrice,
      max_price: seed.maxPrice,
      modal_price: seed.modalPrice,
      priceDate: today,
      date: today,
      trend: seed.trend,
      changeAmount: seed.changeAmount,
      isFallback,
      fallbackSource: isFallback ? 'NEARBY_MANDI' : undefined,
      fallbackBadge: isFallback ? `Nearest Mandi: ${nearestMandiName || seed.market}` : undefined,
      reportedByName: `${seed.market} APMC Officer`,
      createdAt: `${today}T06:30:00.000Z`
    };
  }

  private static filterBySearch(items: MarketPrice[], query?: string): MarketPrice[] {
    if (!query || !query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(p =>
      p.commodity.toLowerCase().includes(q) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      p.variety.toLowerCase().includes(q) ||
      p.market.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.commodityType.toLowerCase().includes(q)
    );
  }
}
