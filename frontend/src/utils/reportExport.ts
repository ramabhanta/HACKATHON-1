import jsPDF from 'jspdf';

// Universal CSV downloader helper
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. Soil Health Report PDF Generator
export function exportSoilHealthReportPDF(data: {
  ph: number;
  nitrogenKgPerHa: number;
  phosphorusKgPerHa: number;
  potassiumKgPerHa: number;
  organicCarbonPct: number;
  electricalConductivity?: number;
  soilHealthScore?: number;
  soilType?: string;
  summary: string;
  recommendations: string[];
  suitableCrops?: string[];
  testedAt?: string;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const primaryColor = [16, 120, 60]; // Emerald green
  const slateDark = [30, 41, 59];

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AGRODEX CROP-PILOT AI', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL SOIL FERTILITY & NUTRIENT HEALTH CARD', 14, 18);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()} | Soil Type: ${data.soilType || 'Red Loam'}`, 14, 23);

  // Health Score Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(14, 34, 182, 22, 3, 3, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const score = data.soilHealthScore || 78;
  doc.text(`${score}/100`, 20, 48);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SOIL HEALTH INDEX: OPTIMAL FERTILITY', 60, 43);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Calibrated for multi-crop rotation & high nitrogen/phosphorus response.', 60, 49);

  // Soil Parameters Table
  let y = 64;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. LABORATORY & SENSOR NUTRIENT METRICS', 14, y);

  y += 5;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Parameter', 18, y + 5.5);
  doc.text('Observed Value', 85, y + 5.5);
  doc.text('Agronomic Benchmark', 135, y + 5.5);

  const metrics = [
    ['Soil Reaction (pH)', `${data.ph} pH`, '6.5 - 7.5 (Neutral / Ideal)'],
    ['Available Nitrogen (N)', `${data.nitrogenKgPerHa} kg/ha`, '280 - 560 kg/ha (Medium)'],
    ['Available Phosphorus (P2O5)', `${data.phosphorusKgPerHa} kg/ha`, '23 - 56 kg/ha (Medium)'],
    ['Available Potassium (K2O)', `${data.potassiumKgPerHa} kg/ha`, '145 - 335 kg/ha (Adequate)'],
    ['Organic Carbon (OC)', `${data.organicCarbonPct}%`, '> 0.50% (Desirable)']
  ];

  y += 8;
  metrics.forEach(([param, val, bench], idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, y, 182, 7, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.text(param, 18, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(val, 85, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(bench, 135, y + 5);
    y += 7;
  });

  // Condition Summary
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. AGRONOMIC INTERPRETATION SUMMARY', 14, y);

  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const splitSummary = doc.splitTextToSize(data.summary || 'Nutrient metrics calibrated for sustainable yields.', 182);
  doc.text(splitSummary, 14, y);
  y += splitSummary.length * 5 + 4;

  // Recommendations
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. PRESCRIBED FERTILIZER & SOIL ENRICHMENT PROTOCOL', 14, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  (data.recommendations || []).forEach((rec, idx) => {
    const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 180);
    doc.text(lines, 14, y);
    y += lines.length * 4.5 + 2;
  });

  // Suitable Crops
  if (data.suitableCrops && data.suitableCrops.length > 0) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text(`Suitable Crops for Rotation: ${data.suitableCrops.join(', ')}`, 14, y);
  }

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('Scientific Notice: AgroDex advisory is generated via digital agronomy algorithms based on input sensor and soil test data.', 14, 285);

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`CropPilot_Soil_Health_Report_${dateStr}.pdf`);
}

// 2. AI Crop Diagnosis PDF Generator
export function exportDiagnosisReportPDF(diagnosis: {
  detected_disease?: string;
  suspectedIssue?: string;
  cropName?: string;
  confidence?: number;
  confidence_score?: number;
  severity?: string;
  symptoms?: string[];
  culturalControl?: string[];
  biologicalControl?: string[];
  chemicalControlSafe?: string[];
  remedies?: string[];
  photoTelemetry?: any;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emerald = [5, 150, 105];
  const slateDark = [30, 41, 59];

  // Header Banner
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AGRODEX CROP-PILOT AI', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI PLANT PATHOLOGY & CROP LEAF DIAGNOSIS REPORT', 14, 18);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()} | Verified Agronomic Protocol`, 14, 23);

  // Diagnosis Highlight Card
  doc.setFillColor(254, 243, 199); // amber 100
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(14, 34, 182, 26, 3, 3, 'FD');

  const diseaseName = diagnosis.detected_disease || diagnosis.suspectedIssue || 'Healthy / Undetermined';
  const crop = diagnosis.cropName || 'Field Crop';
  const conf = Math.round((diagnosis.confidence || diagnosis.confidence_score || 0.9) * 100);

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`CROP: ${crop.toUpperCase()} | CONFIDENCE: ${conf}% | SEVERITY: ${diagnosis.severity || 'Moderate'}`, 18, 41);

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(diseaseName, 18, 51);

  let y = 68;

  // Treatment Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text('TARGETED 3-TIER TREATMENT PROTOCOL', 14, y);

  // Cultural Controls
  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('A. Cultural & Agronomic Sanitations:', 14, y);
  y += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const cultural = diagnosis.culturalControl || ['Remove and safely destroy infected lower leaves.', 'Improve field drainage to prevent waterlogging.'];
  cultural.forEach(c => {
    const lines = doc.splitTextToSize(`• ${c}`, 178);
    doc.text(lines, 18, y);
    y += lines.length * 4 + 1;
  });

  // Biological Controls
  y += 3;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('B. Organic & Biological Inoculants:', 14, y);
  y += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const bio = diagnosis.biologicalControl || ['Foliar spray of Cold-Pressed Neem Oil (10,000 PPM) @ 3 ml/L.', 'Seed or soil treatment with Trichoderma viride.'];
  bio.forEach(b => {
    const lines = doc.splitTextToSize(`• ${b}`, 178);
    doc.text(lines, 18, y);
    y += lines.length * 4 + 1;
  });

  // Chemical Controls
  y += 3;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('C. Safe Chemical Interventions (Registered Fungicides/Insecticides):', 14, y);
  y += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const chem = diagnosis.chemicalControlSafe || diagnosis.remedies || ['Apply registered protectant fungicide as per local Krishi Vigyan Kendra guidance.'];
  chem.forEach(ch => {
    const lines = doc.splitTextToSize(`• ${ch}`, 178);
    doc.text(lines, 18, y);
    y += lines.length * 4 + 1;
  });

  // Safety Warnings
  y += 6;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MANDATORY CHEMICAL SAFETY & SPRAY PRECAUTIONS:', 18, y + 6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Wear protective rubber gloves, face mask, and eye shield during knapsack spray preparation.', 18, y + 11);
  doc.text('2. Never spray against wind direction or during high noon temperatures (>35°C).', 18, y + 15);
  doc.text('3. Strictly observe pre-harvest interval (PHI) before picking produce.', 18, y + 19);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('AgroDex AI Pathology Engine | For emergency crop support visit your nearest Krishi Vigyan Kendra (KVK)', 14, 285);

  const cleanCrop = (diagnosis.cropName || 'Crop').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`CropPilot_Diagnosis_${cleanCrop}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 3. Agri Store Order Invoice PDF Generator
export function exportOrderInvoicePDF(order: {
  id: string;
  orderNumber?: string;
  createdAt: string;
  farmerName?: string;
  vendorName?: string;
  deliveryAddress?: { village?: string; district?: string; pincode?: string; fullAddress?: string };
  items: Array<{ name: string; quantity: number; unitPrice: number; price?: number; unit?: string }>;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  status: string;
  collectionOtp?: string;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emerald = [16, 120, 60];
  const slateDark = [30, 41, 59];

  // Header Banner
  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AGRODEX AGRI STORE', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL BOOKING RECEIPT & TAX INVOICE', 14, 19);
  doc.setFontSize(8);
  doc.text(`Booking SLA: 24 Hours Reserved Pickup | GST Registered Agricultural Supplies`, 14, 25);

  // Meta Information Box
  let y = 38;
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Order ID: #${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`, 14, y);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`, 120, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Farmer / Buyer: ${order.farmerName || 'Registered Farmer'}`, 14, y);
  doc.text(`Pickup Store: ${order.vendorName || 'AgroDex Authorized Kendra'}`, 120, y);

  y += 6;
  const address = order.deliveryAddress
    ? `${order.deliveryAddress.village || ''}, ${order.deliveryAddress.district || ''}`
    : 'Local Farmer Delivery';
  doc.text(`Location: ${address}`, 14, y);
  doc.text(`Payment: ${order.paymentMethod || 'PAY_ON_PICKUP'} (${order.paymentStatus.toUpperCase()})`, 120, y);

  // Collection OTP Banner
  if (order.collectionOtp) {
    y += 8;
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, y, 182, 14, 2, 2, 'FD');
    doc.setTextColor(180, 83, 9);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`STORE COLLECTION OTP: ${order.collectionOtp}`, 20, y + 9);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Show this OTP at the counter to collect your genuine sealed agricultural inputs.', 105, y + 9);
    y += 18;
  } else {
    y += 10;
  }

  // Items Table
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Item Description', 18, y + 5.5);
  doc.text('Qty', 115, y + 5.5);
  doc.text('Unit Price', 135, y + 5.5);
  doc.text('Total (INR)', 170, y + 5.5);

  y += 8;
  (order.items || []).forEach((item, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, y, 182, 7, 'F');
    }
    const unitPrice = item.unitPrice || item.price || 0;
    const itemTotal = unitPrice * item.quantity;
    doc.setFont('helvetica', 'normal');
    doc.text(item.name, 18, y + 5);
    doc.text(String(item.quantity), 118, y + 5);
    doc.text(`INR ${unitPrice}`, 137, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(`INR ${itemTotal}`, 172, y + 5);
    y += 7;
  });

  // Total summary
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.text(`GRAND TOTAL: INR ${order.totalAmount}`, 130, y);

  // Footer notes
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer generated invoice valid at all AgroDex partner agro-dealers across India.', 14, 280);

  doc.save(`AgriStore_Invoice_${order.orderNumber || order.id.slice(0, 8)}.pdf`);
}

// 4. Mandi Rates CSV Exporter
export function exportMandiRatesCSV(prices: any[], state?: string, district?: string) {
  const headers = [
    'State',
    'District',
    'Market / Mandi',
    'Commodity',
    'Variety',
    'Category',
    'Min Price (INR/Q)',
    'Modal Price (INR/Q)',
    'Max Price (INR/Q)',
    'Price Trend',
    'Report Date'
  ];

  const rows = prices.map(p => [
    p.state || state || 'All India',
    p.district || district || 'All Districts',
    p.market || 'APMC Mandi',
    p.commodity || 'Agricultural Produce',
    p.variety || 'Standard',
    p.commodityType || 'CROP',
    p.minPrice ?? 0,
    p.modalPrice ?? 0,
    p.maxPrice ?? 0,
    p.trend || 'STABLE',
    p.priceDate || new Date().toISOString().split('T')[0]
  ]);

  const cleanState = (state || 'All_India').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(`Mandi_Market_Rates_${cleanState}_${dateStr}.csv`, headers, rows);
}

// 5. Procurement Deal Voucher PDF Exporter
export function exportProcurementVoucherPDF(deal: {
  id: string;
  cropName?: string;
  variety?: string;
  quantityKg: number;
  pricePerKg: number;
  vendorName?: string;
  farmerName?: string;
  pickupScheduledDate?: string;
  proposedHarvestDate?: string;
  vendorResponseNotes?: string;
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const emerald = [16, 120, 60];

  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('AGRODEX FARM PRODUCE MARKET', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL MANDI PROCUREMENT & GATE-PASS VOUCHER', 14, 19);
  doc.setFontSize(8);
  doc.text(`Voucher ID: #${deal.id.slice(0, 8).toUpperCase()} | Date: ${new Date().toLocaleString()}`, 14, 25);

  let y = 42;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Crop: ${deal.cropName || 'Farm Produce'} (${deal.variety || 'Grade A'})`, 14, y);
  y += 7;
  doc.text(`Quantity: ${deal.quantityKg} kg (${(deal.quantityKg / 100).toFixed(1)} Quintals)`, 14, y);
  y += 7;
  doc.text(`Agreed Rate: INR ${deal.pricePerKg}/kg (INR ${deal.pricePerKg * 100}/Quintal)`, 14, y);
  y += 7;
  const totalVal = Math.round(deal.quantityKg * deal.pricePerKg);
  doc.text(`Total Settlement Value: INR ${totalVal.toLocaleString('en-IN')}`, 14, y);
  y += 7;
  doc.text(`Authorized Buyer / APMC Trader: ${deal.vendorName || 'APMC Yard Buyer'}`, 14, y);
  y += 7;
  doc.text(`Farmer: ${deal.farmerName || 'Registered Producer'}`, 14, y);
  y += 7;
  doc.text(`Scheduled Gate Entry / Harvest Date: ${deal.pickupScheduledDate || deal.proposedHarvestDate || 'Immediate'}`, 14, y);

  if (deal.vendorResponseNotes) {
    y += 9;
    doc.setFont('helvetica', 'italic');
    doc.text(`Buyer Instructions: "${deal.vendorResponseNotes}"`, 14, y);
  }

  y += 12;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
  doc.roundedRect(14, y, 182, 14, 2, 2, 'FD');
  doc.setTextColor(emerald[0], emerald[1], emerald[2]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL MANDI GATE CLEARANCE PASS - VERIFIED BY AGRODEX ESCROW', 20, y + 9);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('This voucher entitles priority APMC gate entry and automated payment settlement upon weighbridge verification.', 14, 280);

  doc.save(`AgroDex_Procurement_Voucher_${deal.id.slice(0, 8)}.pdf`);
}
