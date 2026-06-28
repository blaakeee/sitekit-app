import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii, shadows } from '../theme';
import { useJobs, useCrew } from '../contexts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CrewList'>;

export function CrewListScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { jobs } = useJobs();
  const { crew } = useCrew();

  const job = jobs.find((j) => j.id === jobId);

  const assignedCrew = job?.assignedMemberIds?.length
    ? crew.filter((m) => job.assignedMemberIds!.includes(m.id))
    : crew;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Crew</Text>
          {job && (
            <MonoLabel>{job.code} · {job.address.toUpperCase()}</MonoLabel>
          )}
        </View>
      </View>

      <MonoLabel style={styles.sectionLabel}>On this job · {assignedCrew.length}</MonoLabel>

      <View style={styles.list}>
        {assignedCrew.map((member) => (
          <Pressable
            key={member.id}
            style={styles.memberCard}
            onPress={() => navigation.navigate('EmployeeProfile', { employeeId: member.id, jobId })}
          >
            <View style={[styles.avatar, { backgroundColor: member.color }]}>
              <Text style={styles.avatarText}>{member.initials}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
            <View style={styles.statusDot}>
              <View style={[styles.dot, member.online ? styles.dotOnline : styles.dotOffline]} />
            </View>
            <Icon name="chevron_right" size={26} color={colors.textMuted} />
          </Pressable>
        ))}
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
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    padding: 16,
    ...shadows.card,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.textInverse,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
  },
  memberRole: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusDot: {
    paddingRight: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: colors.green,
  },
  dotOffline: {
    backgroundColor: colors.textMuted,
  },
});
