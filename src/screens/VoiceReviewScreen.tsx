import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useAuth } from '../contexts';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { transcribeAudio, parseTranscript } from '../services/transcriptionService';
import { addCapture } from '../services/firestoreService';
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

export function VoiceReviewScreen({ navigation, route }: Props) {
  const { orgId } = useAuth();
  const { isConnected } = useNetworkStatus();
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
      Alert.alert('Transcription failed', error.message);
    }
  };

  const handleAddAll = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      for (const entry of entries) {
        await addCapture(orgId, jobId, {
          type: entry.category === 'materials' ? 'materials' : entry.category === 'issue' ? 'issue' : 'voice',
          title: entry.title,
          subtitle: entry.detail ?? '',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioUri: audioUri ?? undefined,
          transcript: transcript ?? undefined,
          parsedEntries: entries,
        });
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Check & confirm</Text>
      </View>

      <View style={styles.content}>
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
            <Pressable style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>Back to job</Text>
            </Pressable>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.queuedCard}>
            <Icon name="error" size={32} color={colors.red} />
            <Text style={styles.queuedTitle}>Transcription failed</Text>
            <Pressable style={styles.retryBtn} onPress={processAudio}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
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
                <View key={idx} style={[styles.entryCard, { borderLeftColor: config.borderColor }]}>
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
  retryBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  retryBtnText: { fontFamily: fonts.headingHeavy, fontSize: 15, color: colors.textInverse },
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
