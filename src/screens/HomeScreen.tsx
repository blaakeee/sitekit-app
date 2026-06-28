import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel } from '../components';
import { colors, fonts, radii, shadows } from '../theme';
import { useJobs, useInventory } from '../contexts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

export function HomeScreen({ navigation }: Props) {
  const { jobs } = useJobs();
  const { inventoryItems } = useInventory();

  const now = new Date();
  const dayLabel = `${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;
  const scheduledCount = jobs.filter((j) => j.status !== 'completed').length;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MonoLabel style={styles.logo}>SITEKIT</MonoLabel>
          <View style={styles.avatar}>
            <Icon name="person" size={22} color={colors.textInverse} />
          </View>
        </View>
        <Text style={styles.title}>Today's jobs</Text>
        <MonoLabel>{dayLabel} · {scheduledCount} SCHEDULED</MonoLabel>
      </View>

      {/* New Estimate Button */}
      <View style={styles.section}>
        <Pressable
          style={[styles.estimateBtn, shadows.buttonGold]}
          onPress={() => navigation.navigate('Estimate', { mode: 'new' })}
        >
          <View style={styles.estimateIcon}>
            <Icon name="request_quote" size={28} color={colors.gold} />
          </View>
          <View style={styles.btnTextWrap}>
            <Text style={styles.btnTitle}>New estimate</Text>
            <Text style={styles.btnSubGold}>Quote a customer — opens a new job</Text>
          </View>
          <Icon name="arrow_forward" size={26} color={colors.dark} />
        </Pressable>
      </View>

      {/* Daily Inventory Button */}
      <View style={styles.section}>
        <Pressable
          style={[styles.inventoryBtn, shadows.buttonDark]}
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={styles.inventoryIcon}>
            <Icon name="inventory_2" size={28} color={colors.gold} />
          </View>
          <View style={styles.btnTextWrap}>
            <Text style={styles.btnTitleLight}>Daily inventory</Text>
            <Text style={styles.btnSubMuted}>{inventoryItems.length} items across today's jobs</Text>
          </View>
          <Icon name="arrow_forward" size={26} color={colors.textInverse} />
        </Pressable>
      </View>

      {/* Scheduled Jobs */}
      <MonoLabel style={styles.sectionLabel}>Scheduled jobs</MonoLabel>
      <View style={styles.jobsList}>
        {jobs.map((job) => (
          <View
            key={job.id}
            style={[
              styles.jobCard,
              job.status === 'on_site' && styles.jobCardActive,
            ]}
          >
            <Pressable onPress={() => navigation.navigate('JobCapture', { jobId: job.id })}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobCode}>{job.code}</Text>
                <View style={[
                  styles.statusBadge,
                  job.status === 'on_site' ? styles.statusOnSite : styles.statusScheduled,
                ]}>
                  <Text style={[
                    styles.statusText,
                    job.status === 'on_site' ? styles.statusTextOnSite : styles.statusTextScheduled,
                  ]}>
                    {job.status === 'on_site' ? 'On site' : job.scheduledTime}
                  </Text>
                </View>
              </View>
              <Text style={styles.jobAddress}>{job.address}</Text>
              <Text style={styles.jobDetail}>{job.trade} · {job.description}</Text>
            </Pressable>

            <View style={styles.jobActions}>
              <Pressable style={styles.navBtn}>
                <Icon name="navigation" size={18} color={colors.textSecondary} />
                <Text style={styles.navBtnText}>Navigate to</Text>
              </Pressable>
              <Pressable
                style={styles.captureBtn}
                onPress={() => navigation.navigate('JobCapture', { jobId: job.id })}
              >
                <Icon
                  name={job.status === 'on_site' ? 'arrow_forward' : 'location_on'}
                  size={18}
                  color={colors.textInverse}
                />
                <Text style={styles.captureBtnText}>
                  {job.status === 'on_site' ? 'Capture work' : 'On site'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontFamily: fonts.monoBold,
    fontSize: 13,
    letterSpacing: 2.6,
    color: colors.dark,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.headingBlack,
    fontSize: 30,
    letterSpacing: -0.3,
    color: colors.dark,
    marginTop: 18,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  estimateBtn: {
    backgroundColor: colors.gold,
    borderRadius: radii.xxl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  estimateIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextWrap: {
    flex: 1,
  },
  btnTitle: {
    fontFamily: fonts.headingBlack,
    fontSize: 18,
    lineHeight: 20,
    color: colors.dark,
  },
  btnTitleLight: {
    fontFamily: fonts.headingBlack,
    fontSize: 18,
    lineHeight: 20,
    color: colors.textInverse,
  },
  btnSubGold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.goldText,
    marginTop: 3,
  },
  btnSubMuted: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 3,
  },
  inventoryBtn: {
    backgroundColor: colors.dark,
    borderRadius: radii.xxl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  inventoryIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    backgroundColor: colors.darkSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobsList: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  jobCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadows.card,
  },
  jobCardActive: {
    borderLeftWidth: 5,
    borderLeftColor: colors.gold,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCode: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusOnSite: {
    backgroundColor: colors.gold,
  },
  statusScheduled: {
    backgroundColor: '#eee9dd',
  },
  statusText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  statusTextOnSite: {
    color: colors.dark,
  },
  statusTextScheduled: {
    color: colors.textSecondary,
  },
  jobAddress: {
    fontFamily: fonts.headingHeavy,
    fontSize: 20,
    color: colors.dark,
    marginTop: 10,
  },
  jobDetail: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 3,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  navBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.textSecondary,
  },
  captureBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  captureBtnText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.textInverse,
  },
});
