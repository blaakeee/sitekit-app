import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { collection, doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import * as mock from '../data/mockData';
import type { Job, CrewMember, InventoryItem } from '../types';

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

export function useJobs() {
  const { orgId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>(mock.jobs);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);

    return onSnapshot(
      collection(db, 'organizations', orgId, 'jobs'),
      (snapshot) => {
        setJobs(snapshot.empty ? mock.jobs : snapshot.docs.map((d) => mapJob(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [orgId]);

  return { jobs, jobsLoading: loading };
}

export function useCrew() {
  const { orgId } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>(mock.crew);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);

    return onSnapshot(
      collection(db, 'organizations', orgId, 'members'),
      (snapshot) => {
        setCrew(snapshot.empty ? mock.crew : snapshot.docs.map((d) => mapCrewMember(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [orgId]);

  return { crew, crewLoading: loading };
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useInventory() {
  const { orgId } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(mock.inventoryItems);
  const [loading, setLoading] = useState(false);
  const [dateKey, setDateKey] = useState(todayKey);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const current = todayKey();
        setDateKey((prev) => (prev !== current ? current : prev));
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!orgId) return;
    setLoading(true);

    return onSnapshot(
      doc(db, 'organizations', orgId, 'inventory', dateKey),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const items = Array.isArray(data?.items) ? data.items.map(mapInventoryItem) : [];
          setInventoryItems(items.length > 0 ? items : mock.inventoryItems);
        } else {
          setInventoryItems(mock.inventoryItems);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [orgId, dateKey]);

  return { inventoryItems, inventoryLoading: loading };
}

export function useData() {
  const { jobs, jobsLoading } = useJobs();
  const { crew, crewLoading } = useCrew();
  const { inventoryItems, inventoryLoading } = useInventory();
  return { jobs, crew, inventoryItems, jobsLoading, crewLoading, inventoryLoading };
}
