import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Stethoscope,
  Microscope,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  MessageSquare,
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Phone,
  Radio
} from 'lucide-react';

interface ExpertPortalProps {
  setActiveTab?: (tab: string) => void;
}

export const ExpertPortal: React.FC<ExpertPortalProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTabLocal] = useState<'QUEUE' | 'PRESCRIPTIONS' | 'BROADCAST'>('QUEUE');

  // Diagnostic Cases Queue
  const [cases, setCases] = useState([
    {
      id: 'case-301',
      farmerName: 'Nani',
      location: 'Kadiri Rural, Sri Sathya Sai (AP)',
      crop: 'Groundnut (Peanut) - Kadiri-6',
      growthStage: 'Flowering & Pegging',
      symptom: 'Circular brown necrotic spots with chlorotic yellow halo on lower leaves',
      aiSuggestedDiagnosis: 'Early Leaf Spot (Cercospora arachidicola)',
      aiConfidence: 94.2,
      severity: 'HIGH',
      submittedAt: 'Today, 7:15 AM',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500',
      status: 'PENDING_REVIEW'
    },
    {
      id: 'case-302',
      farmerName: 'V. Ramana Reddy',
      location: 'Nallamada Mandal, Sri Sathya Sai',
      crop: 'Tomato - Arka Rakshak',
      growthStage: 'Fruit Setting',
      symptom: 'Dark concentric target-board lesions on foliage and lower stem stems',
      aiSuggestedDiagnosis: 'Early Blight (Alternaria solani)',
      aiConfidence: 91.8,
      severity: 'MEDIUM',
      submittedAt: 'Yesterday, 4:40 PM',
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=500',
      status: 'PENDING_REVIEW'
    },
    {
      id: 'case-303',
      farmerName: 'Smt. Lakshmi Devi',
      location: 'Tanakal Mandal, Kadiri',
      crop: 'Jasmine (Mallipoo)',
      growthStage: 'Budding',
      symptom: 'Webbing on tender flower buds with minute reddish mites and leaf curling',
      aiSuggestedDiagnosis: 'Two-Spotted Spider Mite (Tetranychus urticae)',
      aiConfidence: 89.4,
      severity: 'HIGH',
      submittedAt: 'Yesterday, 2:10 PM',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500',
      status: 'RESOLVED'
    }
  ]);

  // Selected case for diagnosis modal
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [chemicalRecommendation, setChemicalRecommendation] = useState('');
  const [organicRecommendation, setOrganicRecommendation] = useState('');

  // Regional Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('High Humidity Warning: Groundnut Cercospora Alert');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Due to recent cloud cover and 84% morning humidity in Kadiri and Rayalaseema mandals, farmers are advised to conduct preventive spray of Mancozeb @ 2g/L or Trichoderma viride to prevent rapid leaf spot spread.'
  );

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openDiagnoseModal = (c: any) => {
    setSelectedCase(c);
    setTreatmentNotes('Verified leaf lesions match early fungal sporulation. Avoid overhead sprinkler irrigation.');
    setOrganicRecommendation('Apply Neem Oil (Azadirachtin 10,000 ppm) @ 3 ml/L or Pseudomonas fluorescens @ 5g/L.');
    setChemicalRecommendation('If >5% foliage infected: Spray Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g/L water.');
  };

  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setCases(prev =>
      prev.map(c => (c.id === selectedCase.id ? { ...c, status: 'RESOLVED' } : c))
    );

    showToast(`Prescription dispatched to farmer ${selectedCase.farmerName}!`);
    setSelectedCase(null);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Regional Agro-Advisory broadcasted to 2,400+ farmers in Sri Sathya Sai district!');
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold bg-emerald-800 text-white border border-emerald-600 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-300">
              <Microscope className="w-3.5 h-3.5" />
              <span>Plant Pathology & Agronomy Tele-Clinic</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              🔬 Agri Expert Consultation Station
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed">
              Examine farmer disease scans, verify AI neural diagnostic heatmaps, formulate certified prescriptions, and issue regional agronomic advisories.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-right">
              <span className="text-[11px] text-cyan-200 block font-semibold">Attending Scientist</span>
              <span className="text-sm font-black text-white">{user?.name || 'Dr. K. Swaminathan'}</span>
              <span className="text-[10px] text-indigo-300 block">ANGRAU Principal Plant Pathologist</span>
            </div>
          </div>
        </div>

        {/* Clinical KPI Cards */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-indigo-200 block font-medium">Pending Farmer Cases</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {cases.filter(c => c.status === 'PENDING_REVIEW').length} Urgent
            </div>
            <span className="text-[10px] text-amber-200">Awaiting clinical review</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-indigo-200 block font-medium">Verified Prescriptions</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">148 Issued</div>
            <span className="text-[10px] text-emerald-300">This planting season</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-indigo-200 block font-medium">AI Accuracy Match</span>
            <div className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5">96.4%</div>
            <span className="text-[10px] text-cyan-200">Neural network validation</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-indigo-200 block font-medium">Active Farmers Supported</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">2,410</div>
            <span className="text-[10px] text-indigo-200">Kadiri & Rayalaseema cluster</span>
          </div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold max-w-xl">
        <button
          onClick={() => setActiveTabLocal('QUEUE')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'QUEUE' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Patient Cases Queue ({cases.filter(c => c.status === 'PENDING_REVIEW').length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('BROADCAST')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'BROADCAST' ? 'bg-white text-indigo-950 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Regional Agro Advisory</span>
        </button>
      </div>

      {/* 1. CASES QUEUE */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-gray-100 mb-3">
                    <img src={item.image} alt={item.crop} className="w-full h-full object-cover" />
                    <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-black rounded-md ${
                      item.severity === 'HIGH' ? 'bg-red-700 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {item.severity} ALERT
                    </span>
                    <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] font-black rounded-md ${
                      item.status === 'RESOLVED' ? 'bg-emerald-700 text-white' : 'bg-yellow-400 text-yellow-950'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-bold text-gray-900">{item.farmerName}</span>
                    <span>{item.submittedAt}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 leading-snug">{item.crop}</h3>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-indigo-600" />
                    <span>{item.location}</span>
                  </p>

                  <div className="mt-3 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase block">AI Neural Diagnosis:</span>
                    <p className="font-extrabold text-indigo-950">{item.aiSuggestedDiagnosis}</p>
                    <div className="flex items-center justify-between text-[11px] text-indigo-700 pt-1">
                      <span>Neural Confidence:</span>
                      <span className="font-black">{item.aiConfidence}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-2.5 line-clamp-2">
                    <span className="font-semibold text-gray-700">Symptoms: </span>
                    {item.symptom}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveTab && setActiveTab('chat')}
                    className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                    title="Direct Message Farmer"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openDiagnoseModal(item)}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{item.status === 'RESOLVED' ? 'View Prescription' : 'Review & Prescribe'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. REGIONAL AGRO ADVISORY BROADCAST */}
      {activeTab === 'BROADCAST' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center text-xl">
              📢
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900">Broadcast Regional Agronomic Advisory</h3>
              <p className="text-xs text-gray-500">
                Pushes instant SMS and mobile notification to registered farmers in target districts.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Advisory Title / Headline *</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Groundnut Cercospora Spore Alert"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Target District & Crop</label>
              <div className="grid grid-cols-2 gap-3">
                <select className="p-2.5 rounded-xl border border-gray-300 font-semibold bg-white">
                  <option>All Districts in Andhra Pradesh</option>
                  <option>Sri Sathya Sai (Kadiri Cluster)</option>
                  <option>Anantapur</option>
                  <option>Kurnool</option>
                </select>
                <select className="p-2.5 rounded-xl border border-gray-300 font-semibold bg-white">
                  <option>All Crops & Standing Fields</option>
                  <option>Groundnut Cultivators</option>
                  <option>Tomato Farmers</option>
                  <option>Floriculture (Jasmine & Rose)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1">Advisory Content & Dosage Instructions *</label>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                rows={4}
                className="w-full p-3 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Official Advisory to Farmers</span>
            </button>
          </form>
        </div>
      )}

      {/* MODAL: DIAGNOSE & ISSUE PRESCRIPTION */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-lg text-gray-900">Official Agronomic Prescription</h3>
                <p className="text-xs text-gray-500">
                  Patient: {selectedCase.farmerName} • Crop: {selectedCase.crop}
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssuePrescription} className="space-y-3.5 text-xs">
              <div className="bg-indigo-50/70 p-3 rounded-xl space-y-1">
                <span className="font-black text-indigo-950 text-sm">{selectedCase.aiSuggestedDiagnosis}</span>
                <p className="text-[11px] text-gray-600">{selectedCase.symptom}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Agronomist Clinical Findings & Advice</label>
                <textarea
                  value={treatmentNotes}
                  onChange={e => setTreatmentNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-emerald-800 mb-1">
                  🌿 1. Recommended Biological / Organic Controls:
                </label>
                <input
                  type="text"
                  value={organicRecommendation}
                  onChange={e => setOrganicRecommendation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-800 mb-1">
                  🧪 2. Recommended Regulated Chemical Controls (If Severe):
                </label>
                <input
                  type="text"
                  value={chemicalRecommendation}
                  onChange={e => setChemicalRecommendation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Sign & Issue Prescription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
