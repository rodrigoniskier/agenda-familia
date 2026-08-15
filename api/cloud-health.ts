const FIREBASE_API_KEY = 'AIzaSyD8xfxfpotKbUFxsHcVOygVZwimnkNXV1A';
const FIREBASE_PROJECT_ID = 'gen-lang-client-0932140849';

export default async function handler(_req: any, res: any) {
  const result: Record<string, any> = {
    ok: false,
    anonymousAuth: false,
    firestore: false,
  };

  try {
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
      },
    );

    result.authStatus = authResponse.status;
    const authBody: any = await authResponse.json().catch(() => ({}));
    const idToken = authBody?.idToken as string | undefined;
    result.anonymousAuth = Boolean(authResponse.ok && idToken);

    if (!idToken) {
      result.authError = authBody?.error?.message || 'Anonymous authentication unavailable';
      return res.status(200).json(result);
    }

    const firestoreResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/familyAgendas/familia-niskier/meta/state`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );

    result.firestoreStatus = firestoreResponse.status;
    result.firestore = firestoreResponse.status === 200 || firestoreResponse.status === 404;

    if (!result.firestore) {
      const firestoreBody: any = await firestoreResponse.json().catch(() => ({}));
      result.firestoreError = firestoreBody?.error?.message || 'Firestore unavailable';
    }

    result.ok = result.anonymousAuth && result.firestore;
    return res.status(200).json(result);
  } catch (error: any) {
    result.error = error?.message || String(error);
    return res.status(200).json(result);
  }
}
