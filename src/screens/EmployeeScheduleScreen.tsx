import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useData } from '../contexts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeSchedule'>;

export function EmployeeScheduleScreen({ route }: Props) {
  const { crew } = useData();
  const employee = crew.find((e) => e.id === route.params.employeeId) ?? crew[0];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{employee.name}</Text>
          <MonoLabel>SCHEDULE · {employee.shiftSummary || 'THIS WEEK'}</MonoLabel>
        </View>
      </View>

      <View style={styles.list}>
        {employee.schedule.map((day) => (
          <View key={day.day} style={styles.dayRow}>
            <View style={styles.dayLabel}>
              <Text style={styles.dayName}>{day.day.toUpperCase()}</Text>
              <Text style={styles.dayDate}>{day.date}</Text>
            </View>
            {day.isOff ? (
              <View style={styles.offCard}>
                <Text style={styles.offText}>Rest day</Text>
              </View>
            ) : (
              <View style={styles.jobCard}>
                <View style={[styles.jobDot, { backgroundColor: day.dot }]} />
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{day.job}</Text>
                  <Text style={styles.jobDetail}>{day.detail}</Text>
                </View>
                <Text style={styles.jobTime}>{day.time}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    lineHeight: 20,
    color: colors.dark,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 10,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  dayLabel: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  dayDate: {
    fontFamily: fonts.headingBlack,
    fontSize: 22,
    lineHeight: 24,
    color: colors.dark,
  },
  jobCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  jobDot: {
    width: 6,
    alignSelf: 'stretch',
    borderRadius: 3,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.dark,
  },
  jobDetail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  jobTime: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  offCard: {
    flex: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d6d0c3',
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
    justifyContent: 'center',
  },
  offText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textDisabled,
  },
});
