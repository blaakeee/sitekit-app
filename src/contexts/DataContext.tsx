import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import * as mock from '../data/mockData';
import type { Job, CrewMember, InventoryItem } from '../types';

type DataContextType = {
  jobs: Job[];
  crew: CrewMember[];
  inventoryItems: InventoryItem[];
  jobsLoading: boolean;
  crewLoading: boolean;
  inventoryLoading: boolean;
};

const DataContext = createContext<DataContextType>({
  jobs: mock.jobs,
  crew: mock.crew,
  inventoryItems: mock.inventoryItems,
  jobsLoading: false,
  crewLoading: false,
  inventoryLoading: false,
});

export function useData() {
  return useContext(DataContext);
}

function mapJob(id: string, data: DocumentData): Job {
  return {
    id,
    code: data.code ?? '',
    address: data.address ?? '',
    trade: data.trade ?? '',
    description: data.description ?? '',
    status: data.status ?? 'scheduled',
    scheduledTime: data.scheduledTime ?? undefined,
    captureCount: data.captureCount ?? 0,
    timeOnSite: data.timeOnSite ?? undefined,
    quotedAmount: data.quotedAmount ?? undefined,
    assignedMemberIds: data.assignedMemberIds ?? undefined,
    createdAt: data.createdAt ?? undefined,
  };
}

function mapCrewMember(id: string, data: DocumentData): CrewMember {
  return {
    id,
    name: data.name ?? 'Unknown',
    initials: data.initials ?? '??',
    role: data.role ?? '',
    color: data.color ?? '#6b6862',
    phone: data.phone ?? '',
    online: data.online ?? false,
    email: data.email ?? undefined,
    certSummary: data.certSummary ?? '',
    shiftSummary: data.shiftSummary ?? '',
    schedule: Array.isArray(data.schedule) ? data.schedule : [],
    certs: Array.isArray(data.certs) ? data.certs : [],
  };
}

function mapInventoryItem(item: DocumentData): InventoryItem {
  return {
    key: item.key ?? '',
    name: item.name ?? '',
    qty: item.qty ?? '',
    job: item.job ?? '',
    dot: item.dot ?? '#8a857a',
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { orgId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(mock.jobs);
  const [crew, setCrew] = useState<CrewMember[]>(mock.crew);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mock.inventoryItems);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [crewLoading, setCrewLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setJobsLoading(true);
    setCrewLoading(true);
    setInventoryLoading(true);

    const unsubJobs = onSnapshot(
      collection(db, 'organizations', orgId, 'jobs'),
      (snapshot) => {
        if (snapshot.empty) {
          setJobs(mock.jobs);
        } else {
          setJobs(snapshot.docs.map((d) => mapJob(d.id, d.data())));
        }
        setJobsLoading(false);
      },
      () => setJobsLoading(false)
    );

    const unsubMembers = onSnapshot(
      collection(db, 'organizations', orgId, 'members'),
      (snapshot) => {
        if (snapshot.empty) {
          setCrew(mock.crew);
        } else {
          setCrew(snapshot.docs.map((d) => mapCrewMember(d.id, d.data())));
        }
        setCrewLoading(false);
      },
      () => setCrewLoading(false)
    );

    const today = new Date().toISOString().split('T')[0];
    const unsubInventory = onSnapshot(
      doc(db, 'organizations', orgId, 'inventory', today),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const items = Array.isArray(data?.items) ? data.items.map(mapInventoryItem) : [];
          setInventoryItems(items.length > 0 ? items : mock.inventoryItems);
        } else {
          setInventoryItems(mock.inventoryItems);
        }
        setInventoryLoading(false);
      },
      () => setInventoryLoading(false)
    );

    return () => {
      unsubJobs();
      unsubMembers();
      unsubInventory();
    };
  }, [orgId]);

  return (
    <DataContext.Provider value={{ jobs, crew, inventoryItems, jobsLoading, crewLoading, inventoryLoading }}>
      {children}
    </DataContext.Provider>
  );
}
