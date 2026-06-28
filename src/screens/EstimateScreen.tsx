import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii, shadows } from '../theme';
import { useAuth } from '../contexts';
import { useJobs } from '../contexts';
import { addEstimate, ensureJobExists } from '../services/firestoreService';
import type { LineItem } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Estimate'>;

let nextId = 1;
function makeId() {
  return `li_${Date.now()}_${nextId++}`;
}

const EMPTY_LINE: () => LineItem = () => ({
  id: makeId(),
  name: '',
  quantity: 1,
  unit: '×',
  unitPrice: 0,
});

export function EstimateScreen({ navigation, route }: Props) {
  const { mode, jobId, voiceLineItems } = route.params;
  const isNew = mode === 'new';

  const { orgId } = useAuth();
  const { jobs } = useJobs();
  const job = jobId ? jobs.find((j) => j.id === jobId) : null;

  const [customerName, setCustomerName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([EMPTY_LINE()]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const processedVoiceRef = useRef(false);
  useEffect(() => {
    if (voiceLineItems && voiceLineItems.length > 0 && !processedVoiceRef.current) {
      processedVoiceRef.current = true;
      const newItems: LineItem[] = voiceLineItems.map((v) => ({
        id: makeId(),
        name: v.name,
        quantity: v.quantity ?? 0,
        unit: v.unit || '×',
        unitPrice: v.unitPrice ?? 0,
      }));
      setLineItems((prev) => {
        const hasContent = prev.some((item) => item.name.trim() !== '');
        return hasContent ? [...prev, ...newItems] : newItems;
      });
    }
  }, [voiceLineItems]);

  const customerFilled = customerName.trim() !== '' && siteAddress.trim() !== '';

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const removeItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, EMPTY_LINE()]);
    setEditingIdx(lineItems.length);
  };

  const handleSubmit = async () => {
    if (isNew && !customerFilled) {
      setCustomerExpanded(true);
      Alert.alert('Customer required', 'Add a customer name and site address before submitting.');
      return;
    }
    const validItems = lineItems.filter((item) => item.name.trim() !== '');
    if (validItems.length === 0) {
      Alert.alert('No line items', 'Add at least one line item with a name.');
      return;
    }
    const incomplete = validItems.find((item) => item.quantity <= 0 || item.unitPrice <= 0);
    if (incomplete) {
      const idx = lineItems.indexOf(incomplete);
      setEditingIdx(idx);
      Alert.alert('Incomplete line item', `"${incomplete.name}" needs a ${incomplete.quantity <= 0 ? 'quantity' : 'price'}.`);
      return;
    }
    if (!orgId) {
      Alert.alert('Not signed in', 'Sign in to save estimates.');
      return;
    }

    setSaving(true);
    try {
      if (job && jobId) {
        await ensureJobExists(orgId, job);
      }
      await addEstimate(orgId, jobId ?? null, {
        mode,
        lineItems: validItems,
        subtotal,
        gst,
        total,
        customerName: isNew ? customerName.trim() : undefined,
        siteAddress: isNew ? siteAddress.trim() : undefined,
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
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View>
            <Text style={styles.headerTitle}>{isNew ? 'New estimate' : 'Add-on work'}</Text>
            <MonoLabel>
              {isNew
                ? 'DRAFT · NOT YET A JOB'
                : job
                  ? `${job.code} · ${job.address.toUpperCase()}`
                  : 'ADD-ON'}
            </MonoLabel>
          </View>
        </View>

        {/* Customer / Job card */}
        {isNew ? (
          <View style={styles.section}>
            {customerExpanded ? (
              <View style={styles.customerForm}>
                <View style={styles.customerFormHeader}>
                  <Icon name="person" size={20} color={colors.blue} />
                  <MonoLabel color={colors.blue} style={styles.customerLabel}>CUSTOMER & SITE</MonoLabel>
                </View>
                <TextInput
                  style={styles.customerInput}
                  placeholder="Customer name"
                  placeholderTextColor={colors.textMuted}
                  value={customerName}
                  onChangeText={setCustomerName}
                  autoFocus
                />
                <TextInput
                  style={styles.customerInput}
                  placeholder="Site address"
                  placeholderTextColor={colors.textMuted}
                  value={siteAddress}
                  onChangeText={setSiteAddress}
                />
                {customerFilled && (
                  <Pressable
                    style={styles.customerDoneBtn}
                    onPress={() => setCustomerExpanded(false)}
                  >
                    <Icon name="check" size={18} color={colors.textInverse} />
                    <Text style={styles.customerDoneText}>Done</Text>
                  </Pressable>
                )}
              </View>
            ) : customerFilled ? (
              <Pressable
                style={styles.customerFilledCard}
                onPress={() => setCustomerExpanded(true)}
              >
                <View style={styles.customerFilledIcon}>
                  <Icon name="person" size={24} color={colors.blue} />
                </View>
                <View style={styles.customerText}>
                  <MonoLabel color={colors.blueLabel} style={styles.customerLabel}>Customer</MonoLabel>
                  <Text style={styles.customerFilledName}>{customerName}</Text>
                  <Text style={styles.customerFilledAddress}>{siteAddress}</Text>
                </View>
                <Icon name="edit" size={20} color={colors.blueMuted} />
              </Pressable>
            ) : (
              <Pressable
                style={styles.customerCard}
                onPress={() => setCustomerExpanded(true)}
              >
                <View style={styles.customerIcon}>
                  <Icon name="person_add" size={24} color={colors.textInverse} />
                </View>
                <View style={styles.customerText}>
                  <MonoLabel color={colors.blueMuted} style={styles.customerLabel}>Customer</MonoLabel>
                  <Text style={styles.customerTitle}>Add customer & site address</Text>
                </View>
                <Icon name="chevron_right" size={24} color={colors.blueMuted} />
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.addonCard}>
              <View style={styles.addonIcon}>
                <Icon name="add_circle" size={24} color={colors.textInverse} />
              </View>
              <View style={styles.addonText}>
                <MonoLabel color={colors.blueLabel} style={styles.customerLabel}>Adding to existing job</MonoLabel>
                <Text style={styles.addonTitle}>
                  {job ? `Extra work — ${job.address}` : 'Extra work'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Capture buttons */}
        <MonoLabel style={styles.sectionLabel}>Capture</MonoLabel>
        <View style={styles.captureRow}>
          <Pressable
            style={[styles.captureBtn, { backgroundColor: colors.blue }, shadows.buttonBlue]}
            onPress={() => {
              navigation.navigate('VoiceRecord', { jobId: jobId ?? 'estimate', estimateMode: true });
            }}
          >
            <Icon name="mic" size={36} color={colors.textInverse} />
            <Text style={styles.captureBtnText}>VOICE NOTE</Text>
          </Pressable>
          <Pressable style={[styles.captureBtn, { backgroundColor: colors.gold }, shadows.buttonGold]}>
            <Icon name="photo_camera" size={36} color={colors.dark} />
            <Text style={[styles.captureBtnText, { color: colors.dark }]}>PHOTO</Text>
          </Pressable>
        </View>

        {/* Line Items */}
        <MonoLabel style={styles.sectionLabel}>
          Line items · {lineItems.filter((i) => i.name.trim()).length}
        </MonoLabel>
        <ScrollView style={styles.lineItemsScroll} contentContainerStyle={styles.lineItems}>
          {lineItems.map((item, idx) => {
            const isEditing = editingIdx === idx;
            const lineTotal = item.quantity * item.unitPrice;

            if (isEditing) {
              return (
                <View key={item.id} style={styles.lineItemEditing}>
                  <TextInput
                    style={styles.editInput}
                    placeholder="Item name"
                    placeholderTextColor={colors.textMuted}
                    value={item.name}
                    onChangeText={(text) => updateItem(idx, { name: text })}
                    autoFocus
                  />
                  <View style={styles.editRow}>
                    <View style={styles.editField}>
                      <Text style={styles.editLabel}>Qty</Text>
                      <TextInput
                        style={styles.editInputSmall}
                        keyboardType="numeric"
                        value={String(item.quantity)}
                        onChangeText={(text) => {
                          const n = parseFloat(text) || 0;
                          updateItem(idx, { quantity: n });
                        }}
                      />
                    </View>
                    <View style={styles.editField}>
                      <Text style={styles.editLabel}>Unit</Text>
                      <TextInput
                        style={styles.editInputSmall}
                        value={item.unit}
                        onChangeText={(text) => updateItem(idx, { unit: text })}
                      />
                    </View>
                    <View style={styles.editField}>
                      <Text style={styles.editLabel}>Price</Text>
                      <TextInput
                        style={styles.editInputSmall}
                        keyboardType="numeric"
                        value={item.unitPrice > 0 ? String(item.unitPrice) : ''}
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        onChangeText={(text) => {
                          const n = parseFloat(text) || 0;
                          updateItem(idx, { unitPrice: n });
                        }}
                      />
                    </View>
                  </View>
                  <View style={styles.editActions}>
                    <Pressable
                      style={styles.editDeleteBtn}
                      onPress={() => removeItem(idx)}
                    >
                      <Icon name="delete" size={18} color={colors.red} />
                    </Pressable>
                    <Pressable
                      style={styles.editDoneBtn}
                      onPress={() => setEditingIdx(null)}
                    >
                      <Text style={styles.editDoneText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }

            const needsQty = item.name.trim() !== '' && item.quantity <= 0;
            const needsPrice = item.name.trim() !== '' && item.unitPrice <= 0;
            const needsAttention = needsQty || needsPrice;

            return (
              <Pressable
                key={item.id}
                style={[styles.lineItem, needsAttention && styles.lineItemIncomplete]}
                onPress={() => setEditingIdx(idx)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineItemName}>
                    {item.name || 'Untitled item'}
                  </Text>
                  {needsAttention ? (
                    <View style={styles.missingRow}>
                      <Icon name="warning" size={14} color={colors.goldDark} />
                      <Text style={styles.missingText}>
                        {needsQty && needsPrice ? 'Needs qty & price' : needsQty ? 'Needs quantity' : 'Needs price'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.lineItemQty}>
                      {item.unit
                        ? `${item.quantity} ${item.unit} $${item.unitPrice.toFixed(2)}`
                        : item.unitPrice > 0
                          ? `$${item.unitPrice.toFixed(2)}`
                          : 'Tap to edit'}
                    </Text>
                  )}
                </View>
                <Text style={styles.lineItemTotal}>
                  {lineTotal > 0 ? `$${lineTotal.toFixed(2)}` : '—'}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.addLineBtn} onPress={addLine}>
            <Icon name="add" size={20} color={colors.textSecondary} />
            <Text style={styles.addLineBtnText}>Add line</Text>
          </Pressable>
        </ScrollView>

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
          <Pressable
            style={[styles.sendBtn, saving && styles.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <>
                <Icon name={isNew ? 'send' : 'add_circle'} size={22} color={colors.dark} />
                <Text style={styles.sendBtnText}>
                  {isNew ? 'Send estimate & open job' : 'Add-on to this job'}
                </Text>
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
  customerForm: {
    backgroundColor: colors.blueLight,
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: radii.lg,
    padding: 14,
    gap: 10,
  },
  customerFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerInput: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.dark,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customerDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.blue,
    borderRadius: radii.sm,
    paddingVertical: 8,
    marginTop: 2,
  },
  customerDoneText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.textInverse,
  },
  customerFilledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.blueLight,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    borderRadius: radii.lg,
    padding: 14,
  },
  customerFilledIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerFilledName: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
    marginTop: 1,
  },
  customerFilledAddress: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
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
  lineItemsScroll: {
    flex: 1,
  },
  lineItems: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
  lineItemIncomplete: {
    borderColor: colors.gold,
    borderWidth: 1.5,
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  missingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.goldDark,
  },
  lineItemEditing: {
    backgroundColor: colors.cardBg,
    borderWidth: 2,
    borderColor: colors.blue,
    borderRadius: radii.lg,
    padding: 14,
    gap: 10,
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
  editInput: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  editRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editField: {
    flex: 1,
    gap: 2,
  },
  editLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  editInputSmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  editDeleteBtn: {
    padding: 6,
  },
  editDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.blue,
    borderRadius: radii.sm,
  },
  editDoneText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.textInverse,
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
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
  },
});
