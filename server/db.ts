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
  `);

  // Migrations for existing databases
  try { db.run('ALTER TABLE members ADD COLUMN invited_vin INTEGER DEFAULT 1'); } catch (e) {}
  try { db.run('ALTER TABLE members ADD COLUMN invited_repas INTEGER DEFAULT 1'); } catch (e) {}
  try { db.run('ALTER TABLE members ADD COLUMN invited_brunch INTEGER DEFAULT 1'); } catch (e) {}

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
  // Famille Bénard: Vin d'Honneur uniquement
  database.exec("UPDATE members SET invited_vin = 1, invited_repas = 0, invited_brunch = 0, repas_noces = 0, brunch_lendemain = 0 WHERE family_id = 'fam-benard'");
  
  // Famille Moreau: Vin d'Honneur et Repas de Noces, mais PAS de Brunch
  database.exec("UPDATE members SET invited_vin = 1, invited_repas = 1, invited_brunch = 0, brunch_lendemain = 0 WHERE family_id = 'fam-moreau'");
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
  const res = database.exec('SELECT COUNT(*) as count FROM families');
  const count = res[0]?.values[0]?.[0] as number;

  if (count > 0) return;

  console.log('[SQLite] Insertion de la liste d\'invités initiale...');

  const initialFamilies = [
    {
      id: 'fam-benard',
      familyName: 'Bénard',
      email: 'jean.benard@exemple.fr',
      members: [
        { id: 'm-b1', firstName: 'Jean', lastName: 'Bénard', isChild: 0, isAttending: 1, vin: 1, repas: 0, brunch: 0 },
        { id: 'm-b2', firstName: 'Valentine', lastName: 'Bénard', isChild: 0, isAttending: 1, vin: 1, repas: 0, brunch: 0 },
        { id: 'm-b3', firstName: 'Lucas', lastName: 'Bénard', isChild: 1, age: 8, isAttending: 1, vin: 1, repas: 0, brunch: 0 },
        { id: 'm-b4', firstName: 'Camille', lastName: 'Bénard', isChild: 1, age: 5, isAttending: 1, vin: 1, repas: 0, brunch: 0 },
      ],
    },
    {
      id: 'fam-chemlenhof',
      familyName: 'Chem-Lenhof',
      email: 'alex.chemlenhof@exemple.fr',
      members: [
        { id: 'm-c1', firstName: 'Alexandre', lastName: 'Chem-Lenhof', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
        { id: 'm-c2', firstName: 'Élodie', lastName: 'Chem-Lenhof', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
        { id: 'm-c3', firstName: 'Gabriel', lastName: 'Chem-Lenhof', isChild: 1, age: 6, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
      ],
    },
    {
      id: 'fam-dubois',
      familyName: 'Dubois',
      email: 'pierre.dubois@exemple.fr',
      members: [
        { id: 'm-d1', firstName: 'Pierre', lastName: 'Dubois', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
        { id: 'm-d2', firstName: 'Sophie', lastName: 'Dubois', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
        { id: 'm-d3', firstName: 'Antoine', lastName: 'Dubois', isChild: 1, age: 11, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
        { id: 'm-d4', firstName: 'Léa', lastName: 'Dubois', isChild: 1, age: 4, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
      ],
    },
    {
      id: 'fam-martin',
      familyName: 'Martin',
      email: 'nicolas.martin@exemple.fr',
      members: [
        { id: 'm-m1', firstName: 'Nicolas', lastName: 'Martin', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
        { id: 'm-m2', firstName: 'Claire', lastName: 'Martin', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 1 },
      ],
    },
    {
      id: 'fam-moreau',
      familyName: 'Moreau',
      email: 'thomas.moreau@exemple.fr',
      members: [
        { id: 'm-mo1', firstName: 'Thomas', lastName: 'Moreau', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 0 },
        { id: 'm-mo2', firstName: 'Charlotte', lastName: 'Moreau', isChild: 0, isAttending: 1, vin: 1, repas: 1, brunch: 0 },
        { id: 'm-mo3', firstName: 'Emma', lastName: 'Moreau', isChild: 1, age: 7, isAttending: 1, vin: 1, repas: 1, brunch: 0 },
      ],
    },
  ];

  for (const fam of initialFamilies) {
    database.run(
      'INSERT INTO families (id, family_name, email) VALUES (?, ?, ?)',
      [fam.id, fam.familyName, fam.email]
    );

    for (const m of fam.members) {
      const invitedVin = (m as any).invitedVin !== undefined ? (m as any).invitedVin : ((m as any).vin !== undefined ? (m as any).vin : 1);
      const invitedRepas = (m as any).invitedRepas !== undefined ? (m as any).invitedRepas : ((m as any).repas !== undefined ? (m as any).repas : 1);
      const invitedBrunch = (m as any).invitedBrunch !== undefined ? (m as any).invitedBrunch : ((m as any).brunch !== undefined ? (m as any).brunch : 1);

      database.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, fam.id, m.firstName, m.lastName, m.isChild, m.age || null, m.isAttending, invitedVin, invitedRepas, invitedBrunch, m.vin, m.repas, m.brunch]
      );
    }
  }

  saveDatabaseToDisk();
  console.log('[SQLite] Liste d\'invités initialisée avec succès dans wedding.db.');
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
      "SELECT created_at, message FROM rsvps WHERE family_id = ? OR LOWER(family_name) = LOWER(?) ORDER BY created_at DESC LIMIT 1",
      [fam.id, fam.family_name]
    );

    const countRes = db!.exec(
      "SELECT COUNT(*) FROM rsvps WHERE family_id = ? OR LOWER(family_name) = LOWER(?)",
      [fam.id, fam.family_name]
    );
    const rsvpCount = countRes.length && countRes[0].values.length > 0 ? Number(countRes[0].values[0][0]) : 0;

    let hasResponded = rsvpCount > 0;
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
         SET is_attending = ?, vin_honneur = ?, repas_noces = ?, brunch_lendemain = ?, dietary_notes = ?
         WHERE id = ?`,
        [isAttending, vin, repas, brunch, dietary, m.id]
      );
    } else {
      db.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, dietary]
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
          if (m.isChild) totalAttendingChildren++;
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
    totalAttending: totalAttendingAdults + totalAttendingChildren,
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
