// Marathi numerals mapping
const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const toMarathiDigits = (num: number | string): string => {
  return num
    .toString()
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return !isNaN(parsed) && char !== ' ' ? marathiDigits[parsed] : char;
    })
    .join('');
};

const marathiMonths = [
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

const marathiDays = [
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
  const dayName = marathiDays[now.getDay()];
  const date = toMarathiDigits(now.getDate());
  const month = marathiMonths[now.getMonth()];
  const year = toMarathiDigits(now.getFullYear());

  return {
    dayName,
    formattedDate: `${dayName}, ${date} ${month} ${year}`,
    tithiInfo: 'आश्विन कृष्ण पक्ष | शके १९४८',
  };
};

export const formatMarathiDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const date = toMarathiDigits(d.getDate());
    const month = marathiMonths[d.getMonth()];
    const year = toMarathiDigits(d.getFullYear());

    let hours = d.getHours();
    const minutes = toMarathiDigits(d.getMinutes().toString().padStart(2, '0'));
    const ampm = hours >= 12 ? 'दु.' : 'स.';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    const hoursMarathi = toMarathiDigits(hours);

    return `${date} ${month} ${year}, ${ampm} ${hoursMarathi}:${minutes}`;
  } catch {
    return isoString;
  }
};

export const getRelativeTimeMarathi = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'आत्ताच';
    if (diffMins < 60) return `${toMarathiDigits(diffMins)} मिनिटांपूर्वी`;
    if (diffHours < 24) return `${toMarathiDigits(diffHours)} तासांपूर्वी`;
    if (diffDays === 1) return 'काल';
    if (diffDays < 30) return `${toMarathiDigits(diffDays)} दिवसांपूर्वी`;
    return formatMarathiDate(isoString);
  } catch {
    return 'काही वेळापूर्वी';
  }
};
