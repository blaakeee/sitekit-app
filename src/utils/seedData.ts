import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { jobs, crew, capturedItems, inventoryItems, estimateLineItems } from '../data/mockData';

export async function seedFirestoreData(orgId: string) {
  for (const job of jobs) {
    const { id, ...jobData } = job;
    const jobRef = doc(db, 'organizations', orgId, 'jobs', id);
    await setDoc(jobRef, { ...jobData, createdAt: Date.now() });

    if (id === '1') {
      for (const capture of capturedItems) {
        const { id: captureId, ...captureData } = capture;
        await setDoc(
          doc(db, 'organizations', orgId, 'jobs', id, 'captures', captureId),
          { ...captureData, createdAt: Date.now() }
        );
      }

      await setDoc(
        doc(db, 'organizations', orgId, 'jobs', id, 'estimates', 'draft'),
        {
          mode: 'new',
          lineItems: estimateLineItems,
          subtotal: 273.0,
          gst: 27.3,
          total: 300.3,
          createdAt: Date.now(),
        }
      );
    }
  }

  for (const member of crew) {
    const { id, schedule, certs, ...memberData } = member;
    await setDoc(doc(db, 'organizations', orgId, 'members', id), {
      ...memberData,
      schedule,
      certs,
    });
  }

  const today = new Date().toISOString().split('T')[0];
  await setDoc(doc(db, 'organizations', orgId, 'inventory', today), {
    items: inventoryItems,
    packedState: {},
  });
}
