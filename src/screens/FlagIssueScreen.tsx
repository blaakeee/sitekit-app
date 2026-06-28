import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useAuth, useJobs } from '../contexts';
import { addCapture, ensureJobExists } from '../services/firestoreService';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FlagIssue'>;

type Severity = 'low' | 'medium' | 'high';

const severityConfig: Record<Severity, { label: string; icon: string; color: string; bg: string }> = {
  low: { label: 'Low', icon: 'info', color: colors.textSecondary, bg: '#eee9dd' },
  medium: { label: 'Medium', icon: 'warning', color: colors.goldDark, bg: colors.goldLight },
  high: { label: 'High', icon: 'error', color: colors.red, bg: colors.redLight },
};

export function FlagIssueScreen({ navigation, route }: Props) {
  const { jobId } = route.params;
  const { orgId } = useAuth();
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.id === jobId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Describe the issue in a few words.');
      return;
    }
    if (!orgId) {
      Alert.alert('Not signed in', 'Sign in to flag issues.');
      return;
    }

    setSaving(true);
    try {
      if (job) {
        await ensureJobExists(orgId, job);
      }
      await addCapture(orgId, jobId, {
        type: 'issue',
        title: title.trim(),
        subtitle: `${severityConfig[severity].label} priority${description.trim() ? ' — ' + description.trim() : ''}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
      });
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
            <Text style={styles.headerTitle}>Flag issue</Text>
            {job && <MonoLabel>{job.code} · {job.address.toUpperCase()}</MonoLabel>}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.iconRow}>
            <View style={styles.issueIcon}>
              <Icon name="report" size={32} color={colors.red} />
            </View>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="What's the issue?"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <TextInput
            style={styles.descriptionInput}
            placeholder="Details (optional)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />

          <MonoLabel style={styles.severityLabel}>Severity</MonoLabel>
          <View style={styles.severityRow}>
            {(['low', 'medium', 'high'] as Severity[]).map((level) => {
              const config = severityConfig[level];
              const selected = severity === level;
              return (
                <Pressable
                  key={level}
                  style={[
                    styles.severityBtn,
                    { backgroundColor: selected ? config.bg : colors.cardBg },
                    selected && { borderColor: config.color },
                  ]}
                  onPress={() => setSeverity(level)}
                >
                  <Icon name={config.icon} size={20} color={selected ? config.color : colors.textMuted} />
                  <Text style={[
                    styles.severityBtnText,
                    { color: selected ? config.color : colors.textSecondary },
                  ]}>
                    {config.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.bottomActions}>
          <Pressable
            style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Icon name="report" size={22} color={colors.textInverse} />
                <Text style={styles.submitBtnText}>Flag issue</Text>
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
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  iconRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  issueIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  descriptionInput: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.dark,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
  },
  severityLabel: {
    paddingTop: 4,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  severityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  severityBtnText: {
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 'auto',
  },
  submitBtn: {
    width: '100%',
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
  },
});
