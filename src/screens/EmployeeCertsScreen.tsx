import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper, Icon, MonoLabel, BackButton } from '../components';
import { colors, fonts, radii } from '../theme';
import { useCrew } from '../contexts';
import type { Certification } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeCerts'>;

const statusColors: Record<Certification['status'], { bg: string; fg: string }> = {
  Valid: { bg: colors.greenLight, fg: colors.green },
  Expiring: { bg: colors.goldLight, fg: colors.goldDark },
  Expired: { bg: colors.redLight, fg: colors.red },
};

export function EmployeeCertsScreen({ route }: Props) {
  const { crew } = useCrew();
  const employee = crew.find((e) => e.id === route.params.employeeId) ?? crew[0];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{employee.name}</Text>
          <MonoLabel>CERTIFICATIONS</MonoLabel>
        </View>
      </View>

      <View style={styles.list}>
        {employee.certs.map((cert, idx) => {
          const sc = statusColors[cert.status];
          return (
            <View key={idx} style={styles.certCard}>
              <View style={styles.certRow}>
                <View style={[styles.certIcon, { backgroundColor: sc.bg }]}>
                  <Icon name="verified" size={24} color={sc.fg} />
                </View>
                <View style={styles.certInfo}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDetail}>{cert.issuer} · {cert.expiry}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.fg }]}>{cert.status}</Text>
                </View>
              </View>
            </View>
          );
        })}
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
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12,
  },
  certCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: 16,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  certIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontFamily: fonts.headingHeavy,
    fontSize: 16,
    lineHeight: 19,
    color: colors.dark,
  },
  certDetail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
