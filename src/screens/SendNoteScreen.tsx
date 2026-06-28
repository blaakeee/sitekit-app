import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useCrew } from '../contexts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SendNote'>;

const quickReplies = ['On my way', 'Running late', 'Bring the ladder', "Job's done"];

export function SendNoteScreen({ navigation, route }: Props) {
  const { crew } = useCrew();
  const employee = crew.find((e) => e.id === route.params.employeeId) ?? crew[0];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Send note</Text>
      </View>

      <View style={styles.content}>
        {/* Recipient */}
        <View style={styles.recipientCard}>
          <View style={[styles.recipientAvatar, { backgroundColor: employee.color }]}>
            <Text style={styles.recipientInitials}>{employee.initials}</Text>
          </View>
          <View style={styles.recipientInfo}>
            <MonoLabel style={styles.toLabel}>TO</MonoLabel>
            <Text style={styles.recipientName}>{employee.name}</Text>
          </View>
        </View>

        {/* Quick replies */}
        <View>
          <MonoLabel style={styles.sectionLabel}>Quick replies</MonoLabel>
          <View style={styles.quickReplies}>
            {quickReplies.map((reply) => (
              <Pressable key={reply} style={styles.quickReplyChip}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Message */}
        <View>
          <MonoLabel style={styles.sectionLabel}>Message</MonoLabel>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              Head to 14 Maple Ave next — switchboard's ready for sign-off.
              <Text style={styles.cursor}>|</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Send button */}
      <View style={styles.bottomActions}>
        <Pressable style={styles.sendBtn} onPress={() => navigation.goBack()}>
          <Icon name="send" size={22} color={colors.textInverse} />
          <Text style={styles.sendBtnText}>Send to {employee.name}</Text>
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
    flex: 1,
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.dark,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
  },
  recipientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInitials: {
    fontFamily: fonts.headingHeavy,
    fontSize: 15,
    color: colors.textInverse,
  },
  recipientInfo: {
    flex: 1,
  },
  toLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
  },
  recipientName: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.dark,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  quickReplies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickReplyText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.dark,
  },
  messageBox: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 16,
    minHeight: 120,
  },
  messageText: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.dark,
  },
  cursor: {
    color: colors.blue,
    fontWeight: '200',
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 'auto',
  },
  sendBtn: {
    width: '100%',
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    color: colors.textInverse,
  },
});
