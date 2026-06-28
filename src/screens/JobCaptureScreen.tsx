import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii, shadows } from '../theme';
import { useJobs, useCrew } from '../contexts';
import { useJobCaptures } from '../hooks/useJobCaptures';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobCapture'>;

const captureIconMap: Record<string, { bg: string; color: string }> = {
  voice: { bg: colors.blueLight, color: colors.blue },
  photo: { bg: colors.goldLight, color: colors.goldDark },
  materials: { bg: '#ede9df', color: colors.dark },
  issue: { bg: colors.redLight, color: colors.red },
};

const captureIconName: Record<string, string> = {
  voice: 'mic',
  photo: 'photo_camera',
  materials: 'inventory_2',
  issue: 'report',
};

export function JobCaptureScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { jobs } = useJobs();
  const { crew } = useCrew();
  const { data: captures, loading: capturesLoading } = useJobCaptures(jobId);

  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Job not found</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const assignedCrew = job.assignedMemberIds?.length
    ? crew.filter((m) => job.assignedMemberIds!.includes(m.id))
    : crew;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{job.address}</Text>
          <MonoLabel>{job.code} · {job.timeOnSite ?? '00:00'} ON SITE</MonoLabel>
        </View>
      </View>

      {/* Crew on site */}
      <View style={styles.section}>
        <View style={styles.crewCard}>
          <View style={styles.crewHeader}>
            <MonoLabel>Crew on site · {assignedCrew.length}</MonoLabel>
            <Pressable
              style={styles.manageLink}
              onPress={() => navigation.navigate('CrewList', { jobId: job.id })}
            >
              <Text style={styles.manageLinkText}>Manage</Text>
              <Icon name="chevron_right" size={18} color={colors.blue} />
            </Pressable>
          </View>
          <View style={styles.crewAvatars}>
            {assignedCrew.map((member, idx) => (
              <Pressable
                key={member.id}
                style={styles.crewMember}
                onPress={() => navigation.navigate('EmployeeProfile', { employeeId: member.id, jobId: job.id })}
              >
                <View style={[
                  styles.crewAvatar,
                  { backgroundColor: member.color },
                  idx === 0 && styles.crewAvatarLead,
                ]}>
                  <Text style={styles.crewInitials}>{member.initials}</Text>
                </View>
                <Text style={styles.crewName}>{member.name}</Text>
                <Text style={idx === 0 ? styles.crewRoleLead : styles.crewRole}>
                  {idx === 0 ? 'Lead' : member.role.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Capture Buttons */}
      <MonoLabel style={styles.sectionLabel}>Capture</MonoLabel>
      <View style={styles.captureGrid}>
        <Pressable
          style={[styles.captureButton, { backgroundColor: colors.blue }, shadows.buttonBlue]}
          onPress={() => navigation.navigate('VoiceRecord', { jobId: job.id })}
        >
          <Icon name="mic" size={44} color={colors.textInverse} />
          <Text style={styles.captureButtonText}>VOICE NOTE</Text>
        </Pressable>
        <Pressable style={[styles.captureButton, { backgroundColor: colors.gold }, shadows.buttonGold]}>
          <Icon name="photo_camera" size={44} color={colors.dark} />
          <Text style={[styles.captureButtonText, { color: colors.dark }]}>PHOTO</Text>
        </Pressable>
        <Pressable style={[styles.captureButton, { backgroundColor: colors.dark }, shadows.buttonDark]}>
          <Icon name="schedule" size={44} color={colors.textInverse} />
          <Text style={styles.captureButtonText}>TIME + PARTS</Text>
        </Pressable>
        <Pressable style={[styles.captureButton, { backgroundColor: colors.red }, shadows.buttonRed]}>
          <Icon name="report" size={44} color={colors.textInverse} />
          <Text style={styles.captureButtonText}>FLAG ISSUE</Text>
        </Pressable>
      </View>

      {/* Captured Items */}
      <MonoLabel style={styles.sectionLabel}>
        Captured · {capturesLoading ? '…' : `${captures.length} items`}
      </MonoLabel>
      {capturesLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.blue} />
        </View>
      ) : captures.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="mic_none" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No captures yet</Text>
          <Text style={styles.emptySubtext}>Use the buttons above to record</Text>
        </View>
      ) : (
        <View style={styles.capturedList}>
          {captures.map((item) => {
            const iconStyle = captureIconMap[item.type] ?? captureIconMap.voice;
            return (
              <Pressable
                key={item.id}
                style={styles.capturedItem}
                onPress={() => {
                  if (item.type === 'voice') {
                    navigation.navigate('VoiceReview', { jobId: job.id, audioUri: item.audioUri });
                  }
                }}
              >
                <View style={[styles.capturedIcon, { backgroundColor: iconStyle.bg }]}>
                  <Icon name={captureIconName[item.type] ?? 'description'} size={22} color={iconStyle.color} />
                </View>
                <View style={styles.capturedText}>
                  <Text style={styles.capturedTitle}>{item.title}</Text>
                  <Text style={styles.capturedSub} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                <Text style={styles.capturedTime}>{item.time}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable
          style={styles.addonBtn}
          onPress={() => navigation.navigate('Estimate', { jobId: job.id, mode: 'addon' })}
        >
          <Icon name="add_circle" size={20} color={colors.dark} />
          <Text style={styles.addonBtnText}>Add-on</Text>
        </Pressable>
        <Pressable
          style={styles.finishBtn}
          onPress={() => navigation.navigate('FinishJob', { jobId: job.id })}
        >
          <Text style={styles.finishBtnText}>Finish job</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
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
  section: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  crewCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 14,
  },
  crewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageLinkText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.blue,
  },
  crewAvatars: {
    flexDirection: 'row',
    gap: 6,
  },
  crewMember: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  crewAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarLead: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  crewInitials: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
  },
  crewName: {
    fontFamily: fonts.heading,
    fontSize: 13,
    lineHeight: 14,
    color: colors.dark,
    textAlign: 'center',
  },
  crewRoleLead: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.goldDark,
    textTransform: 'uppercase',
  },
  crewRole: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  captureGrid: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  captureButton: {
    width: '47%',
    flexGrow: 1,
    height: 128,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  captureButtonText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textInverse,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyText: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptySubtext: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
  },
  capturedList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  capturedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
  },
  capturedIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedText: {
    flex: 1,
  },
  capturedTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.dark,
  },
  capturedSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  capturedTime: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textTertiary,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 'auto',
  },
  addonBtn: {
    flex: 1,
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addonBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.dark,
  },
  finishBtn: {
    flex: 1.4,
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.textInverse,
  },
});
