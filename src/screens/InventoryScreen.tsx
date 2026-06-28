import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useAuth, useInventory } from '../contexts';
import { updateInventoryPacked } from '../services/firestoreService';
import type { InventoryPackedState } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function InventoryScreen({ navigation }: Props) {
  const { orgId } = useAuth();
  const { inventoryItems } = useInventory();
  const [packed, setPacked] = useState<InventoryPackedState>({});

  const now = new Date();
  const dateLabel = `${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;

  const toggle = useCallback((key: string) => {
    setPacked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (orgId) {
        updateInventoryPacked(orgId, todayKey(), next).catch(() => {});
      }
      return next;
    });
  }, [orgId]);

  const packedCount = useMemo(
    () => inventoryItems.filter((it) => packed[it.key]).length,
    [packed, inventoryItems]
  );
  const total = inventoryItems.length;
  const progressPct = total > 0 ? Math.round((packedCount / total) * 100) : 0;

  const jobGroups = useMemo(() => {
    const seen = new Map<string, { dot: string; items: typeof inventoryItems }>();
    for (const item of inventoryItems) {
      const group = seen.get(item.job);
      if (group) {
        group.items.push(item);
      } else {
        seen.set(item.job, { dot: item.dot, items: [item] });
      }
    }
    return Array.from(seen.entries()).map(([job, { dot, items }]) => ({ job, dot, items }));
  }, [inventoryItems]);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Daily inventory</Text>
          <MonoLabel>{dateLabel} · {total} ITEMS</MonoLabel>
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
