import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CalendarEvent, FamilyMember } from '../types';
import { INITIAL_MEMBERS } from '../constants';
import { getSemester2026Events } from '../data/semester2026';
import { getFamilyRoutines2026Events } from '../data/familyRoutines2026';
import { generateFreeSlots } from '../data/freeSlots2026';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const FAMILY_ID = 'familia-niskier';
const familyDoc = doc(db, 'familyAgendas', FAMILY_ID);
const eventsCollection = collection(familyDoc, 'events');
const membersCollection = collection(familyDoc, 'members');
const metaDoc = doc(familyDoc, 'meta', 'state');

const LEGACY_KEYS = [
  'family_cal_events_v4',
  'family_cal_members_v4',
  'family_cal_theme_v2',
  'family_cal_notif_v2',
  'family_cal_last_google_sync',
  'family_cal_semester_2026_2_v1',
  'family_cal_semester_2026_2_v2',
  'family_cal_free_slots_2026_2_v1',
];

type LegacyData = {
  events: CalendarEvent[];
  members: FamilyMember[];
};

function cleanForFirestore<T extends Record<string, any>>(value: T): T {
  const result: Record<string, any> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) result[key] = item;
  }
  return result as T;
}

function eventSignature(event: CalendarEvent): string {
  return [event.title, event.date, event.startTime, event.endTime, event.memberId].join('|');
}

function defaultAgendaEvents(): CalendarEvent[] {
  const scheduled = [
    ...getSemester2026Events(),
    ...getFamilyRoutines2026Events(),
  ];
  return [...scheduled, ...generateFreeSlots(scheduled)];
}

function readLegacyData(): LegacyData {
  if (typeof window === 'undefined') return { events: [], members: [] };

  let events: CalendarEvent[] = [];
  let members: FamilyMember[] = [];

  try {
    const rawEvents = window.localStorage.getItem('family_cal_events_v4');
    if (rawEvents) {
      const parsed = JSON.parse(rawEvents);
      if (Array.isArray(parsed)) events = parsed;
    }
  } catch (error) {
    console.warn('Não foi possível ler os eventos antigos do navegador:', error);
  }

  try {
    const rawMembers = window.localStorage.getItem('family_cal_members_v4');
    if (rawMembers) {
      const parsed = JSON.parse(rawMembers);
      if (Array.isArray(parsed)) members = parsed;
    }
  } catch (error) {
    console.warn('Não foi possível ler os membros antigos do navegador:', error);
  }

  return { events, members };
}

function clearLegacyData(): void {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Migração já concluída; falha de limpeza não impede o uso da nuvem.
    }
  }
}

async function ensureCloudIdentity(): Promise<void> {
  if (auth.currentUser) return;

  try {
    await signInAnonymously(auth);
  } catch (error: any) {
    // Se autenticação anônima não estiver habilitada, ainda tentamos o Firestore.
    // Isso permite projetos cujas regras atuais aceitem acesso sem autenticação.
    console.warn('Autenticação anônima indisponível; tentando acesso direto ao Firestore.', error?.code || error);
  }
}

async function commitInChunks(
  operations: Array<(batch: ReturnType<typeof writeBatch>) => void>,
): Promise<void> {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    for (const operation of operations.slice(i, i + CHUNK_SIZE)) operation(batch);
    await batch.commit();
  }
}

export async function initializeCloudAgenda(): Promise<void> {
  await ensureCloudIdentity();

  const [cloudEventsSnapshot, cloudMembersSnapshot] = await Promise.all([
    getDocs(eventsCollection),
    getDocs(membersCollection),
  ]);

  const legacy = readLegacyData();
  const cloudEventIds = new Set(cloudEventsSnapshot.docs.map((item) => item.id));
  const cloudEventSignatures = new Set(
    cloudEventsSnapshot.docs.map((item) => eventSignature(item.data() as CalendarEvent)),
  );

  const seedEvents = cloudEventsSnapshot.empty ? defaultAgendaEvents() : [];
  const candidateEvents = [...seedEvents, ...legacy.events];
  const eventsToUpload: CalendarEvent[] = [];
  const seenIds = new Set(cloudEventIds);
  const seenSignatures = new Set(cloudEventSignatures);

  for (const event of candidateEvents) {
    if (!event?.id || seenIds.has(event.id) || seenSignatures.has(eventSignature(event))) continue;
    seenIds.add(event.id);
    seenSignatures.add(eventSignature(event));
    eventsToUpload.push(event);
  }

  const memberSource = legacy.members.length > 0 ? legacy.members : INITIAL_MEMBERS;
  const cloudMemberIds = new Set(cloudMembersSnapshot.docs.map((item) => item.id));
  const membersToUpload = cloudMembersSnapshot.empty
    ? memberSource
    : memberSource.filter((member) => !cloudMemberIds.has(member.id));

  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const event of eventsToUpload) {
    operations.push((batch) => {
      batch.set(doc(eventsCollection, event.id), cleanForFirestore(event), { merge: true });
    });
  }

  for (const member of membersToUpload) {
    operations.push((batch) => {
      batch.set(doc(membersCollection, member.id), cleanForFirestore(member), { merge: true });
    });
  }

  if (operations.length > 0) await commitInChunks(operations);

  await setDoc(metaDoc, {
    initialized: true,
    schemaVersion: 1,
    lastBootstrapAt: Date.now(),
  }, { merge: true });

  // A partir daqui a nuvem é a fonte única de verdade.
  clearLegacyData();
}

export function subscribeCloudEvents(
  onChange: (events: CalendarEvent[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    eventsCollection,
    (snapshot) => {
      const events = snapshot.docs
        .map((item) => item.data() as CalendarEvent)
        .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
      onChange(events);
    },
    (error) => onError?.(error),
  );
}

export function subscribeCloudMembers(
  onChange: (members: FamilyMember[]) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    membersCollection,
    (snapshot) => {
      const members = snapshot.docs.map((item) => item.data() as FamilyMember);
      onChange(members.length > 0 ? members : INITIAL_MEMBERS);
    },
    (error) => onError?.(error),
  );
}

export async function upsertCloudEvent(event: CalendarEvent): Promise<void> {
  await ensureCloudIdentity();
  await setDoc(doc(eventsCollection, event.id), cleanForFirestore(event), { merge: true });
}

export async function upsertCloudEvents(events: CalendarEvent[]): Promise<void> {
  await ensureCloudIdentity();
  const operations = events.map((event) => (batch: ReturnType<typeof writeBatch>) => {
    batch.set(doc(eventsCollection, event.id), cleanForFirestore(event), { merge: true });
  });
  await commitInChunks(operations);
}

export async function deleteCloudEvent(eventId: string): Promise<void> {
  await ensureCloudIdentity();
  await deleteDoc(doc(eventsCollection, eventId));
}

export async function replaceCloudMembers(members: FamilyMember[]): Promise<void> {
  await ensureCloudIdentity();
  const current = await getDocs(membersCollection);
  const desiredIds = new Set(members.map((member) => member.id));
  const operations: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

  for (const existing of current.docs) {
    if (!desiredIds.has(existing.id)) {
      operations.push((batch) => batch.delete(existing.ref));
    }
  }

  for (const member of members) {
    operations.push((batch) => {
      batch.set(doc(membersCollection, member.id), cleanForFirestore(member), { merge: true });
    });
  }

  if (operations.length > 0) await commitInChunks(operations);
}
