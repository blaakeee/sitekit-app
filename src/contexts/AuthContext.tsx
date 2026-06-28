import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { onAuthStateChanged, signInWithCredential, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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
          console.error('Failed to resolve organization:', error);
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
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      if (Platform.OS !== 'web' && GoogleSignin) {
        await GoogleSignin.revokeAccess();
      }
    } catch (error) {
      console.error('Sign-out error:', error);
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
  const orgsRef = collection(db, 'organizations');
  const q = query(orgsRef, where('memberIds', 'array-contains', user.uid));

  console.log('[Auth] Finding org for user:', user.uid);
  const snapshot = await withTimeout(getDocs(q), 10000, 'Org lookup');
  console.log('[Auth] Org query returned:', snapshot.size, 'results');

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const newOrgId = `org_${user.uid}`;
  const batch = writeBatch(db);

  batch.set(doc(db, 'organizations', newOrgId), {
    name: `${user.displayName ?? 'My'}'s Team`,
    memberIds: [user.uid],
    createdAt: Date.now(),
  });

  batch.set(doc(db, 'organizations', newOrgId, 'members', user.uid), {
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

  console.log('[Auth] Creating new org:', newOrgId);
  await withTimeout(batch.commit(), 10000, 'Org creation');

  return newOrgId;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
