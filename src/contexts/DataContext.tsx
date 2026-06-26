import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import * as mock from '../data/mockData';
import type { Job, CrewMember, InventoryItem } from '../types';

type DataContextType = {
  jobs: Job[];
  crew: CrewMember[];
  inventoryItems: InventoryItem[];
  loading: boolean;
};

const DataContext = createContext<DataContextType>({
  jobs: mock.jobs,
  crew: mock.crew,
  inventoryItems: mock.inventoryItems,
  loading: false,
});

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { orgId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(mock.jobs);
  const [crew, setCrew] = useState<CrewMember[]>(mock.crew);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mock.inventoryItems);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);

    const unsubJobs = onSnapshot(
      collection(db, 'organizations', orgId, 'jobs'),
      (snapshot) => {
        if (snapshot.empty) {
          setJobs(mock.jobs);
        } else {
          setJobs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Job)));
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubMembers = onSnapshot(
      collection(db, 'organizations', orgId, 'members'),
      (snapshot) => {
        if (snapshot.empty) {
          setCrew(mock.crew);
        } else {
          setCrew(
            snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              schedule: doc.data().schedule ?? [],
              certs: doc.data().certs ?? [],
            } as CrewMember))
          );
        }
      }
    );

    return () => {
      unsubJobs();
      unsubMembers();
    };
  }, [orgId]);

  return (
    <DataContext.Provider value={{ jobs, crew, inventoryItems, loading }}>
      {children}
    </DataContext.Provider>
  );
}
