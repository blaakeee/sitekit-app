import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceReview'>;

export function VoiceReviewScreen({ navigation }: Props) {
  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Check & confirm</Text>
      </View>

      <View style={styles.content}>
        {/* Original transcript */}
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptText}>
            "Replaced two downlights in the hallway, LED 6W. About thirty minutes labour. Cracked tile near the door."
          </Text>
        </View>

        <MonoLabel>Sorted into 3 entries</MonoLabel>

        {/* Materials entry */}
        <View style={[styles.entryCard, { borderLeftColor: colors.blue }]}>
          <View style={styles.entryHeader}>
            <View style={styles.entryLabel}>
              <Icon name="inventory_2" size={16} color={colors.blue} />
              <Text style={[styles.entryLabelText, { color: colors.blue }]}>MATERIALS</Text>
            </View>
            <Icon name="edit" size={20} color={colors.textMuted} />
          </View>
          <View style={styles.entryBody}>
            <Text style={styles.entryTitle}>Downlight LED 6W</Text>
            <View style={styles.quantityControl}>
              <Icon name="remove" size={22} color={colors.textSecondary} />
              <Text style={styles.quantityText}>2</Text>
              <Icon name="add" size={22} color={colors.blue} />
            </View>
          </View>
        </View>

        {/* Time entry */}
        <View style={[styles.entryCard, { borderLeftColor: colors.dark }]}>
          <View style={styles.entryHeader}>
            <View style={styles.entryLabel}>
              <Icon name="schedule" size={16} color={colors.dark} />
              <Text style={[styles.entryLabelText, { color: colors.dark }]}>TIME</Text>
            </View>
            <Icon name="edit" size={20} color={colors.textMuted} />
          </View>
          <Text style={styles.entryTitle}>0.5 hr · Hallway lighting</Text>
        </View>

        {/* Issue entry */}
        <View style={[styles.entryCard, { borderLeftColor: colors.red }]}>
          <View style={styles.entryHeader}>
            <View style={styles.entryLabel}>
              <Icon name="report" size={16} color={colors.red} />
              <Text style={[styles.entryLabelText, { color: colors.red }]}>ISSUE FLAGGED</Text>
            </View>
            <Icon name="photo_camera" size={20} color={colors.textMuted} />
          </View>
          <Text style={styles.entryTitle}>Cracked tile near door</Text>
          <Text style={styles.entryHint}>Tap camera to attach a photo</Text>
        </View>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <Pressable style={styles.discardBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.discardBtnText}>Discard</Text>
        </Pressable>
        <Pressable style={styles.addBtn} onPress={() => navigation.goBack()}>
          <Icon name="check" size={22} color={colors.textInverse} />
          <Text style={styles.addBtnText}>Add all to job</Text>
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
  entryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  entryLabelText: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  entryBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  entryTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 17,
    color: colors.dark,
    marginTop: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityText: {
    fontFamily: fonts.monoBold,
    fontSize: 17,
    color: colors.dark,
  },
  entryHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
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
  discardBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.dark,
  },
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
  addBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.textInverse,
  },
});
