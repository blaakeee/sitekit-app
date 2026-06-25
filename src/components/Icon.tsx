import React from 'react';
import { Text, StyleSheet } from 'react-native';

type Props = {
  name: string;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = '#16181d' }: Props) {
  return (
    <Text style={[styles.icon, { fontSize: size, color }]}>
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: 'MaterialSymbolsOutlined_500Medium',
  },
});
