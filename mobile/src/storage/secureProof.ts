import * as SecureStore from "@/storage/secureStore";
import * as FileSystem from "expo-file-system/legacy";
import { ProofType } from "@/types";

/**
 * PRIVACY-CRITICAL MODULE.
 *
 * All daily "proof" (friend names, reflections, photos) is stored ONLY on the
 * device and never sent to any server. Text is kept in the OS secure enclave
 * (Keychain / Keystore) via expo-secure-store. Photos are copied into the app's
 * private sandbox directory. Everything is purged automatically once its day has
 * passed so nothing lingers.
 */

export interface StoredProof {
  activityId: number;
  proofType: ProofType;
  date: string; // yyyy-mm-dd (local)
  textValues?: string[];
  imageUri?: string;
  minutes?: number;
  count?: number;
  completedAt: string; // ISO
}

const INDEX_KEY_BASE = "liberated.proof.index";
const PROOF_DIR = FileSystem.documentDirectory + "liberated-proof/";

interface IndexEntry {
  key: string;
  date: string;
  imageUri?: string;
}

function indexKey(userId: number) {
  return `${INDEX_KEY_BASE}.${userId}`;
}

function proofKey(userId: number, activityId: number, date: string): string {
  return `liberated.proof.${userId}.${activityId}.${date}`;
}

async function readIndex(userId: number): Promise<IndexEntry[]> {
  const raw = await SecureStore.getItemAsync(indexKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as IndexEntry[];
  } catch {
    return [];
  }
}

async function writeIndex(entries: IndexEntry[]): Promise<void> {
  // caller must supply user-specific key via indexKey
  throw new Error("writeIndex should be called with userId via writeIndexForUser");
}

async function writeIndexForUser(userId: number, entries: IndexEntry[]): Promise<void> {
  await SecureStore.setItemAsync(indexKey(userId), JSON.stringify(entries));
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PROOF_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PROOF_DIR, { intermediates: true });
  }
}

/** Copy a picked image into the private proof directory and return its uri. */
async function persistImage(
  userId: number,
  activityId: number,
  date: string,
  sourceUri: string,
): Promise<string> {
  await ensureDir();

  const stripped = sourceUri.split("#")[0].split("?")[0];
  const candidate = stripped.split(".").pop() ?? "";
  const ext = /^[a-zA-Z0-9]{1,5}$/.test(candidate) ? candidate : "jpg";
  const dest = `${PROOF_DIR}${userId}_${activityId}_${date}.${ext}`;

  await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function saveProof(
  userId: number,
  input: Omit<StoredProof, "completedAt"> & { completedAt?: string },
): Promise<StoredProof> {
  const completedAt = input.completedAt ?? new Date().toISOString();
  let imageUri = input.imageUri;
  if (imageUri && !imageUri.startsWith(PROOF_DIR)) {
    imageUri = await persistImage(userId, input.activityId, input.date, imageUri);
  }

  const proof: StoredProof = { ...input, imageUri, completedAt };
  const key = proofKey(userId, input.activityId, input.date);
  await SecureStore.setItemAsync(key, JSON.stringify(proof));

  const index = await readIndex(userId);
  const filtered = index.filter((e) => e.key !== key);
  filtered.push({ key, date: input.date, imageUri });
  await writeIndexForUser(userId, filtered);

  return proof;
}

export async function getProof(
  userId: number,
  activityId: number,
  date: string,
): Promise<StoredProof | null> {
  const raw = await SecureStore.getItemAsync(proofKey(userId, activityId, date));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProof;
  } catch {
    return null;
  }
}

/**
 * Delete every stored proof whose date is not today. Called on app launch and
 * when the tracking page opens, so yesterday's private data never sticks around.
 */
export async function purgeOldProof(userId: number, today: string): Promise<void> {
  const index = await readIndex(userId);
  const keep: IndexEntry[] = [];
  for (const entry of index) {
    if (entry.date === today) {
      keep.push(entry);
      continue;
    }
    await SecureStore.deleteItemAsync(entry.key);
    if (entry.imageUri) {
      try {
        await FileSystem.deleteAsync(entry.imageUri, { idempotent: true });
      } catch {
        // ignore
      }
    }
  }
  await writeIndexForUser(userId, keep);
}

export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
