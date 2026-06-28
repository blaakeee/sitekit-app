import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useAuth, useData } from '../contexts';
import { useJobCaptures } from '../hooks/useJobCaptures';
import { completeJob } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FinishJob'>;

export function FinishJobScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { orgId } = useAuth();
  const { jobs } = useData();
  const { data: captures } = useJobCaptures(jobId);

  const job = jobs.find((j) => j.id === jobId);

  const [emailCustomer, setEmailCustomer] = useState(true);
  const [completing, setCompleting] = useState(false);

  const captureCount = captures.length;
  const timeOnSite = job?.timeOnSite ?? '—';
  const quoted = job?.quotedAmount != null ? `$${job.quotedAmount}` : '—';

  const handleComplete = async () => {
    if (!orgId) {
      Alert.alert('Not signed in', 'Sign in to complete jobs.');
      return;
    }

    setCompleting(true);
    try {
      await completeJob(orgId, jobId);
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Failed to complete', error.message);
      setCompleting(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View>
          <Text style={styles.headerTitle}>Finish job</Text>
          {job && (
            <MonoLabel>{job.code} · {job.address.toUpperCase()}</MonoLabel>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{captureCount}</Text>
            <Text style={styles.statLabel}>captures</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{timeOnSite}</Text>
            <Text style={styles.statLabel}>on site</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{quoted}</Text>
            <Text style={styles.statLabel}>quoted</Text>
          </View>
        </View>

        {/* Signature */}
        <MonoLabel style={styles.signLabel}>Customer sign-off</MonoLabel>
        <View style={styles.signatureBox}>
          <Text style={styles.signaturePlaceholder}>Sign here</Text>
        </View>

        {/* Email checkbox */}
        <Pressable
          style={styles.checkRow}
          onPress={() => setEmailCustomer((v) => !v)}
        >
          <View style={[styles.checkBox, !emailCustomer && styles.checkBoxOff]}>
            {emailCustomer && <Icon name="check" size={18} color={colors.textInverse} />}
          </View>
          <Text style={styles.checkText}>Email summary + photos to customer</Text>
        </Pressable>
      </View>

      {/* Complete button */}
      <View style={styles.bottomActions}>
        <Pressable
          style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Icon name="cloud_done" size={24} color={colors.textInverse} />
              <Text style={styles.completeBtnText}>Complete & sync</Text>
            </>
          )}
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
  headerTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
  },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
  },
  statValue: {
    fontFamily: fonts.monoBold,
    fontSize: 24,
    color: colors.dark,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  signLabel: {
    marginBottom: -6,
  },
  signatureBox: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signaturePlaceholder: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textMuted,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxOff: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.dark,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 'auto',
  },
  completeBtn: {
    width: '100%',
    height: 58,
    borderRadius: radii.lg,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeBtnDisabled: {
    opacity: 0.6,
  },
  completeBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
  },
});
