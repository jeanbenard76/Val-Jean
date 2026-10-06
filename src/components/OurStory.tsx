import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

// Default image assets
import jbsImg from '../assets/images/jbs.png';
import tourEiffelImg from '../assets/images/toureiffel.png';
import voituresImg from '../assets/images/voitures.png';
import oursImg from '../assets/images/ours.png';
import retrouvaillesImg from '../assets/images/toureiffel.png';
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
      "En 2019, nous déménageons tous les deux à Paris. Valentine rejoint son frère dans une colocation de l'Avenue de Versailles, tandis que Jean s'installe dans un studio avec vue Tour Eiffel ! (en sortant bien la tête de la fenêtre) Nous arrivons au lycée Jean-Baptiste-Say, dans une classe de prépa PT de 45 élèves, dont seulement 20 % de filles. Deux ans de cours, de devoirs et de concours commencent alors.",
    valentineSays: "J'arrive dans cette top prépa avec un objectif : réussir les concours sans redoubler, et avoir AU MOINS les Arts & Métiers, mais pour ça, il faut bien travailler.",
    jeanSays:
      "Sociable comme je suis, j'aborde cette rentrée avec une philosophie très stricte : je suis là pour travailler, point barre. La prépa, ce n'est pas fait pour se faire des amis, et je n'en ressens aucunement le besoin.",
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
      "À la sortie du confinement, le besoin de s'aérer se fait sentir. Nous faisons alors quelques pauses de plus en plus régulières sous forme de balades dans Paris. Mais attention, exigence de la prépa oblige : la promenade ne doit pas durer trop longtemps et ne doit commencer ni trop tôt, ni trop tard. Rapidement, nous commençons à noter tous les parcs parisiens, et nous avons déjà un favori : celui des Buttes Chaumont.",
    valentineSays: "J'ai gardé la note dans mon téléphone des évaluations faites sur les parcs : le Parc Monceau est en dernière position !!",
    jeanSays:
      "Bon, j'avais dit que la prépa n'était pas faite pour se faire des amis... Mais il faut bien avouer que nos discussions sur Snapchat pendant le confinement étaient plutôt agréables. Alors au final, pourquoi ne pas les prolonger dans la vraie vie ?",
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
      "Deux ans après notre rentrée en prépa, les concours marquent le début d'une nouvelle étape. Valentine intègre les Arts & Métiers à Metz, tandis que Jean rejoint IMT Atlantique à Brest. La prépa est terminée, la vie étudiante commence. À distance. Avec près de 1 000 kilomètres entre nos deux écoles, il va falloir s'organiser. La distance commence à être une habitude dans la famille Chem-lenhof !",
    valentineSays: "Jeannot m'appelle tout content de m'annoncer qu'il est pris à Brest, pendant que je réalise de mon coté que Brest-Metz ne se fait pas si vite.",
    jeanSays:
      "En plein road-trip avec des amis, les résultats tombent : je suis pris dans l'école que je visais à Brest ! J'étais tellement heureux que je me suis empressé d'annoncer cette nouvelle à Valentine avant de raccrocher pour fêter ça",
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
      "Et comme si la distance entre Brest et Metz ne suffisait pas, Jean s'en va pendant 6 mois en plein cœur de la Finlande, puis Valentine aux Etats Unis. Mais cela nous permet de vire des expériences inédites : bains dans des lacs glacés, randonnées sauvages avec face à face avec des Ours Bruns du Tennessee.",
    valentineSays: "Plutôt que de faire un échange dans une école en Laponie, Jean a décidé de vivre dans le sud de la Finlande, dans une région froide, grise et sans soleil. Super les vacances.",
    jeanSays:
      "Au final, l'avantage de cette distance pendant nos trois années d'école d'ingénieurs, c'est que ça nous a donné une excellente excuse pour voyager !",
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
      "En mars 2025, Valentine rejoint Jean à Paris pour commencer sa vie professionnelle, dans le conseil naturellement. Après plusieurs années de trains et d'avions réguliers, la longue distance prend fin : Jean habite dans le 15e, elle s'installe dans le 12e arrondissement (les deux arrondissements les plus éloignés de Paris sans doute).",
    valentineSays: "Après 5 ans de relations sans jamais vivre dans la même ville, on se retrouve enfin à Paris ! Il y a forcément un petit temps d'adaptation pour redécouvrir la vie à quelques minutes en métro l'un de l'autre.",
    jeanSays:
      "La distance étant définitivement derrière nous, une nouvelle étape est à prévoir et à organiser....",
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
      "Après plusieurs mois de préparatifs secrets, Jean propose une balade hivernale aux Buttes-Chaumont. Le lieu n'est évidemment pas choisi au hasard : c'est ce même parc que nous avions officiellement élu \"meilleur parc parisien\". C'est dans ce décor symbolique qu'il se lance et fait sa demande en mariage. Et après (seulement !) quelques petites secondes de réflexion pour faire durer le suspense, à base de « QUOI ? » « MAIS QUOI ??? », Valentine dit \"oui, évidemment\" !",
    valentineSays: "Il est arrivé hyper en avance à la balade, alors qu'il préfère arriver pile à l'heure histoire de ne pas trop poireauter. Ça aurait dû me mettre la puce à l'oreille !",
    jeanSays:
      "Trois mois d'organisation en sous-marin pour en arriver là... À peine quelques heures après avoir enfin récupéré la bague, il était déjà temps de passer le cap de la demande !",
    iconName: 'Heart',
  },
];

export default function OurStory() {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // 1:1 Scroll tracking centered on viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 85%', 'end 85%'],
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (let i = STORY_STEPS.length; i >= 1; i--) {
        const el = stepRefs.current[i];
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
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
      <div className="text-center mb-6 sm:mb-10 space-y-2 relative z-10">
        <span className="text-[10px] sm:text-[11px] tracking-[0.3em] font-sans uppercase font-bold text-[#C4A475] block mb-3">
          CARNET D'AVENTURES &amp; CHRONOLOGIE
        </span>
        <h2 className="font-script text-[clamp(2.5rem,4.5vw,7rem)] text-[#13263B] leading-tight pt-2">
          L'Histoire de Valentine &amp; Jean
        </h2>
        <div className="w-20 h-[1px] bg-[#C4A475] mx-auto my-2" />
      </div>

      <div className="relative w-full">
        {/* 2. MATHEMATICALLY PERFECT SVG THREAD 
            By using grid auto-rows, we guarantee each step takes exactly 1/6th of the height.
            The SVG viewBox is 1000x6000, so the center of each step is exactly at Y=500, 1500, 2500, 3500, 4500, 5500.
            This ensures the line passes PERFECTLY behind the center of every single step!
        */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 6000">
            <motion.path
              d="
                M -200, 150
                C 200, 150 500, 200 500, 500
                C 1400, 800 -400, 1200 500, 1500
                C -400, 1800 1400, 2200 500, 2500
                C 1200, 2800 -200, 3200 500, 3500
                C -200, 3800 1200, 4200 500, 4500
                C 1400, 4800 -400, 5200 500, 5500
                Q 500, 5850 1200, 5850
              "
              fill="none"
              stroke="#C4A475"
              strokeWidth="4"
              strokeDasharray="12 12"
              strokeLinecap="round"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>
        </div>

        {/* RESPONSIVE THREAD FOR MOBILE (Straight line instead of loops) */}
        <div className="block lg:hidden absolute left-1/2 -translate-x-1/2 top-[50px] bottom-[50px] w-[2px] pointer-events-none z-0">
          <div className="w-full h-full bg-[#C4A475]/20 rounded-full absolute" />
          <motion.div
            className="w-full bg-[#C4A475] rounded-full origin-top"
            style={{ scaleY: scrollYProgress }}
          />
        </div>


        {/* 3. THE 6 CHRONOLOGICAL STEPS IN STRICT GRID 
            auto-rows-fr guarantees that every single step has EXACTLY the same height.
            This is the secret to making the SVG align perfectly with the DOM elements!
        */}
        <div className="grid grid-cols-1 auto-rows-fr w-full relative z-10">
          {STORY_STEPS.map((step, idx) => {
            const isActive = activeStepId === step.id;

            return (
              <div
                key={step.id}
                ref={(el) => (stepRefs.current[step.id] = el)}
                id={`story-step-${step.id}`}
                className="scroll-mt-32 relative z-10 flex flex-col justify-center py-16 sm:py-24"
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className={`max-w-6xl mx-auto w-full transition-all duration-500 relative z-10 ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-85 scale-[0.98]'
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

                  {/* TRIPARTITE GRID: VALENTINE QUOTE | OPAQUE WHITE CENTER CARD | JEAN QUOTE */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* 1. LEFT COLUMN: VALENTINE'S PERSPECTIVE */}
                    <div className="lg:col-span-3 order-2 lg:order-1 flex flex-col justify-center">
                      <div className="p-2 space-y-2 text-left relative z-20">
                        <div className="flex items-center gap-2 border-b border-amber-300/50 pb-1.5 w-fit">
                          <span className="text-[11px] font-bold tracking-wider uppercase text-amber-800 font-sans">
                            Valentine
                          </span>
                        </div>
                        <p 
                          className="font-serif italic text-sm text-amber-950 font-semibold leading-relaxed" 
                          style={{ textShadow: "0 0 10px white, 0 0 20px white, 0 0 30px white" }}
                        >
                          &ldquo;{step.valentineSays}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* 2. CENTER COLUMN: MAIN STEP CORE & POLAROID PHOTO */}
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
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                          <p className="font-serif text-sm text-[#13263B] leading-relaxed">
                            {step.recitGlobal}
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* 3. RIGHT COLUMN: JEAN'S PERSPECTIVE */}
                    <div className="lg:col-span-3 order-3 flex flex-col justify-center">
                      <div className="p-2 space-y-2 text-right relative z-20">
                        <div className="flex items-center justify-end gap-2 border-b border-blue-300/50 pb-1.5 w-fit ml-auto">
                          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-800 font-sans">
                            Jean
                          </span>
                        </div>
                        <p 
                          className="font-serif italic text-sm text-blue-950 font-semibold leading-relaxed"
                          style={{ textShadow: "0 0 10px white, 0 0 20px white, 0 0 30px white" }}
                        >
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
      </div>
    </section>
  );
}


