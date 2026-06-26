import { collection, addDoc, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CapturedItem, LineItem } from '../types';

export async function addCapture(
  orgId: string,
  jobId: string,
  capture: Omit<CapturedItem, 'id'>
) {
  const capturesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'captures');
  await addDoc(capturesRef, capture);

  const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
  await updateDoc(jobRef, { captureCount: increment(1) });
}

export async function updateJobStatus(
  orgId: string,
  jobId: string,
  status: 'on_site' | 'scheduled' | 'completed'
) {
  const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
  await updateDoc(jobRef, { status });
}

export async function addEstimate(
  orgId: string,
  jobId: string,
  estimate: { mode: 'new' | 'addon'; lineItems: LineItem[]; subtotal: number; gst: number; total: number }
) {
  const estimatesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'estimates');
  await addDoc(estimatesRef, { ...estimate, createdAt: Date.now() });
}

export async function updateInventoryPacked(
  orgId: string,
  dateKey: string,
  packedState: Record<string, boolean>
) {
  const inventoryRef = doc(db, 'organizations', orgId, 'inventory', dateKey);
  await setDoc(inventoryRef, { packedState }, { merge: true });
}

export async function completeJob(orgId: string, jobId: string) {
  const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
  await updateDoc(jobRef, { status: 'completed' });
}
