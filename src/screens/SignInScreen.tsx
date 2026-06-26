import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts';
import { Icon, MonoLabel } from '../components';
import { colors, fonts, radii } from '../theme';
import { seedFirestoreData } from '../utils/seedData';

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, orgId } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!orgId) {
      Alert.alert('Sign in first', 'You need to sign in before seeding data.');
      return;
    }
    try {
      await seedFirestoreData(orgId);
      Alert.alert('Done', 'Sample data has been seeded to Firestore.');
    } catch (error: any) {
      Alert.alert('Seed failed', error.message);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.branding}>
        <MonoLabel style={styles.logo} color={colors.dark}>SITEKIT</MonoLabel>
        <Text style={styles.title}>Field capture{'\n'}for your crew</Text>
        <Text style={styles.subtitle}>
          Voice notes, photos, time tracking and materials — all from the job site.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={styles.googleBtn}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <View style={styles.googleIcon}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
            </>
          )}
        </Pressable>

        {__DEV__ && (
          <Pressable style={styles.seedBtn} onPress={handleSeed}>
            <Icon name="database" size={18} color={colors.textSecondary} />
            <Text style={styles.seedBtnText}>Seed sample data</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  branding: {
    gap: 12,
  },
  logo: {
    fontFamily: fonts.monoBold,
    fontSize: 14,
    letterSpacing: 3,
  },
  title: {
    fontFamily: fonts.headingBlack,
    fontSize: 38,
    letterSpacing: -0.5,
    color: colors.dark,
    lineHeight: 44,
    marginTop: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    maxWidth: 320,
  },
  bottom: {
    gap: 16,
  },
  googleBtn: {
    height: 58,
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontFamily: fonts.headingHeavy,
    fontSize: 18,
    color: colors.blue,
  },
  googleBtnText: {
    fontFamily: fonts.headingHeavy,
    fontSize: 17,
    color: colors.textInverse,
  },
  seedBtn: {
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  seedBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
