import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Tag
} from 'lucide-react';
import {
  PurchaseOffer,
  POPULAR_COMMODITIES,
  QUALITY_GRADES,
  QUANTITY_UNITS
} from './buyerMockData';

interface CreatePurchaseOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offer: Partial<PurchaseOffer>) => Promise<void>;
  buyerName?: string;
  defaultDistrict?: string;
}

export const CreatePurchaseOfferModal: React.FC<CreatePurchaseOfferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  buyerName = 'Kisan Mandi Wholesalers',
  defaultDistrict = 'Sri Sathya Sai'
}) => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [customCropName, setCustomCropName] = useState<string>('');
  const [variety, setVariety] = useState<string>('Saaho 3251 / Arka Rakshak');
  const [qualityGrade, setQualityGrade] = useState<string>('Grade A (Premium)');
  const [quantity, setQuantity] = useState<string>('200');
  const [unit, setUnit] = useState<'QUINTAL' | 'TONNE' | 'CRATE' | 'BAGS' | 'KG'>('CRATE');
  const [targetPrice, setTargetPrice] = useState<string>('520');
  const [procurementCenter, setProcurementCenter] = useState<string>(`Kadiri Mandi Procurement Yard, ${defaultDistrict}`);
  const [validUntilDays, setValidUntilDays] = useState<number>(7);
  const [customValidDate, setCustomValidDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [specialRequirements, setSpecialRequirements] = useState<string>(
    'Uniform ripeness, minimum borer damage. Direct farm-gate truck pickup arranged by our procurement fleet. Instant RTGS settlement.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDayPreset = (days: number) => {
    setValidUntilDays(days);
    const date = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    setCustomValidDate(date);
  };

  const handleCommodityChange = (crop: string) => {
    setSelectedCrop(crop);
    // Smart auto-configuration of units and sample target prices
    if (crop === 'Tomato') {
      setUnit('CRATE');
      setTargetPrice('520');
      setVariety('Arka Rakshak / Saaho Hybrid');
    } else if (crop === 'Groundnut') {
      setUnit('QUINTAL');
      setTargetPrice('7450');
      setVariety('Kadiri-6 / K-9 High Oil');
    } else if (crop === 'Chilli') {
      setUnit('QUINTAL');
      setTargetPrice('18500');
      setVariety('Guntur Teja S17 / Byadgi');
    } else if (crop.includes('Paddy')) {
      setUnit('QUINTAL');
      setTargetPrice('2380');
      setVariety('BPT 5204 Sona Masoori');
    } else if (crop === 'Onion') {
      setUnit('QUINTAL');
      setTargetPrice('2600');
      setVariety('Nashik Red / Bellary Medium');
    } else if (crop === 'Carrot') {
      setUnit('QUINTAL');
      setTargetPrice('2900');
      setVariety('Kuroda English Hybrid');
    } else if (crop.includes('Rose') || crop.includes('Jasmine')) {
      setUnit('KG');
      setTargetPrice('450');
      setVariety('Fresh Morning Pluck');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalCropName = selectedCrop === 'Other (Custom Type)' ? customCropName.trim() : selectedCrop;
    if (!finalCropName) {
      setError('Please specify the commodity/crop name.');
      return;
    }

    const parsedQty = parseFloat(quantity);
    const parsedPrice = parseFloat(targetPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid required quantity greater than 0.');
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid target offer price greater than ₹0.');
      return;
    }

    if (!procurementCenter.trim()) {
      setError('Please provide the procurement yard or delivery location.');
      return;
    }

    setIsSubmitting(true);
    try {
      const priceUnitStr =
        unit === 'QUINTAL' ? 'per Quintal' :
        unit === 'CRATE' ? 'per Crate (25kg)' :
        unit === 'TONNE' ? 'per Tonne' :
        unit === 'BAGS' ? 'per Bag (50kg)' : 'per Kg';

      await onSubmit({
        cropName: finalCropName,
        variety: variety.trim() || 'Standard Variety',
        qualityGrade,
        requiredQuantity: parsedQty,
        unit,
        targetPrice: parsedPrice,
        priceUnit: priceUnitStr,
        procurementCenter: procurementCenter.trim(),
        district: defaultDistrict,
        state: 'Andhra Pradesh',
        validUntil: customValidDate,
        specialRequirements: specialRequirements.trim(),
        status: 'ACTIVE'
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create purchase offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4 animate-in fade-in">
      <div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col border border-emerald-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
              <Plus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Create Purchase Offer</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-teal-950">
                  Buyer Demand
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                Broadcast direct harvest procurement demands to registered cultivators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Crop / Commodity Selection */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
              1. Crop Name / Commodity *
            </label>
            <select
              value={selectedCrop}
              onChange={e => handleCommodityChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              {POPULAR_COMMODITIES.map(crop => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>

            {selectedCrop === 'Other (Custom Type)' && (
              <input
                type="text"
                placeholder="Enter custom crop or commodity name (e.g. Black Gram, Watermelon, Turmeric)"
                value={customCropName}
                onChange={e => setCustomCropName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-emerald-400 bg-emerald-50/30 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 animate-in fade-in"
                required
              />
            )}
          </div>

          {/* 2. Variety & Quality Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                2. Variety / Seed Type
              </label>
              <input
                type="text"
                value={variety}
                onChange={e => setVariety(e.target.value)}
                placeholder="e.g. Kadiri-6, Arka Rakshak, Hybrid 1057"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                3. Quality Grade *
              </label>
              <select
                value={qualityGrade}
                onChange={e => setQualityGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {QUALITY_GRADES.map(grade => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Required Quantity & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                4. Required Quantity *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                Unit of Measure *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {QUANTITY_UNITS.map(u => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Target Offer Price */}
          <div className="space-y-1.5 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-emerald-950 block uppercase tracking-wider text-[11px]">
                5. Target Procurement Offer Price (₹) *
              </label>
              <span className="text-[11px] font-bold text-emerald-800">
                Calculated per {unit}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-black text-emerald-700">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                placeholder="e.g. 7450"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-emerald-300 font-black text-emerald-950 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base shadow-xs"
                required
              />
            </div>
            <p className="text-[10px] text-emerald-800 font-medium">
              Total estimated demand value: <strong className="font-black">₹{((parseFloat(quantity) || 0) * (parseFloat(targetPrice) || 0)).toLocaleString('en-IN')}</strong>
            </p>
          </div>

          {/* 5. Procurement Center / Delivery Region */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
              6. Procurement Center / Preferred Region *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={procurementCenter}
                onChange={e => setProcurementCenter(e.target.value)}
                placeholder="e.g. Kadiri APMC Yard / Farm Gate Pickup"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* 6. Expiry Date & Validity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                7. Offer Expiry / Valid Until *
              </label>
              <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Active for {validUntilDays} days
              </span>
            </div>

            <div className="flex items-center gap-1.5 pb-1">
              {[3, 7, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleDayPreset(days)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition ${
                    validUntilDays === days
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
                  }`}
                >
                  +{days} Days
                </button>
              ))}
            </div>

            <input
              type="date"
              value={customValidDate}
              onChange={e => {
                setCustomValidDate(e.target.value);
                setValidUntilDays(
                  Math.max(1, Math.ceil((new Date(e.target.value).getTime() - Date.now()) / 86400000))
                );
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* 7. Special Requirements */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
              8. Special Quality, Moisture & Logistics Specifications
            </label>
            <textarea
              rows={2}
              value={specialRequirements}
              onChange={e => setSpecialRequirements(e.target.value)}
              placeholder="e.g. Moisture < 8%, sun-dried clean pods, spot cash settlement, buyer vehicle arranges pickup."
              className="w-full p-3 rounded-2xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 font-extrabold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Offer...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Purchase Demand</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
