import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from './Icon';
import { colors, radii } from '../theme';

export function BackButton({ onPress }: { onPress?: () => void }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={onPress ?? (() => navigation.goBack())}
      style={styles.btn}
    >
      <Icon name="arrow_back" size={22} color={colors.dark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
