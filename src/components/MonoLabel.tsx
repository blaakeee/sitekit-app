import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  children: React.ReactNode;
  style?: TextStyle;
  color?: string;
};

export function MonoLabel({ children, style, color = colors.textTertiary }: Props) {
  return (
    <Text style={[styles.label, { color }, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.monoBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
