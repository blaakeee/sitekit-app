import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithCredential, signOut as firebaseSignOut, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
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
        const org = await findOrCreateOrg(firebaseUser);
        setOrgId(org);
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
    await firebaseSignOut(auth);
    await GoogleSignin.revokeAccess().catch(() => {});
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
  await setDoc(doc(db, 'organizations', newOrgId), {
    name: `${user.displayName ?? 'My'}'s Team`,
    memberIds: [user.uid],
    createdAt: Date.now(),
  });

  await setDoc(doc(db, 'organizations', newOrgId, 'members', user.uid), {
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
