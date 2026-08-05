/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// 8 Souvenir Image assets
import coupleImg from '../assets/images/wedding_couple_watercolor_1783093896603.jpg';
import chateauImg from '../assets/images/chateau_wedding_venue_1783093909311.jpg';
import vergerImg from '../assets/images/verger_pommier_1783094439600.jpg';
import amalfiImg from '../assets/images/amalfi_watercolor_1783094452174.jpg';
import tableImg from '../assets/images/wedding_table_setup_1783093924449.jpg';
import buttesImg from '../assets/images/buttes_chaumont.png';
import retrouvaillesImg from '../assets/images/retrouvailles.png';
import tourEiffelImg from '../assets/images/toureiffel.png';

interface PhotoCard {
  id: number;
  src: string;
  alt: string;
  title: string;
  caption: string;
  rotation: number;
}

const PHOTOS: PhotoCard[] = [
  {
    id: 1,
    src: coupleImg,
    alt: "Valentine & Jean",
    title: "Valentine & Jean",
    caption: "Leur grande union, Avril 2027",
    rotation: -3,
  },
  {
    id: 2,
    src: chateauImg,
    alt: "Le Manoir d'Auffay",
    title: "Manoir d'Auffay",
    caption: "Oherville, Seine-Maritime",
    rotation: 4,
  },
  {
    id: 3,
    src: vergerImg,
    alt: "Verger Normand",
    title: "Douceur Normande",
    caption: "Pommiers en fleurs & terroir",
    rotation: -2,
  },
  {
    id: 4,
    src: amalfiImg,
    alt: "Escale en Italie",
    title: "Escapade Amalfi",
    caption: "Souvenirs de voyages",
    rotation: 3,
  },
  {
    id: 5,
    src: tableImg,
    alt: "La Table de Fête",
    title: "L'Art de Recevoir",
    caption: "Détails de fête & vaisselle",
    rotation: -4,
  },
  {
    id: 6,
    src: buttesImg,
    alt: "Les Buttes-Chaumont",
    title: "Buttes-Chaumont",
    caption: "Le rocher de la demande",
    rotation: 5,
  },
  {
    id: 7,
    src: retrouvaillesImg,
    alt: "Retrouvailles à Paris",
    title: "Retrouvailles",
    caption: "Même toit à Paris",
    rotation: -3,
  },
  {
    id: 8,
    src: tourEiffelImg,
    alt: "Balades Parisiennes",
    title: "Flâneries",
    caption: "Paris & crêperies",
    rotation: 2,
  },
];

const STACK_ROTATIONS = [-3, 4, -2, 3, -4, 5, -3, 2];

export default function DynamicPhotoStack() {
  const [topIndex, setTopIndex] = useState<number>(0);
  const [isAssembled, setIsAssembled] = useState<boolean>(false);
  const [turningCardId, setTurningCardId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView && !isAssembled) {
      // 1s delay on scroll arrival, then 8 photos fall 1 by 1 from above landing ON TOP of each other
      const timer = setTimeout(() => {
        setIsAssembled(true);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [isInView, isAssembled]);

  const cycleToNext = () => {
    const currentTop = PHOTOS[topIndex];
    setIsAssembled(true);
    setTurningCardId(currentTop.id);

    setTimeout(() => {
      setTurningCardId(null);
    }, 320);

    setTopIndex((prev) => (prev + 1) % PHOTOS.length);
  };

  const cycleToPrev = () => {
    setIsAssembled(true);
    setTopIndex((prev) => (prev - 1 + PHOTOS.length) % PHOTOS.length);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 my-8" id="photo-stack-container" ref={containerRef}>
      
      {/* SECTION HEADER */}
      <div className="text-center mb-6">
        <span className="font-serif italic text-xs text-[#3B6FA0] uppercase tracking-widest block mb-1">
          Album Souvenir &amp; Clichés
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-[#13263B]">
          Instantanés de Bonheur
        </h3>
      </div>

      {/* 8 FIXED PHOTO CARDS STACK CONTAINER */}
      <div className="relative w-72 h-96 sm:w-80 sm:h-[420px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none mb-6">
        {PHOTOS.map((photo, i) => {
          // Relative position in the stack: 0 = front card, 1 = 2nd card, ..., 7 = back card
          const stackPos = (i - topIndex + PHOTOS.length) % PHOTOS.length;
          const isTop = stackPos === 0;
          const isTurning = turningCardId === photo.id;

          // Z-Index calculations (max 30, well below top header z-[100]):
          let zIndex = isTurning ? 1 : (30 - stackPos * 3);

          const scale = 1 - Math.min(stackPos * 0.03, 0.18);
          const yOffset = stackPos * 6;
          const xOffset = stackPos * 2 * (photo.rotation > 0 ? 1 : -1);
          const targetRotation = STACK_ROTATIONS[stackPos];
          const initialDropRotation = i % 2 === 0 ? -12 : 12;

          const dropDelay = 1.0 + (PHOTOS.length - 1 - stackPos) * 0.22;

          return (
            <motion.div
              key={photo.id}
              style={{ zIndex }}
              className={`absolute w-full h-full bg-[#FAF7F2] border border-[#3B6FA0]/20 p-3.5 pb-12 rounded-2xl shadow-md flex flex-col justify-between ${
                isTop && isInView ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : 'pointer-events-none'
              }`}
              initial={{
                y: -300,
                x: 0,
                opacity: 0,
                rotate: initialDropRotation,
                scale: 0.8,
              }}
              animate={
                isAssembled
                  ? {
                      scale: isTurning ? 0.9 : scale,
                      y: isTurning ? yOffset + 10 : yOffset,
                      x: isTurning ? 320 : (isTop ? 0 : xOffset),
                      rotate: isTurning ? 16 : targetRotation,
                      opacity: isTurning ? 0.3 : 1,
                    }
                  : (isInView
                      ? {
                          scale,
                          y: yOffset,
                          x: isTop ? 0 : xOffset,
                          rotate: targetRotation,
                          opacity: 1,
                        }
                      : {
                          scale: 0.8,
                          y: -300,
                          x: 0,
                          rotate: initialDropRotation,
                          opacity: 0,
                        })
              }
              transition={
                isAssembled
                  ? { duration: 0.3, ease: 'easeOut', delay: 0 }
                  : {
                      type: 'spring',
                      stiffness: 85,
                      damping: 14,
                      delay: dropDelay,
                    }
              }
              whileHover={
                isTop
                  ? { scale: 1.03, rotate: 0, transition: { duration: 0.2 } }
                  : { scale: scale + 0.02, transition: { duration: 0.2 } }
              }
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 100) {
                  cycleToNext();
                }
              }}
            >
              {/* Photo frame */}
              <div className="relative w-full h-[78%] overflow-hidden rounded-xl border border-[#C4A475]/30 bg-white">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>

              {/* Polaroid Caption */}
              <div className="text-center pt-2 select-none flex flex-col justify-center">
                <h4 className="font-display text-[#13263B] text-base font-semibold">
                  {photo.title}
                </h4>
                <p className="font-serif italic text-[#3B6FA0] text-xs">
                  {photo.caption}
                </p>
              </div>

              {/* Pin ornament */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#C4A475]/30 rounded-full border border-[#C4A475] shadow-2xs flex items-center justify-center">
                <div className="w-1 h-1 bg-[#13263B] rounded-full" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={cycleToPrev}
          className="p-2.5 rounded-full border border-[#3B6FA0]/20 bg-white hover:bg-[#FAF7F2] text-[#13263B] transition-all duration-300 shadow-2xs cursor-pointer"
          aria-label="Photo précédente"
          id="prev-photo-btn"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-serif italic text-xs text-[#5A5040]">
          Glissez ou cliquez pour passer à la photo suivante (8 photos)
        </span>

        <button
          onClick={cycleToNext}
          className="p-2.5 rounded-full border border-[#3B6FA0]/20 bg-[#FAF7F2] hover:bg-[#C4A475] hover:text-white text-[#13263B] transition-all duration-300 shadow-2xs cursor-pointer"
          aria-label="Photo suivante"
          id="next-photo-btn"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
