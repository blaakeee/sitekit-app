import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Icon, MonoLabel } from '../../components';
import { colors, fonts, radii } from '../../theme';

type Props = {
  onDismiss: () => void;
};

export function CapabilityBanner({ onDismiss }: Props) {
  return (
    <View style={styles.banner}>
      <Icon name="info" size={18} color={colors.goldDark} />
      <Text style={styles.text}>Using basic camera mode for this device</Text>
      <Pressable onPress={onDismiss} hitSlop={12}>
        <Icon name="close" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 8,
  },
  text: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.goldDark,
  },
});
