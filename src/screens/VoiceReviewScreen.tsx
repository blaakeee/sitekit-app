import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { writeBatch, doc, collection, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useAuth } from '../contexts';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useQueueStatus } from '../hooks/useQueueStatus';
import { transcribeAudio, parseTranscript } from '../services/transcriptionService';
import * as queueService from '../services/queueService';
import type { ParsedEntry } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceReview'>;

const categoryConfig: Record<ParsedEntry['category'], { icon: string; color: string; label: string; borderColor: string }> = {
  materials: { icon: 'inventory_2', color: colors.blue, label: 'MATERIALS', borderColor: colors.blue },
  time: { icon: 'schedule', color: colors.dark, label: 'TIME', borderColor: colors.dark },
  issue: { icon: 'report', color: colors.red, label: 'ISSUE FLAGGED', borderColor: colors.red },
  note: { icon: 'description', color: colors.textSecondary, label: 'NOTE', borderColor: colors.textSecondary },
};

function entryKey(entry: ParsedEntry, idx: number): string {
  return `${entry.category}_${entry.title.slice(0, 20).replace(/\s/g, '_')}_${idx}`;
}

export function VoiceReviewScreen({ navigation, route }: Props) {
  const { orgId } = useAuth();
  const { isConnected } = useNetworkStatus();
  const queueStatus = useQueueStatus();
  const { jobId, audioUri } = route.params;

  const [transcript, setTranscript] = useState<string | null>(null);
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [stage, setStage] = useState<'transcribing' | 'sorting' | 'done' | 'queued' | 'error'>('transcribing');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!audioUri) {
      setStage('done');
      setTranscript('"Replaced two downlights in the hallway, LED 6W. About thirty minutes labour. Cracked tile near the door."');
      setEntries([
        { category: 'materials', title: 'Downlight LED 6W', quantity: 2 },
        { category: 'time', title: 'Hallway lighting', detail: '0.5 hr' },
        { category: 'issue', title: 'Cracked tile near door' },
      ]);
      return;
    }

    if (!isConnected) {
      handleOfflineQueue();
      return;
    }

    processAudio();
  }, [audioUri, isConnected]);

  const handleOfflineQueue = async () => {
    if (!orgId || !audioUri) return;
    await queueService.enqueue({
      type: 'transcribe',
      audioUri,
      jobId,
      orgId,
      createdAt: Date.now(),
    });
    setStage('queued');
  };

  const processAudio = async () => {
    if (!audioUri) return;
    try {
      setStage('transcribing');
      const text = await transcribeAudio(audioUri);
      setTranscript(text);

      setStage('sorting');
      const parsed = await parseTranscript(text);
      setEntries(parsed);

      setStage('done');
    } catch (error: any) {
      console.error('Transcription error:', error);
      setStage('error');
    }
  };

  const handleQueueForLater = async () => {
    if (!orgId || !audioUri) return;
    await queueService.enqueue({
      type: 'transcribe',
      audioUri,
      jobId,
      orgId,
      createdAt: Date.now(),
    });
    navigation.goBack();
  };

  const handleAddAll = async () => {
    if (!orgId) {
      Alert.alert('Not signed in', 'Sign in to save captures to your organization.');
      return;
    }
    if (entries.length === 0) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
      const capturesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'captures');
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      for (const entry of entries) {
        const captureRef = doc(capturesRef);
        batch.set(captureRef, {
          type: entry.category === 'materials' ? 'materials' : entry.category === 'issue' ? 'issue' : 'voice',
          title: entry.title,
          subtitle: entry.detail ?? '',
          time: now,
          audioUri: audioUri ?? null,
          transcript: transcript ?? null,
          parsedEntries: entries,
          createdAt: Date.now(),
        });
      }

      batch.update(jobRef, { captureCount: increment(entries.length) });
      await batch.commit();

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const totalQueued = queueStatus.pending + queueStatus.processing;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Check & confirm</Text>
      </View>

      <View style={styles.content}>
        {/* Queue status banner */}
        {totalQueued > 0 && stage !== 'queued' && (
          <View style={styles.queueBanner}>
            <Icon name="cloud_sync" size={18} color={colors.gold} />
            <Text style={styles.queueBannerText}>
              {totalQueued} recording{totalQueued !== 1 ? 's' : ''} waiting to sync
            </Text>
          </View>
        )}
        {queueStatus.failed > 0 && (
          <Pressable
            style={styles.failedBanner}
            onPress={async () => {
              const items = await queueService.getFailedItems();
              Alert.alert(
                `${items.length} failed recording${items.length !== 1 ? 's' : ''}`,
                'These recordings could not be transcribed after multiple attempts.',
                [
                  { text: 'Dismiss', style: 'cancel' },
                  {
                    text: 'Retry all',
                    onPress: async () => {
                      for (const item of items) {
                        await queueService.retryFailed(item.id);
                      }
                      queueStatus.refresh();
                    },
                  },
                ]
              );
            }}
          >
            <Icon name="error" size={18} color={colors.red} />
            <Text style={styles.failedBannerText}>
              {queueStatus.failed} failed — tap to retry
            </Text>
          </Pressable>
        )}

        {/* Loading states */}
        {stage === 'transcribing' && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.blue} />
            <Text style={styles.loadingText}>Transcribing audio...</Text>
          </View>
        )}

        {stage === 'sorting' && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.loadingText}>Sorting into categories...</Text>
          </View>
        )}

        {stage === 'queued' && (
          <View style={styles.queuedCard}>
            <Icon name="cloud_off" size={32} color={colors.gold} />
            <Text style={styles.queuedTitle}>Queued for processing</Text>
            <Text style={styles.queuedSub}>No connection — the recording will be transcribed when you're back online.</Text>
            {totalQueued > 1 && (
              <Text style={styles.queuedCount}>{totalQueued} total recordings in queue</Text>
            )}
            <Pressable style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Back to job</Text>
            </Pressable>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.queuedCard}>
            <Icon name="error" size={32} color={colors.red} />
            <Text style={styles.queuedTitle}>Transcription failed</Text>
            <Text style={styles.queuedSub}>The recording couldn't be processed right now.</Text>
            <View style={styles.errorActions}>
              <Pressable style={styles.retryBtn} onPress={processAudio}>
                <Icon name="refresh" size={18} color={colors.textInverse} />
                <Text style={styles.retryBtnText}>Retry now</Text>
              </Pressable>
              <Pressable style={styles.queueLaterBtn} onPress={handleQueueForLater}>
                <Icon name="schedule" size={18} color={colors.dark} />
                <Text style={styles.queueLaterBtnText}>Queue for later</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Results */}
        {stage === 'done' && (
          <>
            {transcript && (
              <View style={styles.transcriptCard}>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            )}

            <MonoLabel>Sorted into {entries.length} {entries.length === 1 ? 'entry' : 'entries'}</MonoLabel>

            {entries.map((entry, idx) => {
              const config = categoryConfig[entry.category];
              return (
                <View key={entryKey(entry, idx)} style={[styles.entryCard, { borderLeftColor: config.borderColor }]}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryLabel}>
                      <Icon name={config.icon} size={16} color={config.color} />
                      <Text style={[styles.entryLabelText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <Icon name="edit" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  {entry.detail && <Text style={styles.entryDetail}>{entry.detail}</Text>}
                  {entry.quantity != null && (
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>Qty:</Text>
                      <View style={styles.quantityControl}>
                        <Icon name="remove" size={22} color={colors.textSecondary} />
                        <Text style={styles.quantityText}>{entry.quantity}</Text>
                        <Icon name="add" size={22} color={colors.blue} />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </View>

      {stage === 'done' && (
        <View style={styles.bottomActions}>
          <Pressable style={styles.discardBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.discardBtnText}>Discard</Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={handleAddAll} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Icon name="check" size={22} color={colors.textInverse} />
                <Text style={styles.addBtnText}>Add all to job</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
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
  headerTitle: { fontFamily: fonts.headingHeavy, fontSize: 18, color: colors.dark },
  content: { paddingHorizontal: 20, gap: 14 },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  queueBannerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.goldDark,
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.redLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  failedBannerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.red,
  },
  loadingCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: { fontFamily: fonts.headingHeavy, fontSize: 16, color: colors.dark },
  queuedCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  queuedTitle: { fontFamily: fonts.headingHeavy, fontSize: 18, color: colors.dark },
  queuedSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  queuedCount: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
  },
  doneBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.textInverse },
  errorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  retryBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retryBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.textInverse },
  queueLaterBtn: {
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
  queueLaterBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.dark },
  transcriptCard: {
    backgroundColor: colors.dark,
    borderRadius: radii.xl,
    padding: 16,
  },
  transcriptText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    color: colors.textInverse,
  },
  entryCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 14,
    borderLeftWidth: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLabel: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  entryLabelText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  entryTitle: { fontFamily: fonts.headingHeavy, fontSize: 17, color: colors.dark, marginTop: 8 },
  entryDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quantityLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quantityText: { fontFamily: fonts.monoBold, fontSize: 17, color: colors.dark },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 'auto',
  },
  discardBtn: {
    flex: 1,
    height: 54,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.dark },
  addBtn: {
    flex: 1.6,
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.textInverse },
});
