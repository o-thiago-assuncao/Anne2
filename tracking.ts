// RedTrack tracking utility — captures and persists click attribution params
// across the funnel so they can be forwarded to Stripe metadata and the
// server-side postback.

const STORAGE_KEY = "rt_tracking";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type Stored = {
  clickid: string | null;
  fbclid: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  ts: number;
};

export type TrackingData = {
  clickid: string | null;
  fbclid: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};

const isBrowser = () => typeof window !== "undefined";

function readStored(): Stored | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Stored;
  } catch {
    return null;
  }
}

function writeStored(data: Stored) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode errors
  }
}

function clearStored() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Reads tracking params from the current URL and persists to localStorage.
 * Safe to call on every mount — only writes when a clickid is present.
 */
export function captureClickid(): void {
  if (!isBrowser()) return;
  const params = new URLSearchParams(window.location.search);
  const clickid = params.get("clickid");
  if (!clickid) return;

  const data: Stored = {
    clickid,
    fbclid: params.get("fbclid"),
    utm_source: params.get("utm_source"),
    utm_campaign: params.get("utm_campaign"),
    ts: Date.now(),
  };
  writeStored(data);
}

/**
 * Returns stored clickid, or null if missing or older than 30 days.
 * Clears storage on expiry.
 */
export function getStoredClickid(): string | null {
  const stored = readStored();
  if (!stored) return null;
  if (Date.now() - stored.ts > MAX_AGE_MS) {
    clearStored();
    return null;
  }
  return stored.clickid ?? null;
}

/**
 * Returns the full tracking object (or all-null if expired/missing).
 */
export function getTrackingData(): TrackingData {
  const stored = readStored();
  if (!stored || Date.now() - stored.ts > MAX_AGE_MS) {
    if (stored) clearStored();
    return { clickid: null, fbclid: null, utm_source: null, utm_campaign: null };
  }
  return {
    clickid: stored.clickid ?? null,
    fbclid: stored.fbclid ?? null,
    utm_source: stored.utm_source ?? null,
    utm_campaign: stored.utm_campaign ?? null,
  };
}
