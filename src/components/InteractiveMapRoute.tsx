/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Copy, Check, MapPin, Car, Train } from 'lucide-react';
import normandyMapImg from '../assets/images/cartes_normandie.jpg';

interface InteractiveMapRouteProps {
  onShowLodging?: () => void;
}

export default function InteractiveMapRoute({ onShowLodging }: InteractiveMapRouteProps) {
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ceremony' | 'reception'>('ceremony');

  const copyAddress = async () => {
    const text = activeTab === 'ceremony' 
      ? "Église catholique Notre-Dame-de-l'Assomption, 76880 Arques-la-Bataille, France" 
      : "Manoir d'Auffay, Promenade du Château, 76560 Oherville, France";
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts (HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error("Erreur lors de la copie:", err);
    }
  };

  const scheduleItems = [
    {
      time: '14H00',
      title: 'Cérémonie religieuse',
      location: "Église catholique Notre-Dame-de-l'Assomption, Arques-la-Bataille",
    },
    {
      time: '17H00',
      title: 'Vin d\'honneur',
      location: 'Manoir d\'Auffay, Oherville',
    },
    {
      time: '20H00',
      title: 'Dîner de Noces',
      location: 'Sous la verrière du Manoir',
    },
    {
      time: '23H30',
      title: 'Première danse',
      location: 'Soirée dansante au Manoir',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-10" id="programme-page">
      
      {/* 1. EDITORIAL HEADER */}
      <div className="text-center space-y-2 pb-2">
        <span className="font-serif italic text-xs sm:text-sm text-[#C4A475] tracking-widest uppercase block mb-4">
          — Déroulement de la journée —
        </span>
        <h2 className="font-script text-[clamp(3rem,6vw,5rem)] text-[#13263B] leading-tight pt-2">
          Le Programme
        </h2>
        <p className="font-serif italic text-xs sm:text-sm text-[#5A5040] max-w-xl mx-auto leading-relaxed">
          Nous sommes impatients de célébrer cette journée entourés de nos proches dans la magnifique campagne normande.
        </p>
      </div>

      {/* 2. DUAL GRID: ANIMATED PROGRESSIVE LOOPING RIBBON ON LEFT, NORMANDY MAP ON RIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
        
        {/* LEFT COLUMN (6 cols): PROGRESSIVE LOOPING THREAD + SHIFTED FRAMELESS TEXT */}
        <div className="md:col-span-6 flex flex-col justify-center relative pl-16 sm:pl-20 pr-2 py-4">
          
          {/* SINGLE ANIMATED LOOPING THREAD (NO grey background line!) */}
          <div className="absolute left-0 top-2 bottom-2 w-14 pointer-events-none z-0">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 50 400">
              {/* Single Progressive Animated Golden Thread (Duration 3.0s) */}
              <motion.path
                d="M 15,10 C 42,40 42,90 15,110 C -12,130 -2,180 30,190 C 50,195 45,160 25,160 C 10,160 10,210 15,230 C 42,280 42,330 15,350 C -12,370 20,390 15,395"
                fill="none"
                stroke="#C4A475"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.0, ease: 'easeInOut' }}
              />
            </svg>
          </div>

          {/* 4 FRAMELESS TEXT ITEMS (Shifted right for 100% legibility, appearing in chronological sync) */}
          <div className="space-y-9 relative z-10">
            {scheduleItems.map((item, idx) => {
              // Delay synced with 3s line progression (0.1s, 0.85s, 1.6s, 2.35s)
              const delayTime = 0.1 + idx * 0.75;

              return (
                <motion.div
                  key={item.time}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.55, delay: delayTime, ease: 'easeOut' }}
                  className="text-left space-y-0.5"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#C4A475] tracking-widest uppercase">
                      {item.time}
                    </span>
                    <span className="text-[#C4A475]/40 text-xs">—</span>
                    <h3 className="font-display font-semibold text-lg sm:text-xl text-[#13263B]">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#5A5040] font-sans font-medium pl-0.5">
                    {item.location}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN (6 cols): FEATURED NORMANDY WATERCOLOR MAP ARTWORK */}
        <div className="md:col-span-6 flex flex-col justify-center h-full">
          <div className="relative w-full h-full min-h-[340px] overflow-hidden rounded-3xl shadow-2xs border border-[#3B6FA0]/15">
            <img
              src={normandyMapImg}
              alt="Carte de Normandie du Mariage - Arques-la-Bataille & Manoir d'Auffay"
              className="w-full h-full object-cover object-center rounded-3xl hover:scale-102 transition-transform duration-700"
            />
          </div>
        </div>

      </div>

      {/* 3. AUTHENTIC FRENCH LETTERPRESS TRAVEL GUIDE (No heavy AI template container!) */}
      <div className="space-y-8 max-w-5xl mx-auto pt-4">
        
        {/* Editorial Header */}
        
        {/* Editorial Header */}
        <div className="text-center space-y-2">
          <span className="font-serif italic text-xs text-[#C4A475] tracking-widest uppercase block">
            - Venir en Normandie -
          </span>
          <h3 className="font-display text-2xl sm:text-4xl text-[#13263B] font-light tracking-wide">
            Accès & Transports
          </h3>

          {/* Custom Toggle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="bg-[#13263B]/5 p-1 rounded-full flex gap-1 border border-[#13263B]/10">
              <button 
                onClick={() => setActiveTab('ceremony')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'ceremony' ? 'bg-[#13263B] text-white shadow-sm' : 'text-[#13263B] hover:bg-[#13263B]/10'}`}
              >
                La Cérémonie
              </button>
              <button 
                onClick={() => setActiveTab('reception')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'reception' ? 'bg-[#13263B] text-white shadow-sm' : 'text-[#13263B] hover:bg-[#13263B]/10'}`}
              >
                La Réception
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#5A5040] font-serif italic max-w-md mx-auto pt-1">
            {activeTab === 'ceremony' ? "Église catholique Notre-Dame-de-l'Assomption, 76880 Arques-la-Bataille" : "Manoir d'Auffay, Promenade du Château, 76560 Oherville"}
          </p>

          {/* Action Links */}
          <div className="flex flex-row flex-wrap w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 pt-3">
            <a
              href={activeTab === 'ceremony' ? "https://www.google.com/maps/place/%C3%89glise+catholique+Notre-Dame-de-l%E2%80%99Assomption+%C3%A0+Arques-la-Bataille/@49.8822638,1.1252296,17z/data=!3m1!4b1!4m6!3m5!1s0x47e0a3f76c667795:0x176b7fdf93356bb9!8m2!3d49.8822604!4d1.1278045!16s%2Fg%2F11bx1bydzc?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D" : "https://maps.google.com/?q=Manoir+d'Auffay+Oherville+France"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 bg-[#13263B] hover:bg-[#C4A475] text-white text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"        >
              <span>{activeTab === 'ceremony' ? "L'Église sur Maps" : "Le Manoir sur Maps"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={copyAddress}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2.5 bg-white/90 hover:bg-white text-[#13263B] border border-[#C4A475]/50 text-[11px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer shadow-sm text-center whitespace-nowrap"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#3B6FA0]" />}
              <span>{copiedText ? 'Copié !' : 'Copier l\'adresse'}</span>
            </button>
          </div>
        </div>

        {/* Info Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-4">
          {activeTab === 'ceremony' ? (
            <>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs flex flex-col items-center text-center">
                <h4 className="font-display font-semibold text-lg text-[#13263B]">Stationnement</h4>
                <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
                  Les places aux abords de l'église étant limitées, nous vous invitons à privilégier les rues adjacentes pour vous garer.
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs flex flex-col items-center text-center">
                <h4 className="font-display font-semibold text-lg text-[#13263B]">Horaires</h4>
                <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
                  L'arrivée de Valentine est prévue à 14h30. Vous pourrez tranquillement prendre place dans l'église dès 13h45.
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs flex flex-col items-center text-center">
                <h4 className="font-display font-semibold text-lg text-[#13263B]">Suite des festivités</h4>
                <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
                  À l'issue de la cérémonie, comptez environ 45 minutes de trajet pour rejoindre le lieu des festivités.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs flex flex-col items-center text-center">
                <h4 className="font-display font-semibold text-lg text-[#13263B]">Stationnement</h4>
                <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
                  Un vaste parking privé et gratuit est à votre entière disposition, situé directement sur la promenade du château.
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs flex flex-col items-center text-center">
                <h4 className="font-display font-semibold text-lg text-[#13263B]">Accès</h4>
                <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
                  Le Manoir se trouve à environ 12 minutes de route de la gare d'Yvetot. Pour les personnes venant en voiture, l'accès se fait très facilement jusqu'au domaine à travers des départementales.
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs flex flex-col items-center text-center">
                <h4 className="font-display font-semibold text-lg text-[#13263B]">Hébergements & retours</h4>
                <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
                  Afin de profiter pleinement de la soirée, nous vous conseillons d'anticiper la réservation de vos taxis pour le retour. Vous trouverez également de nombreuses suggestions pour la nuit dans notre rubrique dédiée
                </p>
              </div>
            </>
          )}
        </div>
{/* Lodging Helper Button */}
        {onShowLodging && (
          <div className="pt-4 text-center">
            <button
              onClick={onShowLodging}
              className="text-xs font-serif italic text-[#3B6FA0] hover:text-[#C4A475] hover:underline cursor-pointer transition-colors"
            >
              🏡 Besoin d'un hébergement à proximité ? Consulter notre sélection &ldquo;Où Dormir&rdquo; &rarr;
            </button>
          </div>
        )}
      </div>

    </div>
  );
}








