export type Job = {
  id: string;
  code: string;
  address: string;
  trade: string;
  description: string;
  status: 'on_site' | 'scheduled';
  scheduledTime?: string;
  captureCount: number;
  timeOnSite?: string;
  quotedAmount?: number;
};

export type CrewMember = {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  phone: string;
  online: boolean;
  certSummary: string;
  shiftSummary: string;
  schedule: ScheduleDay[];
  certs: Certification[];
};

export type ScheduleDay = {
  day: string;
  date: string;
  job?: string;
  detail?: string;
  time?: string;
  dot?: string;
  isOff: boolean;
};

export type Certification = {
  name: string;
  issuer: string;
  expiry: string;
  status: 'Valid' | 'Expiring' | 'Expired';
};

export type CapturedItem = {
  id: string;
  type: 'voice' | 'photo' | 'materials' | 'issue';
  title: string;
  subtitle: string;
  time: string;
};

export type InventoryItem = {
  key: string;
  name: string;
  qty: string;
  job: string;
  dot: string;
};

export const jobs: Job[] = [
  {
    id: '1',
    code: '#JB-2208',
    address: '14 Maple Ave',
    trade: 'Electrical',
    description: 'switchboard upgrade',
    status: 'on_site',
    captureCount: 4,
    timeOnSite: '00:51',
    quotedAmount: 300,
  },
  {
    id: '2',
    code: '#JB-2209',
    address: '7 Crystal St',
    trade: 'Plumbing',
    description: 'leak under sink',
    status: 'scheduled',
    scheduledTime: '11:30',
    captureCount: 0,
  },
  {
    id: '3',
    code: '#JB-2210',
    address: '220 Harbour Rd',
    trade: 'HVAC',
    description: 'annual service',
    status: 'scheduled',
    scheduledTime: '14:00',
    captureCount: 0,
  },
];

export const crew: CrewMember[] = [
  {
    id: '0',
    name: 'Jordan M.',
    initials: 'JM',
    role: 'Lead Electrician',
    color: '#1a3a8f',
    phone: '0412 334 982',
    online: true,
    certSummary: '3 valid · 1 expiring',
    shiftSummary: '5 shifts this week',
    schedule: [
      { day: 'Mon', date: '23', job: '14 Maple Ave', detail: 'Switchboard upgrade', time: '08:00 – 16:00', dot: '#1a3a8f', isOff: false },
      { day: 'Tue', date: '24', job: '88 Ridge Rd', detail: 'Full rewire', time: '07:30 – 15:30', dot: '#1a3a8f', isOff: false },
      { day: 'Wed', date: '25', job: '220 Harbour Rd', detail: 'HVAC power assist', time: '09:00 – 14:00', dot: '#f0a500', isOff: false },
      { day: 'Thu', date: '26', job: 'Workshop', detail: 'Stock & admin', time: '08:00 – 12:00', dot: '#6b6862', isOff: false },
      { day: 'Fri', date: '27', job: '12 Anzac Pde', detail: 'New build rough-in', time: '07:00 – 15:00', dot: '#1a3a8f', isOff: false },
      { day: 'Sat', date: '28', isOff: true },
      { day: 'Sun', date: '29', isOff: true },
    ],
    certs: [
      { name: 'A-Grade Electrical License', issuer: 'Energy Safe Vic', expiry: 'Valid to Mar 2028', status: 'Valid' },
      { name: 'Working at Heights', issuer: 'SafeWork', expiry: 'Expires 14 Jul 2026', status: 'Expiring' },
      { name: 'First Aid · HLTAID011', issuer: 'Red Cross', expiry: 'Valid to Nov 2026', status: 'Valid' },
      { name: 'White Card', issuer: 'SafeWork', expiry: 'No expiry', status: 'Valid' },
    ],
  },
  {
    id: '1',
    name: 'Sam K.',
    initials: 'SK',
    role: 'Electrician',
    color: '#16181d',
    phone: '0421 556 113',
    online: true,
    certSummary: '3 valid',
    shiftSummary: '4 shifts this week',
    schedule: [
      { day: 'Mon', date: '23', job: '14 Maple Ave', detail: 'Switchboard upgrade', time: '08:00 – 16:00', dot: '#1a3a8f', isOff: false },
      { day: 'Tue', date: '24', isOff: true },
      { day: 'Wed', date: '25', job: '7 Crystal St', detail: 'Lighting circuit', time: '08:00 – 13:00', dot: '#1a3a8f', isOff: false },
      { day: 'Thu', date: '26', job: '88 Ridge Rd', detail: 'Full rewire', time: '07:30 – 15:30', dot: '#1a3a8f', isOff: false },
      { day: 'Fri', date: '27', job: '12 Anzac Pde', detail: 'New build rough-in', time: '07:00 – 15:00', dot: '#1a3a8f', isOff: false },
      { day: 'Sat', date: '28', isOff: true },
      { day: 'Sun', date: '29', isOff: true },
    ],
    certs: [
      { name: 'A-Grade Electrical License', issuer: 'Energy Safe Vic', expiry: 'Valid to Jan 2027', status: 'Valid' },
      { name: 'Test & Tag', issuer: 'SafeWork', expiry: 'Valid to Sep 2026', status: 'Valid' },
      { name: 'White Card', issuer: 'SafeWork', expiry: 'No expiry', status: 'Valid' },
    ],
  },
  {
    id: '2',
    name: 'Riley T.',
    initials: 'RT',
    role: 'Apprentice · Yr 2',
    color: '#6b6862',
    phone: '0438 901 224',
    online: false,
    certSummary: '2 valid · 1 expired',
    shiftSummary: '5 shifts this week',
    schedule: [
      { day: 'Mon', date: '23', job: '14 Maple Ave', detail: 'Assisting lead', time: '08:00 – 16:00', dot: '#6b6862', isOff: false },
      { day: 'Tue', date: '24', job: 'TAFE', detail: 'Trade school', time: 'All day', dot: '#f0a500', isOff: false },
      { day: 'Wed', date: '25', job: '7 Crystal St', detail: 'Assisting Sam', time: '08:00 – 13:00', dot: '#6b6862', isOff: false },
      { day: 'Thu', date: '26', job: '88 Ridge Rd', detail: 'Full rewire', time: '07:30 – 15:30', dot: '#6b6862', isOff: false },
      { day: 'Fri', date: '27', job: '12 Anzac Pde', detail: 'New build rough-in', time: '07:00 – 15:00', dot: '#6b6862', isOff: false },
      { day: 'Sat', date: '28', isOff: true },
      { day: 'Sun', date: '29', isOff: true },
    ],
    certs: [
      { name: 'Apprentice Registration', issuer: 'VRQA', expiry: 'Active · Year 2', status: 'Valid' },
      { name: 'White Card', issuer: 'SafeWork', expiry: 'No expiry', status: 'Valid' },
      { name: 'First Aid · HLTAID011', issuer: 'Red Cross', expiry: 'Expired 2 Jun 2026', status: 'Expired' },
    ],
  },
];

export const capturedItems: CapturedItem[] = [
  { id: '1', type: 'voice', title: 'Voice note · 0:24', subtitle: '"Replaced the main RCD, tested all circuits…"', time: '9:51' },
  { id: '2', type: 'photo', title: 'Switchboard photo', subtitle: '1 image', time: '9:42' },
  { id: '3', type: 'materials', title: '4× Downlight LED 6W', subtitle: 'Materials', time: '9:55' },
];

export const inventoryItems: InventoryItem[] = [
  { key: 'i0', name: 'Downlight LED 6W', qty: '4×', job: '14 Maple Ave', dot: '#1a3a8f' },
  { key: 'i1', name: 'Switchboard RCD unit', qty: '1×', job: '14 Maple Ave', dot: '#1a3a8f' },
  { key: 'i2', name: 'Cable 2.5mm TPS', qty: '20m', job: '14 Maple Ave', dot: '#1a3a8f' },
  { key: 'i3', name: 'Pipe fittings set', qty: '1×', job: '7 Crystal St', dot: '#6b6862' },
  { key: 'i4', name: 'Tap cartridge kit', qty: '1×', job: '7 Crystal St', dot: '#6b6862' },
  { key: 'i5', name: 'HVAC filter set', qty: '2×', job: '220 Harbour Rd', dot: '#f0a500' },
  { key: 'i6', name: 'Refrigerant R32', qty: '1kg', job: '220 Harbour Rd', dot: '#f0a500' },
  { key: 'i7', name: 'Consumables', qty: 'Tape, ties, connectors', job: 'All jobs', dot: '#8a857a' },
];

export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export const estimateLineItems: LineItem[] = [
  { id: '1', name: 'Downlight LED 6W', quantity: 4, unit: '×', unitPrice: 12.0 },
  { id: '2', name: 'Labour', quantity: 1.5, unit: 'hr ×', unitPrice: 90.0 },
  { id: '3', name: 'Call-out fee', quantity: 1, unit: '', unitPrice: 90.0 },
];
