/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Copy, Check, MapPin, Car, Train } from 'lucide-react';
import normandyMapImg from '../assets/images/normandy_map_artwork.jpg';

interface InteractiveMapRouteProps {
  onShowLodging?: () => void;
}

export default function InteractiveMapRoute({ onShowLodging }: InteractiveMapRouteProps) {
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const copyAddress = () => {
    navigator.clipboard.writeText("Promenade du Château, 76560 Oherville, France");
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const scheduleItems = [
    {
      time: '14H00',
      title: 'Cérémonie religieuse',
      location: 'Église Saint-Ribert à Torcy-Le-Grand',
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
        
        {/* LEFT COLUMN (6 cols): PROGRESSIVE LOOPING THREAD + SHIFTED FRAMELESS TEXT */}
        <div className="lg:col-span-6 flex flex-col justify-center relative pl-16 sm:pl-20 pr-2 py-4">
          
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
        <div className="lg:col-span-6 flex flex-col justify-center h-full">
          <div className="relative w-full h-full min-h-[340px] overflow-hidden rounded-3xl shadow-2xs border border-[#3B6FA0]/15">
            <img
              src={normandyMapImg}
              alt="Carte de Normandie du Mariage - Torcy-Le-Grand & Manoir d'Auffay"
              className="w-full h-full object-cover object-center rounded-3xl hover:scale-102 transition-transform duration-700"
            />
          </div>
        </div>

      </div>

      {/* 3. AUTHENTIC FRENCH LETTERPRESS TRAVEL GUIDE (No heavy AI template container!) */}
      <div className="space-y-8 max-w-5xl mx-auto pt-4">
        
        {/* Editorial Header */}
        <div className="text-center space-y-2">
          <span className="font-serif italic text-xs text-[#C4A475] tracking-widest uppercase block">
            — Venir en Normandie —
          </span>
          <h3 className="font-display text-2xl sm:text-4xl text-[#13263B] font-light tracking-wide">
            Accès & Transports
          </h3>
          <p className="text-xs sm:text-sm text-[#5A5040] font-serif italic max-w-md mx-auto">
            Manoir d'Auffay, Promenade du Château, 76560 Oherville
          </p>

          {/* Chic Action Links */}
          <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
            <a
              href="https://maps.google.com/?q=Manoir+d'Auffay+Oherville+France"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#13263B] hover:bg-[#C4A475] text-white hover:text-[#13263B] text-xs font-semibold rounded-full transition-all cursor-pointer shadow-2xs"
            >
              <span>Ouvrir dans Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={copyAddress}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 hover:bg-white text-[#13263B] border border-[#C4A475]/35 text-xs font-semibold rounded-full transition-all cursor-pointer shadow-2xs"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#3B6FA0]" />}
              <span>{copiedText ? 'Adresse copiée !' : 'Copier l\'adresse'}</span>
            </button>
          </div>
        </div>

        {/* 3 Soft Paper Letterpress Cards with Full Borders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-2">
          
          {/* Card 1: En voiture */}
          <div className="bg-[#FAF7F2]/90 border border-[#C4A475]/40 border-t-2 border-t-[#C4A475] rounded-2xl p-6 space-y-2.5 shadow-2xs hover:border-[#C4A475] hover:shadow-xs transition-all">
            <span className="text-[10px] font-mono font-bold text-[#C4A475] uppercase tracking-widest block">
              1. EN VOITURE (RECOMMANDÉ)
            </span>
            <h4 className="font-display font-semibold text-lg text-[#13263B]">
              Autoroutes A13 / A29 & Parking
            </h4>
            <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
              Depuis Paris (2h30). Un grand <strong>parking privé, gratuit et sécurisé de 150 places</strong> est aménagé directement dans l'enceinte du Manoir d'Auffay à Oherville (76560).
            </p>
          </div>

          {/* Card 2: En train */}
          <div className="bg-[#FAF7F2]/90 border border-[#3B6FA0]/40 border-t-2 border-t-[#3B6FA0] rounded-2xl p-6 space-y-2.5 shadow-2xs hover:border-[#3B6FA0] hover:shadow-xs transition-all">
            <span className="text-[10px] font-mono font-bold text-[#3B6FA0] uppercase tracking-widest block">
              2. EN TRAIN
            </span>
            <h4 className="font-display font-semibold text-lg text-[#3B6FA0]">
              Gare d'Yvetot (à 12 min)
            </h4>
            <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
              Liaisons ferroviaires directes depuis <strong>Paris-Saint-Lazare</strong> (1h40) et <strong>Rouen</strong> (25 min). Taxis et navettes facilement réservables depuis la gare.
            </p>
          </div>

          {/* Card 3: Entre les lieux */}
          <div className="bg-[#FAF7F2]/90 border border-[#C4A475]/40 border-t-2 border-t-[#C4A475] rounded-2xl p-6 space-y-2.5 shadow-2xs hover:border-[#C4A475] hover:shadow-xs transition-all">
            <span className="text-[10px] font-mono font-bold text-[#C4A475] uppercase tracking-widest block">
              3. ENTRE LES LIEUX
            </span>
            <h4 className="font-display font-semibold text-lg text-[#13263B]">
              Trajet Cérémonie &rarr; Manoir
            </h4>
            <p className="text-xs text-[#5A5040] leading-relaxed font-sans">
              Comptez environ <strong>45 minutes de route champêtre</strong> (50 km) entre l'Église de Torcy-le-Grand et le Manoir d'Auffay à Oherville. Pensez au covoiturage entre invités !
            </p>
          </div>
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
