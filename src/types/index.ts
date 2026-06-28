export type Job = {
  id: string;
  code: string;
  address: string;
  trade: string;
  description: string;
  status: 'on_site' | 'scheduled' | 'completed';
  scheduledTime?: string;
  captureCount: number;
  timeOnSite?: string;
  quotedAmount?: number;
  assignedMemberIds?: string[];
  createdAt?: number;
};

export type CrewMember = {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  phone: string;
  online: boolean;
  email?: string;
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
  subtitle?: string;
  time: string;
  createdBy?: string;
  createdAt?: number;
  audioUri?: string;
  transcript?: string;
  parsedEntries?: ParsedEntry[];
};

export type InventoryItem = {
  key: string;
  name: string;
  qty: string;
  job: string;
  dot: string;
};

export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type ParsedEntry = {
  category: 'materials' | 'time' | 'issue' | 'note';
  title: string;
  quantity?: number;
  unit?: string;
  detail?: string;
};

export type Organization = {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: number;
};

export type QueueItemStatus = 'pending' | 'processing' | 'failed';

export type QueueItem = {
  id: string;
  type: 'transcribe';
  audioUri: string;
  jobId: string;
  orgId: string;
  createdAt: number;
  attempts: number;
  status: QueueItemStatus;
};

export type EstimatePayload = {
  mode: 'new' | 'addon';
  lineItems: LineItem[];
  subtotal: number;
  gst: number;
  total: number;
  customerName?: string;
  siteAddress?: string;
};

export type InventoryPackedState = Record<string, boolean>;
