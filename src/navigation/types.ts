export type VoiceLineItem = {
  name: string;
  kind: 'labour' | 'material';
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  estimatedHours: number | null;
};

export type RootStackParamList = {
  Home: undefined;
  JobCapture: { jobId: string };
  VoiceRecord: { jobId: string; estimateMode?: boolean };
  VoiceReview: { jobId: string; audioUri?: string; estimateMode?: boolean };
  Estimate: { jobId?: string; mode: 'new' | 'addon'; voiceLineItems?: VoiceLineItem[] };
  FinishJob: { jobId: string };
  CrewList: { jobId: string };
  EmployeeProfile: { employeeId: string; jobId: string };
  EmployeeSchedule: { employeeId: string };
  EmployeeCerts: { employeeId: string };
  TimeParts: { jobId: string };
  PhotoCapture: { jobId: string; tag: 'before' | 'during' | 'after' };
  PhotoViewer: { uri: string; title: string };
  FlagIssue: { jobId: string };
  CallScreen: { employeeId: string };
  SendNote: { employeeId: string };
  Inventory: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
