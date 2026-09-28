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
  Info,
  Zap,
  X
} from 'lucide-react';
import {
  extractPhotoTelemetry,
  createSampleTelemetry,
  PhotoTelemetryInfo
} from '../../utils/photoTelemetry';

const compressImageFile = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const MAX_DIM = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.jpg',
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.70
      );
    };
    img.onerror = () => resolve(file);
    img.src = objectUrl;
  });
};

interface DiseaseScanProps {
  setActiveTab: (tab: string) => void;
}

export const DiseaseScan: React.FC<DiseaseScanProps> = ({ setActiveTab }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [photoTelemetry, setPhotoTelemetry] = useState<PhotoTelemetryInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [confirmedCrop, setConfirmedCrop] = useState<string>('');

  const quickCrops = [
    { label: '🍅 Tomato', name: 'Tomato' },
    { label: '🌾 Paddy / Rice', name: 'Paddy' },
    { label: '🥜 Groundnut', name: 'Groundnut' },
    { label: '🌿 Cotton', name: 'Cotton' },
    { label: '🌶️ Chilli', name: 'Chilli' },
    { label: '🌽 Maize', name: 'Maize' },
    { label: '🌱 Pulses / Gram', name: 'Bengal Gram' },
    { label: '🥔 Potato', name: 'Potato' }
  ];

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
      const originalFile = e.target.files[0];
      const compressed = await compressImageFile(originalFile);
      setImageFile(compressed);
      setSelectedImage(URL.createObjectURL(compressed));
      setDiagnosis(null);
      setScanError(null);
      setConfirmedCrop('');

      // Extract real-time date, time, file metrics, and field geolocation
      const telemetry = await extractPhotoTelemetry(compressed, {
        latitude: user?.latitude || 14.1165,
        longitude: user?.longitude || 78.1634,
        locationName: `${user?.village ? user.village + ', ' : ''}${user?.district || 'Sri Sathya Sai'}, ${user?.state || 'Andhra Pradesh'}`
      });
      setPhotoTelemetry(telemetry);
    }
  };

  const handleSelectSample = (sample: typeof sampleLeaves[0]) => {
    setSelectedImage(sample.url);
    setImageFile(null);
    setDiagnosis(null);
    setScanError(null);
    setConfirmedCrop(sample.crop);

    // Provide real-time live telemetry for the sample scan
    const telemetry = createSampleTelemetry(sample.name, sample.crop);
    setPhotoTelemetry(telemetry);
  };

  const handleRunScan = async (overrideCropName?: string) => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setScanStep(1);
    setScanError(null);

    // Fast step simulation for visual feedback
    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 400);

    try {
      let fileToSend: File | Blob | null = imageFile;
      if (!fileToSend && selectedImage) {
        try {
          const resp = await fetch(selectedImage);
          const blob = await resp.blob();
          fileToSend = new File([blob], 'leaf_photo.jpg', { type: blob.type || 'image/jpeg' });
        } catch (fetchErr) {
          console.warn('Could not convert sample image to Blob:', fetchErr);
        }
      }

      if (!fileToSend && !selectedImage) {
        setScanError('Please select or capture a plant leaf photo first.');
        setIsAnalyzing(false);
        setScanStep(0);
        clearInterval(stepInterval);
        return;
      }

      const formData = new FormData();
      if (fileToSend) {
        formData.append('image', fileToSend);
        try {
          const { uploadToSupabaseStorage } = await import('../../services/supabaseClient');
          const directUpload = await uploadToSupabaseStorage('crop-scans', fileToSend);
          if (directUpload.success && directUpload.publicUrl) {
            formData.append('imageUrl', directUpload.publicUrl);
          }
        } catch {
          // backend will handle upload
        }
      }
      if (selectedImage && !formData.has('imageUrl')) {
        formData.append('imageUrl', selectedImage);
      }
      const targetCrop = overrideCropName || confirmedCrop;
      if (targetCrop) {
        formData.append('cropName', targetCrop);
      }
      if (user?.id) {
        formData.append('farmer_id', user.id);
      }
      if (photoTelemetry) {
        formData.append('photoMetadata', JSON.stringify(photoTelemetry));
      }

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('agri_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[DiseaseScan] Submitting leaf scan to POST /api/ai/crop-disease...', {
        hasImage: Boolean(fileToSend),
        cropName: targetCrop,
        farmerId: user?.id || 'usr-farmer-1'
      });

      const res = await fetch('/api/ai/crop-disease', {
        method: 'POST',
        headers,
        body: formData
      });

      clearInterval(stepInterval);

      if (res.ok) {
        const data = await res.json();
        console.log('[DiseaseScan] Diagnosis response received:', data);
        setDiagnosis(data);
        if (data.cropName && !data.cropName.includes('Unknown') && !data.cropName.includes('Non-')) {
          setConfirmedCrop(data.cropName);
        }
        setIsAnalyzing(false);
        setScanStep(0);
      } else {
        const err = await res.json().catch(() => ({}));
        const errMsg = err.error || `Scan diagnostic failed (HTTP ${res.status}: ${res.statusText})`;
        console.error('[DiseaseScan] Server error:', errMsg);
        throw new Error(errMsg);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setScanStep(0);
      console.error('[DiseaseScan] Network or execution failure:', err);
      setScanError(err.message || 'Image processing failed. Please ensure the leaf is clearly visible and retry.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-900 border-amber-300 shadow-2xs">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>Google Gemini 3.5 Flash Vision Multimodal</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {t('scanTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t('scanSubtitle')}
          </p>
        </div>

        {/* AI Auto Crop Detection Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <span>🌱</span>
            <span>AI Auto Crop Detection</span>
          </div>
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
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-2.5 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block text-rose-950">Scan Diagnostic Error</span>
                      <span className="text-rose-800 leading-relaxed block mt-0.5">{scanError}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setScanError(null)}
                    className="text-rose-400 hover:text-rose-700 p-0.5 rounded-md shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => handleRunScan()}
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
        diagnosis.isCropPlant === false ? (
          <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 text-red-950 space-y-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 text-red-700 flex items-center justify-center text-2xl shrink-0">
                ⚠️
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-200/80 text-red-900 mb-1">
                  Botanical Rejection Alert
                </div>
                <h3 className="text-lg sm:text-xl font-black text-red-950">
                  Non-Agricultural Subject Detected
                </h3>
                <p className="text-xs sm:text-sm text-red-900 mt-1 leading-relaxed font-medium">
                  {diagnosis.notPlantReason || "The uploaded photograph does not appear to be an agricultural plant or crop leaf. Deep vision detected non-plant subjects such as human skin, animals, vehicles, or household objects."}
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl p-4 border border-red-200 text-xs text-red-950 space-y-2">
              <p className="font-extrabold flex items-center gap-1.5 text-red-900 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                Why was this scan rejected?
              </p>
              <ul className="list-disc pl-5 space-y-1 text-red-800 text-[11px]">
                <li>AgroDex AI is strictly trained for agricultural pathology and plant disease identification.</li>
                <li>Applying agricultural fungicides, bactericides, or insecticides to human skin, pets, or household items is hazardous and illegal.</li>
                <li>Please take a close-up, sharp photo of the affected crop leaf, stem, or pod in your field.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImageFile(null);
                  setDiagnosis(null);
                  setScanError(null);
                  setConfirmedCrop('');
                }}
                className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Upload New Crop Leaf Photo</span>
              </button>
            </div>
          </div>
        ) : (
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

            {/* Interactive Crop Confirmation when Confidence < 75% or Ambiguous */}
            {(diagnosis.requiresFarmerConfirmation || diagnosis.confidenceScore < 75 || !diagnosis.cropIdentified) && (
              <div className="p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 space-y-3.5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-xl shrink-0">
                    🌾
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 mb-1">
                      Confirmation Required
                    </div>
                    <h4 className="font-black text-sm text-amber-950">
                      Confirm Crop to Finalize Targeted Medicines
                    </h4>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      {diagnosis.clarificationPrompt || "Confidence is below 75% or crop species is ambiguous from this angle. Please confirm which crop you are growing so we can verify exact dosage recommendations."}
                    </p>
                  </div>
                </div>

                {/* Quick Select Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide block">
                    Select Your Field Crop:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickCrops.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setConfirmedCrop(c.name)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 ${
                          confirmedCrop.toLowerCase() === c.name.toLowerCase()
                            ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                            : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input & Re-run button */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={confirmedCrop}
                    onChange={e => setConfirmedCrop(e.target.value)}
                    placeholder="Or type custom crop (e.g., Watermelon, Bhendi, Onion...)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs text-amber-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    disabled={!confirmedCrop.trim() || isAnalyzing}
                    onClick={() => handleRunScan(confirmedCrop.trim())}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Re-run Disease Analysis for this Crop</span>
                  </button>
                </div>
              </div>
            )}

          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Identified Crop: <strong className="text-emerald-700 font-extrabold">{diagnosis.cropName}</strong>
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
                <p>The AI is not confident enough to identify this problem with certainty. Please upload a clearer photo or consult your local Krishi Vigyan Kendra (KVK) / AgroDex AI Assistant before spraying chemicals.</p>
              </div>
            </div>
          )}

          {/* Pathogen Root Cause & Biological Etiology */}
          {diagnosis.expertNotes && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs">
              <h3 className="font-extrabold text-indigo-950 flex items-center gap-2 mb-1.5 text-xs uppercase tracking-wide">
                <span>🔬</span> Pathogen Etiology & Biological Root Cause
              </h3>
              <p className="text-indigo-900 leading-relaxed font-medium">
                {diagnosis.expertNotes}
              </p>
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

          {/* Ask AgroDex AI Assistant CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-900 text-white p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg">
                🤖
              </div>
              <div>
                <p className="text-xs font-bold text-amber-300">Need an Instant AI Agronomic Diagnosis?</p>
                <p className="text-xs text-emerald-100">Ask AgroDex AI Assistant for organic dosages, spray schedules & local stores</p>
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
      )
    )}
    </div>
  );
};
