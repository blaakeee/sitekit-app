import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts';
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
  FlagIssueScreen,
  PhotoViewerScreen,
  CallScreen,
  SendNoteScreen,
  InventoryScreen,
  SignInScreen,
} from '../screens';
import { CameraScreen } from '../features/camera';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
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
      <Stack.Screen name="PhotoCapture" component={CameraScreen} />
      <Stack.Screen name="PhotoViewer" component={PhotoViewerScreen} />
      <Stack.Screen name="FlagIssue" component={FlagIssueScreen} />
      <Stack.Screen name="CallScreen" component={CallScreen} />
      <Stack.Screen name="SendNote" component={SendNoteScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
