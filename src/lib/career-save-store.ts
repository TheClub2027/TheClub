import type { Career } from "./game";

export const ACTIVE_CAREER_KEY = "the-club-active-career-v1";
export const LEGACY_CAREER_KEY = "the-club-career-v1";

const DATABASE_NAME = "the-club-careers";
const DATABASE_VERSION = 1;
const CAREER_STORE = "careers";
const INDEX_STORE = "career-index";

export type CareerSaveSummary = {
  id: string;
  manager: string;
  club: string;
  country: string;
  season: number;
  round: number;
  updatedAt: string;
};

type CareerIndexRecord = CareerSaveSummary;
type CareerRecord = { id: string; payload: Career };

export function summarizeCareerSave(career: Career, updatedAt = new Date().toISOString()): CareerSaveSummary {
  const club = career.clubs.find((item) => item.id === career.clubId);
  return {
    id: career.id,
    manager: career.manager,
    club: club?.name ?? "Unknown club",
    country: club?.country ?? "Unknown country",
    season: career.season,
    round: career.round,
    updatedAt,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("This browser does not support IndexedDB career saves."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CAREER_STORE)) database.createObjectStore(CAREER_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(INDEX_STORE)) database.createObjectStore(INDEX_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the local career database."));
    request.onblocked = () => reject(new Error("The local career database is busy in another tab. Close the other game tab and retry."));
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The local career database request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("The local career database transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("The local career database transaction was cancelled."));
  });
}

export async function listLocalCareerSaves(): Promise<CareerSaveSummary[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(INDEX_STORE, "readonly");
    const done = transactionComplete(transaction);
    const records = await requestValue(transaction.objectStore(INDEX_STORE).getAll() as IDBRequest<CareerIndexRecord[]>);
    await done;
    return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    database.close();
  }
}

export async function loadLocalCareer(id: string): Promise<Career | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(CAREER_STORE, "readonly");
    const done = transactionComplete(transaction);
    const record = await requestValue(transaction.objectStore(CAREER_STORE).get(id) as IDBRequest<CareerRecord | undefined>);
    await done;
    return record?.payload ?? null;
  } finally {
    database.close();
  }
}

export async function saveLocalCareer(career: Career): Promise<CareerSaveSummary> {
  const database = await openDatabase();
  const updatedAt = new Date().toISOString();
  const summary = summarizeCareerSave(career, updatedAt);
  try {
    const transaction = database.transaction([CAREER_STORE, INDEX_STORE], "readwrite");
    const done = transactionComplete(transaction);
    transaction.objectStore(CAREER_STORE).put({ id: career.id, payload: career } satisfies CareerRecord);
    transaction.objectStore(INDEX_STORE).put(summary satisfies CareerIndexRecord);
    await done;
    return summary;
  } finally {
    database.close();
  }
}

export async function deleteLocalCareer(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([CAREER_STORE, INDEX_STORE], "readwrite");
    const done = transactionComplete(transaction);
    transaction.objectStore(CAREER_STORE).delete(id);
    transaction.objectStore(INDEX_STORE).delete(id);
    await done;
  } finally {
    database.close();
  }
}

export function getActiveCareerId(): string | null {
  try { return localStorage.getItem(ACTIVE_CAREER_KEY); } catch { return null; }
}

export function setActiveCareerId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_CAREER_KEY, id);
    else localStorage.removeItem(ACTIVE_CAREER_KEY);
  } catch {
    // The save itself is stored in IndexedDB; an unavailable preference store
    // should not prevent the manager from playing or saving a career.
  }
}
