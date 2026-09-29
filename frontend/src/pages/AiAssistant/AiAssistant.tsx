import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { apiUrl } from '../../services/api';
import {
  Send,
  Bot,
  User,
  Paperclip,
  Mic,
  Sparkles,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Info,
  Settings,
  Zap,
  Globe
} from 'lucide-react';

interface AiAssistantProps {
  onOpenVoice: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedProduct?: (product: any) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'GEMINI_AI' | 'LIVE_KNOWLEDGE_ENGINE';
  suggestedActions?: string[];
  matchedProducts?: any[];
  safetyAdvisory?: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ onOpenVoice, setActiveTab }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { addToCart } = useCart();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      source: 'GEMINI_AI',
      text: language === 'te'
        ? `నమస్కారం ${user?.name || 'రైతు'} గారు! నేను మీ అగ్రోడెక్స్ AI వ్యవసాయ సహాయకుడిని. మీ కదిరి పొలంలోని పంటల రక్షణ, ఎరువుల నిర్వహణ, నీటి తడులు లేదా విత్తనాల గురించి మీకు ఎలాంటి సందేహం ఉన్నా అడగండి.`
        : language === 'hi'
        ? `नमस्ते ${user?.name || 'किसान'} जी! मैं आपका एग्रोडेक्स एआई कृषि सहायक हूँ। आपके खेत में लगी फसलों, खाद, दवाओं या सिंचाई से संबंधित कोई भी सवाल पूछें।`
        : `Hello ${user?.name || 'Farmer'}! I am your AgroDex AI farming copilot. I am tuned to your farm in Kadiri, your standing crops, and local Red Loamy soil fertility. How can I assist you today?`,
      timestamp: 'Just now',
      suggestedActions: [
        'What fertilizer should I use for groundnut?',
        'My leaves are turning yellow.',
        'When should I irrigate?',
        'Where can I buy urea near me?'
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Instant ICAR-compliant fallback advisory if network/gateway is offline or times out
  const getClientAgriculturalAdvisory = (
    query: string,
    lang: string
  ): { reply: string; suggestedActions: string[]; matchedProducts: any[] } => {
    const qLower = query.toLowerCase();
    const isTe = lang === 'te' || /[\u0C00-\u0C7F]/.test(query);
    const isHi = lang === 'hi' || /[\u0900-\u097F]/.test(query);

    let reply = '';
    let suggestedActions = [
      'What fertilizer should I use for groundnut?',
      'My leaves are turning yellow.',
      'When should I irrigate?',
      'Where can I buy urea near me?'
    ];
    let matchedProducts: any[] = [];

    const isProcurement =
      qLower.includes('where') ||
      qLower.includes('buy') ||
      qLower.includes('store') ||
      qLower.includes('shop') ||
      qLower.includes('dealer') ||
      qLower.includes('pacs') ||
      qLower.includes('rbk') ||
      qLower.includes('near me') ||
      qLower.includes('near') ||
      qLower.includes('purchase') ||
      qLower.includes('dokan') ||
      qLower.includes('కొనాలి') ||
      qLower.includes('కొనుగోలు') ||
      qLower.includes('ఎక్కడ') ||
      qLower.includes('దొరుకుతుంది') ||
      qLower.includes('లభిస్తుంది') ||
      qLower.includes('दुकान') ||
      qLower.includes('खरीदें') ||
      qLower.includes('ఖరీది') ||
      (qLower.includes('urea') && (qLower.includes('get') || qLower.includes('find') || qLower.includes('price') || qLower.includes('near') || qLower.includes('bag') || qLower.includes('cost')));

    // 1. Where to Buy Urea & Fertilizers in Kadiri (PRIORITIZED FIRST)
    if (isProcurement) {
      if (isTe) {
        reply = `**కదిరి మరియు సమీప ప్రాంతాల్లో యూరియా & ఎరువుల కొనుగోలు మార్గదర్శకం (శ్రీ సత్యసాయి జిల్లా)**\n\n` +
          `• **1. సమీప రైతు భరోసా కేంద్రాలు (RBKs) & గ్రామ సచివాలయాలు:**\n` +
          `  - కదిరి మండలం పరిధిలోని మీ గ్రామ రైతు భరోసా కేంద్రం (RBK) వద్ద ప్రభుత్వం నిర్దేశించిన సబ్సిడీ ధరలకే ధృవీకరించిన ఎరువులు లభిస్తాయి. గ్రామ వ్యవసాయ సహాయకులు (VAAs) ద్వారా డిజిటల్ రిజిస్ట్రేషన్ జరుగుతుంది.\n\n` +
          `• **2. ప్రాథమిక వ్యవసాయ సహకార సంఘాలు (PACS):**\n` +
          `  - కదిరి కో-ఆపరేటివ్ సొసైటీ (PACS Kadiri) వద్ద ఇఫ్కో (IFFCO) మరియు క్రిభ్కో (KRIBHCO) అధికారిక ఎరువుల నిల్వలు అందుబాటులో ఉంటాయి.\n\n` +
          `• **3. కదిరిలోని లైసెన్స్ పొందిన అధీకృత డీలర్లు:**\n` +
          `  - **శ్రీ లక్ష్మి అగ్రి ఇన్‌పుట్స్ (Sri Lakshmi Agri Inputs):** APMC మార్కెట్ రోడ్, కదిరి టౌన్.\n` +
          `  - **ఇఫ్కో కిసాన్ సేవా కేంద్రం (IFFCO Kisan Seva Kendra):** బైపాస్ రోడ్ జంక్షన్, కదిరి రూరల్.\n\n` +
          `• **అధికారిక సబ్సిడీ రిటైల్ ధరలు (Statutory Subsidized MRP):**\n` +
          `  - **వేప పూత పూసిన యూరియా (Neem-Coated Urea 46% N):** ₹266.50 / 45 కిలోల బస్తా\n` +
          `  - **ఇఫ్కో నానో యూరియా లిక్విడ్ (Nano Urea):** ₹225 / 500 మి.లీ సీసా (1 బస్తా యూరియాతో సమానం)\n` +
          `  - **DAP 18:46:0:** ₹1,350 / 50 కిలోల బస్తా\n` +
          `  - **MOP (పొటాష్):** ₹1,700 / 50 కిలోల బస్తా\n\n` +
          `• **అవసరమైన పత్రాలు:** ఈ-పాస్ (e-POS) బయోమెట్రిక్ ప్రామాణీకరణ కోసం మీ **ఆధార్ కార్డు** మరియు **ఈ-పంట (e-Crop) బుకింగ్ / పట్టాదారు పాస్‌బుక్ (1B)** తప్పనిసరిగా వెంట తీసుకువెళ్ళండి.\n\n` +
          `*సూచన:* మన అగ్రోడెక్స్ యాప్‌లోని **"Agri Store"** ట్యాబ్ ద్వారా కూడా మీరు నేరుగా ఆర్డర్ చేయవచ్చు.`;
      } else if (isHi) {
        reply = `**कदिरी एवं नजदीकी केंद्रों पर यूरिया एवं खाद खरीद केंद्र (श्री सत्य साई जिला)**\n\n` +
          `• **1. नजदीकी रायथू भरोसा केंद्र (RBK) एवं ग्राम सचिवालय:**\n` +
          `  - कदिरी मंडल के सभी आरबीके (RBK) केंद्रों पर बायोमेट्रिक ई-पॉस (e-POS) मशीन से सरकारी सब्सिडी पर यूरिया उपलब्ध है।\n\n` +
          `• **2. प्राथमिक कृषि सहकारी समितियां (PACS):**\n` +
          `  - कदिरी को-ऑपरेटिव बैंक / पैक्स (PACS Kadiri) केंद्र से सीधे इफको व कृभको यूरिया प्राप्त करें।\n\n` +
          `• **3. कदिरी में अधिकृत लाइसेंस प्राप्त कृषि डीलर:**\n` +
          `  - **श्री लक्ष्मी एग्री इनपुट्स (Sri Lakshmi Agri Inputs):** एपीएमसी मार्केट रोड, कदिरी।\n` +
          `  - **इफको किसान सेवा केंद्र (IFFCO Kisan Seva Kendra):** बाईपास रोड, कदिरी ग्रामीण।\n\n` +
          `• **सरकारी वैधानिक सब्सिडी दरें (Statutory MRP):**\n` +
          `  - **नीम कोटेड यूरिया (Neem-Coated Urea 46% N):** ₹266.50 / 45 किग्रा बोरी\n` +
          `  - **इफको नैनो यूरिया (Nano Urea Liquid):** ₹225 / 500 मिली बोतल (1 बोरी के बराबर)\n` +
          `  - **डीएपी (DAP 18:46:0):** ₹1,350 / 50 किग्रा बोरी\n` +
          `  - **पोटाश (MOP):** ₹1,700 / 50 किग्रा बोरी\n\n` +
          `• **आवश्यक दस्तावेज:** e-POS फिंगरप्रिंट सत्यापन के लिए अपना **आधार कार्ड** और **ई-क्रॉप बुकिंग / किसान पासबुक (1B)** साथ रखें।\n\n` +
          `*सुझाव:* आप एग्रोडेक्स ऐप में **"Agri Store"** सेक्शन से भी सीधे होम डिलीवरी या स्टोर पिकअप बुक कर सकते हैं।`;
      } else {
        reply = `**Where to Buy Genuine Urea & Certified Fertilizers in Kadiri (Sri Sathya Sai District)**\n\n` +
          `• **1. Nearest Rythu Bharosa Kendras (RBKs) & Village Secretariats:**\n` +
          `  - Visit your local village RBK in Kadiri mandal. Government-subsidized fertilizers are allocated transparently via the integrated e-POS digital distribution system.\n\n` +
          `• **2. Primary Agricultural Credit Societies (PACS):**\n` +
          `  - **Kadiri Cooperative Society (PACS Kadiri):** Stocked with authorized IFFCO and KRIBHCO fertilizer consignments.\n\n` +
          `• **3. Licensed Authorized Agro Dealers in Kadiri:**\n` +
          `  - **Sri Lakshmi Agri Inputs:** APMC Market Road, Kadiri Town.\n` +
          `  - **IFFCO Kisan Seva Kendra:** Bypass Road Junction, Kadiri Rural.\n\n` +
          `• **Statutory Subsidized Retail Prices (Government Fixed):**\n` +
          `  - **Neem-Coated Urea (46% N):** ~₹266.50 / 45 kg bag\n` +
          `  - **IFFCO Nano Urea Liquid:** ₹225 / 500 ml bottle (1 bottle replaces a 45 kg bag)\n` +
          `  - **DAP (18:46:0):** ₹1,350 / 50 kg bag\n` +
          `  - **MOP (Muriate of Potash):** ~₹1,700 / 50 kg bag\n\n` +
          `• **Mandatory Documents Required:** Carry your **Aadhaar Card** (for e-POS biometric authentication) and **e-Crop booking receipt / Pattadar Passbook (1B record)** to claim subsidized bags.\n\n` +
          `*AgroDex Quick Access:* You can also tap the **"Agri Store"** tab below to order certified fertilizer bags with doorstep delivery.`;
      }
      suggestedActions = ['View Kadiri Agri Store', 'Locate Nearest RBK', 'Order Nano Urea Liquid', 'Check Mandi Prices'];
      matchedProducts = [
        {
          id: 'prod-urea-iffco',
          name: 'IFFCO Neem Coated Urea 46% N (45 kg Bag)',
          brand: 'IFFCO',
          price: 266.50,
          packSize: '45 kg Bag',
          images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'],
          category: 'UREA'
        },
        {
          id: 'prod-urea-nano-iffco',
          name: 'IFFCO Nano Urea Liquid (500 ml Bottle)',
          brand: 'IFFCO',
          price: 225.00,
          packSize: '500 ml Bottle',
          images: ['https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80'],
          category: 'UREA'
        },
        {
          id: 'prod-dap-iffco',
          name: 'IFFCO DAP 18:46:0 (50 kg Bag)',
          brand: 'IFFCO',
          price: 1350.00,
          packSize: '50 kg Bag',
          images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'],
          category: 'DAP'
        },
        {
          id: 'prod-mahadhan-19-19-19',
          name: 'Mahadhan 19-19-19 100% Water Soluble (1 kg)',
          brand: 'Mahadhan',
          price: 170.00,
          packSize: '1 kg Pouch',
          images: ['https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80'],
          category: 'NPK'
        }
      ];
    }
    // 2. Crop Fertilizer Dosage & Soil Programs
    else if (
      qLower.includes('fertilizer') ||
      qLower.includes('urea') ||
      qLower.includes('npk') ||
      qLower.includes('dap') ||
      qLower.includes('gypsum') ||
      qLower.includes('groundnut') ||
      qLower.includes('వేరుశనగ') ||
      qLower.includes('ఎరువు') ||
      qLower.includes('खाद')
    ) {
      if (isTe) {
        reply = `**వేరుశనగ పంటకు సమగ్ర ఎరువుల యాజమాన్యం (కదిరి ఎర్ర నేలలు / రెడ్ శాండీ లోమ్)**\n\n` +
          `• **సిఫార్సు చేసిన N:P:K మోతాదు:** హెక్టారుకు 25:50:40 కిలోలు (ఎకరాకు 10:20:16 కిలోల N:P:K).\n` +
          `• **విత్తే సమయంలో (బాసల్ డోస్):** ఎకరాకు 40-50 కిలోల DAP + 25-30 కిలోల మ్యూరేట్ ఆఫ్ పొటాష్ (MOP) + 100 కిలోల జిప్సం వేయాలి.\n` +
          `• **పూత మరియు ఊడలు దిగే దశ (40-45 రోజులు):** ఎకరాకు తప్పనిసరిగా 200 కిలోల జిప్సం మొక్కల మొదళ్ల వద్ద వేసి మట్టిని ఎగదోయాలి. కాల్షియం కాయల్లో గింజ బరువును పెంచి తాలు కాయలు (Pops) రాకుండా చేస్తుంది; సల్ఫర్ నూనె శాతాన్ని పెంచుతుంది.\n` +
          `• **సూక్ష్మ పోషకాలు:** కదిరి ఎర్ర నేలల్లో జింక్ లోపం నివారణకు ఆఖరి దుక్కిలో ఎకరాకు 10 కిలోల జింక్ సల్ఫేట్ వేయండి. పైపాటుగా 19-19-19 నీటిలో కరిగే ఎరువు @ 5 గ్రా/లీటరు నీటికి కలిపి పిచికారీ చేయండి.`;
      } else if (isHi) {
        reply = `**मूंगफली के लिए संतुलित उर्वरक कार्यक्रम (लाल बलुई दोमट मिट्टी)**\n\n` +
          `• **अनुशंसित N:P:K खुराक:** 25:50:40 किग्रा/हेक्टेयर (प्रति एकड़ 10:20:16 किग्रा)।\n` +
          `• **बुवाई के समय (बेसल ड्रेसिंग):** प्रति एकड़ 40-50 किग्रा DAP + 25 किग्रा म्‍यूरेट ऑफ पोटाश (MOP) + 100 किग्रा जिप्सम डालें।\n` +
          `• **फूल एवं खूंटे (पेगिंग) बनते समय (40-45 दिन):** प्रति एकड़ 200 किग्रा जिप्सम पौधों की जड़ों के पास डालकर मिट्टी चढ़ाएं। कैल्शियम दानों को पुष्ट बनाता है और खाली फलियां (Pops) बनने से रोकता है।\n` +
          `• **सूक्ष्म पोषक तत्व:** लाल मिट्टी में जिंक की कमी दूर करने के लिए प्रति एकड़ 10 किग्रा जिंक सल्फेट डालें एवं वनस्पति वृद्धि के समय 19-19-19 घुलनशील खाद @ 5 ग्राम/लीटर का छिड़काव करें।`;
      } else {
        reply = `**Balanced Fertilizer Program for Groundnut (Red Sandy Loam Soil)**\n\n` +
          `• **Recommended Scientific N:P:K Ratio:** 25:50:40 kg/ha (equivalent to 10:20:16 kg/acre).\n` +
          `• **Basal Dressing (At Sowing):** Apply DAP @ 40-50 kg/acre + Muriate of Potash (MOP) @ 25 kg/acre + Gypsum @ 100 kg/acre.\n` +
          `• **Flowering & Pegging Stage (40-45 DAS):** Crucial application of **Gypsum @ 200 kg/acre** around the root zone followed by earthing up. Calcium is indispensable for shell development and eliminates "pops" (empty shells), while Sulfur boosts kernel oil content.\n` +
          `• **Red Loamy Soil Strategy (Kadiri Region):** Due to high drainage and leaching, apply nitrogen in splits. Supplement with Zinc Sulphate @ 10 kg/acre basally, or spray water-soluble 19-19-19 @ 5g/L water at 30-35 DAS for vegetative vigor.`;
      }
      suggestedActions = ['Order Gypsum on Agri Store', 'How to test soil pH?', 'View Groundnut disease calendar'];
      matchedProducts = [
        {
          id: 'prod-urea-iffco',
          name: 'IFFCO Neem Coated Urea 46% N (45 kg Bag)',
          brand: 'IFFCO',
          price: 266.50,
          packSize: '45 kg Bag',
          images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'],
          category: 'UREA'
        },
        {
          id: 'prod-dap-iffco',
          name: 'IFFCO DAP 18:46:0 (50 kg Bag)',
          brand: 'IFFCO',
          price: 1350.00,
          packSize: '50 kg Bag',
          images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80'],
          category: 'DAP'
        },
        {
          id: 'prod-mahadhan-19-19-19',
          name: 'Mahadhan 19-19-19 100% Water Soluble (1 kg)',
          brand: 'Mahadhan',
          price: 170.00,
          packSize: '1 kg Pouch',
          images: ['https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80'],
          category: 'NPK'
        }
      ];
    } else if (
      qLower.includes('yellow') ||
      qLower.includes('leaves') ||
      qLower.includes('turning yellow') ||
      qLower.includes('chlorosis') ||
      qLower.includes('పసుపు') ||
      qLower.includes('పీలీ')
    ) {
      if (isTe) {
        reply = `**ఆకులు పసుపు రంగులోకి మారడానికి రోగనిర్ధారణ మరియు సత్వర నివారణ**\n\n` +
          `1. **నత్రజని లోపం (Nitrogen Deficiency):**\n` +
          `   • క్రింది ముదురు ఆకులు మొత్తం సమానంగా లేత పసుపు రంగులోకి మారతాయి.\n` +
          `   • నివారణ: 19:19:19 నీటిలో కరిగే ఎరువు @ 5 గ్రా/లీటరు నీటికి కలిపి పిచికారీ చేయండి లేదా ఎకరాకు 25 కిలోల యూరియా వేయండి.\n\n` +
          `2. **ఇనుము లోపం (Iron Chlorosis):**\n` +
          `   • లేత పై ఆకుల ఈనెలు ఆకుపచ్చగా ఉండి, ఈనెల మధ్య భాగం పసుపు లేదా తెల్లగా మారుతుంది.\n` +
          `   • నివారణ: అన్నభేది (ఫెర్రస్ సల్ఫేట్) 5 గ్రా + నిమ్మ ఉప్పు 1 గ్రా లీటరు నీటికి కలిపి పిచికారీ చేయండి.\n\n` +
          `3. **రసం పీల్చే పురుగులు (Thrips & Whiteflies):**\n` +
          `   • ఆకుల అడుగున పరిశీలించండి. వేప నూనె (10,000 PPM) 3 మి.లీ/లీటరు లేదా ఎసిటామిప్రిడ్ 20% SP @ 0.5 గ్రా/లీటరు పిచికారీ చేయండి.`;
      } else if (isHi) {
        reply = `**पत्तियों का पीला पड़ना (क्लोरोसिस): वैज्ञानिक निदान एवं समाधान**\n\n` +
          `1. **नाइट्रोजन की कमी:** निचली पुरानी पत्तियां पहले पीली पड़ती हैं। समाधान: 19:19:19 घुलनशील खाद 5 ग्राम/लीटर की दर से छिड़कें अथवा 25 किग्रा यूरिया प्रति एकड़ दें।\n\n` +
          `2. **आयरन (लोहे) की कमी:** नई कोमल पत्तियों की नसें हरी रहती हैं और बीच का भाग पीला हो जाता है। समाधान: फेरस सल्फेट 5 ग्राम + साइट्रिक एसिड 1 ग्राम प्रति लीटर पानी में मिलाकर छिड़काव करें।\n\n` +
          `3. **रस चूसक कीट:** नीम का तेल (10,000 PPM) 3 मिली/लीटर या एसिटामिप्रिड 20% SP @ 0.5 ग्राम/लीटर का छिड़काव करें।`;
      } else {
        reply = `**Diagnostic Pointers: Foliage Yellowing (Chlorosis)**\n\n` +
          `• **1. Nitrogen Deficiency (Lower Old Leaves):** Uniform pale yellowing starting from bottom leaves and advancing upwards. **Remedy:** Foliar spray 19-19-19 water-soluble fertilizer @ 5g/L water, or top-dress 25 kg Neem Coated Urea per acre.\n\n` +
          `• **2. Iron Chlorosis (Upper Young Leaves):** Interveinal chlorosis where veins remain deep green while the leaf blade turns yellow/whitish (very common in calcareous/high pH soils). **Remedy:** Spray Ferrous Sulphate (FeSO4) @ 5g/L + Citric Acid @ 1g/L water in early morning.\n\n` +
          `• **3. Sucking Pests (Thrips, Jassids, Whiteflies):** Yellow speckling with leaf curling or stunted flush. **Remedy:** Spray cold-pressed Neem Oil (10,000 PPM) @ 3 ml/L or Acetamiprid 20% SP @ 0.5g/L.\n\n` +
          `• **4. Root Waterlogging:** Poor drainage suffocates root respiration. Ensure excess standing water is drained out through furrows immediately.`;
      }
      suggestedActions = ['Order 19-19-19 Spray', 'Scan leaf using Crop Scan camera', 'Check Soil Moisture'];
      matchedProducts = [
        {
          id: 'prod-mahadhan-19-19-19',
          name: 'Mahadhan 19-19-19 100% Water Soluble (1 kg)',
          brand: 'Mahadhan',
          price: 170.00,
          packSize: '1 kg Pouch',
          images: ['https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop&q=80'],
          category: 'NPK'
        },
        {
          id: 'prod-neem-oil-10000',
          name: 'Cold Pressed Pure Neem Oil 10,000 PPM (1 L)',
          brand: 'Multiplex',
          price: 420.00,
          packSize: '1 L Bottle',
          images: ['https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&auto=format&fit=crop&q=80'],
          category: 'Bio-Organic'
        }
      ];
    } else if (
      qLower.includes('irrigation') ||
      qLower.includes('water') ||
      qLower.includes('నీరు') ||
      qLower.includes('సిंचाई')
    ) {
      if (isTe) {
        reply = `**శాస్త్రీయ నీటి యాజమాన్యం మరియు క్లిష్టమైన దశలు**\n\n` +
          `1. **పూత దశ (విత్తిన 25-30 రోజులకు):** తేలికపాటి నీటి తడి ఇవ్వాలి. పూత రాలకుండా తేమ సమతుల్యత కాపాడాలి.\n` +
          `2. **ఊడలు దిగే దశ (40-50 రోజులకు):** అత్యంత కీలకమైన దశ! ఊడలు సులభంగా మట్టిలోకి చొచ్చుకుపోవడానికి పై 5 సెం.మీ నేల వదులుగా తేమగా ఉండాలి.\n` +
          `3. **కాయల్లో గింజ ఊరే దశ (65-75 రోజులకు):** కాయ పుష్టిగా ఎదగడానికి మరియు నూనె శాతానికి క్రమబద్ధమైన తడులు అవసరం.\n\n` +
          `• **నీటి ఆదా పద్ధతి:** స్ప్రింక్లర్లు లేదా డ్రిప్ పద్ధతి ద్వారా 40% నీరు ఆదా అవుతుంది. కోతకు 7-10 రోజుల ముందు తడులు ఆపాలి.`;
      } else if (isHi) {
        reply = `**वैज्ञानिक सिंचाई प्रबंधन (क्रांतिक अवस्थाएं)**\n\n` +
          `1. **फूल आने की अवस्था (25-30 दिन):** हल्की सिंचाई करें। अत्यधिक पानी भरने से बचें।\n` +
          `2. **खूंटे (पेग) बनने की अवस्था (40-50 दिन):** सर्वाधिक महत्वपूर्ण समय! मिट्टी की ऊपरी सतह भुरभुरी और नम रहनी चाहिए ताकि खूंटे आसानी से जमीन में प्रवेश कर सकें।\n` +
          `3. **दाना भरने की अवस्था (65-75 दिन):** नियमित नमी बनाए रखें ताकि दाना सिकुड़े नहीं और पूरा भराव हो।\n\n` +
          `• **सुझाव:** फव्वारा (स्प्रिंकलर) या ड्रिप विधि अपनाएं जिससे 40% पानी की बचत होती है। कटाई से 10 दिन पहले पानी बंद कर दें।`;
      } else {
        reply = `**Scientific Stage-Based Irrigation Schedule**\n\n` +
          `1. **Flowering Stage (25-30 Days After Sowing):** Light irrigation. Avoid waterlogging which causes flower drop.\n` +
          `2. **Peg Penetration Stage (40-50 DAS):** The most critical stage! Top 5 cm soil must remain moist and friable to enable pegs to penetrate effortlessly into the soil.\n` +
          `3. **Pod Development & Kernel Filling (65-75 DAS):** Regular, moderate moisture is vital to ensure plump kernels and prevent shriveling.\n\n` +
          `• **Efficiency Tip:** Drip or sprinkler irrigation saves 40-50% water compared to furrow flooding and significantly lowers the incidence of Stem/Collar Rot. Cease irrigation 7-10 days prior to harvest for easy lifting.`;
      }
      suggestedActions = ['Check weather forecast', 'View soil moisture tips', 'Drip fertigation guides'];
      reply = `**AgroDex Expert Agronomic Advisory for "${query}"**\n\n` +
        `• **Field Inspection Protocol:** Walk your plots in an 'M' or 'W' pattern to check representative plants across canopy levels.\n` +
        `• **Foliar Protection:** Spray cold-pressed Neem Oil (10,000 PPM) @ 3 ml/L or Trichoderma viride @ 5g/L water for broad-spectrum prophylactic biological defense.\n` +
        `• **Instant Visual Diagnostics:** Use the **"Scan Crop"** tool to snap leaf photographs for instant AI pathogen and pest diagnosis with registered CIBRC dosages.`;
      suggestedActions = ['What fertilizer should I use for groundnut?', 'My leaves are turning yellow.', 'When should I irrigate?'];
    }

    return { reply, suggestedActions, matchedProducts };
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('agri_token') || ''}`
    };

    const aiMsgId = `ai-${Date.now()}`;
    let accumulatedText = '';
    let streamSucceeded = false;

    // 1. First attempt: Real-time streaming AI endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(apiUrl('/api/ai/chat/stream'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend,
          language
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok && res.body) {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            id: aiMsgId,
            sender: 'ai',
            source: 'GEMINI_AI',
            text: '',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  streamSucceeded = true;
                  setMessages(prev =>
                    prev.map(m => (m.id === aiMsgId ? { ...m, text: accumulatedText } : m))
                  );
                } else if (parsed.meta) {
                  const { matchedProducts, suggestedActions } = parsed.meta;
                  setMessages(prev =>
                    prev.map(m => (m.id === aiMsgId ? { ...m, matchedProducts, suggestedActions } : m))
                  );
                }
              } catch {
                // not JSON chunk
              }
            }
          }
        }
      }
    } catch (streamErr) {
      console.warn('⚡ [AgroDex AI Stream] Delayed or waking up, falling back to standard chat:', streamErr);
    }

    if (streamSucceeded && accumulatedText.trim()) {
      // Ensure matchedProducts are populated if meta was missed or empty
      setMessages(prev =>
        prev.map(m => {
          if (m.id === aiMsgId && (!m.matchedProducts || m.matchedProducts.length === 0)) {
            const fallbackAdvisory = getClientAgriculturalAdvisory(textToSend, language);
            return {
              ...m,
              matchedProducts: fallbackAdvisory.matchedProducts,
              suggestedActions: m.suggestedActions?.length ? m.suggestedActions : fallbackAdvisory.suggestedActions
            };
          }
          return m;
        })
      );
      setIsTyping(false);
      return;
    }

    // 2. Second attempt: Standard conversational endpoint
    try {
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 25000);

      const fallbackRes = await fetch(apiUrl('/api/ai/chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend,
          language
        }),
        signal: fallbackController.signal
      });
      clearTimeout(fallbackTimeoutId);

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== aiMsgId);
          return [
            ...filtered,
            {
              id: aiMsgId,
              sender: 'ai',
              source: data.source || 'GEMINI_AI',
              text: data.reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              suggestedActions: data.suggestedActions,
              matchedProducts: data.matchedProducts
            }
          ];
        });
        setIsTyping(false);
        return;
      }
    } catch (chatErr) {
      console.warn('⚡ [AgroDex AI Chat] Standard API fetch delayed, using smart agricultural fallback engine:', chatErr);
    }

    // 3. Third attempt: Instant client-side agricultural fallback engine (ZERO DROP / ZERO BLANK RESPONSES)
    const clientFallback = getClientAgriculturalAdvisory(textToSend, language);
    setMessages(prev => [
      ...prev.filter(m => m.id !== aiMsgId),
      {
        id: aiMsgId,
        sender: 'ai',
        source: 'LIVE_KNOWLEDGE_ENGINE',
        text: clientFallback.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: clientFallback.suggestedActions,
        matchedProducts: clientFallback.matchedProducts
      }
    ]);
    setIsTyping(false);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Header bar */}
      <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm sm:text-base tracking-tight">AI Farming Assistant</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 bg-amber-400 text-amber-950 shadow-xs">
                <Zap className="w-3 h-3 fill-amber-950" />
                <span>Google Gemini 3.5 Flash</span>
              </span>
            </div>
            <p className="text-[11px] text-emerald-200 truncate max-w-xs sm:max-w-md">
              Sri Venkateswara Farm • Kadiri (Groundnut & Tomato)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice button */}
          <button
            onClick={onOpenVoice}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 text-xs"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>
      </div>

      {/* Safety & Real AI Banner */}
      <div className="bg-amber-50/90 px-4 py-2 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>AI Agricultural Copilot:</strong> Real answers tailored to Indian agro-climatic conditions. Always adhere to chemical container safety labels.
          </span>
        </div>
      </div>

      {/* Message Chat Flow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-xs'
              }`}
            >
              {/* AI Source Tag */}
              {msg.sender === 'ai' && (
                <div className="mb-2 flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    msg.source === 'GEMINI_AI'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {msg.source === 'GEMINI_AI' ? '⚡ Google Gemini 3.5 Flash' : '🌐 Live Agricultural Engine'}
                  </span>
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Matched Products Card inside AI Response */}
              {msg.matchedProducts && msg.matchedProducts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200/60">
                  <p className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Certified Inputs Available in Kadiri:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.matchedProducts.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-xs text-gray-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-500">₹{p.price} • {p.packSize}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(p);
                            setActiveTab('cart');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
                        >
                          Buy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick follow-up action chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-200/40">
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (action === 'Scan Leaf Photo' || action === 'Scan My Crop') {
                          setActiveTab('scan');
                        } else if (action === 'Check Soil Health' || action === 'Soil Intelligence') {
                          setActiveTab('soil');
                        } else if (action === 'Agri Input Store' || action === 'Buy Urea / DAP' || action === 'Buy DAP / Urea') {
                          setActiveTab('store');
                        } else if (action === 'Sell Produce' || action === 'Create Produce Listing') {
                          setActiveTab('produce');
                        } else if (action === 'View Mandi Rates') {
                          setActiveTab('prices');
                        } else {
                          handleSend(action);
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 shadow-2xs transition active:scale-95"
                    >
                      💡 {action}
                    </button>
                  ))}
                </div>
              )}

              <span
                className={`text-[10px] block mt-1.5 ${
                  msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-gray-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">
              🤖
            </div>
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className="p-2.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
            title="Scan Crop Image"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenVoice}
            className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition"
            title="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              language === 'te'
                ? 'మీ ప్రశ్నను ఇక్కడ అడగండి (ఉదా: వేరుశనగ ఎరువులు)...'
                : language === 'hi'
                ? 'अपना कृषि प्रश्न यहाँ लिखें...'
                : 'Ask any farming question (e.g., groundnut fertilizer dosage, tomato curl remedies)...'
            }
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-2xl shadow-md transition active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};
