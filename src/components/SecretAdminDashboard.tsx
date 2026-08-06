/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Database, Download, FileSpreadsheet, ShieldCheck, RefreshCw, Search, Users, Baby, Utensils, MessageSquare, Check, X, ArrowLeft } from 'lucide-react';
import { GuestFamily, RSVPStats } from '../types';
import { getStoredFamilies, clearLocalStorageRSVPs } from '../utils/rsvpStorage';

interface SecretAdminDashboardProps {
  onBackToHome?: () => void;
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  try {
    const utcStr = dateStr.includes('Z') || dateStr.includes('+')
      ? dateStr
      : dateStr.replace(' ', 'T') + 'Z';
    const d = new Date(utcStr);
    if (isNaN(d.getTime())) return dateStr;
    
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    }).format(d).replace(':', 'h');
  } catch (e) {
    return dateStr;
  }
};

// Admin token captured from the URL (?admin=<token>) and stored by App.tsx
const getAdminToken = () => sessionStorage.getItem('adminToken') || '';
const adminHeaders = (): Record<string, string> => {
  const token = getAdminToken();
  return token ? { 'x-admin-token': token } : {};
};

export default function SecretAdminDashboard({ onBackToHome }: SecretAdminDashboardProps) {
  const [families, setFamilies] = useState<GuestFamily[]>([]);
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'attending' | 'absent' | 'dietary'>('all');
  const [filterEvent, setFilterEvent] = useState<'all' | 'vin' | 'repas' | 'brunch'>('all');

  // Authentication gate: null = checking, true = dashboard (native browser prompt)
  const [authed, setAuthed] = useState<boolean | null>(null);

  const verifyToken = async (token: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/verify', {
        headers: token ? { 'x-admin-token': token } : {},
      });
      if (res.ok) return { ok: true };
      if (res.status === 503) {
        const data = await res.json().catch(() => ({} as any));
        return { ok: false, error: data.error || 'ADMIN_TOKEN non configuré sur le serveur.' };
      }
      return { ok: false, error: 'incorrect' };
    } catch {
      return { ok: false, error: 'Serveur injoignable, réessayez plus tard.' };
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data && typeof data.totalFamilies === 'number') {
            setStats(data);
            return;
          }
        } catch (jsonErr) {}
      }
    } catch (e) {
      console.error('Erreur chargement stats API:', e);
    }
  };

  const fetchFamilies = async () => {
    try {
      const res = await fetch('/api/families');
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            setFamilies(data);
            setLoading(false);
            return;
          }
        } catch (jsonErr) {}
      }
    } catch (e) {
      console.error('Erreur chargement familles API:', e);
    }
    // Fallback to localStorage + pre-seeded list in production / static mode
    const localFamilies = getStoredFamilies();
    setFamilies(localFamilies);
    setLoading(false);
  };

  // On mount: try the stored token, otherwise ask via the native browser prompt
  useEffect(() => {
    (async () => {
      let result = await verifyToken(getAdminToken());
      let message = 'Espace Mariés — mot de passe :';
      while (!result.ok) {
        if (result.error && result.error !== 'incorrect') {
          window.alert(result.error);
          onBackToHome?.();
          return;
        }
        const pwd = window.prompt(message);
        if (pwd === null || !pwd.trim()) {
          onBackToHome?.();
          return;
        }
        result = await verifyToken(pwd.trim());
        if (result.ok) {
          sessionStorage.setItem('adminToken', pwd.trim());
        } else {
          message = 'Mot de passe incorrect, réessayez :';
        }
      }
      setAuthed(true);
      fetchStats();
      fetchFamilies();
    })();
  }, []);

  const handleUpdateInvitation = async (familyId: string, vin: boolean, repas: boolean, brunch: boolean) => {
    try {
      const res = await fetch('/api/admin/update-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ familyId, invitedVin: vin, invitedRepas: repas, invitedBrunch: brunch }),
      });
      if (res.ok) {
        fetchFamilies();
        fetchStats();
      }
    } catch (e) {
      console.error('Erreur mise à jour portée invitation:', e);
    }
  };

  // Compute breakdown of Adults & Children per Event
  const eventBreakdown = useMemo(() => {
    let vinAdults = 0, vinChildren = 0;
    let repasAdults = 0, repasChildren = 0;
    let brunchAdults = 0, brunchChildren = 0;
    let totalAdultsAttending = 0, totalChildrenAttending = 0;

    families.forEach((fam) => {
      const isResponded = Boolean(
        fam.hasResponded ||
        fam.respondedAt ||
        fam.notes === 'has_responded' ||
        (fam.lastMessage && fam.lastMessage.trim().length > 0)
      );

      // ONLY count attendance metrics for families that HAVE RESPONDED
      if (isResponded) {
        fam.members.forEach((m) => {
          if (m.isAttending) {
            if (m.isChild) totalChildrenAttending++;
            else totalAdultsAttending++;

            if (m.events?.vinHonneur) {
              if (m.isChild) vinChildren++;
              else vinAdults++;
            }
            if (m.events?.repasNoces) {
              if (m.isChild) repasChildren++;
              else repasAdults++;
            }
            if (m.events?.brunchLendemain) {
              if (m.isChild) brunchChildren++;
              else brunchAdults++;
            }
          }
        });
      }
    });

    return {
      totalAdultsAttending,
      totalChildrenAttending,
      vinAdults,
      vinChildren,
      repasAdults,
      repasChildren,
      brunchAdults,
      brunchChildren,
    };
  }, [families]);


  // Filtered families list
  const filteredFamilies = useMemo(() => {
    return families.filter((fam) => {
      // 1. Search Query
      const q = search.toLowerCase().trim();
      const nameMatch = !q || fam.familyName.toLowerCase().includes(q) || fam.members.some((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q));
      if (!nameMatch) return false;

      // 2. Filter Status
      if (filterStatus === 'attending' && !fam.members.some((m) => m.isAttending)) return false;
      if (filterStatus === 'absent' && fam.members.some((m) => m.isAttending)) return false;
      if (filterStatus === 'dietary' && !fam.members.some((m) => m.dietaryNotes && m.dietaryNotes.trim())) return false;

      // 3. Filter Event
      if (filterEvent === 'vin' && !fam.members.some((m) => m.isAttending && m.events?.vinHonneur)) return false;
      if (filterEvent === 'repas' && !fam.members.some((m) => m.isAttending && m.events?.repasNoces)) return false;
      if (filterEvent === 'brunch' && !fam.members.some((m) => m.isAttending && m.events?.brunchLendemain)) return false;

      return true;
    });
  }, [families, search, filterStatus, filterEvent]);

  // Waiting for authentication (native browser prompt)
  if (!authed) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <RefreshCw className="w-6 h-6 text-[#C4A475] animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8" id="secret-admin-dashboard">

      {/* 1. HEADER WITH GO BACK & REFRESH BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-[#13263B]/15 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#13263B] text-[#C4A475] rounded-2xl shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl text-[#13263B] font-bold">
                Espace Mariés • Requêtes &amp; Statistiques
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Base SQLite active (wedding.db)
              </span>
            </div>
            <p className="font-serif italic text-xs text-[#5A5040] mt-0.5">
              Page secrète réservée aux mariés pour faire vos requêtes sur qui a répondu, décompter adultes &amp; enfants par repas, et exporter les fichiers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-slate-200 border border-slate-300 text-[#13263B] text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au site</span>
            </button>
          )}

          <button
            onClick={() => {
              setLoading(true);
              fetchStats();
              fetchFamilies();
            }}
            className="px-4 py-2 bg-[#13263B] hover:bg-[#C4A475] hover:text-[#13263B] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* 2. REPARTITION EXACTE DES ADULTES & ENFANTS PAR TYPE DE REPAS / ÉVÉNEMENT */}
      <div className="space-y-3">
        <h3 className="font-display text-xl text-[#13263B] font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-[#C4A475]" />
          <span>Décompte par Type de Repas (Adultes vs Enfants)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card Total Confirmed */}
          <div className="bg-white p-5 rounded-2xl border border-[#3B6FA0]/20 shadow-2xs flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#3B6FA0] block">
              TOTAL CONFIRMÉS
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold text-[#13263B]">
                {eventBreakdown.totalAdultsAttending + eventBreakdown.totalChildrenAttending}
              </span>
              <span className="text-xs font-mono text-slate-500">
                / {stats?.totalInvited || 0} invités
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-[#5A5040] font-sans space-y-0.5">
              <div className="flex justify-between">
                <span>Adultes :</span>
                <strong className="text-[#13263B]">{eventBreakdown.totalAdultsAttending}</strong>
              </div>
              <div className="flex justify-between">
                <span>Enfants :</span>
                <strong className="text-[#C4A475]">{eventBreakdown.totalChildrenAttending}</strong>
              </div>
            </div>
          </div>

          {/* Card 1: Vin d'Honneur */}
          <div className="bg-white p-5 rounded-2xl border border-[#3B6FA0]/20 shadow-2xs flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#13263B] block">
              🍸 VIN D'HONNEUR (16H30)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold text-[#13263B]">
                {eventBreakdown.vinAdults + eventBreakdown.vinChildren}
              </span>
              <span className="text-xs font-serif italic text-[#3B6FA0]">invités</span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-[#5A5040] font-sans space-y-0.5">
              <div className="flex justify-between">
                <span>Adultes :</span>
                <strong className="text-[#13263B]">{eventBreakdown.vinAdults}</strong>
              </div>
              <div className="flex justify-between">
                <span>Enfants :</span>
                <strong className="text-[#C4A475]">{eventBreakdown.vinChildren}</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Repas de Noces */}
          <div className="bg-white p-5 rounded-2xl border border-[#C4A475]/40 shadow-2xs flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#C4A475] block">
              🍽️ REPAS DE NOCES (19H00)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold text-[#C4A475]">
                {eventBreakdown.repasAdults + eventBreakdown.repasChildren}
              </span>
              <span className="text-xs font-serif italic text-[#3B6FA0]">couverts</span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-[#5A5040] font-sans space-y-0.5">
              <div className="flex justify-between">
                <span>Adultes :</span>
                <strong className="text-[#13263B]">{eventBreakdown.repasAdults}</strong>
              </div>
              <div className="flex justify-between">
                <span>Enfants :</span>
                <strong className="text-[#C4A475]">{eventBreakdown.repasChildren}</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Brunch du Lendemain */}
          <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-2xs flex flex-col justify-between space-y-2">
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-800 block">
              🥐 BRUNCH DU LENDEMAIN
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-display text-3xl font-bold text-amber-800">
                {eventBreakdown.brunchAdults + eventBreakdown.brunchChildren}
              </span>
              <span className="text-xs font-serif italic text-amber-700">convives</span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-[#5A5040] font-sans space-y-0.5">
              <div className="flex justify-between">
                <span>Adultes :</span>
                <strong className="text-[#13263B]">{eventBreakdown.brunchAdults}</strong>
              </div>
              <div className="flex justify-between">
                <span>Enfants :</span>
                <strong className="text-[#C4A475]">{eventBreakdown.brunchChildren}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. INTERACTIVE QUERY TABLE & SEARCH FILTERS */}
      <div className="bg-white rounded-3xl border border-[#3B6FA0]/15 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-xl text-[#13263B] font-semibold">
              Requêteur des Réponses &amp; Invités ({filteredFamilies.length} familles)
            </h3>
            <p className="text-xs text-[#5A5040] font-serif italic">
              Filtrez instantanément par nom, statut de présence ou type de repas.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher par nom..."
                className="pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-slate-200 rounded-xl text-xs text-[#13263B] focus:outline-none focus:border-[#C4A475] w-44"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF7F2] border border-slate-200 rounded-xl text-xs text-[#13263B] focus:outline-none font-sans cursor-pointer"
            >
              <option value="all">Tous statuts</option>
              <option value="attending">Présents uniquement</option>
              <option value="absent">Absents uniquement</option>
              <option value="dietary">Allergies / Régimes</option>
            </select>

            {/* Event Filter */}
            <select
              value={filterEvent}
              onChange={(e: any) => setFilterEvent(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF7F2] border border-slate-200 rounded-xl text-xs text-[#13263B] focus:outline-none font-sans cursor-pointer"
            >
              <option value="all">Tous événements</option>
              <option value="vin">Présents au Vin</option>
              <option value="repas">Présents au Repas</option>
              <option value="brunch">Présents au Brunch</option>
            </select>
          </div>
        </div>

        {/* Query Results Cards List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredFamilies.length > 0 ? (
            filteredFamilies.map((fam) => {
              const attendingMembers = fam.members.filter((m) => m.isAttending);
              const absentMembers = fam.members.filter((m) => !m.isAttending);
              const isResponded = Boolean(
                fam.hasResponded ||
                fam.respondedAt ||
                fam.notes === 'has_responded' ||
                (fam.lastMessage && fam.lastMessage.trim().length > 0)
              );

              return (
                <div key={fam.id} className="p-4 bg-[#FAF7F2] rounded-2xl border border-slate-200/80 space-y-3">
                  {/* Family Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display font-bold text-base text-[#13263B]">
                        Famille {fam.familyName}
                      </h4>
                      {fam.email && (
                        <a href={`mailto:${fam.email}`} className="text-xs text-[#3B6FA0] hover:underline font-mono">
                          {fam.email}
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isResponded ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full font-sans">
                          ✓ Répondu {fam.respondedAt ? `le ${formatDate(fam.respondedAt)}` : ''} ({attendingMembers.length} présent(s) / {absentMembers.length} absent(s))
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full font-sans">
                          ⏳ En attente de réponse
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Members breakdown grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {fam.members.map((m) => (
                      <div key={m.id} className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {m.isChild ? <Baby className="w-3.5 h-3.5 text-[#C4A475]" /> : <Users className="w-3.5 h-3.5 text-[#13263B]" />}
                            <span className="font-semibold text-[#13263B]">{m.firstName} {m.lastName}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400">({m.isChild ? 'Enfant' : 'Adulte'})</span>
                          </div>

                          {isResponded ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              m.isAttending ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {m.isAttending ? '✓ Présent' : '✗ Absent'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              ⏳ Non confirmé
                            </span>
                          )}
                        </div>

                        {/* Events participation or invitation scope */}
                        {isResponded ? (
                          m.isAttending && (
                            <div className="text-[10px] text-slate-600 flex items-center gap-1.5 flex-wrap pt-1">
                              <span className={`px-2 py-0.5 rounded font-mono ${m.events?.vinHonneur ? 'bg-[#13263B] text-white' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                Vin
                              </span>
                              <span className={`px-2 py-0.5 rounded font-mono ${m.events?.repasNoces ? 'bg-[#C4A475] text-white' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                Repas
                              </span>
                              <span className={`px-2 py-0.5 rounded font-mono ${m.events?.brunchLendemain ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-400 line-through'}`}>
                                Brunch
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[9px] uppercase font-bold text-slate-400">Invité :</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${m.invitedTo?.vinHonneur !== false ? 'bg-slate-100 text-[#13263B]' : 'bg-slate-50 text-slate-300 line-through'}`}>
                              Vin
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${m.invitedTo?.repasNoces ? 'bg-slate-100 text-[#13263B]' : 'bg-slate-50 text-slate-300 line-through'}`}>
                              Repas
                            </span>
                            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${m.invitedTo?.brunchLendemain ? 'bg-slate-100 text-[#13263B]' : 'bg-slate-50 text-slate-300 line-through'}`}>
                              Brunch
                            </span>
                          </div>
                        )}

                        {m.dietaryNotes && (
                          <div className="mt-1 text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 flex items-center gap-1">
                            <Utensils className="w-3 h-3 shrink-0 text-amber-700" />
                            <span><strong>Régime :</strong> {m.dietaryNotes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Message if left */}
                  {fam.lastMessage && (
                    <div className="text-xs font-serif italic text-[#3B6FA0] bg-white p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[#C4A475] shrink-0 mt-0.5" />
                      <span>« {fam.lastMessage} »</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 font-serif italic text-center py-8">
              Aucun invité ne correspond à ces critères de recherche.
            </p>
          )}
        </div>
      </div>

      {/* 4. FILE DOWNLOAD BUTTONS & RESET ACTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            let csv = "Famille,Prénom,Nom,Statut,Âge,Présent,Vin d'Honneur,Repas de Noces,Brunch,Régime/Allergies,Email\n";
            families.forEach((fam) => {
              fam.members.forEach((m: any) => {
                csv += `"${fam.familyName}","${m.firstName}","${m.lastName}","${
                  m.isChild ? "Enfant" : "Adulte"
                }","${m.age || ""}","${m.isAttending ? "Oui" : "Non"}","${
                  m.events?.vinHonneur ? "Oui" : "Non"
                }","${m.events?.repasNoces ? "Oui" : "Non"}","${
                  m.events?.brunchLendemain ? "Oui" : "Non"
                }","${m.dietaryNotes || ""}","${fam.email || ""}"\n`;
              });
            });

            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "liste_invites_mariage.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="p-5 bg-[#13263B] hover:bg-[#C4A475] text-white hover:text-[#13263B] rounded-2xl font-sans text-xs font-semibold flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-[#C4A475] group-hover:text-[#13263B]" />
            <div className="text-left">
              <span className="block font-bold text-sm">Exporter en CSV / Excel</span>
              <span className="text-[11px] font-serif italic opacity-80">
                Pour le traiteur
              </span>
            </div>
          </div>
          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
        </button>

        <a
          href={`/api/admin/download-db?key=${encodeURIComponent(getAdminToken())}`}
          download="wedding.db"
          className="p-5 bg-white border border-[#3B6FA0]/20 hover:border-[#13263B] text-[#13263B] rounded-2xl font-sans text-xs font-semibold flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-[#3B6FA0]" />
            <div className="text-left">
              <span className="block font-bold text-sm">Télécharger wedding.db</span>
              <span className="text-[11px] text-[#5A5040] font-serif italic">
                Sauvegarde binaire
              </span>
            </div>
          </div>
          <Download className="w-5 h-5 text-[#3B6FA0] group-hover:translate-y-0.5 transition-transform" />
        </a>

        <button
          onClick={async () => {
            if (window.confirm('Voulez-vous vraiment effacer toutes les réponses reçues et réinitialiser la base de données ?')) {
              try {
                clearLocalStorageRSVPs();
                await fetch('/api/admin/clear-rsvps', { method: 'POST', headers: adminHeaders() }).catch(() => {});
                fetchFamilies();
                fetchStats();
                alert('Toutes les réponses ont été réinitialisées avec succès !');
              } catch (e) {
                console.error('Erreur réinitialisation:', e);
              }
            }
          }}
          className="p-5 bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 text-red-700 hover:text-white rounded-2xl font-sans text-xs font-semibold flex items-center justify-between group transition-all shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-red-500 group-hover:text-white" />
            <div className="text-left">
              <span className="block font-bold text-sm">Effacer les réponses</span>
              <span className="text-[11px] opacity-80 font-serif italic">
                Réinitialiser la base
              </span>
            </div>
          </div>
          <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

    </div>
  );
}
