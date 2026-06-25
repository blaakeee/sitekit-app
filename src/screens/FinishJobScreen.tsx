import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FinishJob'>;

export function FinishJobScreen({ navigation }: Props) {
  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Finish job</Text>
      </View>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>captures</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1.5h</Text>
            <Text style={styles.statLabel}>on site</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>$300</Text>
            <Text style={styles.statLabel}>quoted</Text>
          </View>
        </View>

        {/* Signature */}
        <MonoLabel style={styles.signLabel}>Customer sign-off</MonoLabel>
        <View style={styles.signatureBox}>
          <Text style={styles.signaturePlaceholder}>Sign here</Text>
        </View>

        {/* Email checkbox */}
        <View style={styles.checkRow}>
          <View style={styles.checkBox}>
            <Icon name="check" size={18} color={colors.textInverse} />
          </View>
          <Text style={styles.checkText}>Email summary + photos to customer</Text>
        </View>
      </View>

      {/* Complete button */}
      <View style={styles.bottomActions}>
        <Pressable
          style={styles.completeBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="cloud_done" size={24} color={colors.textInverse} />
          <Text style={styles.completeBtnText}>Complete & sync</Text>
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
  completeBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
  },
});
