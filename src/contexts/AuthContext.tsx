import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { onAuthStateChanged, signInWithCredential, signOut as firebaseSignOut, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '../config/firebase';

type AuthContextType = {
  user: User | null;
  orgId: string | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  orgId: null,
  isLoading: true,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const org = await findOrCreateOrg(firebaseUser);
          setOrgId(org);
        } catch (error) {
          console.error('Failed to resolve organization:', error);
          setOrgId(null);
          Alert.alert(
            'Setup failed',
            'Could not connect to your organization. Check your connection and restart the app.'
          );
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
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('No ID token returned');
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      await GoogleSignin.revokeAccess();
    } catch (error) {
      console.error('Sign-out error:', error);
      Alert.alert('Sign out failed', 'Could not sign out completely. Try again.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, orgId, isLoading, signIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

async function findOrCreateOrg(user: User): Promise<string> {
  const orgsRef = collection(db, 'organizations');
  const q = query(orgsRef, where('memberIds', 'array-contains', user.uid));
  const snapshot = await getDocs(q);

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

  await batch.commit();

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
