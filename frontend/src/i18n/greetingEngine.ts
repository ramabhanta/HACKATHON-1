import { Language } from './translations';

export type TimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

/**
 * Returns the active time slot based on current local hour (0-23)
 * 04:00 to 11:59 -> MORNING
 * 12:00 to 16:59 -> AFTERNOON
 * 17:00 to 20:59 -> EVENING
 * 21:00 to 03:59 -> NIGHT
 */
export function getTimeSlot(hour: number = new Date().getHours()): TimeSlot {
  if (hour >= 4 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 21) return 'EVENING';
  return 'NIGHT';
}

export const GREETINGS: Record<TimeSlot, Record<string, string>> = {
  MORNING: {
    en: 'Good Morning',
    kn: 'ಶುಭೋದಯ',
    te: 'శుభోదయం',
    hi: 'शुभ प्रभात',
    ta: 'காலை வணக்கம்',
    ml: 'സുപ്രഭാതം',
    mr: 'शुभ प्रभात',
    bn: 'শুভ সকাল',
    gu: 'શુભ સવાર',
    pa: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ',
    or: 'ଶୁଭ ସକାଳ'
  },
  AFTERNOON: {
    en: 'Good Afternoon',
    kn: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    te: 'శుభ మధ్యాహ్నం',
    hi: 'शुभ दोपहर',
    ta: 'மதிய வணக்கம்',
    ml: 'ശുഭ ഉച്ചതിരിഞ്ഞ്',
    mr: 'शुभ दुपार',
    bn: 'শুভ দুপুর',
    gu: 'શુભ બપોર',
    pa: 'ਸ਼ੁਭ ਦੁਪਹਿਰ',
    or: 'ଶୁଭ ଅପରାହ୍ନ'
  },
  EVENING: {
    en: 'Good Evening',
    kn: 'ಶುಭ ಸಂಜೆ',
    te: 'శుభ సాయంత్రం',
    hi: 'शुभ संध्या',
    ta: 'மாலை வணக்கம்',
    ml: 'ശുഭ സായാഹ്നം',
    mr: 'शुभ संध्याकाळ',
    bn: 'শুভ সন্ধ্যা',
    gu: 'શુભ સાંજ',
    pa: 'ਸ਼ੁਭ ਸ਼ਾਮ',
    or: 'ଶୁଭ ସନ୍ଧ୍ୟା'
  },
  NIGHT: {
    en: 'Good Night',
    kn: 'ಶುಭ ರಾತ್ರಿ',
    te: 'శుభ రాత్రి',
    hi: 'शुभ रात्रि',
    ta: 'இரவு வணக்கம்',
    ml: 'ശുഭരാത്രി',
    mr: 'शुभ रात्री',
    bn: 'শুভ রাত্রি',
    gu: 'શુભ રાત્રિ',
    pa: 'ਸ਼ੁਭ ਰਾਤ',
    or: 'ଶୁଭ ରାତ୍ରି'
  }
};

/**
 * Returns the localized greeting string based on language and current local hour
 */
export function getDynamicGreeting(language: Language = 'en', hour?: number): string {
  const slot = getTimeSlot(hour);
  const slotGreetings = GREETINGS[slot];
  return slotGreetings[language] || slotGreetings['en'] || 'Good Morning';
}

/**
 * Returns a fully formatted greeting bound with the user's name
 * e.g. "ಶುಭ ಮಧ್ಯಾಹ್ನ, Ramesh!", "శుభ సాయంత్రం, Kisan!"
 */
export function formatUserGreeting(
  language: Language = 'en',
  userName?: string,
  role?: string,
  hour?: number
): string {
  const greeting = getDynamicGreeting(language, hour);
  const rawName = userName?.trim();

  if (rawName) {
    if (language === 'te') {
      return `${greeting}, ${rawName} గారు! 👋`;
    }
    if (language === 'hi') {
      return `${greeting}, ${rawName} जी! 👋`;
    }
    if (language === 'kn') {
      return `${greeting}, ${rawName}! 👋`;
    }
    return `${greeting}, ${rawName}! 👋`;
  }

  // Fallbacks if no user name is set
  if (role === 'VENDOR') {
    if (language === 'kn') return `${greeting}, ವ್ಯಾಪಾರಿ ಮಿತ್ರರೇ! 👋`;
    if (language === 'te') return `${greeting}, వ్యాపారి గారు! 👋`;
    if (language === 'hi') return `${greeting}, व्यापारी जी! 👋`;
    return `${greeting}, Agro Dealer! 👋`;
  }

  if (role === 'BUYER') {
    if (language === 'kn') return `${greeting}, ಖರೀದಿದಾರರೇ! 👋`;
    if (language === 'te') return `${greeting}, కొనుగోలుదారు గారు! 👋`;
    if (language === 'hi') return `${greeting}, खरीदार जी! 👋`;
    return `${greeting}, Procurement Partner! 👋`;
  }

  if (language === 'kn') return `${greeting}, ರೈತ ಮಿತ್ರರೇ! 👋`;
  if (language === 'te') return `${greeting}, రైతు గారు! 👋`;
  if (language === 'hi') return `${greeting}, किसान जी! 👋`;
  return `${greeting}, Farmer! 👋`;
}
