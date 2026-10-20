import { registerVisit } from './calendarApi';

const VISITOR_KEY = 'visitorId';
const EVENT_KEY = 'visitorVisitEvent';
const INACTIVITY_MS = 30 * 60 * 1000;

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) return null;
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function safeReferrer() {
  try { return document.referrer ? new URL(document.referrer).origin : null; } catch { return null; }
}

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function createVisitorTracker(storage = browserStorage()) {
  if (!storage) return () => {};
  let visitorId;
  try {
    visitorId = storage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = uuid();
      if (!visitorId) return () => {};
      storage.setItem(VISITOR_KEY, visitorId);
    }
  } catch {
    return () => {};
  }

  let eventId;
  let lastVisitAt = 0;
  try {
    const previous = JSON.parse(storage.getItem(EVENT_KEY) || 'null');
    if (previous && Date.now() - previous.at < INACTIVITY_MS) {
      eventId = previous.id;
      lastVisitAt = previous.at;
    }
  } catch { /* unavailable or malformed storage: start a fresh event */ }

  if (!eventId) eventId = uuid();
  if (!eventId) return () => {};
  let started = false;

  return (path = window.location.pathname) => {
    const now = Date.now();
    if (now - lastVisitAt >= INACTIVITY_MS && started) eventId = uuid();
    lastVisitAt = now;
    started = true;
    try { storage.setItem(EVENT_KEY, JSON.stringify({ id: eventId, at: now })); } catch { /* tracking is best effort */ }
    registerVisit({ visitorId, eventId, page: path, referrer: safeReferrer() }).catch(() => {});
  };
}
