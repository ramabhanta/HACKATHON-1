import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sprout
} from 'lucide-react';
import { NearbyFarmerProfile, FarmInspectionBooking } from './buyerMockData';

interface BookInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: NearbyFarmerProfile | null;
  onConfirm: (booking: FarmInspectionBooking) => void;
  buyerName?: string;
  buyerPhone?: string;
}

export const BookInspectionModal: React.FC<BookInspectionModalProps> = ({
  isOpen,
  onClose,
  farmer,
  onConfirm,
  buyerName = 'Kisan Mandi Quality Team',
  buyerPhone = '+91 94400 98765'
}) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [inspectionDate, setInspectionDate] = useState<string>(tomorrow);
  const [timeSlot, setTimeSlot] = useState<string>('07:30 AM - 10:30 AM (Early Harvest Pluck)');
  const [inspectorName, setInspectorName] = useState<string>(buyerName);
  const [inspectorPhone, setInspectorPhone] = useState<string>(buyerPhone);
  const [notes, setNotes] = useState<string>(
    'Field moisture test (<8%), pod size grading, and tare weighment calibration check.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Universal Escape key listener
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !farmer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const booking: FarmInspectionBooking = {
      id: `insp-${Math.random().toString(36).substring(2, 9)}`,
      farmerId: farmer.farmerId,
      farmerName: farmer.farmerName,
      village: farmer.village,
      cropName: farmer.cropName,
      acreage: farmer.totalAcreage,
      inspectionDate,
      timeSlot,
      inspectorName: inspectorName.trim() || 'Procurement Officer',
      inspectorPhone: inspectorPhone.trim() || '+91 94400 98765',
      notes: notes.trim(),
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onConfirm(booking);
      onClose();
    }, 400);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4 animate-in fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col border border-emerald-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
              <ClipboardCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Book Farm Gate Inspection</h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Send agronomist / assessor for standing crop quality check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Farmer Info Snapshot */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-3 text-xs">
          <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center font-black text-emerald-800">
            {farmer.avatarUrl ? (
              <img src={farmer.avatarUrl} alt={farmer.farmerName} className="w-full h-full object-cover" />
            ) : (
              farmer.farmerName.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <span>{farmer.farmerName}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black">
                Verified ✓
              </span>
            </div>
            <p className="text-[11px] text-gray-600">
              {farmer.cropName} ({farmer.variety}) • {farmer.totalAcreage} Acres • {farmer.village}, {farmer.district} ({farmer.distanceKm} km away)
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
              Preferred Inspection Date *
            </label>
            <input
              type="date"
              value={inspectionDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setInspectionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
              Preferred Arrival Time Slot *
            </label>
            <select
              value={timeSlot}
              onChange={e => setTimeSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="07:30 AM - 10:30 AM (Early Harvest Pluck)">07:30 AM - 10:30 AM (Early Harvest Pluck)</option>
              <option value="11:00 AM - 01:30 PM (Midday Field Grading)">11:00 AM - 01:30 PM (Midday Field Grading)</option>
              <option value="04:00 PM - 06:30 PM (Evening Harvest Weighment)">04:00 PM - 06:30 PM (Evening Harvest Weighment)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                Assigned Inspector Name
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                placeholder="e.g. Suresh (Field Agronomist)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
                Inspector Contact Phone
              </label>
              <input
                type="tel"
                value={inspectorPhone}
                onChange={e => setInspectorPhone(e.target.value)}
                placeholder="+91 94400 98765"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-gray-300 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block uppercase tracking-wider text-[11px]">
              Inspection Scope & Testing Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Moisture testing, digital refractometer sugar brix, seed uniformity check."
              className="w-full p-3 rounded-2xl border border-gray-300 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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
                  <span>Scheduling Visit...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Farm Inspection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
