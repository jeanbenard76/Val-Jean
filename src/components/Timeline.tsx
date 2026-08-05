/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, Wine, Heart, Music, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import { ScheduleItem } from '../types';

const TIMELINE_DATA: ScheduleItem[] = [
  {
    id: 'mairie',
    time: '14:30',
    title: 'Le Mariage Civil',
    location: 'Hôtel de Ville de Honfleur',
    description: 'Rendez-vous sur le perron de la mairie pour le consentement et la signature des registres. Nous lancerons des confettis biodégradables à notre sortie !',
    iconName: 'Heart',
  },
  {
    id: 'eglise',
    time: '15:30',
    title: 'La Cérémonie Religieuse',
    location: 'Église Sainte-Catherine, Honfleur',
    description: 'Une célébration traditionnelle au cœur de la magnifique église en bois de Honfleur. Un moment d\'émotion, de chants et de musique sacrée.',
    iconName: 'Church',
  },
  {
    id: 'cocktail',
    time: '17:30',
    title: 'Le Vin d\'Honneur & Photos',
    location: 'Les Jardins du Château du Val',
    description: 'Célébrons cette union autour de rafraîchissements, d\'animations culinaires locales et de nos traditionnelles séances photo. N\'hésitez pas à revêtir vos plus beaux détails bleus et jaunes !',
    iconName: 'Wine',
  },
  {
    id: 'diner',
    time: '20:00',
    title: 'Le Banquet de Noces',
    location: 'Grande Serre du Château du Val',
    description: 'Un dîner gastronomique de saison préparé par notre chef traiteur normand, mettant à l\'honneur les saveurs de notre terroir. Discours et surprises complèteront ce moment.',
    iconName: 'Utensils',
  },
  {
    id: 'soiree',
    time: '23:30',
    title: 'La Soirée Dansante',
    location: 'Salle d\'Honneur du Château',
    description: 'Ouverture du bal par les mariés, suivie d\'une programmation festive animée par notre DJ jusqu\'au bout de la nuit. Préparez vos chaussures de danse !',
    iconName: 'Music',
  },
];

export default function Timeline() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Heart':
        return <Heart className="w-5 h-5 text-wedding-blue-800" />;
      case 'Church':
        return (
          <svg className="w-5 h-5 text-wedding-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'Wine':
        return <Wine className="w-5 h-5 text-wedding-blue-800" />;
      case 'Utensils':
        return <Utensils className="w-5 h-5 text-wedding-blue-800" />;
      case 'Music':
        return <Music className="w-5 h-5 text-wedding-blue-800" />;
      default:
        return <Clock className="w-5 h-5 text-wedding-blue-800" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8" id="wedding-timeline">
      <div className="text-center mb-12">
        <span className="font-serif italic text-sm text-wedding-yellow-600 tracking-wider">Le Déroulement des Festivités</span>
        <h3 className="font-display text-2xl sm:text-3xl text-wedding-blue-900 mt-1 font-semibold">
          Le Programme du Samedi 17 Avril 2027
        </h3>
        <p className="font-serif italic text-wedding-blue-600 text-sm mt-2 max-w-lg mx-auto">
          Voici le fil conducteur de notre magnifique journée. Cliquez sur chaque moment pour découvrir tous les détails pratiques.
        </p>
      </div>

      <div className="relative border-l-2 border-wedding-yellow-200/60 ml-4 sm:ml-32 pl-6 sm:pl-8 space-y-8">
        {TIMELINE_DATA.map((item, index) => {
          const isExpanded = expandedId === item.id;

          return (
            <motion.div
              key={item.id}
              className="relative"
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Timeline marker / icon container */}
              <div className="absolute -left-[39px] sm:-left-[47px] top-1.5 w-8 h-8 rounded-full bg-wedding-yellow-100 border-2 border-wedding-yellow-500/50 flex items-center justify-center shadow-sm z-10">
                {getIcon(item.iconName)}
              </div>

              {/* Time display for desktop, floating to the left of the line */}
              <div className="hidden sm:block absolute -left-32 top-2 w-24 text-right">
                <span className="font-display text-xl font-medium text-wedding-blue-800">
                  {item.time}
                </span>
                <span className="block font-mono text-[10px] tracking-widest text-wedding-yellow-600 font-semibold uppercase mt-0.5">
                  HEURE DE PARIS
                </span>
              </div>

              {/* Content Card with elegant border and hover effect */}
              <div
                onClick={() => toggleExpand(item.id)}
                className={`bg-wedding-yellow-50/80 hover:bg-wedding-yellow-100/60 border border-wedding-blue-100/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${
                  isExpanded ? 'border-wedding-yellow-500/40 shadow-md ring-1 ring-wedding-yellow-500/10' : ''
                }`}
                id={`timeline-card-${item.id}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    {/* Time for mobile only */}
                    <span className="sm:hidden inline-block font-display text-sm font-semibold text-wedding-yellow-600 bg-wedding-yellow-100 px-2 py-0.5 rounded-md mb-2">
                      {item.time}
                    </span>
                    <h4 className="font-display text-lg text-wedding-blue-900 font-medium">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-wedding-blue-600/80 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-wedding-yellow-600" />
                      <span className="font-serif italic">{item.location}</span>
                    </div>
                  </div>
                  <button className="text-wedding-blue-600 p-1 hover:bg-wedding-blue-100/30 rounded-full transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded details with smooth height animation */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 pt-3 border-t border-wedding-blue-100/40 text-sm text-wedding-blue-800 leading-relaxed font-sans"
                  >
                    <p>{item.description}</p>
                    {item.id === 'cocktail' && (
                      <div className="mt-3 p-3 bg-wedding-blue-50/50 rounded-lg border border-wedding-blue-100/30 text-xs flex items-center gap-2">
                        <span className="text-wedding-yellow-600 font-bold">✨ Thème Couleur :</span>
                        <span className="font-serif italic text-wedding-blue-800">
                          Les touches subtiles de jaune paille et de bleu azur sur vos tenues seront grandement appréciées !
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
