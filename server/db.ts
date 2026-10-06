/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

// Path to the SQLite .db file on disk.
// Configurable via DB_PATH (e.g. /data/wedding.db on Coolify with a persistent volume).
const DB_FILE_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(process.cwd(), 'wedding.db');

let db: Database | null = null;

/**
 * Initialize SQLite Database using sql.js and load existing wedding.db or create a new one.
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      db = new SQL.Database(fileBuffer);
      console.log(`[SQLite] Base de données chargée depuis: ${DB_FILE_PATH}`);
    } catch (err) {
      console.error('[SQLite] Erreur de lecture du fichier .db, création d\'une nouvelle base:', err);
      db = new SQL.Database();
    }
  } else {
    console.log('[SQLite] Création d\'une nouvelle base de données wedding.db');
    db = new SQL.Database();
  }

  // Create tables if they do not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      family_name TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      is_child INTEGER DEFAULT 0,
      is_baby INTEGER DEFAULT 0,
      age INTEGER,
      is_attending INTEGER DEFAULT 1,
      invited_vin INTEGER DEFAULT 1,
      invited_repas INTEGER DEFAULT 1,
      invited_brunch INTEGER DEFAULT 1,
      vin_honneur INTEGER DEFAULT 1,
      repas_noces INTEGER DEFAULT 1,
      brunch_lendemain INTEGER DEFAULT 1,
      dietary_notes TEXT,
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      family_id TEXT,
      family_name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrations for existing databases
  try { db.run('ALTER TABLE members ADD COLUMN invited_vin INTEGER DEFAULT 1'); } catch (e) {}
  try { db.run('ALTER TABLE members ADD COLUMN invited_repas INTEGER DEFAULT 1'); } catch (e) {}
  try { db.run('ALTER TABLE members ADD COLUMN invited_brunch INTEGER DEFAULT 1'); } catch (e) {}
  try { db.run('ALTER TABLE members ADD COLUMN is_baby INTEGER DEFAULT 0'); } catch (e) {}

  // Sync initial invitation scopes for pre-seeded families in existing database
  syncInitialInvitations(db);

  saveDatabaseToDisk();

  // Seed default guest list if families table is empty
  seedInitialFamilies(db);

  return db;
}

/**
 * Sync initial invitation scopes for seeded families in existing database.
 */
function syncInitialInvitations(database: Database): void {
  // Ne rien faire (plus de familles de démo)
}

/**
 * Save in-memory SQLite database state directly to wedding.db binary file on disk.
 */
export function saveDatabaseToDisk(): void {
  if (!db) return;
  try {
    fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.error('[SQLite] Erreur lors de la sauvegarde sur disque:', err);
  }
}

/**
 * Seed default families if database is empty.
 */
function seedInitialFamilies(database: Database): void {
  // Base de données vierge, aucune famille de démo insérée
}

/**
 * Get all families and their members.
 */
export function getAllFamiliesWithMembers() {
  if (!db) throw new Error('Database not initialized');

  const famRes = db.exec('SELECT * FROM families ORDER BY family_name ASC');
  if (!famRes.length) return [];

  const columns = famRes[0].columns;
  const families = famRes[0].values.map((row) => {
    const famObj: any = {};
    columns.forEach((col, idx) => {
      famObj[col] = row[idx];
    });
    return famObj;
  });

  return families.map((fam) => {
    const memRes = db!.exec('SELECT * FROM members WHERE family_id = ?', [fam.id]);
    let members: any[] = [];
    if (memRes.length) {
      const memCols = memRes[0].columns;
      members = memRes[0].values.map((mRow) => {
        const mObj: any = {};
        memCols.forEach((col, idx) => {
          mObj[col] = mRow[idx];
        });
        return {
          id: mObj.id,
          firstName: mObj.first_name,
          lastName: mObj.last_name,
          isChild: Boolean(mObj.is_child),
          isBaby: Boolean(mObj.is_baby),
          age: mObj.age,
          isAttending: Boolean(mObj.is_attending),
          invitedTo: {
            vinHonneur: Number(mObj.invited_vin) === 1,
            repasNoces: Number(mObj.invited_repas) === 1,
            brunchLendemain: Number(mObj.invited_brunch) === 1,
          },
          events: {
            vinHonneur: Boolean(mObj.vin_honneur),
            repasNoces: Boolean(mObj.repas_noces),
            brunchLendemain: Boolean(mObj.brunch_lendemain),
          },
          dietaryNotes: mObj.dietary_notes || '',
        };
      });
    }

    const rsvpRes = db!.exec(
      "SELECT created_at, message FROM rsvps WHERE family_id = ? ORDER BY created_at DESC LIMIT 1",
      [fam.id]
    );

    const countRes = db!.exec(
      "SELECT COUNT(*) FROM rsvps WHERE family_id = ?",
      [fam.id]
    );
    const rsvpCount = countRes.length && countRes[0].values.length > 0 ? Number(countRes[0].values[0][0]) : 0;

    let hasResponded = rsvpCount > 0 || fam.notes === 'has_responded';
    let respondedAt = null;
    let lastMessage = '';

    if (rsvpRes.length && rsvpRes[0].values.length > 0) {
      hasResponded = true;
      respondedAt = rsvpRes[0].values[0][0];
      lastMessage = (rsvpRes[0].values[0][1] as string) || '';
    }

    return {
      id: fam.id,
      familyName: fam.family_name,
      email: fam.email,
      notes: fam.notes,
      hasResponded,
      respondedAt,
      lastMessage,
      members,
    };
  });
}

/**
 * Search families or members by query string.
 */
export function searchFamilies(query: string) {
  const all = getAllFamiliesWithMembers();
  const q = query.trim().toLowerCase();
  if (!q) return all;

  return all.filter((fam) => {
    if (fam.familyName.toLowerCase().includes(q)) return true;
    return fam.members.some(
      (m: any) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)
    );
  });
}

/**
 * Save an RSVP submission and update member statuses in SQLite database.
 */
export function submitRSVP(data: {
  familyId?: string;
  familyName: string;
  email: string;
  message?: string;
  members: any[];
}) {
  if (!db) throw new Error('Database not initialized');

  let famId = data.familyId;

  // 1. Create family if it doesn't exist
  if (!famId) {
    famId = `fam-custom-${Date.now()}`;
    db.run(
      "INSERT INTO families (id, family_name, email, notes) VALUES (?, ?, ?, 'has_responded')",
      [famId, data.familyName, data.email]
    );
  } else {
    // Update family email and mark has_responded
    db.run("UPDATE families SET email = ?, notes = 'has_responded', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
      data.email,
      famId,
    ]);
  }

  // 2. Insert or update members
  for (const m of data.members) {
    const memRes = db.exec('SELECT invited_vin, invited_repas, invited_brunch FROM members WHERE id = ?', [m.id]);
    let invVin = 1, invRepas = 1, invBrunch = 1;
    if (memRes.length && memRes[0].values.length > 0) {
      invVin = Number(memRes[0].values[0][0] ?? 1);
      invRepas = Number(memRes[0].values[0][1] ?? 1);
      invBrunch = Number(memRes[0].values[0][2] ?? 1);
    } else if (m.invitedTo) {
      invVin = m.invitedTo.vinHonneur !== false ? 1 : 0;
      invRepas = m.invitedTo.repasNoces ? 1 : 0;
      invBrunch = m.invitedTo.brunchLendemain ? 1 : 0;
    }

    const isAttending = m.isAttending ? 1 : 0;
    const vin = (invVin && m.events?.vinHonneur) ? 1 : 0;
    const repas = (invRepas && m.events?.repasNoces) ? 1 : 0;
    const brunch = (invBrunch && m.events?.brunchLendemain) ? 1 : 0;
    const dietary = m.dietaryNotes || '';

    const existsRes = db.exec('SELECT id FROM members WHERE id = ?', [m.id]);
    if (existsRes.length && existsRes[0].values.length > 0) {
      db.run(
        `UPDATE members
         SET is_attending = ?, vin_honneur = ?, repas_noces = ?, brunch_lendemain = ?, dietary_notes = ?, is_child = ?, is_baby = ?
         WHERE id = ?`,
        [isAttending, vin, repas, brunch, dietary, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.id]
      );
    } else {
      db.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, is_baby, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, dietary]
      );
    }
  }

  // 3. Record RSVP log with explicit ISO 8601 timestamp
  const rsvpId = `rsvp-${Date.now()}`;
  const nowIso = new Date().toISOString();
  db.run(
    'INSERT INTO rsvps (id, family_id, family_name, email, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [rsvpId, famId, data.familyName, data.email, data.message || '', nowIso]
  );

  saveDatabaseToDisk();

  return { success: true, rsvpId, familyId: famId };
}

/**
 * Get overall attendance statistics for the couple.
 */
export function getStats() {
  const allFamilies = getAllFamiliesWithMembers();
  let totalInvited = 0;
  let totalAttendingAdults = 0;
  let totalAttendingChildren = 0;
  let totalAttendingBabies = 0;
  let totalVinHonneur = 0;
  let totalRepasNoces = 0;
  let totalBrunch = 0;
  let totalRespondedFamilies = 0;

  allFamilies.forEach((fam) => {
    totalInvited += fam.members.length;

    if (fam.hasResponded) {
      totalRespondedFamilies++;
      fam.members.forEach((m: any) => {
        if (m.isAttending) {
          if (m.isBaby) totalAttendingBabies++;
          else if (m.isChild) totalAttendingChildren++;
          else totalAttendingAdults++;

          if (m.events?.vinHonneur) totalVinHonneur++;
          if (m.events?.repasNoces) totalRepasNoces++;
          if (m.events?.brunchLendemain) totalBrunch++;
        }
      });
    }
  });

  return {
    totalFamilies: allFamilies.length,
    totalRespondedFamilies,
    totalInvited,
    totalAttendingAdults,
    totalAttendingChildren,
    totalAttendingBabies,
    totalAttending: totalAttendingAdults + totalAttendingChildren + totalAttendingBabies,
    totalVinHonneur,
    totalRepasNoces,
    totalBrunch,
  };
}

/**
 * Get all RSVP submissions.
 */
export function getAllRSVPs() {
  if (!db) throw new Error('Database not initialized');

  const res = db.exec('SELECT * FROM rsvps ORDER BY created_at DESC');
  if (!res.length) return [];

  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, idx) => {
      obj[c] = row[idx];
    });
    return obj;
  });
}

/**
 * Save a message sent from the public contact form.
 */
export function addContactMessage(data: { name: string; email: string; subject: string; message: string }) {
  if (!db) throw new Error('Database not initialized');

  const id = `msg-${Date.now()}`;
  db.run(
    'INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.name, data.email, data.subject, data.message, new Date().toISOString()]
  );
  saveDatabaseToDisk();
  return { success: true, id };
}

/**
 * Get all contact form messages, newest first.
 */
export function getAllContactMessages() {
  if (!db) throw new Error('Database not initialized');

  const res = db.exec('SELECT * FROM contact_messages ORDER BY created_at DESC');
  if (!res.length) return [];

  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, idx) => {
      obj[c] = row[idx];
    });
    return obj;
  });
}

/**
 * Update invitation scopes for all members of a family.
 */
export function updateFamilyInvitations(familyId: string, invitedVin: boolean, invitedRepas: boolean, invitedBrunch: boolean) {
  if (!db) throw new Error('Database not initialized');
  const iVin = invitedVin ? 1 : 0;
  const iRepas = invitedRepas ? 1 : 0;
  const iBrunch = invitedBrunch ? 1 : 0;

  db.run('UPDATE members SET invited_vin = ?, invited_repas = ?, invited_brunch = ? WHERE family_id = ?', [iVin, iRepas, iBrunch, familyId]);
  saveDatabaseToDisk();
  return { success: true };
}

/**
 * Clear all received RSVPs and reset family member statuses in database.
 */
export function clearAllRSVPs() {
  if (!db) throw new Error('Database not initialized');

  // 1. Clear rsvps, families, and members tables
  db.exec('DELETE FROM rsvps');
  db.exec('DELETE FROM members');
  db.exec('DELETE FROM families');

  // 2. Re-seed default initial guest families list
  seedInitialFamilies(db);

  saveDatabaseToDisk();
  console.log('[SQLite] Base de données réinitialisée à neuf dans wedding.db.');
  return { success: true, message: 'Toutes les réponses ont été supprimées et la base réinitialisée.' };
}

/**
 * Return absolute path to wedding.db for direct file download.
 */
export function getDbFilePath(): string {
  saveDatabaseToDisk();
  return DB_FILE_PATH;
}

/**
 * Add an array of families directly (used by admin for manual addition and Excel import).
 */
export function addFamilies(families: any[]) {
  if (!db) throw new Error('Database not initialized');

  let addedCount = 0;

  for (const fam of families) {
    // Generate an ID if it doesn't exist
    const famId = fam.id || `fam-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Insert family
    db.run(
      "INSERT INTO families (id, family_name, email, notes) VALUES (?, ?, ?, 'manual_addition')",
      [famId, fam.familyName, fam.email || '']
    );

    // Insert members
    for (const m of fam.members) {
      const memId = m.id || `m-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const invVin = m.invitedTo?.vinHonneur !== false ? 1 : 0;
      const invRepas = m.invitedTo?.repasNoces ? 1 : 0;
      const invBrunch = m.invitedTo?.brunchLendemain ? 1 : 0;

      // For admin addition, they might be marking them as attending or not right away
      const isAttending = m.isAttending ? 1 : 0;
      const vin = (invVin && m.events?.vinHonneur) ? 1 : 0;
      const repas = (invRepas && m.events?.repasNoces) ? 1 : 0;
      const brunch = (invBrunch && m.events?.brunchLendemain) ? 1 : 0;
      
      db.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, is_baby, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [memId, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, m.dietaryNotes || '']
      );
    }
    
    addedCount++;
  }

  saveDatabaseToDisk();
  return { success: true, count: addedCount };
}

/**
 * Delete a family and all its members and RSVPs.
 */
export function deleteFamily(familyId: string) {
  if (!db) throw new Error('Database not initialized');
  db.run("DELETE FROM members WHERE family_id = ?", [familyId]);
  db.run("DELETE FROM families WHERE id = ?", [familyId]);
  db.run("DELETE FROM rsvps WHERE family_id = ?", [familyId]);
  saveDatabaseToDisk();
  return { success: true };
}


/**
 * Update an existing family and its members.
 */
export function updateFamily(familyId: string, familyData: any) {
  if (!db) throw new Error('Database not initialized');
  db.run("UPDATE families SET family_name = ?, email = ? WHERE id = ?", [familyData.familyName, familyData.email || '', familyId]);
  db.run("DELETE FROM members WHERE family_id = ?", [familyId]);
  for (const m of familyData.members) {
      const memId = m.id || `m-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const invVin = m.invitedTo?.vinHonneur !== false ? 1 : 0;
      const invRepas = m.invitedTo?.repasNoces ? 1 : 0;
      const invBrunch = m.invitedTo?.brunchLendemain ? 1 : 0;
      const isAttending = m.isAttending ? 1 : 0;
      const vin = (invVin && m.events?.vinHonneur) ? 1 : 0;
      const repas = (invRepas && m.events?.repasNoces) ? 1 : 0;
      const brunch = (invBrunch && m.events?.brunchLendemain) ? 1 : 0;
      db.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, is_baby, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [memId, familyId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, m.dietaryNotes || '']
      );
  }
  saveDatabaseToDisk();
  return { success: true };
}
