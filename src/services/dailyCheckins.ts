import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export type DailyHabit = 'water' | 'devotional';

export type DailyCheckin = {
  id: string;
  date: string;
  memberId: string;
  water: boolean;
  devotional: boolean;
  updatedAt: number;
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const checkinsCollection = collection(db, 'familyAgendas', 'familia-niskier', 'dailyCheckins');

async function ensureIdentity(): Promise<void> {
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (error) {
    // O listener ainda tentará acessar o Firestore. A interface mantém estado otimista
    // mesmo quando a infraestrutura Firebase ainda não estiver completamente habilitada.
    console.warn('Daily check-in: autenticação anônima indisponível.', error);
  }
}

export function subscribeDailyCheckins(
  date: string,
  onChange: (checkins: DailyCheckin[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const todayQuery = query(checkinsCollection, where('date', '==', date));
  return onSnapshot(
    todayQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<DailyCheckin, 'id'>),
        })),
      );
    },
    (error) => onError?.(error),
  );
}

export async function setDailyHabit(
  date: string,
  memberId: string,
  habit: DailyHabit,
  value: boolean,
): Promise<void> {
  await ensureIdentity();
  const id = `${date}_${memberId}`;
  await setDoc(
    doc(checkinsCollection, id),
    {
      date,
      memberId,
      [habit]: value,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}
