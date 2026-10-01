// Utility functions for Marathi typography, dates, and numerals

const MARATHI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const toMarathiDigits = (num: number | string): string => {
  return num
    .toString()
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return !isNaN(parsed) && char !== ' ' ? MARATHI_DIGITS[parsed] : char;
    })
    .join('');
};

const MARATHI_MONTHS = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

const MARATHI_DAYS = [
  'रविवार',
  'सोमवार',
  'मंगळवार',
  'बुधवार',
  'गुरुवार',
  'शुक्रवार',
  'शनिवार',
];

export const getMarathiCurrentDate = (): {
  dayName: string;
  formattedDate: string;
  tithiInfo: string;
} => {
  const now = new Date();
  const dayName = MARATHI_DAYS[now.getDay()];
  const dateNum = toMarathiDigits(now.getDate());
  const monthName = MARATHI_MONTHS[now.getMonth()];
  const yearNum = toMarathiDigits(now.getFullYear());

  return {
    dayName,
    formattedDate: `${dayName}, ${dateNum} ${monthName} ${yearNum}`,
    tithiInfo: 'आश्विन कृष्ण पक्ष | शके १९४८',
  };
};

export const formatMarathiDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const dateNum = toMarathiDigits(d.getDate());
    const monthName = MARATHI_MONTHS[d.getMonth()];
    const yearNum = toMarathiDigits(d.getFullYear());
    let hours = d.getHours();
    const minutes = toMarathiDigits(d.getMinutes().toString().padStart(2, '0'));
    const ampm = hours >= 12 ? 'दु.' : 'स.';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    const hoursNum = toMarathiDigits(hours);

    return `${dateNum} ${monthName} ${yearNum}, ${ampm} ${hoursNum}:${minutes}`;
  } catch {
    return isoString;
  }
};

export const getRelativeTimeMarathi = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'आत्ताच';
    if (diffMinutes < 60) return `${toMarathiDigits(diffMinutes)} मिनिटांपूर्वी`;
    if (diffHours < 24) return `${toMarathiDigits(diffHours)} तासांपूर्वी`;
    if (diffDays === 1) return 'काल';
    if (diffDays < 30) return `${toMarathiDigits(diffDays)} दिवसांपूर्वी`;

    return formatMarathiDate(isoString);
  } catch {
    return 'काही वेळापूर्वी';
  }
};
