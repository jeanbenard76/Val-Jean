import { GuestFamily } from '../types';
import { INITIAL_GUEST_FAMILIES } from '../data/fallbackFamilies';

const STORAGE_KEY_FAMILIES = 'vj_guest_families';
const STORAGE_KEY_RSVPS = 'vj_rsvp_logs';

/**
 * Retrieve current families list from localStorage or fallback to default initial families.
 */
export function getStoredFamilies(): GuestFamily[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAMILIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erreur lecture localStorage families:', e);
  }
  return INITIAL_GUEST_FAMILIES;
}

/**
 * Retrieve all RSVP submission logs from localStorage.
 */
export function getStoredRSVPs(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RSVPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erreur lecture localStorage rsvps:', e);
  }
  return [];
}

/**
 * Save an RSVP submission into localStorage and update family status.
 */
export function saveRSVPToLocalStorage(payload: {
  familyId?: string;
  familyName: string;
  email: string;
  message?: string;
  members: any[];
}): { families: GuestFamily[]; rsvps: any[] } {
  const currentFamilies = getStoredFamilies();
  const currentRSVPs = getStoredRSVPs();

  let targetFamId = payload.familyId;
  const nowIso = new Date().toISOString();

  let updatedFamilies = [...currentFamilies];

  // 1. Find existing family or create custom family
  let targetIndex = updatedFamilies.findIndex(
    (f) => (targetFamId && f.id === targetFamId) || f.familyName.toLowerCase().trim() === payload.familyName.toLowerCase().trim()
  );

  if (targetIndex >= 0) {
    const fam = updatedFamilies[targetIndex];
    updatedFamilies[targetIndex] = {
      ...fam,
      email: payload.email,
      hasResponded: true,
      respondedAt: nowIso,
      lastMessage: payload.message || fam.lastMessage || '',
      members: payload.members.map((m) => ({
        ...m,
        isAttending: Boolean(m.isAttending),
        events: m.events || { vinHonneur: true, repasNoces: true, brunchLendemain: true },
        dietaryNotes: m.dietaryNotes || '',
      })),
    };
  } else {
    targetFamId = targetFamId || `fam-custom-${Date.now()}`;
    const newFamily: GuestFamily = {
      id: targetFamId,
      familyName: payload.familyName,
      email: payload.email,
      hasResponded: true,
      respondedAt: nowIso,
      lastMessage: payload.message || '',
      members: payload.members.map((m) => ({
        ...m,
        isAttending: Boolean(m.isAttending),
        events: m.events || { vinHonneur: true, repasNoces: true, brunchLendemain: true },
        dietaryNotes: m.dietaryNotes || '',
      })),
    };
    updatedFamilies.push(newFamily);
  }

  // 2. Add RSVP entry log
  const newRsvp = {
    id: `rsvp-${Date.now()}`,
    family_id: targetFamId,
    family_name: payload.familyName,
    email: payload.email,
    message: payload.message || '',
    created_at: nowIso,
  };
  const updatedRSVPs = [newRsvp, ...currentRSVPs];

  try {
    localStorage.setItem(STORAGE_KEY_FAMILIES, JSON.stringify(updatedFamilies));
    localStorage.setItem(STORAGE_KEY_RSVPS, JSON.stringify(updatedRSVPs));
  } catch (e) {
    console.error('Erreur écriture localStorage:', e);
  }

  return { families: updatedFamilies, rsvps: updatedRSVPs };
}

/**
 * Clear all localStorage RSVP responses and reset families list.
 */
export function clearLocalStorageRSVPs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FAMILIES);
    localStorage.removeItem(STORAGE_KEY_RSVPS);
  } catch (e) {
    console.error('Erreur réinitialisation localStorage:', e);
  }
}
