import { collection, addDoc, doc, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CapturedItem, EstimatePayload, InventoryPackedState } from '../types';

function requireId(value: string, name: string) {
  if (!value) throw new Error(`${name} is required`);
}

export async function addCapture(
  orgId: string,
  jobId: string,
  capture: Omit<CapturedItem, 'id'>
) {
  requireId(orgId, 'orgId');
  requireId(jobId, 'jobId');
  if (!capture.title) throw new Error('Capture title is required');

  const capturesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'captures');
  await addDoc(capturesRef, {
    type: capture.type,
    title: capture.title,
    subtitle: capture.subtitle ?? '',
    time: capture.time,
    createdBy: capture.createdBy ?? null,
    createdAt: capture.createdAt ?? Date.now(),
    audioUri: capture.audioUri ?? null,
    transcript: capture.transcript ?? null,
    parsedEntries: capture.parsedEntries ?? null,
  });

  const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
  await updateDoc(jobRef, { captureCount: increment(1) });
}

export async function updateJobStatus(
  orgId: string,
  jobId: string,
  status: 'on_site' | 'scheduled' | 'completed'
) {
  requireId(orgId, 'orgId');
  requireId(jobId, 'jobId');

  const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
  await updateDoc(jobRef, { status });
}

export async function addEstimate(
  orgId: string,
  jobId: string,
  estimate: EstimatePayload
) {
  requireId(orgId, 'orgId');
  requireId(jobId, 'jobId');

  if (!Array.isArray(estimate.lineItems) || estimate.lineItems.length === 0) {
    throw new Error('Estimate must have at least one line item');
  }
  if (typeof estimate.total !== 'number' || !isFinite(estimate.total) || estimate.total < 0) {
    throw new Error('Estimate total must be a non-negative number');
  }

  const sanitizedItems = estimate.lineItems.map((item) => ({
    id: item.id,
    name: item.name || 'Untitled',
    quantity: typeof item.quantity === 'number' && isFinite(item.quantity) ? item.quantity : 0,
    unit: item.unit || '',
    unitPrice: typeof item.unitPrice === 'number' && isFinite(item.unitPrice) ? item.unitPrice : 0,
  }));

  const estimatesRef = collection(db, 'organizations', orgId, 'jobs', jobId, 'estimates');
  await addDoc(estimatesRef, {
    mode: estimate.mode,
    lineItems: sanitizedItems,
    subtotal: estimate.subtotal,
    gst: estimate.gst,
    total: estimate.total,
    createdAt: Date.now(),
  });
}

export async function updateInventoryPacked(
  orgId: string,
  dateKey: string,
  packedState: InventoryPackedState
) {
  requireId(orgId, 'orgId');
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new Error(`Invalid dateKey: ${dateKey}. Expected YYYY-MM-DD format.`);
  }

  const sanitized: InventoryPackedState = {};
  for (const [key, value] of Object.entries(packedState)) {
    if (typeof value === 'boolean') {
      sanitized[key] = value;
    }
  }

  const inventoryRef = doc(db, 'organizations', orgId, 'inventory', dateKey);
  await setDoc(inventoryRef, { packedState: sanitized }, { merge: true });
}

export async function completeJob(orgId: string, jobId: string) {
  requireId(orgId, 'orgId');
  requireId(jobId, 'jobId');

  const jobRef = doc(db, 'organizations', orgId, 'jobs', jobId);
  await updateDoc(jobRef, { status: 'completed' });
}
