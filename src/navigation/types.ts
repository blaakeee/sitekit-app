export type VoiceLineItem = {
  name: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
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
  CallScreen: { employeeId: string };
  SendNote: { employeeId: string };
  Inventory: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
