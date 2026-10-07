import sys

with open('server/db.ts', 'r', encoding='utf-8') as f:
    db = f.read()

db = db.replace('is_child INTEGER DEFAULT 0,', 'is_child INTEGER DEFAULT 0,\n      is_baby INTEGER DEFAULT 0,')
db = db.replace("try { db.run('ALTER TABLE members ADD COLUMN invited_brunch INTEGER DEFAULT 1'); } catch (e) {}",
                "try { db.run('ALTER TABLE members ADD COLUMN invited_brunch INTEGER DEFAULT 1'); } catch (e) {}\n  try { db.run('ALTER TABLE members ADD COLUMN is_baby INTEGER DEFAULT 0'); } catch (e) {}")

db = db.replace('isChild: Boolean(mObj.is_child),', 'isChild: Boolean(mObj.is_child),\n          isBaby: Boolean(mObj.is_baby),')

submit_rsvp_repl1 = '''
        `UPDATE members
         SET is_attending = ?, vin_honneur = ?, repas_noces = ?, brunch_lendemain = ?, dietary_notes = ?, is_child = ?, is_baby = ?
         WHERE id = ?`,
        [isAttending, vin, repas, brunch, dietary, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.id]
'''
db = db.replace('''
        `UPDATE members
         SET is_attending = ?, vin_honneur = ?, repas_noces = ?, brunch_lendemain = ?, dietary_notes = ?
         WHERE id = ?`,
        [isAttending, vin, repas, brunch, dietary, m.id]
'''.strip(), submit_rsvp_repl1.strip())

submit_rsvp_repl2 = '''
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, is_baby, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, dietary]
'''
db = db.replace('''
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [m.id, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, dietary]
'''.strip(), submit_rsvp_repl2.strip())

add_fam_repl = '''
      db.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, is_baby, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [memId, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.isBaby ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, m.dietaryNotes || '']
      );
'''
db = db.replace('''
      db.run(
        `INSERT INTO members (id, family_id, first_name, last_name, is_child, age, is_attending, invited_vin, invited_repas, invited_brunch, vin_honneur, repas_noces, brunch_lendemain, dietary_notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [memId, famId, m.firstName, m.lastName, m.isChild ? 1 : 0, m.age || null, isAttending, invVin, invRepas, invBrunch, vin, repas, brunch, m.dietaryNotes || '']
      );
'''.strip(), add_fam_repl.strip())

update_fam_fn = '''
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
'''
if "updateFamily" not in db:
    db = db + '\n' + update_fam_fn

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(db)

print('Backend updated successfully.')
