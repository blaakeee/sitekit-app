import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii, shadows } from '../theme';
import { estimateLineItems } from '../data/mockData';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Estimate'>;

export function EstimateScreen({ navigation, route }: Props) {
  const { mode, jobId } = route.params;
  const isNew = mode === 'new';

  const subtotal = estimateLineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View>
          <Text style={styles.headerTitle}>{isNew ? 'New estimate' : 'Add-on work'}</Text>
          <MonoLabel>
            {isNew ? 'DRAFT · NOT YET A JOB' : '#JB-2208 · 14 MAPLE AVE'}
          </MonoLabel>
        </View>
      </View>

      {/* Customer / Job card */}
      {isNew ? (
        <View style={styles.section}>
          <View style={styles.customerCard}>
            <View style={styles.customerIcon}>
              <Icon name="person_add" size={24} color={colors.textInverse} />
            </View>
            <View style={styles.customerText}>
              <MonoLabel color={colors.blueMuted} style={styles.customerLabel}>Customer</MonoLabel>
              <Text style={styles.customerTitle}>Add customer & site address</Text>
            </View>
            <Icon name="chevron_right" size={24} color={colors.blueMuted} />
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.addonCard}>
            <View style={styles.addonIcon}>
              <Icon name="add_circle" size={24} color={colors.textInverse} />
            </View>
            <View style={styles.addonText}>
              <MonoLabel color={colors.blueLabel} style={styles.customerLabel}>Adding to existing job</MonoLabel>
              <Text style={styles.addonTitle}>Extra work — 14 Maple Ave</Text>
            </View>
          </View>
        </View>
      )}

      {/* Capture buttons */}
      <MonoLabel style={styles.sectionLabel}>Capture</MonoLabel>
      <View style={styles.captureRow}>
        <Pressable style={[styles.captureBtn, { backgroundColor: colors.blue }, shadows.buttonBlue]}>
          <Icon name="mic" size={36} color={colors.textInverse} />
          <Text style={styles.captureBtnText}>VOICE NOTE</Text>
        </Pressable>
        <Pressable style={[styles.captureBtn, { backgroundColor: colors.gold }, shadows.buttonGold]}>
          <Icon name="photo_camera" size={36} color={colors.dark} />
          <Text style={[styles.captureBtnText, { color: colors.dark }]}>PHOTO</Text>
        </Pressable>
      </View>

      {/* Line Items */}
      <MonoLabel style={styles.sectionLabel}>Line items</MonoLabel>
      <View style={styles.lineItems}>
        {estimateLineItems.map((item) => {
          const lineTotal = item.quantity * item.unitPrice;
          const qtyLabel = item.unit
            ? `${item.quantity} ${item.unit} $${item.unitPrice.toFixed(2)}`
            : 'Standard';
          return (
            <View key={item.id} style={styles.lineItem}>
              <View>
                <Text style={styles.lineItemName}>{item.name}</Text>
                <Text style={styles.lineItemQty}>{qtyLabel}</Text>
              </View>
              <Text style={styles.lineItemTotal}>${lineTotal.toFixed(2)}</Text>
            </View>
          );
        })}
        <Pressable style={styles.addLineBtn}>
          <Icon name="add" size={20} color={colors.textSecondary} />
          <Text style={styles.addLineBtnText}>Add line</Text>
        </Pressable>
      </View>

      {/* Totals footer */}
      <View style={styles.totalsFooter}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalMono}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GST 10%</Text>
          <Text style={styles.totalMono}>${gst.toFixed(2)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.sendBtn} onPress={() => navigation.goBack()}>
          <Icon name={isNew ? 'send' : 'add_circle'} size={22} color={colors.dark} />
          <Text style={styles.sendBtnText}>
            {isNew ? 'Send estimate & open job' : 'Add-on to this job'}
          </Text>
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
    lineHeight: 20,
    color: colors.dark,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 2,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blue,
    borderRadius: radii.lg,
    padding: 14,
  },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerText: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  customerTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
    marginTop: 1,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blueLight,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    borderRadius: radii.lg,
    padding: 14,
  },
  addonIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonText: {
    flex: 1,
  },
  addonTitle: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
    marginTop: 1,
  },
  captureRow: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    flexDirection: 'row',
    gap: 12,
  },
  captureBtn: {
    flex: 1,
    height: 90,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 14,
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: colors.textInverse,
  },
  lineItems: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 15,
  },
  lineItemName: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.dark,
  },
  lineItemQty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  lineItemTotal: {
    fontFamily: fonts.monoBold,
    fontSize: 16,
    color: colors.dark,
  },
  addLineBtn: {
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
  addLineBtnText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.textSecondary,
  },
  totalsFooter: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: colors.dark,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textInverseSecondary,
  },
  totalMono: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textInverseSecondary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.textInverse,
  },
  grandTotalValue: {
    fontFamily: fonts.monoBold,
    fontSize: 26,
    color: colors.gold,
  },
  sendBtn: {
    width: '100%',
    height: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
  },
});
