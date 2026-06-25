import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  HomeScreen,
  JobCaptureScreen,
  VoiceRecordScreen,
  VoiceReviewScreen,
  EstimateScreen,
  FinishJobScreen,
  CrewListScreen,
  EmployeeProfileScreen,
  EmployeeScheduleScreen,
  EmployeeCertsScreen,
  CallScreen,
  SendNoteScreen,
  InventoryScreen,
} from '../screens';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f4f1ea' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="JobCapture" component={JobCaptureScreen} />
      <Stack.Screen name="VoiceRecord" component={VoiceRecordScreen} />
      <Stack.Screen name="VoiceReview" component={VoiceReviewScreen} />
      <Stack.Screen name="Estimate" component={EstimateScreen} />
      <Stack.Screen name="FinishJob" component={FinishJobScreen} />
      <Stack.Screen name="CrewList" component={CrewListScreen} />
      <Stack.Screen name="EmployeeProfile" component={EmployeeProfileScreen} />
      <Stack.Screen name="EmployeeSchedule" component={EmployeeScheduleScreen} />
      <Stack.Screen name="EmployeeCerts" component={EmployeeCertsScreen} />
      <Stack.Screen name="CallScreen" component={CallScreen} />
      <Stack.Screen name="SendNote" component={SendNoteScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
    </Stack.Navigator>
  );
}
