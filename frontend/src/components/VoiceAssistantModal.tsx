import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuery: (query: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose, onSubmitQuery }) => {
  const { language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const samplePrompts = {
    te: [
      'వేరుశనగ పంటకు ఏ ఎరువు వేయాలి?',
      'నా టమాటా ఆకులు పసుపు రంగులోకి మారుతున్నాయి',
      'నీటి తడి ఎప్పుడు ఇవ్వాలి?',
      'కదిరి లో యూరియా ఎక్కడ దొరుకుతుంది?'
    ],
    hi: [
      'मूंगफली के लिए कौन सी खाद उपयुक्त है?',
      'मेरी टमाटर की पत्तियां पीली पड़ रही हैं',
      'सिंचाई कब करनी चाहिए?',
      'पास में यूरिया कहां मिलेगा?'
    ],
    en: [
      'What fertilizer should I use for groundnut?',
      'My leaves are turning yellow. What should I do?',
      'When should I irrigate my field?',
      'Where can I buy certified urea near me?'
    ]
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecognitionSupported(false);
    }
  }, []);

  // Universal Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      // Select speech language
      if (language === 'te') recognition.lang = 'te-IN';
      else if (language === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = (textToSend?: string) => {
    const finalQuery = textToSend || transcript;
    if (finalQuery.trim()) {
      onSubmitQuery(finalQuery);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentPrompts: string[] = (samplePrompts as Record<string, string[]>)[language] || samplePrompts.en;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative"
      >
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95 border border-gray-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-2 pb-4">
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-3 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {language === 'te' ? 'రైతు వాయిస్ అసిస్టెంట్' : language === 'hi' ? 'किसान वॉयस असिस्टेंट' : 'Voice Farming Assistant'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'te'
              ? 'మీ ప్రశ్నను తెలుగులో స్పష్టంగా మాట్లాడండి'
              : language === 'hi'
              ? 'अपनी मातृभाषा में बोलकर कृषि प्रश्न पूछें'
              : 'Speak your farming question naturally'}
          </p>
        </div>

        {/* Big Animated Mic Button */}
        <div className="flex flex-col items-center justify-center my-6">
          <button
            onClick={startListening}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-100 scale-110'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95'
            }`}
          >
            {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <Mic className="w-10 h-10" />}
          </button>
          <span className="text-xs font-semibold text-gray-500 mt-3">
            {isListening
              ? (language === 'te' ? 'వినబడుతోంది... మాట్లాడండి' : language === 'hi' ? 'सुन रहा हूँ... बोलिए' : 'Listening... speak now')
              : (language === 'te' ? 'మాట్లాడటానికి బటన్ నొక్కండి' : language === 'hi' ? 'बोलने के लिए माइक दबाएं' : 'Tap microphone to speak')}
          </span>
        </div>

        {/* Live Transcript Box */}
        {transcript && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-4">
            <p className="text-xs text-emerald-800 font-medium">"{transcript}"</p>
          </div>
        )}

        {/* Quick Sample Voice Prompts */}
        <div className="mt-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            {language === 'te' ? 'ప్రశ్నల ఉదాహరణలు' : language === 'hi' ? 'उदाहरण प्रश्न' : 'Or tap a common question'}
          </p>
          <div className="space-y-1.5">
            {currentPrompts.map((prompt: string, i: number) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="w-full text-left p-2.5 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-xl text-xs font-medium border border-gray-100 transition flex items-center justify-between group"
              >
                <span>🗣️ {prompt}</span>
                <span className="text-emerald-600 opacity-0 group-hover:opacity-100 font-bold transition">→</span>
              </button>
            ))}
          </div>
        </div>

        {transcript && (
          <button
            onClick={() => handleSend()}
            className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
          >
            {language === 'te' ? 'సమాధానం పొందండి' : language === 'hi' ? 'उत्तर प्राप्त करें' : 'Get AI Recommendation'}
          </button>
        )}

        {/* Footer Cancel / Dismiss Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel / ಮುಚ್ಚಿ
          </button>
        </div>
      </div>
    </div>
  );
};
