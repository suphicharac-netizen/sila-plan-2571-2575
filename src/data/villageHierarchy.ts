export interface VillageInfo {
  number: number;
  name: string;
  shortName: string;
  zoneId: string;
  zoneName: string;
}

export interface ZoneInfo {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  villageNumbers: number[];
  color: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    bar: string;
  };
}

export const ZONES_DATA: ZoneInfo[] = [
  {
    id: 'zone-1',
    name: 'เขต 1',
    title: 'เขต 1 (ศิลา - โนนม่วง)',
    subtitle: 'โซนพื้นที่บ้านศิลา, บ้านโนนม่วง และพื้นที่เชื่อมโยง มหาวิทยาลัยขอนแก่น',
    description: 'ครอบคลุม 9 หมู่บ้าน ได้แก่ หมู่ที่ 1, 2, 3, 12, 18, 19, 24, 27, 28',
    villageNumbers: [1, 2, 3, 12, 18, 19, 24, 27, 28],
    color: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      accent: 'text-emerald-700',
      bar: 'bg-emerald-600'
    }
  },
  {
    id: 'zone-2',
    name: 'เขต 2',
    title: 'เขต 2 (โกทา - หนองหิน - ขามเจริญ - ดอนหญ้านาง - ท่าพระเนาว์)',
    subtitle: 'โซนชุมชนเมืองตะวันออก ชุมชนโกทา, หนองหิน, ขามเจริญ และลุ่มน้ำพอง',
    description: 'ครอบคลุม 10 หมู่บ้าน ได้แก่ หมู่ที่ 4, 5, 10, 11, 15, 16, 20, 22, 23, 26',
    villageNumbers: [4, 5, 10, 11, 15, 16, 20, 22, 23, 26],
    color: {
      bg: 'bg-sky-50/70',
      border: 'border-sky-200',
      text: 'text-sky-900',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-800',
      accent: 'text-sky-700',
      bar: 'bg-sky-600'
    }
  },
  {
    id: 'zone-3',
    name: 'เขต 3',
    title: 'เขต 3 (หนองกุง - หนองไผ่ - เต่านอ)',
    subtitle: 'โซนชุมชนหนองกุง, หนองไผ่, เต่านอ และพื้นที่แนวถนนมิตรภาพ',
    description: 'ครอบคลุม 9 หมู่บ้าน ได้แก่ หมู่ที่ 6, 7, 8, 9, 13, 14, 17, 21, 25',
    villageNumbers: [6, 7, 8, 9, 13, 14, 17, 21, 25],
    color: {
      bg: 'bg-indigo-50/70',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
      accent: 'text-indigo-700',
      bar: 'bg-indigo-600'
    }
  }
];

export const ALL_VILLAGES: VillageInfo[] = [
  // เขต 1
  { number: 1, name: 'หมู่ที่ 1 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 2, name: 'หมู่ที่ 2 บ้านศิลา', shortName: 'บ้านศิลา', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 3, name: 'หมู่ที่ 3 บ้านศิลา', shortName: 'บ้านศิลา', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 12, name: 'หมู่ที่ 12 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 18, name: 'หมู่ที่ 18 บ้านศิลา', shortName: 'บ้านศิลา', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 19, name: 'หมู่ที่ 19 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 24, name: 'หมู่ที่ 24 บ้านศิลา', shortName: 'บ้านศิลา', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 27, name: 'หมู่ที่ 27 บ้านโนนม่วง', shortName: 'บ้านโนนม่วง', zoneId: 'zone-1', zoneName: 'เขต 1' },
  { number: 28, name: 'หมู่ที่ 28 บ้านศิลา', shortName: 'บ้านศิลา', zoneId: 'zone-1', zoneName: 'เขต 1' },

  // เขต 2
  { number: 4, name: 'หมู่ที่ 4 บ้านโกทา', shortName: 'บ้านโกทา', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 5, name: 'หมู่ที่ 5 บ้านหนองหิน', shortName: 'บ้านหนองหิน', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 10, name: 'หมู่ที่ 10 บ้านดอนหญ้านาง', shortName: 'บ้านดอนหญ้านาง', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 11, name: 'หมู่ที่ 11 บ้านท่าพระเนาว์', shortName: 'บ้านท่าพระเนาว์', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 15, name: 'หมู่ที่ 15 บ้านโกทา', shortName: 'บ้านโกทา', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 16, name: 'หมู่ที่ 16 บ้านขามเจริญ', shortName: 'บ้านขามเจริญ', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 20, name: 'หมู่ที่ 20 บ้านหนองหิน', shortName: 'บ้านหนองหิน', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 22, name: 'หมู่ที่ 22 บ้านดอนหญ้านาง', shortName: 'บ้านดอนหญ้านาง', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 23, name: 'หมู่ที่ 23 บ้านขามเจริญ', shortName: 'บ้านขามเจริญ', zoneId: 'zone-2', zoneName: 'เขต 2' },
  { number: 26, name: 'หมู่ที่ 26 บ้านโกทา', shortName: 'บ้านโกทา', zoneId: 'zone-2', zoneName: 'เขต 2' },

  // เขต 3
  { number: 6, name: 'หมู่ที่ 6 บ้านหนองกุง', shortName: 'บ้านหนองกุง', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 7, name: 'หมู่ที่ 7 บ้านหนองกุง', shortName: 'บ้านหนองกุง', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 8, name: 'หมู่ที่ 8 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 9, name: 'หมู่ที่ 9 บ้านเต่านอ', shortName: 'บ้านเต่านอ', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 13, name: 'หมู่ที่ 13 บ้านหนองกุง', shortName: 'บ้านหนองกุง', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 14, name: 'หมู่ที่ 14 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 17, name: 'หมู่ที่ 17 บ้านหนองกุง', shortName: 'บ้านหนองกุง', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 21, name: 'หมู่ที่ 21 บ้านเต่านอ', shortName: 'บ้านเต่านอ', zoneId: 'zone-3', zoneName: 'เขต 3' },
  { number: 25, name: 'หมู่ที่ 25 บ้านหนองไผ่', shortName: 'บ้านหนองไผ่', zoneId: 'zone-3', zoneName: 'เขต 3' }
];

export const getZoneById = (id: string): ZoneInfo | undefined => {
  return ZONES_DATA.find((z) => z.id === id);
};

export const getVillageByNumber = (num: number): VillageInfo | undefined => {
  return ALL_VILLAGES.find((v) => v.number === num);
};

export const getVillagesByZoneId = (zoneId: string): VillageInfo[] => {
  return ALL_VILLAGES.filter((v) => v.zoneId === zoneId).sort((a, b) => a.number - b.number);
};

export const getZoneForVillageNumber = (num: number): ZoneInfo | undefined => {
  const village = getVillageByNumber(num);
  if (!village) return undefined;
  return getZoneById(village.zoneId);
};
