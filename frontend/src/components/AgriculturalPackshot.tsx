import React, { useState } from 'react';

export interface PackshotProduct {
  id?: string;
  name: string;
  brand?: string;
  brandBadge?: string;
  category?: string;
  categoryId?: string;
  subcategory?: string;
  compositionFormula?: string;
  packSize?: string;
  packagingType?: string; // 'BAG' | 'BOTTLE' | 'POUCH' | 'CANISTER' | 'EQUIPMENT'
  images?: string[];
}

interface AgriculturalPackshotProps {
  product: PackshotProduct;
  className?: string;
  imgClassName?: string;
  size?: 'card' | 'modal' | 'thumb';
}

/**
 * Returns brand-specific color palette and official styling
 */
function getBrandTheme(brand = '', category = '') {
  const b = brand.toLowerCase();
  const cat = category.toLowerCase();

  if (b.includes('iffco')) {
    return {
      primary: '#006837', // IFFCO forest green
      secondary: '#004724',
      accent: '#FFD100',
      badgeBg: 'bg-emerald-900',
      badgeText: 'text-amber-300',
      border: 'border-emerald-600'
    };
  }
  if (b.includes('kribhco')) {
    return {
      primary: '#8A1515', // Kribhco crimson maroon
      secondary: '#5C0E0E',
      accent: '#FFD700',
      badgeBg: 'bg-red-950',
      badgeText: 'text-amber-300',
      border: 'border-red-600'
    };
  }
  if (b.includes('coromandel') || b.includes('gromor')) {
    return {
      primary: '#005A36', // Coromandel green
      secondary: '#B57C1E',
      accent: '#FFDF00',
      badgeBg: 'bg-emerald-950',
      badgeText: 'text-emerald-300',
      border: 'border-emerald-500'
    };
  }
  if (b.includes('mahadhan')) {
    return {
      primary: '#0F4C81', // Mahadhan deep blue
      secondary: '#D9531E', // Mahadhan orange
      accent: '#FFA500',
      badgeBg: 'bg-blue-950',
      badgeText: 'text-orange-300',
      border: 'border-blue-500'
    };
  }
  if (b.includes('bayer')) {
    return {
      primary: '#00857C', // Bayer teal
      secondary: '#004843',
      accent: '#89D329',
      badgeBg: 'bg-teal-950',
      badgeText: 'text-teal-300',
      border: 'border-teal-500'
    };
  }
  if (b.includes('syngenta')) {
    return {
      primary: '#002F6C', // Syngenta royal blue
      secondary: '#0072CE',
      accent: '#78BE20',
      badgeBg: 'bg-blue-950',
      badgeText: 'text-lime-300',
      border: 'border-blue-600'
    };
  }
  if (b.includes('tata') || b.includes('rallis')) {
    return {
      primary: '#004B87', // Tata blue
      secondary: '#002855',
      accent: '#E35205',
      badgeBg: 'bg-blue-900',
      badgeText: 'text-white',
      border: 'border-blue-400'
    };
  }
  if (b.includes('nfl')) {
    return {
      primary: '#1A365D', // NFL navy
      secondary: '#0D1B2A',
      accent: '#F6AD55',
      badgeBg: 'bg-blue-950',
      badgeText: 'text-amber-300',
      border: 'border-blue-400'
    };
  }
  if (b.includes('gsfc') || b.includes('sardar')) {
    return {
      primary: '#C53030', // GSFC brick red
      secondary: '#7B341E',
      accent: '#ECC94B',
      badgeBg: 'bg-red-900',
      badgeText: 'text-amber-200',
      border: 'border-red-400'
    };
  }

  // Category based defaults
  if (cat.includes('urea') || cat.includes('fertilizer') || cat.includes('complex')) {
    return {
      primary: '#15803d',
      secondary: '#166534',
      accent: '#fbbf24',
      badgeBg: 'bg-emerald-900',
      badgeText: 'text-amber-300',
      border: 'border-emerald-600'
    };
  }
  if (cat.includes('protection') || cat.includes('chemical') || cat.includes('pesticide')) {
    return {
      primary: '#b91c1c',
      secondary: '#7f1d1d',
      accent: '#facc15',
      badgeBg: 'bg-rose-950',
      badgeText: 'text-rose-200',
      border: 'border-rose-500'
    };
  }
  if (cat.includes('seed')) {
    return {
      primary: '#b45309',
      secondary: '#78350f',
      accent: '#fef08a',
      badgeBg: 'bg-amber-950',
      badgeText: 'text-amber-200',
      border: 'border-amber-500'
    };
  }

  return {
    primary: '#047857',
    secondary: '#064e3b',
    accent: '#34d399',
    badgeBg: 'bg-emerald-950',
    badgeText: 'text-emerald-300',
    border: 'border-emerald-500'
  };
}

/**
 * Extracts compact formula badge string (e.g., "46% N", "19:19:19", "18-46-0")
 */
function extractFormulaTag(name = '', formula = '', brandBadge = ''): string {
  if (formula && formula.length <= 16) return formula;
  const match = name.match(/(\d+[\s:–-]\d+[\s:–-]\d+|\d+%\s*N|\d+:\d+|\d+%\s*[A-Z][a-z]?)/i);
  if (match) return match[0];
  if (formula) {
    const fMatch = formula.match(/(\d+[\s:–-]\d+[\s:–-]\d+|\d+%\s*[A-Za-z]+|\d+:\d+)/);
    if (fMatch) return fMatch[0];
  }
  return brandBadge || 'AGRI INPUT';
}

export const AgriculturalPackshot: React.FC<AgriculturalPackshotProps> = ({
  product,
  className = '',
  imgClassName = '',
  size = 'card'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const rawUrl = product.images?.[0];
  // Filter out any known broken or 404 links
  const isSuspiciousUrl =
    !rawUrl ||
    rawUrl.includes('photo-1585314062340-f1a5a7c9328d') || // Broken dark soil texture
    rawUrl.includes('photo-1592417817098-8f3d6910985b') || // 404
    rawUrl.includes('photo-1592417817098-8f3d6910a455');   // 404

  const hasImage = !isSuspiciousUrl && !imageError;
  const theme = getBrandTheme(product.brand, product.category || product.categoryId);
  const formulaTag = extractFormulaTag(product.name, product.compositionFormula, product.brandBadge);
  const packaging = (product.packagingType || 'BAG').toUpperCase();
  const brand = (product.brandBadge || product.brand || 'AGRI INPUT').toUpperCase();
  const packSize = product.packSize || (packaging === 'BOTTLE' ? '500 ml' : '50 kg');

  // If valid image exists and hasn't errored, render it with safe fallback handler
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-100/60 ${className}`}
    >
      {hasImage ? (
        <>
          <img
            src={rawUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
            }}
            className={`w-full h-full object-contain p-2 transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            } ${imgClassName}`}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50 animate-pulse">
              <span className="text-[11px] font-bold text-stone-400">Loading packshot...</span>
            </div>
          )}
        </>
      ) : (
        /* Guaranteed crisp, packaging-accurate SVG vector packshot */
        <div className="w-full h-full p-2 flex items-center justify-center select-none">
          {packaging === 'BOTTLE' ? (
            /* =================== BOTTLE PACKAGING =================== */
            <svg
              viewBox="0 0 240 280"
              className="w-full h-full max-h-48 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            >
              {/* Bottle Cap & Ring */}
              <defs>
                <linearGradient id={`grad-cap-${product.id}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d1d5db" />
                  <stop offset="50%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#9ca3af" />
                </linearGradient>
                <linearGradient id={`grad-body-${product.id}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f3f4f6" />
                  <stop offset="25%" stopColor="#ffffff" />
                  <stop offset="75%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#e5e7eb" />
                </linearGradient>
                <linearGradient id={`grad-label-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} />
                  <stop offset="100%" stopColor={theme.secondary} />
                </linearGradient>
              </defs>

              {/* Cap */}
              <rect x="95" y="10" width="50" height="22" rx="4" fill={`url(#grad-cap-${product.id})`} stroke="#9ca3af" strokeWidth="1.5" />
              <line x1="102" y1="14" x2="102" y2="28" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="112" y1="14" x2="112" y2="28" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="120" y1="14" x2="120" y2="28" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="128" y1="14" x2="128" y2="28" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="138" y1="14" x2="138" y2="28" stroke="#cbd5e1" strokeWidth="2" />

              {/* Neck & Shoulder */}
              <path
                d="M 100 32 L 140 32 L 144 48 C 146 58 178 72 182 92 L 182 245 C 182 255 174 262 164 262 L 76 262 C 66 262 58 255 58 245 L 58 92 C 62 72 94 58 96 48 Z"
                fill={`url(#grad-body-${product.id})`}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Graduation ticks on left side */}
              <line x1="62" y1="110" x2="72" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="62" y1="140" x2="76" y2="140" stroke="#94a3b8" strokeWidth="2" />
              <line x1="62" y1="170" x2="72" y2="170" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="62" y1="200" x2="76" y2="200" stroke="#94a3b8" strokeWidth="2" />
              <line x1="62" y1="230" x2="72" y2="230" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Label Wrap */}
              <rect x="70" y="98" width="100" height="135" rx="6" fill={`url(#grad-label-${product.id})`} stroke={theme.accent} strokeWidth="1" />
              
              {/* Brand Header on Label */}
              <rect x="74" y="104" width="92" height="24" rx="4" fill="#ffffff" />
              <text x="120" y="120" textAnchor="middle" fill={theme.primary} fontSize="11" fontWeight="900" fontFamily="system-ui, sans-serif">
                {brand.slice(0, 16)}
              </text>

              {/* Product Formula Big Tag */}
              <text x="120" y="152" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif">
                {formulaTag}
              </text>

              {/* Foliar / Liquid Badge */}
              <rect x="80" y="162" width="80" height="18" rx="9" fill={theme.accent} />
              <text x="120" y="174" textAnchor="middle" fill="#1e293b" fontSize="8" fontWeight="900" fontFamily="system-ui, sans-serif">
                FOLIAR NANO LIQUID
              </text>

              {/* Pack Size */}
              <text x="120" y="202" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="800" fontFamily="system-ui, sans-serif">
                {packSize}
              </text>

              {/* Statutory Stamp */}
              <text x="120" y="222" textAnchor="middle" fill="#cbd5e1" fontSize="7" fontWeight="700" letterSpacing="0.5">
                GOVT CERTIFIED FCO 1985
              </text>
            </svg>
          ) : packaging === 'EQUIPMENT' ? (
            /* =================== EQUIPMENT / SPRAYER =================== */
            <svg
              viewBox="0 0 240 280"
              className="w-full h-full max-h-48 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            >
              <defs>
                <linearGradient id={`grad-eq-${product.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>

              {/* Tank Body */}
              <rect x="55" y="45" width="130" height="190" rx="28" fill={`url(#grad-eq-${product.id})`} stroke="#0284c7" strokeWidth="2" />
              {/* Tank Cap */}
              <rect x="95" y="25" width="50" height="22" rx="6" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
              {/* Back straps */}
              <path d="M 45 70 Q 55 140 45 210" stroke="#334155" strokeWidth="8" strokeLinecap="round" fill="none" />
              <path d="M 195 70 Q 185 140 195 210" stroke="#334155" strokeWidth="8" strokeLinecap="round" fill="none" />
              {/* Tank Panel */}
              <rect x="70" y="80" width="100" height="120" rx="12" fill="#ffffff" opacity="0.95" />
              
              <text x="120" y="105" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="900">
                {brand.slice(0, 16)}
              </text>
              <text x="120" y="125" textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900">
                16L BATTERY
              </text>
              <text x="120" y="142" textAnchor="middle" fill="#d97706" fontSize="9" fontWeight="800">
                KNAPSACK SPRAYER
              </text>
              {/* Battery gauge */}
              <rect x="85" y="152" width="70" height="14" rx="4" fill="#e2e8f0" stroke="#94a3b8" />
              <rect x="87" y="154" width="45" height="10" rx="2" fill="#22c55e" />
              <text x="120" y="182" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700">
                12V 8Ah HI-PRESSURE
              </text>
              {/* Base Feet */}
              <rect x="68" y="232" width="24" height="12" rx="3" fill="#1e293b" />
              <rect x="148" y="232" width="24" height="12" rx="3" fill="#1e293b" />
            </svg>
          ) : packaging === 'POUCH' ? (
            /* =================== POUCH / SACHET PACKAGING =================== */
            <svg
              viewBox="0 0 240 280"
              className="w-full h-full max-h-48 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            >
              <defs>
                <linearGradient id={`grad-pouch-${product.id}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="30%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>

              {/* Foil Pouch Shape */}
              <path
                d="M 50 35 L 190 35 L 180 250 C 180 258 172 265 160 265 L 80 265 C 68 265 60 258 60 250 Z"
                fill={`url(#grad-pouch-${product.id})`}
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              {/* Tear notch */}
              <path d="M 48 50 L 58 55 L 48 60 Z" fill="#64748b" />
              <path d="M 192 50 L 182 55 L 192 60 Z" fill="#64748b" />
              {/* Ziplock Heat Seal line */}
              <line x1="52" y1="65" x2="188" y2="65" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />

              {/* Main Printed Banner */}
              <rect x="62" y="78" width="116" height="155" rx="8" fill={theme.primary} />
              
              <rect x="66" y="84" width="108" height="24" rx="4" fill="#ffffff" />
              <text x="120" y="100" textAnchor="middle" fill={theme.secondary} fontSize="11" fontWeight="900">
                {brand.slice(0, 16)}
              </text>

              <text x="120" y="130" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
                {formulaTag}
              </text>

              {/* CIB Toxicity Triangle Indicator */}
              <polygon points="120,145 106,170 134,170" fill="#22c55e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="120" y="184" textAnchor="middle" fill="#f8fafc" fontSize="8" fontWeight="700">
                PLANT PROTECTION
              </text>

              <rect x="74" y="196" width="92" height="18" rx="9" fill={theme.accent} />
              <text x="120" y="209" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="900">
                NET: {packSize}
              </text>
            </svg>
          ) : (
            /* =================== BAG PACKAGING (DEFAULT UREA / NPK / POTASH SACK) =================== */
            <svg
              viewBox="0 0 240 280"
              className="w-full h-full max-h-48 drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            >
              <defs>
                <linearGradient id={`grad-bag-${product.id}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="35%" stopColor="#ffffff" />
                  <stop offset="65%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <pattern id={`weave-${product.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 0 4 L 8 4 M 4 0 L 4 8" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Woven Sack Outline */}
              <path
                d="M 45 28 C 45 24 55 20 120 20 C 185 20 195 24 195 28 L 188 255 C 188 260 178 265 120 265 C 62 265 52 260 52 255 Z"
                fill={`url(#grad-bag-${product.id})`}
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />
              {/* Texture Overlay */}
              <path
                d="M 45 28 C 45 24 55 20 120 20 C 185 20 195 24 195 28 L 188 255 C 188 260 178 265 120 265 C 62 265 52 260 52 255 Z"
                fill={`url(#weave-${product.id})`}
                opacity="0.7"
              />

              {/* Stitched Top Seam */}
              <path d="M 42 28 Q 120 25 198 28" stroke="#f59e0b" strokeWidth="4" strokeDasharray="5 3" fill="none" />

              {/* Brand Color Header Stripe */}
              <path
                d="M 46 38 L 194 38 L 192 90 L 48 90 Z"
                fill={theme.primary}
              />
              <text x="120" y="65" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" letterSpacing="0.5">
                {brand.slice(0, 18)}
              </text>
              <text x="120" y="80" textAnchor="middle" fill={theme.accent} fontSize="8" fontWeight="800" letterSpacing="1">
                FERTILIZER CONTROL ORDER 1985
              </text>

              {/* Big NPK / Formula Badge */}
              <rect x="65" y="105" width="110" height="52" rx="10" fill="#ffffff" stroke={theme.primary} strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
              <text x="120" y="132" textAnchor="middle" fill={theme.secondary} fontSize="17" fontWeight="900" fontFamily="system-ui, sans-serif">
                {formulaTag}
              </text>
              <text x="120" y="148" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="800">
                {product.subcategory?.replace('_', ' ') || product.category || 'FERTILIZER'}
              </text>

              {/* Subsidized Govt Emblem */}
              <circle cx="120" cy="184" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="120" y="181" textAnchor="middle" fill="#92400e" fontSize="7" fontWeight="900">
                GOVT OF INDIA
              </text>
              <text x="120" y="191" textAnchor="middle" fill="#b45309" fontSize="6.5" fontWeight="900">
                SUBSIDIZED
              </text>

              {/* Net Weight Banner */}
              <rect x="62" y="214" width="116" height="24" rx="6" fill={theme.secondary} />
              <text x="120" y="230" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" letterSpacing="0.5">
                NET WEIGHT: {packSize}
              </text>

              {/* Stitched Bottom Seam */}
              <path d="M 54 254 Q 120 258 186 254" stroke="#f59e0b" strokeWidth="4" strokeDasharray="5 3" fill="none" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
