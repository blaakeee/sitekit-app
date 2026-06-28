import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { onAuthStateChanged, signInWithCredential, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { logger } from '../services/logger';

let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch {}
}

type AuthContextType = {
  user: User | null;
  orgId: string | null;
  isLoading: boolean;
  orgLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  orgId: null,
  isLoading: true,
  orgLoading: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setOrgLoading(true);
        try {
          const org = await findOrCreateOrg(firebaseUser);
          setOrgId(org);
        } catch (error: any) {
          logger.error('Auth', 'Failed to resolve organization', { error: error?.message });
          setOrgId(null);
          Alert.alert(
            'Setup failed',
            `${error?.message ?? 'Unknown error'}`,
          );
        } finally {
          setOrgLoading(false);
        }
      } else {
        setOrgId(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();
        const idToken = response.data?.idToken;
        if (!idToken) throw new Error('No ID token returned');
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
    } catch (error: any) {
      logger.error('Auth', 'Google Sign-In failed', { error: error?.message });
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      if (Platform.OS !== 'web' && GoogleSignin) {
        await GoogleSignin.revokeAccess();
      }
    } catch (error: any) {
      logger.error('Auth', 'Sign-out failed', { error: error?.message });
      Alert.alert('Sign out failed', 'Could not sign out completely. Try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, orgId, isLoading, orgLoading, signIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s — check Firestore rules and network`)), ms)
    ),
  ]);
}

async function findOrCreateOrg(user: User): Promise<string> {
  const orgId = `org_${user.uid}`;
  const orgRef = doc(db, 'organizations', orgId);

  logger.info('Auth', 'Looking up org', { orgId });
  const snapshot = await withTimeout(getDoc(orgRef), 10000, 'Org lookup');

  if (snapshot.exists()) {
    logger.info('Auth', 'Org found', { orgId });
    return orgId;
  }

  const batch = writeBatch(db);

  batch.set(doc(db, 'organizations', orgId), {
    name: `${user.displayName ?? 'My'}'s Team`,
    memberIds: [user.uid],
    createdAt: Date.now(),
  });

  batch.set(doc(db, 'organizations', orgId, 'members', user.uid), {
    name: user.displayName ?? 'Unknown',
    initials: getInitials(user.displayName ?? 'U'),
    role: 'Owner',
    color: '#1a3a8f',
    phone: user.phoneNumber ?? '',
    email: user.email ?? '',
    online: true,
    certSummary: '',
    shiftSummary: '',
  });

  logger.info('Auth', 'Creating new org', { orgId });
  await withTimeout(batch.commit(), 10000, 'Org creation');

  return orgId;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
