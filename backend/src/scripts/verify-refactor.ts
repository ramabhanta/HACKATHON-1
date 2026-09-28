import { db } from '../database/db.js';
import { extendedCategories, comprehensiveProductsCatalog } from '../database/productsCatalog.js';
import { AiService } from '../services/aiService.js';

console.log('🧪 ==========================================');
console.log('🧪 RUNNING COMPREHENSIVE REFACTOR VERIFICATION');
console.log('🧪 ==========================================');

// 1. Catalog Verification
console.log('\n📦 1. AGRI STORE CATALOG VERIFICATION:');
console.log(`• Total Products in comprehensiveProductsCatalog: ${comprehensiveProductsCatalog.length}`);
console.log(`• Total Categories in extendedCategories: ${extendedCategories.length}`);

if (comprehensiveProductsCatalog.length < 100) {
  throw new Error(`Expected at least 100 products, got ${comprehensiveProductsCatalog.length}`);
}

// Category Distribution
const categoryCounts: Record<string, number> = {};
const subcategoriesFound = new Set<string>();
let missingImages = 0;

for (const p of comprehensiveProductsCatalog) {
  categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  if (p.subcategory) subcategoriesFound.add(p.subcategory);
  if (!p.images || p.images.length === 0 || !p.images[0].startsWith('http')) {
    missingImages++;
  }
}

console.log('• Products per Category:', categoryCounts);
console.log(`• Total Unique Subcategories: ${subcategoriesFound.size}`);
console.log('• Subcategories List:', Array.from(subcategoriesFound));
console.log(`• Products with missing/invalid image URLs: ${missingImages}`);

if (missingImages > 0) {
  throw new Error(`Found ${missingImages} products with missing or invalid images!`);
}

// 2. Targeted Medicine Matching Verification
console.log('\n💊 2. TARGETED MEDICINE RESOLUTION TEST:');
const testCases = [
  {
    issue: 'Early Leaf Spot (Tikka Disease - Cercospora arachidicola)',
    crop: 'Groundnut',
    expectedInclude: 'prod-saaf-500g'
  },
  {
    issue: 'Late Blight (Phytophthora infestans)',
    crop: 'Tomato',
    expectedInclude: 'prod-ridomil-gold-syngenta'
  },
  {
    issue: 'Invasive Black Thrips (Thrips parvispinus) and Leaf Curl',
    crop: 'Chilli',
    expectedInclude: 'prod-delegate-100ml'
  },
  {
    issue: 'Spodoptera litura & Fruit Borer (Helicoverpa armigera)',
    crop: 'Tomato',
    expectedInclude: 'prod-coragen-60ml'
  },
  {
    issue: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
    crop: 'Paddy',
    expectedInclude: 'prod-plantomycin-streptocycline'
  },
  {
    issue: 'Severe Zinc & Iron Deficiency Chlorosis',
    crop: 'Groundnut',
    expectedInclude: 'prod-zinc-sulphate-iffco'
  }
];

let allPassed = true;
for (const tc of testCases) {
  const matched = AiService.resolveTargetedProducts(tc.issue, tc.crop);
  const pass = matched.includes(tc.expectedInclude);
  console.log(`\n• Test Case: "${tc.issue}" (${tc.crop})`);
  console.log(`  Matched Product IDs: ${JSON.stringify(matched)}`);
  console.log(`  Expected ${tc.expectedInclude}: ${pass ? '✅ PASS' : '❌ FAIL'}`);
  if (!pass) allPassed = false;
}

if (!allPassed) {
  throw new Error('Targeted medicine resolution test failed!');
}

// 3. Non-Plant Rejection & Low Confidence Verification
console.log('\n🛡️ 3. NON-PLANT REJECTION & AMBIGUITY VERIFICATION:');
(async () => {
  const nonPlantResult = await AiService.diagnoseDisease('usr-farmer-1', undefined, 'Human Hand Skin');
  console.log('• Non-Plant Object Test (input: "Human Hand Skin"):');
  console.log(`  isCropPlant: ${nonPlantResult.isCropPlant} (Expected false)`);
  console.log(`  notPlantReason: "${nonPlantResult.notPlantReason}"`);
  console.log(`  recommendedProductIds count: ${nonPlantResult.recommendedProductIds.length} (Expected 0)`);

  if (nonPlantResult.isCropPlant !== false || nonPlantResult.recommendedProductIds.length !== 0) {
    throw new Error('Non-plant rejection failed!');
  }

  const ambiguousResult = await AiService.diagnoseDisease('usr-farmer-1', undefined, 'Unknown / Unclear');
  console.log('\n• Ambiguous Crop Test (input: "Unknown / Unclear"):');
  console.log(`  requiresFarmerConfirmation: ${ambiguousResult.requiresFarmerConfirmation} (Expected true)`);
  console.log(`  cropIdentified: ${ambiguousResult.cropIdentified} (Expected false)`);
  console.log(`  clarificationPrompt: "${ambiguousResult.clarificationPrompt}"`);

  if (!ambiguousResult.requiresFarmerConfirmation) {
    throw new Error('Ambiguous crop confirmation trigger failed!');
  }

  console.log('\n🎉 ALL REFACTOR VERIFICATIONS PASSED WITH 100% SUCCESS!');
})();
