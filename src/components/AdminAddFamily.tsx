/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UserPlus, Upload, FileSpreadsheet, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminAddFamilyProps {
  onSuccess: () => void;
  adminHeaders: () => Record<string, string>;
}

export default function AdminAddFamily({ onSuccess, adminHeaders }: AdminAddFamilyProps) {
  const [mode, setMode] = useState<'none' | 'manual' | 'excel'>('none');
  
  // Manual form state
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<{ id: number, firstName: string, lastName: string, isChild: boolean, invitedVin: boolean, invitedRepas: boolean, invitedBrunch: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Excel state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<any[]>([]);
  const [excelParsing, setExcelParsing] = useState(false);

  const addMember = () => {
    setMembers([...members, { id: Date.now(), firstName: '', lastName: familyName, isChild: false, invitedVin: true, invitedRepas: true, invitedBrunch: true }]);
  };

  const updateMember = (id: number, field: string, value: any) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const handleManualSubmit = async () => {
    if (!familyName.trim() || members.length === 0) {
      setError('Veuillez renseigner un nom de famille et au moins un membre.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    const payload = [{
      familyName: familyName.trim(),
      email: email.trim(),
      members: members.map(m => ({
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
        isChild: m.isChild,
        invitedTo: {
          vinHonneur: m.invitedVin,
          repasNoces: m.invitedRepas,
          brunchLendemain: m.invitedBrunch
        }
      }))
    }];

    try {
      const res = await fetch('/api/admin/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      
      setFamilyName('');
      setEmail('');
      setMembers([]);
      setMode('none');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelParsing(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as any[];

      // Map rows to families
      const familiesMap = new Map<string, any>();
      
      rows.forEach(row => {
        const famName = row['Famille']?.toString().trim();
        if (!famName) return;

        const firstName = row['Prénom']?.toString().trim() || '';
        const lastName = row['Nom']?.toString().trim() || famName;
        const email = row['Email']?.toString().trim() || '';
        const isChild = row['Catégorie']?.toString().toLowerCase().includes('enfant') || row['Enfant']?.toString().toLowerCase() === 'oui';
        
        const vin = row["Vin d'Honneur"]?.toString().toLowerCase() !== 'non';
        const repas = row["Repas de Noces"]?.toString().toLowerCase() !== 'non';
        const brunch = row["Brunch"]?.toString().toLowerCase() !== 'non';
        const age = parseInt(row["Âge"]?.toString() || '0') || null;

        if (!familiesMap.has(famName)) {
          familiesMap.set(famName, {
            familyName: famName,
            email: email,
            members: []
          });
        }
        
        // Only update email if it was empty and we found one
        if (!familiesMap.get(famName).email && email) {
          familiesMap.get(famName).email = email;
        }

        if (firstName) {
          familiesMap.get(famName).members.push({
            firstName,
            lastName,
            isChild,
            age,
            invitedTo: {
              vinHonneur: vin,
              repasNoces: repas,
              brunchLendemain: brunch
            }
          });
        }
      });

      const parsedFamilies = Array.from(familiesMap.values()).filter(f => f.members.length > 0);
      
      if (parsedFamilies.length === 0) {
        throw new Error("Aucune donnée valide trouvée. Vérifiez que la colonne 'Famille' existe.");
      }
      
      setExcelPreview(parsedFamilies);
    } catch (err: any) {
      setError("Erreur de lecture Excel : " + err.message);
    } finally {
      setExcelParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitExcelImport = async () => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify(excelPreview)
      });
      if (!res.ok) throw new Error("Erreur lors de l'import");
      
      setExcelPreview([]);
      setMode('none');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#3B6FA0]/15 p-6 shadow-xs mt-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display text-xl text-[#13263B] font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#C4A475]" />
            Ajouter des invités
          </h3>
          <p className="text-xs text-[#5A5040] font-serif italic">
            Ajoutez manuellement une famille ou importez votre fichier Excel complet.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode(mode === 'manual' ? 'none' : 'manual')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${mode === 'manual' ? 'bg-[#13263B] text-white' : 'bg-[#FAF7F2] text-[#13263B] hover:bg-slate-200 border border-slate-200'}`}
          >
            <Plus className="w-4 h-4" />
            Saisie manuelle
          </button>
          <button
            onClick={() => setMode(mode === 'excel' ? 'none' : 'excel')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${mode === 'excel' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-medium">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* MANUAL MODE */}
      {mode === 'manual' && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nom de la famille *</label>
              <input type="text" value={familyName} onChange={e => {
                setFamilyName(e.target.value);
                // Update default last names of members
                setMembers(members.map(m => m.lastName === familyName ? { ...m, lastName: e.target.value } : m));
              }} placeholder="ex: Dupont" className="w-full px-3 py-2 bg-[#FAF7F2] border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email de contact (optionnel)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="famille@email.com" className="w-full px-3 py-2 bg-[#FAF7F2] border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500">Membres de la famille</label>
              <button onClick={addMember} className="cursor-pointer text-xs text-[#3B6FA0] hover:text-[#C4A475] font-semibold flex items-center gap-1">
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>
            
            <div className="space-y-2">
              {members.length === 0 && (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                  Aucun membre ajouté. Cliquez sur "Ajouter".
                </p>
              )}
              {members.map((m, idx) => (
                <div key={m.id} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input type="text" placeholder="Prénom" value={m.firstName} onChange={e => updateMember(m.id, 'firstName', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                  <input type="text" placeholder="Nom" value={m.lastName} onChange={e => updateMember(m.id, 'lastName', e.target.value)} className="flex-1 min-w-[120px] px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                  
                  <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                    <input type="checkbox" checked={m.isChild} onChange={e => updateMember(m.id, 'isChild', e.target.checked)} />
                    Enfant
                  </label>
                  
                  <div className="flex items-center gap-2 border-l border-slate-300 pl-2 ml-1 text-xs">
                    <label className="flex items-center gap-1 cursor-pointer" title="Vin d'Honneur"><input type="checkbox" checked={m.invitedVin} onChange={e => updateMember(m.id, 'invitedVin', e.target.checked)} /> Vin</label>
                    <label className="flex items-center gap-1 cursor-pointer" title="Repas de Noces"><input type="checkbox" checked={m.invitedRepas} onChange={e => updateMember(m.id, 'invitedRepas', e.target.checked)} /> Repas</label>
                    <label className="flex items-center gap-1 cursor-pointer" title="Brunch"><input type="checkbox" checked={m.invitedBrunch} onChange={e => updateMember(m.id, 'invitedBrunch', e.target.checked)} /> Brunch</label>
                  </div>

                  <button onClick={() => removeMember(m.id)} className="cursor-pointer p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button onClick={handleManualSubmit} disabled={submitting || members.length === 0} className="cursor-pointer px-5 py-2.5 bg-[#13263B] hover:bg-[#C4A475] text-white hover:text-[#13263B] rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {submitting ? 'Enregistrement...' : 'Créer la famille'}
            </button>
          </div>
        </div>
      )}

      {/* EXCEL MODE */}
      {mode === 'excel' && (
        <div className="mt-6 space-y-4 animate-fade-in">
          {excelPreview.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-3" />
              <h4 className="text-sm font-bold text-[#13263B] mb-1">Chargez votre fichier Excel</h4>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Colonnes attendues : Famille, Prénom, Nom, Email, Catégorie (Adulte/Enfant), Vin d'Honneur, Repas de Noces, Brunch.
              </p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" ref={fileInputRef} id="excel-upload" />
              <label htmlFor="excel-upload" className="inline-block px-4 py-2 bg-white border border-slate-300 text-sm font-semibold rounded-xl cursor-pointer hover:border-[#C4A475] text-[#13263B]">
                {excelParsing ? 'Analyse...' : 'Parcourir les fichiers'}
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between">
                <div>
                  <h4 className="text-emerald-800 font-bold text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> Aperçu de l'import réussi
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    {excelPreview.length} familles trouvées, total de {excelPreview.reduce((acc, f) => acc + f.members.length, 0)} invités.
                  </p>
                </div>
                <button onClick={() => setExcelPreview([])} className="text-xs text-slate-500 hover:text-[#13263B] underline cursor-pointer">
                  Annuler
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2 text-xs">
                {excelPreview.slice(0, 10).map((f, i) => (
                  <div key={i} className="flex justify-between items-center pb-2 border-b border-slate-200 last:border-0 last:pb-0">
                    <span className="font-bold text-[#13263B]">{f.familyName}</span>
                    <span className="text-slate-500">{f.members.length} membre(s)</span>
                  </div>
                ))}
                {excelPreview.length > 10 && (
                  <div className="text-center text-slate-400 italic pt-2">
                    ... et {excelPreview.length - 10} autres familles.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={submitExcelImport} disabled={submitting} className="cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {submitting ? 'Importation en cours...' : 'Confirmer l\'import'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
