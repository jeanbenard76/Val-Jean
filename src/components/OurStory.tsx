import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

// Default image assets
import jbsImg from '../assets/images/jbs.png';
import tourEiffelImg from '../assets/images/toureiffel.png';
import voituresImg from '../assets/images/voitures.png';
import oursImg from '../assets/images/ours.png';
import retrouvaillesImg from '../assets/images/retrouvailles.png';
import buttesChaumontImg from '../assets/images/buttes_chaumont.png';

export interface StoryStep {
  id: number;
  year: string;
  date: string;
  title: string;
  subtitle: string;
  location: string;
  defaultImage: string;
  rotateDeg: string;
  recitGlobal: string;
  valentineSays: string;
  jeanSays: string;
  iconName: string;
}

export const STORY_STEPS: StoryStep[] = [
  {
    id: 1,
    year: '2019',
    date: 'Année 2019',
    title: 'Rencontre en Prépa PT',
    subtitle: 'Lycée Jean-Baptiste Say (Paris)',
    location: 'Paris 16e',
    defaultImage: jbsImg,
    rotateDeg: '-2.5deg',
    recitGlobal:
      "En plein cœur du marathon de la prépa PT, entre cours d'algorithmie, physique nucléaire et travaux pratiques de Sciences de l'Ingénieur, nos chemins se croisent au lycée Jean-Baptiste Say. C'est au milieu des oscilloscopes et des équations différentielles que naît notre complicité.",
    valentineSays:
      "Je révisais ma thermodynamique avec un sérieux absolu, pendant que Jean essayait de m'expliquer la physique quantique avec des métaphores tirées par les cheveux !",
    jeanSays:
      "J'ai passé 80% de mes TP de SI à faire semblant de régler des signaux électriques pour avoir une excuse de venir à sa paillasse.",
    iconName: 'GraduationCap',
  },
  {
    id: 2,
    year: '2020',
    date: 'Année 2020',
    title: 'Balades Parisiennes & Fringales de Crêpes',
    subtitle: 'Jardin du Luxembourg, Buttes-Chaumont, Panthéon',
    location: 'Paris',
    defaultImage: tourEiffelImg,
    rotateDeg: '2deg',
    recitGlobal:
      "Le couple se forge au rythme de longues déambulations parisiennes : les allées du Jardin du Luxembourg, les pentes escarpées des Buttes-Chaumont, le Quartier Latin. Une habitude s'installe : Jean louche sur chaque crêperie croisée sur le parcours, mais préfère taire sa faim pour jouer les randonneurs infatigables.",
    valentineSays:
      "Il fixait chaque vitrine de crêperie rue Mouffetard avec des yeux affamés, mais quand je lui proposais une pause, il répondait imperturbable 'Non non c'est parfait, continuons à marcher' !",
    jeanSays:
      "J'avais une faim de loup après trois heures de marche intensive aux Buttes-Chaumont, mais la fierté m'interdisait de ralentir le rythme.",
    iconName: 'Coffee',
  },
  {
    id: 3,
    year: '2021',
    date: 'Été 2021',
    title: 'Résultats des Concours & Choc des Écoles',
    subtitle: 'IMT Atlantique vs Arts et Métiers de Metz',
    location: 'Road-trip & Metz / Brest',
    defaultImage: voituresImg,
    rotateDeg: '-1.8deg',
    recitGlobal:
      "Jour J des intégrations d'écoles d'ingénieurs. Jean, en plein road-trip, appelle Valentine pour lui annoncer sa grande nouvelle : admis à l'IMT Atlantique à Brest ! Valentine comprend à cet instant précis qu'elle intégrera les Arts et Métiers à Metz. La géographie bouleverse brutalement les plans élaborés ensemble.",
    valentineSays:
      "Je m'imaginais déjà dans la même ville, et là Jean m'annonce en direct de sa voiture 'Je pars à Brest !' ... Panique à bord, cap sur Metz en solo !",
    jeanSays:
      "J'étais fou de joie au volant... jusqu'au moment où j'ai tapé 'Trajet Brest-Metz' sur le GPS et réalisé l'ampleur du voyage.",
    iconName: 'Compass',
  },
  {
    id: 4,
    year: '2021-2024',
    date: '2021 — 2024',
    title: '3 Ans à Distance : Saunas & Ours Américains',
    subtitle: 'Brest, Metz, Paris, Finlande & USA',
    location: 'Joensuu (Finlande) & États-Unis',
    defaultImage: oursImg,
    rotateDeg: '2.8deg',
    recitGlobal:
      "Pendant trois ans, nous apprivoisons la distance entre les liaisons TGV et les vols internationaux. De Joensuu en Finlande jusqu'aux parcs naturels américains, chaque retrouvaille est une aventure : bains glacés finlandais après le sauna traditionnel, et randonnées sauvages à l'affût des ours américains.",
    valentineSays:
      "Jean m'a convaincue de sauter dans un lac gelé à Joensuu par -15°C après le sauna. Je suis encore surprise d'avoir survécu avec tous mes orteils !",
    jeanSays:
      "Aux États-Unis, Valentine sursautait à chaque craquement de branche en criant 'Un ours !', et cette fois-ci c'était vraiment des ours sur la route !",
    iconName: 'Globe',
  },
  {
    id: 5,
    year: '2025',
    date: 'Début 2025',
    title: 'Retrouvailles à Paris & Vies Professionnelles',
    subtitle: 'Consultants en Énergie & Industrie',
    location: 'Paris',
    defaultImage: retrouvaillesImg,
    rotateDeg: '-2deg',
    recitGlobal:
      "Clap de fin pour la distance ! Diplômes en poche, nous emménageons enfin ensemble à Paris pour lancer nos carrières de consultants : Jean dans le secteur de l'énergie, Valentine dans l'industrie. La fin des billets de train du vendredi soir laisse place à une complicité quotidienne retrouvée.",
    valentineSays:
      "Enfin sous le même toit et dans le même fuseau horaire ! Nos dîners sont dorénavant rythmés par nos débriefs de missions et l'optimisation de nos emplois du temps.",
    jeanSays:
      "Plus besoin de régler un réveil à 5h30 le lundi matin pour attraper le premier train. Une vraie révolution !",
    iconName: 'Briefcase',
  },
  {
    id: 6,
    year: '21/12/2025',
    date: '21 Décembre 2025',
    title: 'La Demande en Fiançailles aux Buttes-Chaumont',
    subtitle: 'Retour aux sources sur notre rocher',
    location: 'Parc des Buttes-Chaumont, Paris',
    defaultImage: buttesChaumontImg,
    rotateDeg: '1.5deg',
    recitGlobal:
      "Le 21 décembre 2025, retour symbolique là où tout avait commencé. Lors d'une promenade hivernale aux Buttes-Chaumont, au sommet du rocher du Temple de la Sybille, Jean pose un genou à terre et fait sa demande. Un moment magique scellé par un grand OUI émouvant.",
    valentineSays:
      "Il semblait anormalement concentré pour une simple balade hivernale. Quand il s'est agenouillé sur notre rocher favori, l'émotion a été totale !",
    jeanSays:
      "J'avais vérifié la poche de mon manteau cinquante fois. Et cette fois-ci, nous avons immédiatement fêté ça autour de vraies crêpes parisiennes !",
    iconName: 'Heart',
  },
];

export default function OurStory() {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Scroll-driven path length strictly bound to user scroll position!
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 60%', 'end 85%'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 350, damping: 55 });
  const mobileHeight = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2.5;

      for (let i = STORY_STEPS.length; i >= 1; i--) {
        const el = stepRefs.current[i];
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top - 140) {
            setActiveStepId(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-12 relative overflow-hidden" id="our-story-section">
      
      {/* 1. SECTION HEADER */}
      <div className="text-center mb-10 sm:mb-16 space-y-2 relative z-10">
        <span className="text-[10px] sm:text-[11px] tracking-[0.3em] font-sans uppercase font-bold text-[#C4A475] block mb-3">
          CARNET D'AVENTURES &amp; CHRONOLOGIE
        </span>
        <h2 className="font-script text-[clamp(3rem,6vw,5rem)] text-[#13263B] leading-tight pt-2">
          L'Histoire de Valentine &amp; Jean
        </h2>
        <div className="w-20 h-[1px] bg-[#C4A475] mx-auto my-2" />
        <p className="font-serif italic text-xs sm:text-sm text-[#5A5040] max-w-xl mx-auto leading-relaxed">
          Six grandes étapes, de la prépa PT jusqu'à notre demande en fiançailles aux Buttes-Chaumont.
        </p>
      </div>

      {/* 2. EXACT HAND-DRAWN LOOPING SVG THREAD (MATCHING USER DRAWING SKETCH) */}
      <div className="hidden lg:block absolute inset-x-0 top-[240px] bottom-[80px] pointer-events-none z-0">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1400 2400">
          {/* Wild cursive loops starting top-left, looping around screen edges & steps */}
          <motion.path
            d="
              M 50,40 
              C 350,-60 650,80 500,120 
              C 350,160 300,50 480,40 
              C 700,30 1350,20 1300,280 
              C 1250,540 1050,320 1150,460 
              C 1250,600 1380,480 1280,380 
              C 1150,260 400,600 120,550 
              C -50,500 80,720 220,650 
              C 360,580 180,480 80,580 
              C -20,680 400,920 650,880 
              C 900,840 1380,780 1320,1120 
              C 1260,1460 1050,1180 1180,1320 
              C 1310,1460 1400,1200 1250,1150 
              C 1100,1100 400,1420 120,1380 
              C -50,1340 80,1580 220,1500 
              C 360,1420 180,1320 80,1420 
              C -20,1520 400,1820 650,1780 
              C 900,1740 1380,1680 1300,2020 
              C 1220,2360 800,2150 500,2360
            "
            fill="none"
            stroke="#C4A475"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            style={{ pathLength: smoothProgress }}
          />
        </svg>
      </div>

      {/* 3. RESPONSIVE LEFT THREAD FOR IPHONE / MOBILE */}
      <div className="lg:hidden absolute left-6 top-[240px] bottom-[80px] w-[2px] pointer-events-none z-0">
        <motion.div
          className="w-full bg-gradient-to-b from-[#C4A475]/20 via-[#C4A475] to-[#C4A475]/20 origin-top"
          style={{ height: mobileHeight }}
        />
      </div>

      {/* 4. THE 6 CHRONOLOGICAL STEPS (Scattered Layout & Clean White Cards) */}
      <div className="space-y-16 sm:space-y-24 relative z-10">
        {STORY_STEPS.map((step, idx) => {
          const isActive = activeStepId === step.id;

          // Scattered offsets from left to right across the screen layout
          const offsetClasses = [
            'lg:ml-[-5%]',               // Step 1: shifted left
            'lg:mr-[-6%] lg:ml-auto',     // Step 2: shifted right
            'lg:ml-[-8%]',               // Step 3: shifted far left
            'lg:mr-[-5%] lg:ml-auto',     // Step 4: shifted right
            'lg:ml-[-4%]',               // Step 5: shifted left
            'lg:mx-auto',                // Step 6: centered finale
          ][idx % 6];

          // Vertical quote offsets to clear the golden SVG thread line
          const valentineShift = [
            'lg:translate-y-4',  // Step 1
            'lg:-translate-y-6', // Step 2
            'lg:translate-y-6',  // Step 3
            'lg:-translate-y-8', // Step 4
            'lg:translate-y-4',  // Step 5
            'lg:-translate-y-4', // Step 6
          ][idx % 6];

          const jeanShift = [
            'lg:-translate-y-4', // Step 1
            'lg:translate-y-6',  // Step 2
            'lg:-translate-y-6', // Step 3
            'lg:translate-y-8',  // Step 4
            'lg:-translate-y-4', // Step 5
            'lg:translate-y-4',  // Step 6
          ][idx % 6];

          return (
            <div
              key={step.id}
              ref={(el) => (stepRefs.current[step.id] = el)}
              id={`story-step-${step.id}`}
              className="scroll-mt-32 relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: idx * 0.1 }}
                className={`max-w-5xl transition-all duration-500 relative z-10 ${offsetClasses} ${
                  isActive ? 'opacity-100' : 'opacity-85'
                }`}
              >
                {/* ELEGANT MINIMAL HEADER: YEAR, LOCATION & FINE LINE */}
                <div className="flex flex-col items-center justify-center mb-6 max-w-sm mx-auto text-center">
                  <div className="flex items-center justify-center gap-2.5 text-[#13263B]">
                    <span className="font-serif text-sm sm:text-base font-semibold tracking-wider text-[#13263B]">
                      {step.date}
                    </span>
                    <span className="text-[#C4A475] font-light">•</span>
                    <span className="font-serif italic text-xs sm:text-sm text-slate-500">
                      {step.location}
                    </span>
                  </div>
                  <div className="w-12 h-[1px] bg-[#C4A475]/60 mt-2.5" />
                </div>

                {/* TRIPARTITE GRID: FRAMELESS VALENTINE QUOTE | OPAQUE WHITE CENTER CARD | FRAMELESS JEAN QUOTE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* 1. LEFT COLUMN: VALENTINE'S PERSPECTIVE (FRAMELESS & CUSTOM HEIGHT SHIFT) */}
                  <div className={`lg:col-span-3 order-2 lg:order-1 flex flex-col justify-center ${valentineShift}`}>
                    <div className="p-3 space-y-1.5 text-left relative z-20">
                      <div className="flex items-center gap-2 border-b border-amber-400/50 pb-1 w-fit">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-display text-[9px] font-bold flex items-center justify-center border border-amber-300 shrink-0">
                          V
                        </span>
                        <span className="text-[11px] font-bold tracking-wider uppercase text-amber-800 font-sans">
                          Valentine
                        </span>
                      </div>

                      <p className="font-serif italic text-xs sm:text-sm text-amber-900 leading-relaxed drop-shadow-2xs">
                        &ldquo;{step.valentineSays}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* 2. CENTER COLUMN: MAIN STEP CORE & POLAROID PHOTO (CLEAN WHITE CARD WITHOUT TOP GRADIENT) */}
                  <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-center">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-md w-full relative z-20 overflow-hidden">
                      
                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="font-display text-2xl sm:text-3xl text-[#13263B] font-semibold leading-tight">
                          {step.title}
                        </h3>
                        <p className="font-serif italic text-xs sm:text-sm text-[#C4A475] mt-1">
                          {step.subtitle}
                        </p>
                      </div>

                      {/* Polaroid Photo Frame */}
                      <div className="flex justify-center py-1">
                        <div
                          className="bg-white p-2.5 rounded-xl shadow-xs border border-slate-200 transition-transform duration-300 hover:rotate-0 max-w-[200px] sm:max-w-[210px] w-full relative group"
                          style={{ transform: `rotate(${step.rotateDeg})` }}
                        >
                          {/* Scotch Tape effect */}
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#FAF7F2]/90 border border-amber-200/60 rotate-[-1deg] opacity-80 pointer-events-none" />

                          <div className="w-full aspect-4/3 rounded-lg bg-slate-50 overflow-hidden relative">
                            <img
                              src={step.defaultImage}
                              alt={step.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Récit Global sur Fond Blanc */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100 text-left">
                        <p className="font-serif text-xs sm:text-sm text-[#13263B] leading-relaxed">
                          {step.recitGlobal}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* 3. RIGHT COLUMN: JEAN'S PERSPECTIVE (FRAMELESS & CUSTOM HEIGHT SHIFT) */}
                  <div className={`lg:col-span-3 order-3 flex flex-col justify-center ${jeanShift}`}>
                    <div className="p-3 space-y-1.5 text-right relative z-20">
                      <div className="flex items-center justify-end gap-2 border-b border-blue-400/50 pb-1 w-fit ml-auto">
                        <span className="text-[11px] font-bold tracking-wider uppercase text-blue-800 font-sans">
                          Jean
                        </span>
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-display text-[9px] font-bold flex items-center justify-center border border-blue-300 shrink-0">
                          J
                        </span>
                      </div>

                      <p className="font-serif italic text-xs sm:text-sm text-blue-900 leading-relaxed drop-shadow-2xs">
                        &ldquo;{step.jeanSays}&rdquo;
                      </p>
                    </div>
                  </div>

                </div>

              </motion.div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
