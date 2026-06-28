import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii, shadows } from '../theme';
import { useCrew } from '../contexts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeProfile'>;

export function EmployeeProfileScreen({ navigation, route }: Props) {
  const { crew } = useCrew();
  const employee = crew.find((e) => e.id === route.params.employeeId) ?? crew[0];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Crew member</Text>
      </View>

      {/* Profile */}
      <View style={styles.profile}>
        <View style={[styles.avatarLarge, { backgroundColor: employee.color }]}>
          <Text style={styles.avatarText}>{employee.initials}</Text>
        </View>
        <Text style={styles.profileName}>{employee.name}</Text>
        <Text style={styles.profileRole}>{employee.role}</Text>
        <View style={styles.statusRow}>
          {employee.online ? (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>On site now</Text>
            </View>
          ) : (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Off site</Text>
            </View>
          )}
          <Text style={styles.phone}>{employee.phone}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionGrid}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.blue }, shadows.buttonBlue]}
          onPress={() => navigation.navigate('CallScreen', { employeeId: employee.id })}
        >
          <Icon name="call" size={38} color={colors.textInverse} />
          <Text style={styles.actionBtnText}>CALL</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.gold }, shadows.buttonGold]}
          onPress={() => navigation.navigate('SendNote', { employeeId: employee.id })}
        >
          <Icon name="sms" size={38} color={colors.dark} />
          <Text style={[styles.actionBtnText, { color: colors.dark }]}>SEND NOTE</Text>
        </Pressable>
      </View>

      {/* Detail links */}
      <MonoLabel style={styles.sectionLabel}>Details</MonoLabel>
      <View style={styles.detailList}>
        <Pressable
          style={styles.detailRow}
          onPress={() => navigation.navigate('EmployeeSchedule', { employeeId: employee.id })}
        >
          <View style={[styles.detailIcon, { backgroundColor: colors.blueLight }]}>
            <Icon name="calendar_month" size={26} color={colors.blue} />
          </View>
          <View style={styles.detailText}>
            <Text style={styles.detailTitle}>This week's schedule</Text>
            <Text style={styles.detailSub}>{employee.shiftSummary}</Text>
          </View>
          <Icon name="chevron_right" size={26} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={styles.detailRow}
          onPress={() => navigation.navigate('EmployeeCerts', { employeeId: employee.id })}
        >
          <View style={[styles.detailIcon, { backgroundColor: colors.goldLight }]}>
            <Icon name="workspace_premium" size={26} color={colors.goldDark} />
          </View>
          <View style={styles.detailText}>
            <Text style={styles.detailTitle}>Certifications</Text>
            <Text style={styles.detailSub}>{employee.certSummary}</Text>
          </View>
          <Icon name="chevron_right" size={26} color={colors.textMuted} />
        </Pressable>
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
  headerTitle: {
    flex: 1,
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
  },
  profile: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 10,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.headingBlack,
    fontSize: 30,
    color: colors.textInverse,
  },
  profileName: {
    fontFamily: fonts.headingBlack,
    fontSize: 24,
    letterSpacing: -0.24,
    color: colors.dark,
  },
  profileRole: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  onlineText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.66,
    textTransform: 'uppercase',
    color: colors.green,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eee9dd',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  offlineText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.66,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  phone: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 13,
    color: colors.dark,
  },
  actionGrid: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 108,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textInverse,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  detailList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 16,
  },
  detailIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
  },
  detailTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
  },
  detailSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
