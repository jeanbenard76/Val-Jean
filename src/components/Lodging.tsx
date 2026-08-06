/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Bed, Hotel, ExternalLink, ChevronLeft, ChevronRight, Check, MapPin, Info } from 'lucide-react';

interface LodgingCard {
  id: string;
  name: string;
  category: string;
  distance: string;
  image: string;
  description: string;
  price: string;
  highlights: string[];
  link: string;
}

const AIRBNB_OHERVILLE_URL = "https://www.airbnb.fr/s/Oherville--France/homes?checkin=2027-04-17&checkout=2027-04-18";
const BOOKING_OHERVILLE_URL = "https://www.booking.com/searchresults.fr.html?ss=Oherville%2C+France&checkin=2027-04-17&checkout=2027-04-18";

const LODGING_CAROUSEL: LodgingCard[] = [
  {
    id: 'manoir-lys',
    name: "Le Manoir des Lys",
    category: "NOTRE RECOMMANDATION",
    distance: "À 5 MIN DU DOMAINE",
    image: "/images/chateau_wedding_venue_1783093909311.jpg",
    description: "Demeure normande de charme située à Oherville dans la vallée de la Durdent. Idéal pour séjourner au calme.",
    price: "130€ - 190€ / nuit",
    highlights: ["Petit-déjeuner inclus", "Parking sécurisé gratuit", "Proche Manoir d'Auffay"],
    link: BOOKING_OHERVILLE_URL,
  },
  {
    id: 'gite-grange',
    name: "Gîte La Grange Bleue",
    category: "CHAMBRE D'HÔTES",
    distance: "À 7 MIN DU DOMAINE",
    image: "/images/wedding_couple_watercolor_1783093896603.jpg",
    description: "Une grange rénovée avec goût combinant poutres apparentes, confort haut de gamme et atmosphère paisible en pleine nature à Oherville.",
    price: "95€ - 140€ / nuit",
    highlights: ["Cuisine équipée", "Wi-Fi haut débit", "Vue sur la vallée de la Durdent"],
    link: AIRBNB_OHERVILLE_URL,
  },
  {
    id: 'val-durdent',
    name: "Auberge du Val de Durdent",
    category: "PRATIQUE & PROCHE",
    distance: "AU CŒUR D'OHERVILLE",
    image: "/images/wedding_table_setup_1783093924449.jpg",
    description: "Auberge authentique et suites au bord de la rivière, à quelques minutes en voiture du Manoir d'Auffay.",
    price: "85€ - 120€ / nuit",
    highlights: ["Au centre d'Oherville", "Terrasse au bord de l'eau", "Petit-déjeuner normand"],
    link: BOOKING_OHERVILLE_URL,
  },
  {
    id: 'domaine-durdent',
    name: "Domaine de la Durdent",
    category: "CHARME & CALME",
    distance: "À 10 MIN DU DOMAINE",
    image: "/images/chateau_wedding_venue_1783093909311.jpg",
    description: "Superbe corps de ferme normand transformé en suites privatives au bord de l'eau avec jardin d'hiver.",
    price: "110€ - 160€ / nuit",
    highlights: ["Jardin privé avec terrasse", "Calme absolu", "Petit-déjeuner fait maison"],
    link: "https://www.gites-de-france.com",
  },
  {
    id: 'clos-normand',
    name: "Le Clos Normand",
    category: "GÎTE FAMILIAL",
    distance: "À 12 MIN DU DOMAINE",
    image: "/images/wedding_table_setup_1783093924449.jpg",
    description: "Gîte de grande capacité pouvant accueillir jusqu'à 8 personnes. Parfait pour les familles ou groupes d'amis.",
    price: "180€ - 250€ / nuit",
    highlights: ["4 chambres doubles", "Grand jardin clos", "Parking privé 4 voitures"],
    link: AIRBNB_OHERVILLE_URL,
  },
];

export default function Lodging() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8" id="lodging-page-section">
      {/* Editorial Header */}
      <div className="text-center mb-6 sm:mb-8">
        <span className="font-serif italic text-xs sm:text-sm text-[#C4A475] uppercase tracking-widest block mb-4">
          SÉJOUR &amp; HÉBERGEMENT
        </span>
        <h2 className="font-script text-5xl sm:text-7xl text-[#13263B] leading-tight pt-2">
          Où Dormir ?
        </h2>
        <p className="font-serif italic text-[#5A5040] text-sm mt-1.5 max-w-xl mx-auto leading-relaxed">
          Pour profiter pleinement des festivités au Manoir d'Auffay (Oherville), découvrez notre sélection d'hébergements à proximité.
        </p>
      </div>

      {/* 1. BANDEAU RECHERCHES RAPIDES AIRBNB & BOOKING */}
      <div className="bg-[#FAF7F2] border border-[#3B6FA0]/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-10">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#C4A475]" />
            <h3 className="font-display text-2xl text-[#13263B] font-normal">
              Hébergements à Oherville
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#5A5040] font-sans">
            Consultez les hébergements disponibles autour du Manoir d'Auffay
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          {/* Airbnb Button */}
          <a
            href={AIRBNB_OHERVILLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-white border border-[#3B6FA0]/20 text-[#13263B] hover:bg-slate-50 font-semibold text-xs rounded-full flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all hover:border-[#FF5A5F]/40"
            id="btn-airbnb-oherville"
          >
            <Bed className="w-4 h-4 text-[#FF5A5F]" />
            <span>Voir sur Airbnb</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* Booking Button */}
          <a
            href={BOOKING_OHERVILLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-[#003580] hover:bg-[#002866] text-white font-semibold text-xs rounded-full flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-all"
            id="btn-booking-oherville"
          >
            <Hotel className="w-4 h-4 text-white" />
            <span>Voir sur Booking</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* 2. Carrousel d'hébergements recommandés autour d'Oherville */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl text-[#13263B] font-medium">
              Hébergements Recommandés
            </h3>
            <p className="text-xs text-[#5A5040] font-serif italic">
              Sélection d'hébergements de charme vérifiés par les mariés
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="p-2.5 rounded-full border border-[#3B6FA0]/20 bg-white hover:bg-[#FAF7F2] text-[#13263B] transition-all cursor-pointer shadow-2xs"
              aria-label="Hébergements précédents"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2.5 rounded-full border border-[#3B6FA0]/20 bg-white hover:bg-[#FAF7F2] text-[#13263B] transition-all cursor-pointer shadow-2xs"
              aria-label="Hébergements suivants"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Scroll Container */}
        <div
          ref={carouselRef}
          className="flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1 px-1 custom-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {LODGING_CAROUSEL.map((item) => (
            <div
              key={item.id}
              className="w-full sm:w-[320px] md:w-[350px] flex-shrink-0 snap-start bg-white border border-[#3B6FA0]/15 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Section with Badges - Compact height */}
              <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Top Badge */}
                <div className="absolute top-2.5 left-2.5 bg-[#13263B] text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-sm shadow-xs">
                  {item.category}
                </div>

                {/* Bottom Right Distance Badge */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono tracking-wider font-semibold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C4A475]" />
                  <span>{item.distance}</span>
                </div>
              </div>

              {/* Content Body - Compact spacing */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-display text-xl sm:text-2xl text-[#13263B] font-medium mb-1 line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#5A5040] font-sans leading-relaxed mb-2.5 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Tariff Line */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs mb-2.5">
                    <span className="text-[#5A5040] font-sans text-[11px]">Tarif indicatif :</span>
                    <span className="font-mono font-bold text-[#13263B] text-xs">{item.price}</span>
                  </div>

                  {/* Highlights Checkmark List */}
                  <ul className="space-y-1 text-[11px] text-[#13263B] font-sans">
                    {item.highlights.map((hl, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span className="truncate">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button - Fully visible without vertical cutoff */}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#FAF7F2] hover:bg-[#13263B] hover:text-white border border-[#C4A475]/40 text-[#13263B] font-semibold font-sans text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 shadow-2xs group"
                >
                  <Info className="w-3.5 h-3.5 text-[#C4A475] group-hover:text-white transition-colors" />
                  <span>Découvrir l'hébergement</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
