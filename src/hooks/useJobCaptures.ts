import { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts';
import { capturedItems as mockCaptures } from '../data/mockData';
import type { CapturedItem } from '../types';

export function useJobCaptures(jobId: string) {
  const { orgId } = useAuth();
  const [data, setData] = useState<CapturedItem[]>(mockCaptures);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);

    const capturesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'captures');
    const q = query(capturesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setData(mockCaptures);
        } else {
          setData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CapturedItem)));
        }
        setLoading(false);
      },
      () => {
        setData(mockCaptures);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId, jobId]);

  return { data, loading };
}
