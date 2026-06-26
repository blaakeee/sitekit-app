import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useData } from '../contexts';
import { useRecorder } from '../services/audioService';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceRecord'>;

function WaveBar({ delay, color = colors.blue }: { delay: number; color?: string }) {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 450, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[styles.waveBar, { backgroundColor: color, transform: [{ scaleY: anim }] }]}
    />
  );
}

export function VoiceRecordScreen({ navigation, route }: Props) {
  const { jobs, crew } = useData();
  const job = jobs.find((j) => j.id === route.params.jobId) ?? jobs[0];
  const recorder = useRecorder();

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    return `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await recorder.start();
    } catch (error: any) {
      Alert.alert('Recording failed', error.message);
    }
  };

  const handleStopAndReview = async () => {
    try {
      const uri = await recorder.stop();
      navigation.navigate('VoiceReview', { jobId: job.id, audioUri: uri ?? undefined });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCancel = async () => {
    await recorder.cancel();
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    if (recorder.isRecording) return;
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.55, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );
    const opacAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.45, duration: 0, useNativeDriver: true }),
      ])
    );
    scaleAnim.start();
    opacAnim.start();
    return () => { scaleAnim.stop(); opacAnim.stop(); };
  }, [recorder.isRecording, pulseAnim, pulseOpacity]);

  return (
    <ScreenWrapper scroll={false}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{job.address}</Text>
          <MonoLabel>{job.code} · ON SITE</MonoLabel>
        </View>
        <View style={styles.cameraBtn}>
          <Icon name="photo_camera" size={22} color={colors.dark} />
        </View>
      </View>

      {/* Crew card */}
      <View style={styles.section}>
        <View style={styles.crewCard}>
          <View style={styles.crewHeader}>
            <MonoLabel>Crew on site · {crew.length}</MonoLabel>
            <Pressable style={styles.manageLink}>
              <Text style={styles.manageLinkText}>Manage</Text>
              <Icon name="chevron_right" size={18} color={colors.blue} />
            </Pressable>
          </View>
          <View style={styles.crewAvatars}>
            {crew.map((member, idx) => (
              <View key={member.id} style={styles.crewMember}>
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
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Idle State */}
      {!recorder.isRecording && (
        <View style={styles.idleContainer}>
          <Text style={styles.idleTitle}>Hold the mic and just talk</Text>
          <Text style={styles.idleSub}>Notes, parts, time and issues are sorted automatically.</Text>

          <Pressable onPress={handleStartRecording} style={styles.micBtnWrap}>
            <Animated.View style={[
              styles.micPulse,
              { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
            ]} />
            <View style={styles.micBtn}>
              <Icon name="mic" size={84} color={colors.textInverse} />
            </View>
          </Pressable>

          <MonoLabel style={styles.tapLabel}>Tap to start</MonoLabel>

          <Pressable
            style={styles.addonLink}
            onPress={() => navigation.navigate('Estimate', { jobId: job.id, mode: 'addon' })}
          >
            <Icon name="add_circle" size={20} color={colors.dark} />
            <Text style={styles.addonLinkText}>Add-on work / quote</Text>
          </Pressable>
        </View>
      )}

      {/* Recording State */}
      {recorder.isRecording && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingBadgeText}>RECORDING · {formatTime(recorder.durationMs)}</Text>
          </View>

          <View style={styles.waveContainer}>
            {[0, 100, 250, 150, 350, 50, 300, 200, 120].map((delay, i) => (
              <WaveBar key={i} delay={delay} color={i === 3 || i === 6 ? colors.gold : colors.blue} />
            ))}
          </View>

          <View style={styles.listeningBox}>
            <Icon name="mic" size={28} color={colors.blue} />
            <Text style={styles.listeningText}>Listening...</Text>
            <Text style={styles.listeningHint}>Transcript will appear after you stop</Text>
          </View>

          <View style={styles.recordingActions}>
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.stopBtn} onPress={handleStopAndReview}>
              <Icon name="stop" size={22} color={colors.textInverse} />
              <Text style={styles.stopBtnText}>Stop & review</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  headerText: { flex: 1 },
  headerTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    lineHeight: 20,
    color: colors.dark,
  },
  cameraBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { paddingHorizontal: 20, paddingBottom: 6 },
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
  manageLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  manageLinkText: { fontFamily: fonts.heading, fontSize: 13, color: colors.blue },
  crewAvatars: { flexDirection: 'row', gap: 6 },
  crewMember: { flex: 1, alignItems: 'center', gap: 6 },
  crewAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewAvatarLead: { borderWidth: 2, borderColor: colors.gold },
  crewInitials: { fontFamily: fonts.headingHeavy, fontSize: 16, color: colors.textInverse },
  crewName: { fontFamily: fonts.heading, fontSize: 13, lineHeight: 14, color: colors.dark, textAlign: 'center' },
  crewRoleLead: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.goldDark,
    textTransform: 'uppercase',
  },
  crewRole: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  idleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  idleTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 22,
    color: colors.dark,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 28,
  },
  idleSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 8,
  },
  micBtnWrap: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
  micPulse: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: colors.blue,
  },
  micBtn: {
    width: 184,
    height: 184,
    borderRadius: 92,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(26,58,143,0.35)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 12,
  },
  tapLabel: { marginTop: 32 },
  addonLink: {
    marginTop: 22,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addonLinkText: { fontFamily: fonts.headingHeavy, fontSize: 14, color: colors.dark },
  recordingContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },
  recordingBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
  recordingDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.red },
  recordingBadgeText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.1, color: colors.red },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 60,
    marginVertical: 22,
  },
  waveBar: { width: 5, height: 46, borderRadius: 3 },
  listeningBox: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  listeningText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
  },
  listeningHint: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
  },
  cancelBtn: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.dark },
  stopBtn: {
    flex: 1,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.textInverse },
});
