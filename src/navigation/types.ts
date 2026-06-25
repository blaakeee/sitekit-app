export type RootStackParamList = {
  Home: undefined;
  JobCapture: { jobId: string };
  VoiceRecord: { jobId: string };
  VoiceReview: { jobId: string };
  Estimate: { jobId?: string; mode: 'new' | 'addon' };
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
