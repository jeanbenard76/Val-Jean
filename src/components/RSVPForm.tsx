/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Search, User, Baby, Heart, Users, ChevronRight, CheckCircle2, AlertCircle, Database, Download, FileSpreadsheet, ShieldCheck, RefreshCw, MessageSquare, Utensils, Clock } from 'lucide-react';
import { GuestFamily, FamilyMember } from '../types';

// Fallback Pre-seeded Database of Guest Families
const FALLBACK_FAMILIES: GuestFamily[] = [
  {
    id: 'fam-benard',
    familyName: 'Bénard',
    email: 'jean.benard@exemple.fr',
    members: [
      {
        id: 'm-b1',
        firstName: 'Jean',
        lastName: 'Bénard',
        isChild: false,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
      {
        id: 'm-b2',
        firstName: 'Valentine',
        lastName: 'Bénard',
        isChild: false,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
      {
        id: 'm-b3',
        firstName: 'Lucas',
        lastName: 'Bénard',
        isChild: true,
        age: 8,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
      {
        id: 'm-b4',
        firstName: 'Camille',
        lastName: 'Bénard',
        isChild: true,
        age: 5,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
    ],
  },
  {
    id: 'fam-chemlenhof',
    familyName: 'Chem-Lenhof',
    email: 'alex.chemlenhof@exemple.fr',
    members: [
      {
        id: 'm-c1',
        firstName: 'Alexandre',
        lastName: 'Chem-Lenhof',
        isChild: false,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
      {
        id: 'm-c2',
        firstName: 'Élodie',
        lastName: 'Chem-Lenhof',
        isChild: false,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
      {
        id: 'm-c3',
        firstName: 'Gabriel',
        lastName: 'Chem-Lenhof',
        isChild: true,
        age: 6,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
    ],
  },
];

export default function RSVPForm() {
  const [families, setFamilies] = useState<GuestFamily[]>(FALLBACK_FAMILIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<GuestFamily | null>(null);

  // Editable members list for the selected or custom family
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // New member inputs
  const [showAddMember, setShowAddMember] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newIsChild, setNewIsChild] = useState(false);

  // Admin dashboard state
  const [showAdmin, setShowAdmin] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [allRSVPs, setAllRSVPs] = useState<any[]>([]);
  const [adminFilter, setAdminFilter] = useState<'all' | 'attending' | 'absent' | 'dietary'>('all');
  const [adminSearch, setAdminSearch] = useState('');

  // Load live families & stats from SQLite backend on component mount
  // (fetchRSVPs removed: admin-only route, unused on the public form)
  useEffect(() => {
    fetchFamilies();
    fetchStats();
  }, []);

  const fetchFamilies = async () => {
    try {
      const res = await fetch('/api/families');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFamilies(data);
        }
      }
    } catch (err) {
      console.log('Utilisation du mode hors-ligne pour la recherche invités');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.log('Erreur récupération statistiques API');
    }
  };

  const fetchRSVPs = async () => {
    try {
      const res = await fetch('/api/rsvps');
      if (res.ok) {
        const data = await res.json();
        setAllRSVPs(data);
      }
    } catch (err) {
      console.log('Erreur récupération des RSVPs');
    }
  };

  const handleUpdateInvitation = async (
    familyId: string,
    invitedVin: boolean,
    invitedRepas: boolean,
    invitedBrunch: boolean
  ) => {
    try {
      const res = await fetch('/api/admin/update-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, invitedVin, invitedRepas, invitedBrunch }),
      });
      if (res.ok) {
        await fetchFamilies();
        await fetchStats();
      }
    } catch (err) {
      console.error('Erreur mise à jour invitation', err);
    }
  };

  // Search filter matching families or individual member names
  const filteredSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return families.filter((fam) => {
      if (fam.familyName.toLowerCase().includes(q)) return true;
      return fam.members.some(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, families]);

  // Handle selecting a family from suggestions database
  const handleSelectFamily = (fam: GuestFamily) => {
    setSelectedFamily(fam);
    setSearchQuery(`Famille ${fam.familyName}`);
    setEmail(fam.email || '');
    if (fam.lastMessage) {
      setMessage(fam.lastMessage);
    }

    const sanitizedMembers = fam.members.map((m) => {
      const inv = m.invitedTo || { vinHonneur: true, repasNoces: true, brunchLendemain: true };
      return {
        ...m,
        invitedTo: inv,
        events: {
          vinHonneur: inv.vinHonneur !== false ? Boolean(m.events.vinHonneur) : false,
          repasNoces: inv.repasNoces ? Boolean(m.events.repasNoces) : false,
          brunchLendemain: inv.brunchLendemain ? Boolean(m.events.brunchLendemain) : false,
        },
      };
    });

    setMembers(sanitizedMembers);
    setShowSuggestions(false);
  };

  // Start fresh manual family input if name not found in DB
  const handleCreateCustomFamily = () => {
    const cleanName = searchQuery.trim() || 'Invité';
    setSelectedFamily({
      id: `custom-${Date.now()}`,
      familyName: cleanName,
      members: [],
    });
    setMembers([
      {
        id: `m-custom-1`,
        firstName: cleanName,
        lastName: '',
        isChild: false,
        isAttending: true,
        events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
      },
    ]);
    setShowSuggestions(false);
  };

  // Toggle individual attendance
  const toggleAttendance = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, isAttending: !m.isAttending } : m))
    );
  };

  // Set explicit attendance status (Présent / Absent)
  const setMemberAttendance = (memberId: string, status: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, isAttending: status } : m))
    );
  };

  // Toggle individual event participation
  const toggleEvent = (memberId: string, eventKey: 'vinHonneur' | 'repasNoces' | 'brunchLendemain') => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              events: {
                ...m.events,
                [eventKey]: !m.events[eventKey],
              },
            }
          : m
      )
    );
  };

  // Update dietary notes for a member
  const updateDietary = (memberId: string, notes: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, dietaryNotes: notes } : m))
    );
  };

  // Batch toggle all members
  const batchSetAttendance = (status: boolean) => {
    setMembers((prev) => prev.map((m) => ({ ...m, isAttending: status })));
  };

  // Add a new member / child to the current family
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim()) return;

    const newMember: FamilyMember = {
      id: `m-added-${Date.now()}`,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim() || (selectedFamily?.familyName || ''),
      isChild: newIsChild,
      isAttending: true,
      events: { vinHonneur: true, repasNoces: true, brunchLendemain: true },
    };

    setMembers((prev) => [...prev, newMember]);
    setNewFirstName('');
    setNewLastName('');
    setNewIsChild(false);
    setShowAddMember(false);
  };

  // Submit RSVP to SQLite wedding.db backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      familyId: selectedFamily?.id,
      familyName: selectedFamily?.familyName || searchQuery,
      email,
      members,
      message,
    };

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchFamilies();
        await fetchStats();
        await fetchRSVPs();
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Erreur lors de l’envoi du RSVP', err);
      setIsSubmitted(true);
    }
  };

  const attendingAdults = members.filter((m) => m.isAttending && !m.isChild).length;
  const attendingChildren = members.filter((m) => m.isAttending && m.isChild).length;

  // Filtered families list for Admin audit view
  const adminFilteredFamilies = useMemo(() => {
    const q = adminSearch.trim().toLowerCase();
    return families.filter((fam) => {
      // Name or search match
      const nameMatch = !q || fam.familyName.toLowerCase().includes(q) || fam.members.some((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q));
      if (!nameMatch) return false;

      if (adminFilter === 'attending') return fam.members.some((m) => m.isAttending);
      if (adminFilter === 'absent') return fam.members.every((m) => !m.isAttending);
      if (adminFilter === 'dietary') return fam.members.some((m) => Boolean(m.dietaryNotes && m.dietaryNotes.trim()));
      return true;
    });
  }, [families, adminFilter, adminSearch]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8" id="rsvp-section">
      
      {/* Editorial Header */}
      <div className="text-center mb-6 sm:mb-8">
        <span className="font-serif italic text-xs sm:text-sm text-[#C4A475] tracking-wider uppercase block mb-4">
          Réponse Souhaitée Avant le 15 Février 2027
        </span>
        <h2 className="font-script text-5xl sm:text-7xl text-[#13263B] leading-tight pt-2">
          Confirmation de Présence
        </h2>
        <div className="w-16 h-[1px] bg-[#C4A475] mx-auto my-3" />
        <p className="font-serif italic text-[#3B6FA0] text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
          Afin d’organiser au mieux notre réception au Manoir d'Auffay, merci d’indiquer ci-dessous les membres de votre foyer qui participeront à notre grand jour.
        </p>
      </div>

      {/* Main Card Container */}
      <div className="bg-white/80 backdrop-blur-md border-0 rounded-3xl p-5 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C4A475]/60 to-transparent" />

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] border border-[#C4A475] mx-auto flex items-center justify-center text-[#13263B]">
                <CheckCircle2 className="w-8 h-8 text-[#C4A475]" />
              </div>

              <div>
                <h3 className="font-display text-2xl sm:text-3xl text-[#13263B] mb-2">
                  Merci infiniment !
                </h3>
                <p className="text-sm font-serif italic text-[#5A5040] max-w-md mx-auto">
                  Votre réponse pour la {selectedFamily ? `Famille ${selectedFamily.familyName}` : 'votre famille'} a bien été enregistrée dans la base de données du mariage.
                </p>
              </div>

              {/* Summary breakdown box */}
              <div className="bg-[#FAF7F2] border border-[#3B6FA0]/15 rounded-2xl p-5 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#13263B] border-b border-[#3B6FA0]/10 pb-2">
                  <span>Récapitulatif des confirmations</span>
                  <span className="text-[#C4A475]">
                    {attendingAdults + attendingChildren} Présent(s)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1 border-b border-dashed border-slate-200">
                      <div className="flex items-center gap-2">
                        {m.isChild ? (
                          <Baby className="w-3.5 h-3.5 text-[#C4A475]" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-[#13263B]" />
                        )}
                        <span className="font-medium text-[#13263B]">
                          {m.firstName} {m.lastName}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase ${m.isChild ? 'bg-[#C4A475]/20 text-[#8B6B38]' : 'bg-[#13263B]/10 text-[#13263B]'}`}>
                          {m.isChild ? 'Enfant' : 'Adulte'}
                        </span>
                      </div>

                      <span className={`font-semibold text-[11px] ${m.isAttending ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {m.isAttending ? '✓ Présent(e)' : '✗ Absent(e)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedFamily(null);
                  setSearchQuery('');
                  setMembers([]);
                }}
                className="px-6 py-2.5 border border-[#13263B]/30 hover:border-[#13263B] text-[#13263B] text-xs uppercase tracking-wider font-semibold rounded-full transition-all cursor-pointer"
              >
                Saisir une autre réponse
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* STEP 1: Search Name / Database Lookup */}
              <div className="space-y-2 relative">
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#13263B]">
                  1. RECHERCHEZ VOTRE NOM OU PRÉNOM (LISTE D'INVITÉS) *
                </label>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-[#3B6FA0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                      if (!e.target.value) {
                        setSelectedFamily(null);
                        setMembers([]);
                      }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Tapez votre nom (ex. Bénard, Chem-Lenhof, Dubois, Martin...)"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF7F2] border border-[#3B6FA0]/20 rounded-2xl text-xs text-[#13263B] font-sans focus:outline-none focus:border-[#C4A475] transition-colors"
                  />
                </div>

                {/* Database Suggestion Dropdown */}
                {showSuggestions && searchQuery.trim().length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#3B6FA0]/20 rounded-2xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((fam) => (
                        <div
                          key={fam.id}
                          onClick={() => handleSelectFamily(fam)}
                          className="p-3.5 hover:bg-[#FAF7F2] cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#C4A475]" />
                              <span className="font-display font-semibold text-sm text-[#13263B]">
                                Famille {fam.familyName}
                              </span>
                              {fam.hasResponded && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  ✓ Déjà répondu
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5A5040] font-sans italic mt-0.5 ml-6">
                              {fam.members.map((m) => `${m.firstName}${m.isChild ? ' (enfant)' : ''}`).join(', ')}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#3B6FA0] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            <span>{fam.hasResponded ? 'Mettre à jour' : 'Sélectionner'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))
                    ) : (
                      <div
                        onClick={handleCreateCustomFamily}
                        className="p-4 hover:bg-[#FAF7F2] cursor-pointer transition-colors text-xs text-[#13263B] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-[#C4A475]" />
                          <span>Nom non répertorié. Créer un foyer pour <strong>&ldquo;{searchQuery}&rdquo;</strong></span>
                        </div>
                        <span className="font-semibold text-[#3B6FA0] uppercase text-[10px]">Valider ➔</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BANNÈRE RAPPEL : SI LE FOYER A DÉJÀ RÉPONDU */}
              {selectedFamily?.hasResponded && (
                <div className="bg-[#FAF7F2] border border-[#C4A475]/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C4A475]/20 text-[#C4A475] flex items-center justify-center shrink-0 border border-[#C4A475]/30 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-semibold text-base text-[#13263B]">
                          Vous avez déjà répondu pour la Famille {selectedFamily.familyName} !
                        </h4>
                      </div>
                      <p className="text-xs font-serif italic text-[#5A5040] mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#3B6FA0]" />
                        <span>
                          {selectedFamily.respondedAt
                            ? `Dernière mise à jour le ${new Date(selectedFamily.respondedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                            : 'Réponse déjà enregistrée dans la base'}
                        </span>
                      </p>
                      <p className="text-xs font-sans font-medium text-[#3B6FA0] mt-1.5">
                        Vous pouvez encore modifier vos choix ci-dessous et enregistrer votre mise à jour.
                      </p>
                      {selectedFamily.lastMessage && (
                        <p className="text-xs font-serif text-[#3B6FA0] italic mt-1.5 bg-white/80 p-2 rounded-lg border border-[#C4A475]/20">
                          Message transmis : « {selectedFamily.lastMessage} »
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: FAMILY MEMBERS ATTENDANCE MATRIX */}
              {(selectedFamily || members.length > 0) && (
                <div className="space-y-6 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3B6FA0]/15 pb-3">
                    <div>
                      <h3 className="font-display text-2xl text-[#13263B]">
                        Membres de la Famille ({members.length})
                      </h3>
                      <p className="text-xs text-[#5A5040] font-sans">
                        Cochez individuellement la présence de chaque adulte et enfant.
                      </p>
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => batchSetAttendance(true)}
                        className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#3B6FA0]/20 text-[#13263B] text-[11px] font-sans font-medium rounded-lg cursor-pointer transition-colors"
                      >
                        ✓ Tout cocher présent
                      </button>
                      <button
                        type="button"
                        onClick={() => batchSetAttendance(false)}
                        className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#3B6FA0]/20 text-[#13263B] text-[11px] font-sans font-medium rounded-lg cursor-pointer transition-colors"
                      >
                        ✗ Tout décocher
                      </button>
                    </div>
                  </div>

                  {/* Individual Members Cards */}
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          member.isAttending
                            ? 'bg-[#FAF7F2] border-[#3B6FA0]/30 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          
                          {/* Member name & Badge */}
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${member.isChild ? 'bg-[#C4A475]/20 text-[#8B6B38]' : 'bg-[#13263B]/10 text-[#13263B]'}`}>
                              {member.isChild ? <Baby className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-lg text-[#13263B] font-semibold">
                                  {member.firstName} {member.lastName}
                                </span>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                  member.isChild ? 'bg-[#C4A475]/20 text-[#8B6B38]' : 'bg-[#13263B]/10 text-[#13263B]'
                                }`}>
                                  {member.isChild ? 'Enfant' : 'Adulte'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Explicit Attendance Buttons (Présent / Absent) */}
                          <div className="flex items-center gap-1 bg-white/90 p-1 rounded-full border border-[#3B6FA0]/15 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setMemberAttendance(member.id, true)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
                                member.isAttending
                                  ? 'bg-[#13263B] text-white shadow-2xs font-bold'
                                  : 'text-slate-500 hover:text-[#13263B] hover:bg-slate-100'
                              }`}
                            >
                              <span>✓ Présent(e)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setMemberAttendance(member.id, false)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-sans tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
                                !member.isAttending
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300 font-bold'
                                  : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                              }`}
                            >
                              <span>✗ Absent(e)</span>
                            </button>
                          </div>
                        </div>

                        {/* Events checkboxes if attending */}
                        {member.isAttending && (
                          <div className="mt-3 pt-3 border-t border-[#3B6FA0]/10 space-y-3">
                            <span className="block text-[10px] font-sans font-bold uppercase tracking-wider text-[#13263B]">
                              Événements auxquels participent {member.firstName} :
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              {/* Vin d'honneur */}
                              {member.invitedTo?.vinHonneur !== false && (
                                <label className={`flex items-center gap-2 p-2 bg-white rounded-xl border border-[#3B6FA0]/15 cursor-pointer hover:bg-[#FAF7F2] transition-colors ${
                                  !(member.events?.vinHonneur ?? true) ? 'bg-slate-50 border-slate-200 opacity-60' : ''
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={member.events?.vinHonneur ?? true}
                                    onChange={() => toggleEvent(member.id, 'vinHonneur')}
                                    className="accent-[#C4A475] rounded"
                                  />
                                  <span className={`text-[11px] font-medium transition-all ${
                                    !(member.events?.vinHonneur ?? true) ? 'line-through text-slate-400' : 'text-[#13263B]'
                                  }`}>
                                    Vin d'Honneur (16h30)
                                  </span>
                                </label>
                              )}

                              {/* Repas de Noces */}
                              {member.invitedTo?.repasNoces !== false && (
                                <label className={`flex items-center gap-2 p-2 bg-white rounded-xl border border-[#3B6FA0]/15 cursor-pointer hover:bg-[#FAF7F2] transition-colors ${
                                  !(member.events?.repasNoces ?? true) ? 'bg-slate-50 border-slate-200 opacity-60' : ''
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={member.events?.repasNoces ?? true}
                                    onChange={() => toggleEvent(member.id, 'repasNoces')}
                                    className="accent-[#C4A475] rounded"
                                  />
                                  <span className={`text-[11px] font-medium transition-all ${
                                    !(member.events?.repasNoces ?? true) ? 'line-through text-slate-400' : 'text-[#13263B]'
                                  }`}>
                                    Repas de Noces (19h00)
                                  </span>
                                </label>
                              )}

                              {/* Brunch */}
                              {member.invitedTo?.brunchLendemain !== false && (
                                <label className={`flex items-center gap-2 p-2 bg-white rounded-xl border border-[#3B6FA0]/15 cursor-pointer hover:bg-[#FAF7F2] transition-colors ${
                                  !(member.events?.brunchLendemain ?? true) ? 'bg-slate-50 border-slate-200 opacity-60' : ''
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={member.events?.brunchLendemain ?? true}
                                    onChange={() => toggleEvent(member.id, 'brunchLendemain')}
                                    className="accent-[#C4A475] rounded"
                                  />
                                  <span className={`text-[11px] font-medium transition-all ${
                                    !(member.events?.brunchLendemain ?? true) ? 'line-through text-slate-400' : 'text-[#13263B]'
                                  }`}>
                                    Brunch du Lendemain
                                  </span>
                                </label>
                              )}
                            </div>

                            {/* Dietary notes / Allergies */}
                            <div className="pt-2">
                              <input
                                type="text"
                                value={member.dietaryNotes || ''}
                                onChange={(e) => updateDietary(member.id, e.target.value)}
                                placeholder="Régime particulier / allergies (ex. Végétarien, Sans gluten, Sans arachides...)"
                                className="w-full px-3 py-2 bg-white border border-[#3B6FA0]/15 rounded-xl text-xs text-[#13263B] focus:outline-none focus:border-[#C4A475]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Extra Member Option */}
                  <div className="pt-2">
                    {!showAddMember ? (
                      <button
                        type="button"
                        onClick={() => setShowAddMember(true)}
                        className="px-4 py-2 border border-dashed border-[#3B6FA0]/30 hover:border-[#13263B] text-[#13263B] text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>+ Ajouter un membre ou un accompagnant non listé</span>
                      </button>
                    ) : (
                      <div className="p-4 bg-white border border-[#3B6FA0]/20 rounded-2xl space-y-3">
                        <h4 className="font-display font-semibold text-sm text-[#13263B]">
                          Ajouter un membre à la famille
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newFirstName}
                            onChange={(e) => setNewFirstName(e.target.value)}
                            placeholder="Prénom (ex: Hugo)"
                            className="px-3 py-2 bg-white border border-[#3B6FA0]/20 rounded-xl text-xs text-[#13263B] focus:outline-none"
                          />
                          <input
                            type="text"
                            value={newLastName}
                            onChange={(e) => setNewLastName(e.target.value)}
                            placeholder={`Nom (par défaut ${selectedFamily?.familyName || ''})`}
                            className="px-3 py-2 bg-white border border-[#3B6FA0]/20 rounded-xl text-xs text-[#13263B] focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#13263B]">
                            <input
                              type="checkbox"
                              checked={newIsChild}
                              onChange={(e) => setNewIsChild(e.target.checked)}
                              className="accent-[#C4A475]"
                            />
                            <span>C'est un enfant</span>
                          </label>

                          <button
                            type="button"
                            onClick={handleAddMember}
                            className="px-4 py-2 bg-[#13263B] hover:bg-[#13263B]/90 text-white text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Ajouter à la famille
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3: CONTACT EMAIL & MESSAGE */}
              {(selectedFamily || members.length > 0) && (
                <div className="space-y-4 pt-4 border-t border-[#3B6FA0]/15">
                  <div>
                    <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#13263B] mb-2">
                      2. ADRESSE EMAIL DE CONTACT (POUR RECEVOIR LA CONFIRMATION) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@exemple.fr"
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#3B6FA0]/20 rounded-2xl text-xs text-[#13263B] font-sans focus:outline-none focus:border-[#C4A475]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#13263B] mb-2">
                      3. UN PETIT MOT POUR LES MARIÉS OU LE LIVRE D'OR (OPTIONNEL)
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Laissez-nous un message doux pour graver ce souvenir..."
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#3B6FA0]/20 rounded-2xl text-xs text-[#13263B] font-sans focus:outline-none focus:border-[#C4A475] resize-none"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#13263B] hover:bg-[#C4A475] hover:text-[#13263B] text-white font-sans font-semibold uppercase text-xs tracking-[0.2em] transition-all cursor-pointer shadow-xs rounded-xl flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-[#C4A475]" />
                      <span>{selectedFamily?.hasResponded ? 'ENREGISTRER LA MISE À JOUR' : 'ENVOYER LA CONFIRMATION DE FAMILLE'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Default hint if family not yet searched */}
              {!selectedFamily && members.length === 0 && (
                <div className="p-6 bg-[#FAF7F2] border border-dashed border-[#3B6FA0]/20 rounded-2xl text-center space-y-2">
                  <Heart className="w-5 h-5 text-[#C4A475] mx-auto" />
                  <p className="font-serif italic text-xs text-[#5A5040]">
                    Entrez votre nom de famille ci-dessus (ex. <strong>Bénard</strong>, <strong>Chem-Lenhof</strong>, <strong>Dubois</strong>, <strong>Martin</strong>...) pour pré-remplir les membres de votre foyer et confirmer votre présence en quelques clics.
                  </p>
                </div>
              )}

            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
