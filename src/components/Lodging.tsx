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
    id: 'essentiel',
    name: "L'Essentiel",
    category: "CHAMBRE D'HÔTES",
    distance: "À 4 MIN (1,8 KM)",
    image: "/images/essentiel.jpg",
    description: "Pour 2 personnes. Un charmant Bed & Breakfast situé dans le village d'Oherville, à deux pas du Manoir.",
    price: "35€ / pers / nuit",
    highlights: ["2 personnes", "Linge à disposition", "Proche Manoir"],
    link: "https://www.booking.com/hotel/fr/essentiel-oherville.fr.html?aid=304142&label=gen173nr-10CAQoggJCGHNlYXJjaF9vaGVydmlsbGUsIGZyYW5jZUgNWARoTYgBAZgBM7gBF8gBDNgBA-gBAfgBAYgCAagCAbgC2O7S0wbAAgHSAiRiMGJkZTc2Yi1mYmNlLTQyZTUtOWE4ZS03ZGIxNWYxMTFlNTPYAgHgAgE&ucfs=1&checkin=2027-04-17&checkout=2027-04-18&dest_id=-1455744&dest_type=city&group_adults=2&no_rooms=1&group_children=0&srpvid=7da0746cd4340596&srepoch=1786034165&all_sr_blocks=1349142501_407252890_2_2_0&highlighted_blocks=1349142501_407252890_2_2_0&matching_block_id=1349142501_407252890_2_2_0&atlas_src=sr_iw_title",
  },
  {
    id: 'gite-durdent',
    name: "Gîte de la Durdent",
    category: "GÎTE DE CHARME",
    distance: "À 7 MIN (4,1 KM)",
    image: "/images/durdent.jpg",
    description: "Pour 6 personnes (3 chambres). Gîte tout confort avec jardin situé au cœur d'Oherville.",
    price: "22€ / pers (133€)",
    highlights: ["6 personnes (3 ch.)", "Parking privé", "Jardin"],
    link: "https://www.booking.com/hotel/fr/gite-de-la-durdent.fr.html?aid=304142&label=gen173nr-10CAQoggJCGHNlYXJjaF9vaGVydmlsbGUsIGZyYW5jZUgNWARoTYgBAZgBM7gBF8gBDNgBA-gBAfgBAYgCAagCAbgC2O7S0wbAAgHSAiRiMGJkZTc2Yi1mYmNlLTQyZTUtOWE4ZS03ZGIxNWYxMTFlNTPYAgHgAgE&ucfs=1&checkin=2027-04-17&checkout=2027-04-18&dest_id=-1455744&dest_type=city&group_adults=2&no_rooms=1&group_children=0&srpvid=7da0746cd4340596&srepoch=1786034165&all_sr_blocks=1176860701_390210577_6_0_0&highlighted_blocks=1176860701_390210577_6_0_0&matching_block_id=1176860701_390210577_6_0_0&atlas_src=sr_iw_title",
  },
  {
    id: 'colvert',
    name: "Le Colvert",
    category: "GÎTES DE FRANCE",
    distance: "À 7 MIN (4,1 KM)",
    image: "/images/colvert.png",
    description: "Pour 5 personnes (2 chambres). Une authentique demeure normande. 2 nuits minimum.",
    price: "71€ / pers / nuit",
    highlights: ["5 personnes (2 ch.)", "2 nuits min.", "Spa & Sauna"],
    link: "https://www.gites.fr/d/58617284?searchId=60e3f93c-7bfe-48e3-9f37-f218bea72ba7&checkin=2027-04-16&checkout=2027-04-18&searchTerm=Oherville%2C+Normandie%2C+France&pageSize=21&asyncSubscriptions=true&hasGConfig=true&searchMultiUnits=true&locale=fr-FR&currency=EUR&selectedPriceRateId=DEFAULT&adults=2&_gl=1*ewhmp*_up*MQ..*_gs*MQ..&gclid=CjwKCAjw4dDTBhAqEiwAkHYmSvsTtul6elsZJ87Yl92fUokK3a0ABCLtyigW1SaS34ofrXkAfuV5-hoCh0YQAvD_BwE&ctx=SdCmdvc89R",
  },
  {
    id: 'petite-ecurie',
    name: "La Petite Écurie",
    category: "GÎTES DE FRANCE",
    distance: "À 14 MIN (8,9 KM)",
    image: "/images/ecurie.jpg",
    description: "Pour 6 personnes (2 chambres). Hébergement chaleureux et accueillant. 2 nuits minimum.",
    price: "23€ / pers / nuit",
    highlights: ["6 personnes (2 ch.)", "2 nuits min.", "Très calme"],
    link: "https://www.gites.fr/d/59010073?searchId=60e3f93c-7bfe-48e3-9f37-f218bea72ba7&checkin=2027-04-16&checkout=2027-04-18&searchTerm=Oherville%2C+Normandie%2C+France&pageSize=21&asyncSubscriptions=true&hasGConfig=true&searchMultiUnits=true&locale=fr-FR&currency=EUR&selectedPriceRateId=DEFAULT&adults=2&_gl=1*ewhmp*_up*MQ..*_gs*MQ..&gclid=CjwKCAjw4dDTBhAqEiwAkHYmSvsTtul6elsZJ87Yl92fUokK3a0ABCLtyigW1SaS34ofrXkAfuV5-hoCh0YQAvD_BwE&ctx=SdCmdvc89R",
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
        <h2 className="font-script text-[clamp(3rem,6vw,5rem)] text-[#13263B] leading-tight pt-2">
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

        <div className="flex flex-row items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Airbnb Button */}
          <a
            href={AIRBNB_OHERVILLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-3 sm:px-5 py-3 bg-white border border-[#3B6FA0]/20 text-[#13263B] hover:bg-slate-50 font-semibold text-[10px] sm:text-xs rounded-full flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all hover:border-[#FF5A5F]/40 text-center"
            id="btn-airbnb-oherville"
          >
            <Bed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5A5F]" />
            <span>Airbnb</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Booking Button */}
          <a
            href={BOOKING_OHERVILLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-3 sm:px-5 py-3 bg-[#003580] hover:bg-[#002866] text-white font-semibold text-[10px] sm:text-xs rounded-full flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all text-center"
            id="btn-booking-oherville"
          >
            <Hotel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span>Booking</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
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
          className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 pt-1 px-1 custom-scrollbar sm:justify-center md:justify-start"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {LODGING_CAROUSEL.map((item) => (
            <div
              key={item.id}
              className="w-[85vw] sm:w-[320px] md:w-[350px] flex-shrink-0 snap-center bg-white border border-[#3B6FA0]/15 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
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
