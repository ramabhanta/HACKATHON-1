import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Language, translations, LanguageMeta, indianLanguages } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (keyOrText: string) => string;
  languages: LanguageMeta[];
  currentLangMeta: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Universal phrase mapping dictionary across all 11 Indian languages
// Covers common terminology, status badges, units, and agricultural phrases
const commonPhrases: Record<string, Record<Language, string>> = {
  // Navigation & Actions
  'My Farm': {
    en: 'My Farm', hi: 'मेरा खेत', te: 'నా పొలం', ta: 'எனது பண்ணை', kn: 'ನನ್ನ ಜಮೀನು',
    ml: 'എന്റെ കൃഷിയിടം', mr: 'माझे शेत', bn: 'আমার খামার', gu: 'મારું ખેતર', pa: 'ਮੇਰਾ ਖੇਤ', or: 'ମୋର କ୍ଷେତ'
  },
  'AI Assistant': {
    en: 'AI Assistant', hi: 'एआई सहायक', te: 'AI సహాయకుడు', ta: 'AI உதவியாளர்', kn: 'AI ಸಹಾಯಕ',
    ml: 'AI സഹായി', mr: 'एआय सहाय्यक', bn: 'এআই সহকারী', gu: 'એઆઈ સહાયક', pa: 'AI ਸਹਾਇਕ', or: 'AI ସହାୟକ'
  },
  'Scan Crop': {
    en: 'Scan Crop', hi: 'फसल स्कैन करें', te: 'పంట స్కాన్ చేయండి', ta: 'பயிர் ஸ்கேன்', kn: 'ಬೆಳೆ ಸ್ಕ್ಯಾನ್',
    ml: 'വിള സ്കാൻ ചെയ്യുക', mr: 'पीक स्कॅन करा', bn: 'ফসল স্ক্যান করুন', gu: 'પાક સ્કેન કરો', pa: 'ਫਸਲ ਸਕੈਨ ਕਰੋ', or: 'ଫସଲ ସ୍କାନ କରନ୍ତୁ'
  },
  'Agri Store': {
    en: 'Agri Store', hi: 'कृषि स्टोर', te: 'రైతు బజార్', ta: 'விவசாய அங்காடி', kn: 'ಕೃಷಿ ಮಳಿಗೆ',
    ml: 'കാർഷിക സ്റ്റോർ', mr: 'कृषी दुकान', bn: 'কৃষি বাজার', gu: 'કૃષિ સ્ટોર', pa: 'ਖੇਤੀ ਸਟੋਰ', or: 'କୃଷି ବଜାର'
  },
  'Sell Produce': {
    en: 'Sell Produce', hi: 'फसल बेचें', te: 'పంట అమ్మండి', ta: 'விளைபொருள் விற்பனை', kn: 'ಬೆಳೆ ಮಾರಾಟ',
    ml: 'വിളവുകൾ വിൽക്കുക', mr: 'शेतमाल विक्री', bn: 'ফসল বিক্রি', gu: 'પાક વેચાણ', pa: 'ਫਸਲ ਵੇਚੋ', or: 'ଫସଲ ବିକ୍ରୟ'
  },
  'Mandi Prices': {
    en: 'Mandi Prices', hi: 'मंडी भाव', te: 'మార్కెట్ ధరలు', ta: 'மண்டி விலைகள்', kn: 'ಮಾರುಕಟ್ಟೆ ದರಗಳು',
    ml: 'മാർക്കറ്റ് നിരക്കുകൾ', mr: 'बाजार भाव', bn: 'মান্ডি দর', gu: 'માર્કેટ ભાવ', pa: 'ਮੰਡੀ ਭਾਅ', or: 'ମଣ୍ଡି ଦର'
  },
  'Orders': {
    en: 'Orders', hi: 'ऑर्डर', te: 'ఆర్డర్లు', ta: 'ஆர்டர்கள்', kn: 'ಆದೇಶಗಳು',
    ml: 'ഓർഡറുകൾ', mr: 'ऑर्डर्स', bn: 'অর্ডার', gu: 'ઓર્ડર', pa: 'ਆਰਡਰ', or: 'ଅର୍ଡର'
  },
  'Nearby Shops': {
    en: 'Nearby Shops', hi: 'पास की दुकानें', te: 'సమీప దుకాణాలు', ta: 'அருகிலுள்ள கடைகள்', kn: 'ಹತ್ತಿರದ ಅಂಗಡಿಗಳು',
    ml: 'സമീപത്തെ കടകൾ', mr: 'जवळची दुकाने', bn: 'নিকটবর্তী দোকান', gu: 'નજીકની દુકાનો', pa: 'ਨੇੜਲੀਆਂ ਦੁਕਾਨਾਂ', or: 'ନିକଟସ୍ଥ ଦୋକାନ'
  },
  'Farm Manager': {
    en: 'Farm Manager', hi: 'खेत प्रबंधन', te: 'పొలం నిర్వహణ', ta: 'பண்ணை மேலாண்மை', kn: 'ಜಮೀನು ನಿರ್ವಹಣೆ',
    ml: 'കൃഷി മാനേജർ', mr: 'शेत व्यवस्थापन', bn: 'খামার পরিচালনা', gu: 'ખેતર વ્યવસ્થાપન', pa: 'ਖੇਤ ਪ੍ਰਬੰਧਨ', or: 'କ୍ଷେତ ପରିଚାଳନା'
  },
  'Messages': {
    en: 'Messages', hi: 'संदेश', te: 'సందేశాలు', ta: 'செய்திகள்', kn: 'ಸಂದೇಶಗಳು',
    ml: 'സന്ദേശങ്ങൾ', mr: 'संदेश', bn: 'বার্তা', gu: 'સંદેશા', pa: 'ਸੁਨੇਹੇ', or: 'ବାର୍ତ୍ତା'
  },
  'Vendor Hub': {
    en: 'Vendor Hub', hi: 'विक्रेता हब', te: 'వ్యాపారి హబ్', ta: 'விற்பனையாளர் மையம்', kn: 'ಮಾರಾಟಗಾರರ ಹಬ್',
    ml: 'വെണ്ടർ ഹബ്ബ്', mr: 'विक्रेता केंद्र', bn: 'বিক্রেতা কেন্দ্র', gu: 'વિક્રેતા હબ', pa: 'ਵਿਕਰੇਤਾ ਹੱਬ', or: 'ବିକ୍ରେତା ହବ୍'
  },
  'Mandi Desk': {
    en: 'Mandi Desk', hi: 'मंडी डेस्क', te: 'మార్కెట్ డెస్క్', ta: 'மண்டி மேசை', kn: 'ಮಂಡಿ ಡೆಸ್ಕ್',
    ml: 'മണ്ടി ഡെസ്ക്', mr: 'मंडी डेस्क', bn: 'মান্ডি ডেস্ক', gu: 'મંડી ડેસ્ક', pa: 'ਮੰਡੀ ਡੈਸਕ', or: 'ମଣ୍ଡି ଡେସ୍କ'
  },
  // Statuses & Actions
  'Confirm': {
    en: 'Confirm', hi: 'स्वीकार करें', te: 'ధృవీకరించండి', ta: 'உறுதிப்படுத்து', kn: 'ದೃಢೀಕರಿಸಿ',
    ml: 'സ്ഥിരീകരിക്കുക', mr: 'मंजूर करा', bn: 'নিশ্চিত করুন', gu: 'સ્વીકારો', pa: 'ਪੁਸ਼ਟੀ ਕਰੋ', or: 'ନିଶ୍ଚିତ କରନ୍ତୁ'
  },
  'Reject': {
    en: 'Reject', hi: 'अस्वीकार करें', te: 'తిరస్కరించండి', ta: 'நிராகரி', kn: 'ತಿರಸ್ಕರಿಸಿ',
    ml: 'നിരസിക്കുക', mr: 'नाकारा', bn: 'প্রত্যাখ্যান করুন', gu: 'નકારો', pa: 'ਰੱਦ ਕਰੋ', or: 'ପ୍ରତ୍ୟାଖ୍ୟାନ କରନ୍ତୁ'
  },
  'Confirmed': {
    en: 'Confirmed', hi: 'स्वीकृत', te: 'ఆమోదించబడింది', ta: 'உறுதிப்படுத்தப்பட்டது', kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
    ml: 'സ്ഥിരീകരിച്ചു', mr: 'मंजूर', bn: 'অনুমোদিত', gu: 'મંજૂર', pa: 'ਪ੍ਰਵਾਨਿਤ', or: 'ଅନୁମୋଦିତ'
  },
  'Rejected': {
    en: 'Rejected', hi: 'अस्वीकृत', te: 'తిరస్కరించబడింది', ta: 'நிராகரிக்கப்பட்டது', kn: 'ತಿರಸ್ಕರಿಸಲಾಗಿದೆ',
    ml: 'നിരസിച്ചു', mr: 'नाकारले', bn: 'প্রত্যাখ্যাত', gu: 'અસ્વીકૃત', pa: 'ਰੱਦ ਕੀਤਾ ਗਿਆ', or: 'ପ୍ରତ୍ୟାଖ୍ୟାତ'
  },
  'Pending': {
    en: 'Pending', hi: 'लंबित', te: 'పరిశీలనలో ఉంది', ta: 'நிலுவையில் உள்ளது', kn: 'ಬಾಕಿ ಉಳಿದಿದೆ',
    ml: 'തീർപ്പുകൽപ്പിക്കാത്തത്', mr: 'प्रलंबित', bn: 'অপেক্ষমাণ', gu: 'બાકી છે', pa: 'ਬਕਾਇਆ', or: 'ବିଚାରାଧୀନ'
  },
  'Status': {
    en: 'Status', hi: 'स्थिति', te: 'స్థితి', ta: 'நிலை', kn: 'ಸ್ಥಿತಿ',
    ml: 'അവസ്ഥ', mr: 'स्थिती', bn: 'অবস্থা', gu: 'સ્થિતિ', pa: 'ਸਥਿਤੀ', or: 'ସ୍ଥିତି'
  },
  'Price': {
    en: 'Price', hi: 'मूल्य', te: 'ధర', ta: 'விலை', kn: 'ಬೆಲೆ',
    ml: 'വില', mr: 'किंमत', bn: 'মূল্য', gu: 'કિંમત', pa: 'ਕੀਮਤ', or: 'ମୂଲ୍ୟ'
  },
  'Quantity': {
    en: 'Quantity', hi: 'मात्रा', te: 'పరిమాణం', ta: 'அளவு', kn: 'ಪ್ರಮಾಣ',
    ml: 'അളവ്', mr: 'प्रमाण', bn: 'পরিমাণ', gu: 'જથ્થો', pa: 'ਮਾਤਰਾ', or: 'ପରିମାଣ'
  },
  'Total': {
    en: 'Total', hi: 'कुल', te: 'మొత్తం', ta: 'மொத்தம்', kn: 'ಒಟ್ಟು',
    ml: 'ആകെ', mr: 'एकूण', bn: 'মোট', gu: 'કુલ', pa: 'ਕੁੱਲ', or: 'ମୋଟ'
  },
  'Buy': {
    en: 'Buy', hi: 'खरीदें', te: 'కొనండి', ta: 'வாங்கவும்', kn: 'ಖರೀದಿಸಿ',
    ml: 'വാങ്ങുക', mr: 'खरेदी करा', bn: 'কিনুন', gu: 'ખરીદો', pa: 'ਖਰੀਦੋ', or: 'କିଣନ୍ତୁ'
  },
  'Sell': {
    en: 'Sell', hi: 'बेचें', te: 'అమ్మండి', ta: 'விற்கவும்', kn: 'ಮಾರಿ',
    ml: 'വിൽക്കുക', mr: 'विका', bn: 'বিক্রি করুন', gu: 'વેચો', pa: 'ਵੇਚੋ', or: 'ବିକ୍ରୟ କରନ୍ତୁ'
  },
  'Farmer': {
    en: 'Farmer', hi: 'किसान', te: 'రైతు', ta: 'விவசாயி', kn: 'ರೈತ',
    ml: 'കർഷകൻ', mr: 'शेतकरी', bn: 'কৃষক', gu: 'ખેડૂત', pa: 'ਕਿਸਾਨ', or: 'ଚାଷୀ'
  },
  'Vendor': {
    en: 'Vendor', hi: 'विक्रेता', te: 'వ్యాపారి', ta: 'விற்பனையாளர்', kn: 'ವ್ಯಾಪಾರಿ',
    ml: 'വ്യാപാരി', mr: 'विक्रेता', bn: 'বিক্রেতা', gu: 'વિક્રેતા', pa: 'ਵਿਕਰੇਤਾ', or: 'ବ୍ୟବସାୟୀ'
  },
  'Buyer': {
    en: 'Buyer', hi: 'खरीदार', te: 'కొనుగోలుదారు', ta: 'வாங்குபவர்', kn: 'ಖರೀದಿದಾರ',
    ml: 'വാങ്ങുന്നയാൾ', mr: 'खरेदीदार', bn: 'ক্রেতা', gu: 'ખરીદનાર', pa: 'ਖਰੀਦਦਾਰ', or: 'କ୍ରେତା'
  },
  'Admin': {
    en: 'Admin', hi: 'व्यवस्थापक', te: 'అడ్మిన్', ta: 'நிர்வாகி', kn: 'ನಿರ್ವಾಹಕ',
    ml: 'അഡ്മിൻ', mr: 'प्रशासक', bn: 'প্রশাসক', gu: 'એડમિન', pa: 'ਐਡਮਿਨ', or: 'ପ୍ରଶାସକ'
  },
  'In Stock': {
    en: 'In Stock', hi: 'उपलब्ध है', te: 'స్టాక్ ఉంది', ta: 'இருப்பில் உள்ளது', kn: 'ಲಭ್ಯವಿದೆ',
    ml: 'ലഭ്യമാണ്', mr: 'उपलब्ध आहे', bn: 'মজুদ আছে', gu: 'ઉપલબ્ધ છે', pa: 'ਸਟਾਕ ਵਿੱਚ ਹੈ', or: 'ଉପଲବ୍ଧ ଅଛି'
  },
  'Add to Cart': {
    en: 'Add to Cart', hi: 'कार्ट में जोड़ें', te: 'కొనుగోలు చేయండి', ta: 'கூடையில் சேர்க்கவும்', kn: 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
    ml: 'കാർട്ടിലേക്ക് ചേർക്കുക', mr: 'कार्टमध्ये जोडा', bn: 'কার্টে যোগ করুন', gu: 'કાર્ટમાં ઉમેરો', pa: 'ਕਾਰਟ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰੋ', or: 'କାର୍ଟରେ ଯୋଡନ୍ତୁ'
  },
  'Login': {
    en: 'Login', hi: 'लॉग इन', te: 'లాగిన్', ta: 'உள்நுழைய', kn: 'ಲಾಗಿನ್',
    ml: 'ലോഗിൻ', mr: 'लॉग इन', bn: 'লগ ইন', gu: 'લૉગ ઇન', pa: 'ਲੌਗ ਇਨ', or: 'ଲଗ୍ ଇନ୍'
  },
  'Register': {
    en: 'Register', hi: 'पंजीकरण', te: 'నమోదు చేయండి', ta: 'பதிவு செய்க', kn: 'ನೋಂದಣಿ',
    ml: 'രജിസ്റ്റർ ചെയ്യുക', mr: 'नोंदणी करा', bn: 'নিবন্ধন', gu: 'નોંધણી', pa: 'ਰਜਿਸਟਰ', or: 'ପଞ୍ଜୀକରଣ'
  },
  'Logout': {
    en: 'Logout', hi: 'लॉग आउट', te: 'లాగౌట్', ta: 'வெளியேறு', kn: 'ಲಾಗ್‌ಔಟ್',
    ml: 'ലോഗൗട്ട്', mr: 'लॉग आउट', bn: 'লগ আউট', gu: 'લૉગ આઉટ', pa: 'ਲੌਗ ਆਉਟ', or: 'ଲଗ୍ ଆଉଟ୍'
  },
  'Real-Time Photo Verified': {
    en: 'Real-Time Photo Verified', hi: 'वास्तविक समय फोटो सत्यापित', te: 'రియల్-టైమ్ ఫోటో ధృవీకరించబడింది',
    ta: 'நிகழ்நேர புகைப்படம் சரிபார்க்கப்பட்டது', kn: 'ನೈಜ ಸಮಯದ ಫೋಟೋ ದೃಢೀಕರಿಸಲಾಗಿದೆ', ml: 'തത്സമയ ഫോട്ടോ സ്ഥിരീകരിച്ചു',
    mr: 'रिअल-टाईम फोटो सत्यापित', bn: 'রিয়েল-টাইম ছবি যাচাইকৃত', gu: 'રીઅલ-ટાઇમ ફોટો ચકાસાયેલ',
    pa: 'ਰੀਅਲ-ਟਾਈਮ ਫੋਟੋ ਪ੍ਰਮਾਣਿਤ', or: 'ପ୍ରକୃତ ସମୟ ଫଟୋ ପ୍ରମାଣିତ'
  },
  'Captured Date & Time': {
    en: 'Captured Date & Time', hi: 'फोटो लेने की तारीख व समय', te: 'తీసిన తేదీ & సమయం',
    ta: 'எடுக்கப்பட்ட தேதி மற்றும் நேரம்', kn: 'ತೆಗೆದ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ', ml: 'എടുത്ത തീയതിയും സമയവും',
    mr: 'फोटो काढलेली तारीख व वेळ', bn: 'ছবি তোলার তারিখ ও সময়', gu: 'ફોટો લીધેલ તારીખ અને સમય',
    pa: 'ਖਿੱਚਣ ਦੀ ਮਿਤੀ ਅਤੇ ਸਮਾਂ', or: 'ଫଟୋ ଉଠାଯାଇଥିବା ତାରିଖ ଓ ସମୟ'
  },
  'Location & Camera Telemetry': {
    en: 'Location & Camera Telemetry', hi: 'स्थान एवं कैमरा टेलीमेट्री', te: 'లొకేషన్ & కెమెరా వివరాలు',
    ta: 'இருப்பிடம் மற்றும் கேமரா விவரங்கள்', kn: 'ಸ್ಥಳ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಮಾಹಿತಿ', ml: 'ലൊക്കേഷൻ, ക്യാമറ വിവരങ്ങൾ',
    mr: 'स्थान व कॅमेरा माहिती', bn: 'স্থান ও ক্যামেরা বিবরণ', gu: 'સ્થાન અને કેમેરા વિગતો',
    pa: 'ਸਥਾਨ ਅਤੇ ਕੈਮਰਾ ਵੇਰਵੇ', or: 'ସ୍ଥାନ ଓ କ୍ୟାମେରା ବିବରଣୀ'
  },
  'All-India Rates': {
    en: 'All-India Rates', hi: 'अखिल भारतीय भाव', te: 'భారతదేశ వ్యాప్త ధరలు', ta: 'அகில இந்திய விலைகள்',
    kn: 'ಅಖಿಲ ಭಾರತ ದರಗಳು', ml: 'ഇന്ത്യയിലെ നിരക്കുകൾ', mr: 'अखिल भारतीय भाव', bn: 'সারা ভারতের দর',
    gu: 'સમગ્ર ભારતના ભાવ', pa: 'ਅਖਿਲ ਭਾਰਤੀ ਭਾਅ', or: 'ସର୍ବଭାରତୀୟ ଦର'
  },
  'Farmer Market': {
    en: 'Farmer Market', hi: 'किसान बाजार', te: 'రైతు మార్కెట్', ta: 'விவசாய சந்தை',
    kn: 'ರೈತ ಮಾರುಕಟ್ಟೆ', ml: 'കർഷക ചന്ത', mr: 'शेतकरी बाजार', bn: 'কৃষক বাজার',
    gu: 'ખેડૂત બજાર', pa: 'ਕਿਸਾਨ ਮੰਡੀ', or: 'ଚାଷୀ ବଜାର'
  },
  'Logistics Chat': {
    en: 'Logistics Chat', hi: 'लॉजिस्टिक्स चैट', te: 'రవాణా చాట్', ta: 'சரக்கு போக்குவரத்து உரையாடல்',
    kn: 'ಸಾರಿಗೆ ಚಾಟ್', ml: 'ലോജിസ്റ്റിക്സ് ചാറ്റ്', mr: 'वाहतूक चर्चा', bn: 'পরিবহন আলোচনা',
    gu: 'પરિવહન ચર્ચા', pa: 'ਲੌਜਿਸਟਿਕਸ ਚੈਟ', or: 'ପରିବହନ ଚାଟ୍'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('agri_lang') as Language) || 'en';
  });

  // Track original text of text nodes to ensure clean bidirectional switching
  const originalTextMap = useRef<WeakMap<Node, string>>(new WeakMap());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agri_lang', lang);

    // Sync with Google Translate cookie if available
    try {
      const hostname = window.location.hostname;
      const cookieValue = `/en/${lang}`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname};`;
      document.cookie = `googtrans=${cookieValue}; path=/;`;

      // Trigger Google Translate dropdown change if present
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
      }
    } catch {
      // Ignored in non-browser environments
    }
  };

  // Universal translation helper function
  const t = (keyOrText: string): string => {
    if (!keyOrText) return '';
    const currentDict = translations[language] || translations['en'];

    // 1. Check direct translation key
    if (currentDict && currentDict[keyOrText]) {
      return currentDict[keyOrText];
    }

    // 2. Check universal phrase dictionary
    if (commonPhrases[keyOrText] && commonPhrases[keyOrText][language]) {
      return commonPhrases[keyOrText][language];
    }

    // 3. Check case-insensitive phrase match
    const lowerKey = keyOrText.trim().toLowerCase();
    for (const [phrase, map] of Object.entries(commonPhrases)) {
      if (phrase.toLowerCase() === lowerKey && map[language]) {
        return map[language];
      }
    }

    // 4. Check English dictionary fallback
    if (translations['en'] && translations['en'][keyOrText]) {
      return translations['en'][keyOrText];
    }

    return keyOrText;
  };

  // Automated DOM Text Tree Translator: ensures each and every line converts dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: number;

    const translateDomTree = () => {
      const root = document.getElementById('root');
      if (!root) return;

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tagName = parent.tagName.toLowerCase();
            if (['script', 'style', 'input', 'textarea', 'pre', 'code'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('.notranslate') || parent.getAttribute('data-no-translate')) {
              return NodeFilter.FILTER_REJECT;
            }
            const val = node.nodeValue?.trim();
            if (!val || val.length === 0 || /^[\d\s.,:;!?₹$%()/\-]+$/.test(val)) {
              return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let currentNode = walker.nextNode();
      while (currentNode) {
        let original = originalTextMap.current.get(currentNode);
        if (!original) {
          original = currentNode.nodeValue || '';
          originalTextMap.current.set(currentNode, original);
        }

        if (language === 'en') {
          // Restore English
          if (currentNode.nodeValue !== original) {
            currentNode.nodeValue = original;
          }
        } else {
          // Translate text node value
          const trimmed = original.trim();
          let translated = t(trimmed);

          if (translated !== trimmed) {
            // Preserve surrounding whitespace
            const leadingSpace = original.match(/^\s*/)?.[0] || '';
            const trailingSpace = original.match(/\s*$/)?.[0] || '';
            currentNode.nodeValue = `${leadingSpace}${translated}${trailingSpace}`;
          }
        }

        currentNode = walker.nextNode();
      }
    };

    const scheduleTranslation = () => {
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(translateDomTree);
    };

    // Run initial scan
    scheduleTranslation();

    // Observe dynamic changes
    const observer = new MutationObserver(() => {
      scheduleTranslation();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });

    return () => {
      cancelAnimationFrame(timeoutId);
      observer.disconnect();
    };
  }, [language]);

  const currentLangMeta = indianLanguages.find(l => l.code === language) || indianLanguages[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: indianLanguages,
        currentLangMeta
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
