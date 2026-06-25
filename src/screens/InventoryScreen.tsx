import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { inventoryItems } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

export function InventoryScreen({ navigation }: Props) {
  const [packed, setPacked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setPacked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const packedCount = useMemo(
    () => inventoryItems.filter((it) => packed[it.key]).length,
    [packed]
  );
  const total = inventoryItems.length;
  const progressPct = Math.round((packedCount / total) * 100);

  const jobGroups = useMemo(() => {
    const groups = [
      { job: '14 Maple Ave', dot: '#1a3a8f' },
      { job: '7 Crystal St', dot: '#6b6862' },
      { job: '220 Harbour Rd', dot: '#f0a500' },
      { job: 'All jobs', dot: '#8a857a' },
    ];
    return groups
      .map((g) => ({
        ...g,
        items: inventoryItems.filter((it) => it.job === g.job),
      }))
      .filter((g) => g.items.length > 0);
  }, []);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Daily inventory</Text>
          <MonoLabel>MON 23 JUN · {total} ITEMS</MonoLabel>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.section}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{packedCount} of {total} packed</Text>
            <MonoLabel style={styles.progressHint}>Tap to pack</MonoLabel>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>
      </View>

      {/* Grouped items */}
      <View style={styles.groups}>
        {jobGroups.map((group) => (
          <View key={group.job} style={styles.group}>
            <View style={styles.groupLabel}>
              <View style={[styles.groupDot, { backgroundColor: group.dot }]} />
              <Text style={styles.groupName}>{group.job.toUpperCase()}</Text>
            </View>
            <View style={styles.groupItems}>
              {group.items.map((item) => {
                const checked = !!packed[item.key];
                return (
                  <Pressable
                    key={item.key}
                    style={styles.itemRow}
                    onPress={() => toggle(item.key)}
                  >
                    <View style={[
                      styles.checkbox,
                      checked ? styles.checkboxChecked : styles.checkboxUnchecked,
                    ]}>
                      {checked && <Icon name="check" size={20} color={colors.textInverse} />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={[
                        styles.itemName,
                        checked && styles.itemNameChecked,
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemQty}>{item.qty}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.dark,
  },
  progressHint: {
    fontSize: 11,
    letterSpacing: 1.1,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 4,
  },
  groups: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  group: {
    marginTop: 16,
  },
  groupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  groupName: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.3,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  groupItems: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 14,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.green,
  },
  checkboxUnchecked: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.borderDash,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.dark,
  },
  itemNameChecked: {
    color: colors.textMuted,
  },
  itemQty: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
