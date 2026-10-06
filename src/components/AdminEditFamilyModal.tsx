import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { GuestFamily } from '../types';

interface AdminEditFamilyModalProps {
  family: GuestFamily;
  onClose: () => void;
  onSuccess: () => void;
  adminHeaders: () => Record<string, string>;
}

export default function AdminEditFamilyModal({ family, onClose, onSuccess, adminHeaders }: AdminEditFamilyModalProps) {
  const [familyName, setFamilyName] = useState(family.familyName);
  const [email, setEmail] = useState(family.email || '');
  const [members, setMembers] = useState(
    family.members.map(m => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      isChild: m.isChild,
      isBaby: m.isBaby || false,
      isAttending: m.isAttending,
      invitedVin: m.invitedTo?.vinHonneur ?? true,
      invitedRepas: m.invitedTo?.repasNoces ?? true,
      invitedBrunch: m.invitedTo?.brunchLendemain ?? true,
      dietaryNotes: m.dietaryNotes || ''
    }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    setMembers([...members, { 
      id: 'new-' + Date.now().toString(), 
      firstName: '', 
      lastName: familyName, 
      isChild: false, 
      isBaby: false,
      isAttending: true,
      invitedVin: true, 
      invitedRepas: true, 
      invitedBrunch: true,
      dietaryNotes: ''
    }]);
  };

  const updateMember = (id: string, field: string, value: any) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    if (!familyName.trim() || members.length === 0) {
      setError('Veuillez renseigner un nom de famille et au moins un membre.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    const payload = {
      familyName: familyName.trim(),
      email: email.trim(),
      members: members.map(m => ({
        id: m.id.startsWith('new-') ? null : m.id,
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
        isChild: m.isChild,
        isBaby: m.isBaby,
        isAttending: m.isAttending,
        invitedTo: {
          vinHonneur: m.invitedVin,
          repasNoces: m.invitedRepas,
          brunchLendemain: m.invitedBrunch
        },
        dietaryNotes: m.dietaryNotes
      }))
    };

    try {
      const res = await fetch(/api/admin/families/, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erreur lors de la modification");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#13263B]/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl font-bold text-[#13263B]">Modifier la famille</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nom de la famille</label>
            <input type="text" value={familyName} onChange={e => setFamilyName(e.target.value)} className="w-full px-3 py-2 bg-[#FAF7F2] border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-[#FAF7F2] border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <label className="block text-xs font-bold uppercase text-slate-500">Membres ({members.length})</label>
          <button onClick={addMember} className="text-xs font-semibold text-[#3B6FA0] hover:text-[#C4A475] flex items-center gap-1 cursor-pointer">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {members.map((m) => (
            <div key={m.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center">
              <input type="text" placeholder="Prénom" value={m.firstName} onChange={e => updateMember(m.id, 'firstName', e.target.value)} className="flex-1 min-w-[100px] px-2 py-1.5 border rounded text-xs" />
              <input type="text" placeholder="Nom" value={m.lastName} onChange={e => updateMember(m.id, 'lastName', e.target.value)} className="flex-1 min-w-[100px] px-2 py-1.5 border rounded text-xs" />
              
              <select value={m.isBaby ? 'baby' : (m.isChild ? 'child' : 'adult')} onChange={e => {
                const val = e.target.value;
                updateMember(m.id, 'isBaby', val === 'baby');
                updateMember(m.id, 'isChild', val === 'child');
              }} className="px-2 py-1.5 border rounded text-xs">
                <option value="adult">Adulte</option>
                <option value="child">Enfant</option>
                <option value="baby">Bébé</option>
              </select>

              <div className="flex items-center gap-2 border-l border-r border-slate-300 px-3 text-xs">
                <label className="flex items-center gap-1"><input type="checkbox" checked={m.invitedVin} onChange={e => updateMember(m.id, 'invitedVin', e.target.checked)} /> Vin</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={m.invitedRepas} onChange={e => updateMember(m.id, 'invitedRepas', e.target.checked)} /> Repas</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={m.invitedBrunch} onChange={e => updateMember(m.id, 'invitedBrunch', e.target.checked)} /> Brunch</label>
              </div>

              <label className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                <input type="checkbox" checked={m.isAttending} onChange={e => updateMember(m.id, 'isAttending', e.target.checked)} />
                Présent
              </label>

              <button onClick={() => removeMember(m.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded ml-auto cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-sm font-semibold cursor-pointer">Annuler</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 bg-[#13263B] text-white hover:bg-[#C4A475] rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50">
            {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
