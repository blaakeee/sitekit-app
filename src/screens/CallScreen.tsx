import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, MonoLabel } from '../components';
import { colors, fonts, radii } from '../theme';
import { useData } from '../contexts';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CallScreen'>;

function WaveBar({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 450, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { transform: [{ scaleY: anim }] },
      ]}
    />
  );
}

export function CallScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { crew } = useData();
  const employee = crew.find((e) => e.id === route.params.employeeId) ?? crew[0];

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const scaleAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.55, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
    );
    const opacityAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
      ])
    );
    scaleAnim.start();
    opacityAnim.start();
    return () => { scaleAnim.stop(); opacityAnim.stop(); };
  }, [pulseScale, pulseOpacity]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topSection}>
        <MonoLabel color={colors.textTertiary}>CALLING · MOBILE</MonoLabel>
        <View style={styles.avatarWrap}>
          <Animated.View style={[
            styles.pulse,
            { backgroundColor: employee.color, transform: [{ scale: pulseScale }], opacity: pulseOpacity },
          ]} />
          <View style={[styles.avatarLarge, { backgroundColor: employee.color }]}>
            <Text style={styles.avatarText}>{employee.initials}</Text>
          </View>
        </View>
        <Text style={styles.calleeName}>{employee.name}</Text>
        <Text style={styles.calleePhone}>{employee.phone}</Text>
      </View>

      <View style={styles.waveContainer}>
        {[0, 100, 250, 150, 350].map((delay, i) => (
          <WaveBar key={i} delay={delay} />
        ))}
      </View>

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 44 }]}>
        <View style={styles.controlRow}>
          <View style={styles.control}>
            <View style={styles.controlBtn}>
              <Icon name="mic_off" size={28} color={colors.textInverseMuted} />
            </View>
            <Text style={styles.controlLabel}>Mute</Text>
          </View>
          <View style={styles.control}>
            <View style={styles.controlBtn}>
              <Icon name="dialpad" size={28} color={colors.textInverseMuted} />
            </View>
            <Text style={styles.controlLabel}>Keypad</Text>
          </View>
          <View style={styles.control}>
            <View style={styles.controlBtn}>
              <Icon name="volume_up" size={28} color={colors.textInverseMuted} />
            </View>
            <Text style={styles.controlLabel}>Speaker</Text>
          </View>
        </View>

        <Pressable style={styles.endCallBtn} onPress={() => navigation.goBack()}>
          <Icon name="call_end" size={36} color={colors.textInverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    gap: 14,
  },
  avatarWrap: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.headingBlack,
    fontSize: 42,
    color: colors.textInverse,
  },
  calleeName: {
    fontFamily: fonts.headingBlack,
    fontSize: 26,
    color: colors.textInverse,
    marginTop: 6,
  },
  calleePhone: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textInverseSecondary,
    marginTop: 4,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    marginTop: 34,
  },
  waveBar: {
    width: 5,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 3,
  },
  bottomSection: {
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
    gap: 26,
    paddingHorizontal: 36,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 34,
  },
  control: {
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#26282f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textInverseMuted,
  },
  endCallBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(197,72,47,0.45)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
});
