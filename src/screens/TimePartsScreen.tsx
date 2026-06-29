import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { writeBatch, doc, collection, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useAuth, useJobs } from '../contexts';
import { ensureJobExists } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TimeParts'>;

type PartEntry = {
  id: string;
  name: string;
  qty: string;
};

let nextId = 1;
function makeId() {
  return `tp_${Date.now()}_${nextId++}`;
}

export function TimePartsScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { orgId } = useAuth();
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.id === jobId);

  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [parts, setParts] = useState<PartEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const addPart = () => {
    setParts((prev) => [...prev, { id: makeId(), name: '', qty: '1' }]);
  };

  const updatePart = (id: string, field: 'name' | 'qty', value: string) => {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
  };

  const hasTime = (hours.trim() !== '' && hours.trim() !== '0') || (minutes.trim() !== '' && minutes.trim() !== '0');
  const validParts = parts.filter((p) => p.name.trim() !== '');
  const hasContent = hasTime || validParts.length > 0;

  const handleSubmit = async () => {
    if (!hasContent) {
      Alert.alert('Nothing to log', 'Add time or at least one part.');
      return;
    }
    if (!orgId) {
      Alert.alert('Not signed in', 'Sign in to log time and parts.');
      return;
    }

    setSaving(true);
    try {
      if (job) await ensureJobExists(orgId, job);

      const batch = writeBatch(db);
      const capturesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'captures');
      const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let captureCount = 0;

      if (hasTime) {
        const h = parseInt(hours, 10) || 0;
        const m = parseInt(minutes, 10) || 0;
        const timeLabel = h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;

        const captureRef = doc(capturesRef);
        batch.set(captureRef, {
          type: 'voice',
          title: description.trim() || 'Time logged',
          subtitle: timeLabel,
          time: now,
          createdAt: Date.now(),
        });
        captureCount++;
      }

      for (const part of validParts) {
        const captureRef = doc(capturesRef);
        batch.set(captureRef, {
          type: 'materials',
          title: part.name.trim(),
          subtitle: `Qty: ${part.qty || '1'}`,
          time: now,
          createdAt: Date.now(),
        });
        captureCount++;
      }

      if (captureCount > 0) {
        batch.set(jobRef, { captureCount: increment(captureCount) }, { merge: true });
      }

      await batch.commit();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <BackButton />
          <View>
            <Text style={styles.headerTitle}>Time + Parts</Text>
            {job && <MonoLabel>{job.code} · {job.address.toUpperCase()}</MonoLabel>}
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Time entry */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="schedule" size={20} color={colors.dark} />
              <Text style={styles.sectionTitle}>Time</Text>
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={hours}
                  onChangeText={setHours}
                />
                <Text style={styles.timeUnit}>hrs</Text>
              </View>
              <View style={styles.timeField}>
                <TextInput
                  style={styles.timeInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={minutes}
                  onChangeText={setMinutes}
                />
                <Text style={styles.timeUnit}>min</Text>
              </View>
            </View>
            <TextInput
              style={styles.descInput}
              placeholder="What was done (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Parts entry */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="inventory_2" size={20} color={colors.dark} />
              <Text style={styles.sectionTitle}>Parts & materials</Text>
            </View>
            {parts.map((part) => (
              <View key={part.id} style={styles.partRow}>
                <TextInput
                  style={styles.partName}
                  placeholder="Item name"
                  placeholderTextColor={colors.textMuted}
                  value={part.name}
                  onChangeText={(v) => updatePart(part.id, 'name', v)}
                />
                <TextInput
                  style={styles.partQty}
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={part.qty}
                  onChangeText={(v) => updatePart(part.id, 'qty', v)}
                />
                <Pressable onPress={() => removePart(part.id)} hitSlop={8}>
                  <Icon name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addPartBtn} onPress={addPart}>
              <Icon name="add" size={20} color={colors.textSecondary} />
              <Text style={styles.addPartText}>Add part</Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={styles.bottomActions}>
          <Pressable
            style={[styles.submitBtn, (!hasContent || saving) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!hasContent || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Icon name="check" size={22} color={colors.textInverse} />
                <Text style={styles.submitBtnText}>Log to job</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    lineHeight: 20,
    color: colors.dark,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
  },
  timeInput: {
    flex: 1,
    fontFamily: fonts.monoBold,
    fontSize: 28,
    color: colors.dark,
    paddingVertical: 14,
  },
  timeUnit: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textSecondary,
  },
  descInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.dark,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  partName: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.dark,
    paddingVertical: 10,
  },
  partQty: {
    width: 50,
    fontFamily: fonts.monoBold,
    fontSize: 15,
    color: colors.dark,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingVertical: 10,
  },
  addPartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDash,
    borderRadius: radii.lg,
    padding: 14,
  },
  addPartText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
  },
});
