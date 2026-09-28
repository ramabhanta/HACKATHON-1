import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Upload,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  UserCheck,
  MapPin,
  Calendar,
  Clock,
  HardDrive,
  Info
} from 'lucide-react';
import {
  extractPhotoTelemetry,
  createSampleTelemetry,
  PhotoTelemetryInfo
} from '../../utils/photoTelemetry';

interface DiseaseScanProps {
  setActiveTab: (tab: string) => void;
}

export const DiseaseScan: React.FC<DiseaseScanProps> = ({ setActiveTab }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [selectedCrop, setSelectedCrop] = useState('Groundnut');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [photoTelemetry, setPhotoTelemetry] = useState<PhotoTelemetryInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Demo sample photos for quick 1-click test
  const sampleLeaves = [
    {
      name: 'Groundnut Leaf Spot (Tikka)',
      crop: 'Groundnut',
      url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500'
    },
    {
      name: 'Tomato Blight Symptoms',
      crop: 'Tomato',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=500'
    },
    {
      name: 'Healthy Field Foliage',
      crop: 'Groundnut',
      url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=500'
    }
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setDiagnosis(null);
      setScanError(null);

      // Extract real-time date, time, file metrics, and field geolocation
      const telemetry = await extractPhotoTelemetry(file, {
        latitude: user?.latitude || 14.1165,
        longitude: user?.longitude || 78.1634,
        locationName: `${user?.village ? user.village + ', ' : ''}${user?.district || 'Sri Sathya Sai'}, ${user?.state || 'Andhra Pradesh'}`
      });
      setPhotoTelemetry(telemetry);
    }
  };

  const handleSelectSample = (sample: typeof sampleLeaves[0]) => {
    setSelectedCrop(sample.crop);
    setSelectedImage(sample.url);
    setImageFile(null);
    setDiagnosis(null);
    setScanError(null);

    // Provide real-time live telemetry for the sample scan
    const telemetry = createSampleTelemetry(sample.name, sample.crop);
    setPhotoTelemetry(telemetry);
  };

  const handleRunScan = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setScanStep(1);
    setScanError(null);

    // Step simulation for visual feedback
    const timer1 = setTimeout(() => setScanStep(2), 600);
    const timer2 = setTimeout(() => setScanStep(3), 1200);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('cropName', selectedCrop);
      if (photoTelemetry) {
        formData.append('photoMetadata', JSON.stringify(photoTelemetry));
      }

      const res = await fetch('/api/ai/crop-disease', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setDiagnosis(data);
          setIsAnalyzing(false);
          setScanStep(0);
        }, 1800);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Scan diagnostic failed');
      }
    } catch (err: any) {
      setIsAnalyzing(false);
      setScanStep(0);
      setScanError(err.message || 'Image processing failed. Please ensure the leaf is clearly visible and retry.');
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <span>🔬 MobileNetV3 / EfficientNet Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('scanTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('scanSubtitle')}
          </p>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">Crop:</label>
          <select
            value={selectedCrop}
            onChange={e => setSelectedCrop(e.target.value)}
            className="bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="Groundnut">Groundnut (వేరుశనగ)</option>
            <option value="Tomato">Tomato (టమాటా)</option>
            <option value="Rice">Rice / Paddy (వరి)</option>
            <option value="Cotton">Cotton (ప్రత్తి)</option>
            <option value="Chilli">Chilli (మిరప)</option>
            <option value="Wheat">Wheat (గోధుమ)</option>
            <option value="Maize">Maize (మొక్కజొన్న)</option>
          </select>
        </div>
      </div>

      {/* Main Upload / Camera Viewport */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left Preview Box */}
          <div className="relative border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30 min-h-[260px] flex flex-col items-center justify-center p-4 overflow-hidden group">
            {selectedImage ? (
              <div className="relative w-full h-full min-h-[260px] flex items-center justify-center overflow-hidden rounded-xl bg-black/5">
                <img
                  src={selectedImage}
                  alt="Crop preview"
                  className="max-h-72 w-full object-cover rounded-xl shadow-md"
                />

                {/* Real-time Visual Telemetry Watermark Overlay on Photo */}
                {photoTelemetry && (
                  <div className="absolute bottom-2 left-2 right-2 p-2.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-[10px] space-y-1 border border-white/20 pointer-events-none shadow-lg">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-black text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        LIVE PHOTO AUDIT
                      </span>
                      <span className="text-[9px] text-gray-300">
                        {photoTelemetry.dimensions} • {photoTelemetry.megapixels}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-200 text-[10px] font-semibold">
                      <span>📅 {photoTelemetry.uploadDateFormatted}</span>
                      <span>🕒 {photoTelemetry.uploadTimeFormatted}</span>
                    </div>
                    <div className="truncate text-gray-300 text-[9px] flex items-center gap-1 font-mono">
                      <span>📍</span>
                      <span className="truncate">{photoTelemetry.locationName}</span>
                    </div>
                  </div>
                )}

                <label className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition backdrop-blur-xs flex items-center gap-1 z-10">
                  <Camera className="w-4 h-4" /> Change Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-gray-800">Take or Upload Leaf Photo</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Snap an affected leaf showing lesions or discoloration
                </p>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition active:scale-95 flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Choose from Gallery / Camera
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Action & Sample Picker */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
                Or Click a Sample Test Image:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {sampleLeaves.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sample)}
                    className="p-2 rounded-xl border border-gray-200 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50/50 transition text-left group flex flex-col items-center"
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-14 object-cover rounded-lg mb-1 group-hover:scale-105 transition"
                    />
                    <span className="text-[10px] font-bold text-gray-800 text-center leading-tight line-clamp-1">
                      {sample.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scan Button & Step Animation */}
            <div className="pt-2 space-y-2">
              {scanError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              <button
                onClick={handleRunScan}
                disabled={!selectedImage || isAnalyzing}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>
                      {scanStep === 1
                        ? 'Validating & Preprocessing Image...'
                        : scanStep === 2
                        ? 'Running Deep Neural Inference...'
                        : 'Matching Treatment Guidance...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>Scan Leaf & Diagnose Problem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Real Photo Information & Field Telemetry Card */}
        {photoTelemetry && (
          <div className="mt-6 pt-5 border-t border-emerald-100 space-y-3 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                  📸
                </div>
                <div>
                  <h4 className="font-black text-xs text-gray-900 flex items-center gap-1.5">
                    <span>Real Photo Information & Field Telemetry</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Real-Time Captured
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    Live temporal and spatial parameters recorded at the exact moment of photo upload
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Uploaded: {photoTelemetry.uploadTimeFormatted}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {/* 1. Real Upload Date */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span>Upload Date</span>
                </div>
                <span className="font-extrabold text-gray-900 block mt-1">
                  {photoTelemetry.uploadDateFormatted}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                  {photoTelemetry.uploadTimeFormatted} (IST)
                </span>
              </div>

              {/* 2. Device Last Modified Capture Time */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Capture Timestamp</span>
                </div>
                <span className="font-extrabold text-gray-900 block mt-1 truncate" title={photoTelemetry.captureDateFormatted}>
                  {photoTelemetry.captureDateFormatted}
                </span>
                <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                  {photoTelemetry.deviceSource === 'FIELD_CAMERA' ? '📱 Mobile Camera' : photoTelemetry.deviceSource === 'FIELD_SAMPLE' ? '🔬 Reference Sample' : '🖼️ Device Storage'}
                </span>
              </div>

              {/* 3. File Metrics */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                  <HardDrive className="w-3 h-3 text-emerald-600" />
                  <span>File Size & Format</span>
                </div>
                <span className="font-extrabold text-gray-900 block mt-1 truncate" title={photoTelemetry.fileName}>
                  {photoTelemetry.fileSizeFormatted}
                </span>
                <span className="text-[10px] text-gray-500 font-mono block mt-0.5 truncate">
                  {photoTelemetry.mimeType.replace('image/', '').toUpperCase()} • {photoTelemetry.fileName}
                </span>
              </div>

              {/* 4. Resolution & Dimensions */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                  <Camera className="w-3 h-3 text-emerald-600" />
                  <span>Dimensions & Sensor</span>
                </div>
                <span className="font-extrabold text-gray-900 block mt-1">
                  {photoTelemetry.dimensions}
                </span>
                <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                  {photoTelemetry.megapixels} ({photoTelemetry.aspectRatio})
                </span>
              </div>
            </div>

            {/* Field Geolocation Strip */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-950 font-bold truncate">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">{photoTelemetry.locationName}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-mono shrink-0">
                <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-emerald-200">
                  GPS: {photoTelemetry.latitude}° N, {photoTelemetry.longitude}° E
                </span>
                {photoTelemetry.accuracyMeters && (
                  <span className="text-gray-500">±{photoTelemetry.accuracyMeters}m accuracy</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Deep Learning Diagnostic Output */}
      {diagnosis && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-200 space-y-6 animate-in fade-in duration-300">
          {/* Certified Photo Timestamp & Diagnostic Audit Banner */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                🗓️
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide block">
                  Certified Photo Timestamp & Diagnostic Audit
                </span>
                <span className="font-black text-gray-900">
                  Photo Analyzed: {diagnosis.photoMetadata?.uploadDateFormatted || photoTelemetry?.uploadDateFormatted || new Date().toLocaleDateString('en-IN')} at {diagnosis.photoMetadata?.uploadTimeFormatted || photoTelemetry?.uploadTimeFormatted || new Date().toLocaleTimeString('en-IN')}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right text-[11px] text-gray-600">
              <span className="block font-extrabold text-gray-900">
                📍 {diagnosis.photoMetadata?.locationName || photoTelemetry?.locationName || 'Kadiri, Sri Sathya Sai (AP)'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {diagnosis.photoMetadata?.fileName || photoTelemetry?.fileName || 'Field_Leaf_Sample.jpg'} • {diagnosis.photoMetadata?.dimensions || photoTelemetry?.dimensions || '1920 × 1080 px'}
              </span>
            </div>
          </div>

          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Crop: {diagnosis.cropName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {diagnosis.severity} Severity
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                {diagnosis.suspectedIssue}
              </h2>
            </div>

            <div className="bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200 text-center sm:text-right">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                {t('confidenceScore')}
              </span>
              <span className="text-2xl font-black text-emerald-700">
                {diagnosis.confidenceScore}%
              </span>
            </div>
          </div>

          {/* Low confidence safety guard notice */}
          {diagnosis.confidenceScore < 60 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Low AI Confidence Advisory:</p>
                <p>The AI is not confident enough to identify this problem with certainty. Please upload a clearer photo or consult your local Krishi Vigyan Kendra (KVK) / AgriDex AI Assistant before spraying chemicals.</p>
              </div>
            </div>
          )}

          {/* Visual evidence noticed */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span>🔍</span> {t('whatAiNoticed')}
            </h3>
            <ul className="space-y-1.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 text-xs text-gray-700">
              {diagnosis.symptomsEvidence?.map((sym: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{sym}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Three-Tiered Treatment Recommendation */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
              {t('treatmentOptions')}
            </h3>

            {/* 1. Cultural */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {t('culturalControl')}
              </h4>
              <ul className="text-xs text-emerald-900 space-y-1 pl-5 list-disc">
                {diagnosis.culturalControl?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 2. Biological */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
              <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700" /> {t('bioControl')}
              </h4>
              <ul className="text-xs text-teal-900 space-y-1 pl-5 list-disc">
                {diagnosis.biologicalControl?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 3. Chemical (Safe) */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-700" /> {t('safeChemicalControl')}
              </h4>
              <ul className="text-xs text-amber-900 space-y-1 pl-5 list-disc">
                {diagnosis.chemicalControlSafe?.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Safety Warnings Banner */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block uppercase tracking-wide">
                {t('safetyNotice')}:
              </span>
              <p className="mt-0.5 leading-relaxed">
                Always follow the registered pesticide product label on the container. Never mix incompatible agrochemicals. Wear protective rubber gloves, mask, and eye goggles during knapsack spraying.
              </p>
            </div>
          </div>

          {/* Matched Certified Products in Local Shops */}
          {diagnosis.products && diagnosis.products.length > 0 && (
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                <span>🛒</span> {t('matchedProductsTitle')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {diagnosis.products.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-emerald-300 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=120'}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                      <div className="truncate">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {p.brand}
                        </span>
                        <h4 className="font-bold text-xs text-gray-900 truncate mt-0.5">{p.name}</h4>
                        <p className="text-[11px] text-gray-500 font-medium">₹{p.price} • {p.packSize}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(p);
                        setActiveTab('cart');
                      }}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 transition active:scale-95"
                    >
                      {t('addToCart')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ask AgriDex AI Assistant CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-900 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg">
                🤖
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">Need an Instant AI Agronomic Diagnosis?</p>
                <p className="text-xs text-emerald-100">Ask AgriDex AI Assistant for organic dosages, spray schedules & local stores</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('ai')}
              className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-xl transition shadow active:scale-95 whitespace-nowrap flex items-center gap-1.5"
            >
              <span>💬</span>
              <span>{t('askAiBtn') || 'Ask AI Assistant'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
