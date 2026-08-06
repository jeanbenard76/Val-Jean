/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import WeddingLogo from './components/WeddingLogo';
import DynamicPhotoStack from './components/DynamicPhotoStack';
import InteractiveMapRoute from './components/InteractiveMapRoute';
import Lodging from './components/Lodging';
import Contact from './components/Contact';
import Registry from './components/Registry';
import RSVPForm from './components/RSVPForm';
import OurStory from './components/OurStory';
import SecretAdminDashboard from './components/SecretAdminDashboard';

type PageType = 'home' | 'story' | 'itinerary' | 'lodging' | 'registry' | 'rsvp' | 'contact' | 'admin';

// Real URL per page so refresh / back / shared links land on the right page.
// The Express server (and Vite in dev) serve index.html for every path (SPA fallback).
const PAGE_PATHS: Record<PageType, string> = {
  home: '/',
  story: '/notre-histoire',
  itinerary: '/programme',
  lodging: '/ou-dormir',
  registry: '/liste-de-mariage',
  rsvp: '/rsvp',
  contact: '/contact',
  admin: '/admin',
};

const pageFromPath = (path: string): PageType => {
  const entry = Object.entries(PAGE_PATHS).find(
    ([, p]) => p !== '/' && (path === p || path.startsWith(p + '/'))
  );
  return (entry?.[0] as PageType) || 'home';
};

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState<PageType>('home');

  // On load: restore the page from the URL (path, or legacy ?admin=1 query).
  // The admin password itself is always asked via the browser prompt, never stored.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin') || params.has('secret') || params.has('maries')) {
      setActivePage('admin');
      return;
    }
    setActivePage(pageFromPath(window.location.pathname));
  }, []);

  // Browser back/forward buttons
  useEffect(() => {
    const onPopState = () => setActivePage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handlePageChange = (page: PageType) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    const path = PAGE_PATHS[page] || '/';
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    // Instant scroll to top to simulate moving to a completely new separated page
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-[100dvh] toile-overlay selection:bg-[#FAE28A] flex flex-col relative" id="app-root">
      
      {/* 1. STICKY NAV HEADER */}
      <header className="sticky top-0 z-[100] bg-[#FFFEF5]/90 backdrop-blur-md border-b border-[#3B6FA0]/15 px-6 py-4 flex items-center justify-between shadow-xs">
        {/* Left: Brand Monogram */}
        <div 
          onClick={() => handlePageChange('home')} 
          className="flex items-center gap-2 cursor-pointer group"
          id="nav-brand"
        >
          <WeddingLogo size="sm" className="w-10 h-10 -my-1" themeColor="blue" />
          <div className="flex flex-col">
            <span className="font-display text-sm tracking-widest font-semibold text-[#1A3A5C] group-hover:text-[#F5C842] transition-colors">
              VALENTINE &amp; JEAN
            </span>
            <span className="font-serif italic text-[10px] text-[#3B6FA0] tracking-wider">
              17 Avril 2027 • Normandie
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-serif tracking-widest uppercase text-[#1A3A5C]">
          {[
            { id: 'home', label: 'Accueil' },
            { id: 'story', label: 'Notre Histoire' },
            { id: 'itinerary', label: 'Programme & Trajet' },
            { id: 'lodging', label: 'Où Dormir' },
            { id: 'registry', label: 'Liste de Mariage' },
            { id: 'rsvp', label: 'RSVP', isSpecial: true },
            { id: 'contact', label: 'Nous Contacter' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id as PageType)}
              className={`py-1 transition-colors cursor-pointer relative ${
                item.isSpecial
                  ? `font-bold text-[#C4A475] hover:text-[#13263B] ${activePage === item.id ? 'underline decoration-[#C4A475] underline-offset-4' : ''}`
                  : `hover:text-[#C4A475] ${activePage === item.id ? 'text-[#C4A475] font-semibold' : 'text-[#1A3A5C]'}`
              }`}
            >
              {item.label}
              {activePage === item.id && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#C4A475] rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile navigation trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#3B6FA0]/10 text-[#1A3A5C] transition-colors cursor-pointer"
            aria-label="Menu principal"
            id="mobile-menu-trigger"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. MOBILE DRAWER NAVIGATION */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-[73px] left-0 right-0 bg-[#FFFEF5]/95 backdrop-blur-lg border-b border-[#3B6FA0]/15 z-30 shadow-xl overflow-hidden flex flex-col p-6 space-y-4 font-serif tracking-widest uppercase text-[#1A3A5C] text-center"
            id="mobile-navigation-drawer"
          >
            {[
              { id: 'home', label: 'Accueil' },
              { id: 'story', label: 'Notre Histoire' },
              { id: 'itinerary', label: 'Programme & Trajet' },
              { id: 'lodging', label: 'Où Dormir' },
              { id: 'registry', label: 'Liste de Mariage' },
              { id: 'rsvp', label: 'RSVP', isSpecial: true },
              { id: 'contact', label: 'Nous Contacter' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id as PageType)}
                className={`py-3 hover:text-[#C4A475] border-b border-[#3B6FA0]/10 last:border-0 ${
                  item.isSpecial ? 'text-[#C4A475] font-bold' : ''
                } ${
                  activePage === item.id ? 'bg-[#C4A475]/10 rounded-xl font-semibold' : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1">
        {/* HOME PAGE */}
        {activePage === 'home' && (
          <div id="home-page" className="animate-fade-in">
            {/* 1. INITIAL ENTRY HERO SCREEN (Simple, elegant, Toile de Jouy) */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 py-6 sm:py-8 overflow-hidden bg-[#FAF7F2] border-b border-[#3B6FA0]/15 min-h-[calc(100dvh-73px)]">
              {/* Richer Toile de Jouy Background Overlay with soft blur */}
              <div className="absolute inset-0 toile-pattern opacity-[0.14] blur-[0.3px] pointer-events-none" />
              
              {/* Top Parents Line with Larger Logo in Center */}
              <div className="relative z-10 my-auto py-2 sm:py-4 max-w-4xl mx-auto flex flex-col items-center text-center space-y-3">
                
                {/* Parents & Larger Center Logo Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 w-full max-w-3xl mx-auto px-4 border-b border-[#C4A475]/30 pb-3">
                  <span className="text-[11px] sm:text-xs font-serif tracking-widest uppercase text-[#13263B]/70 text-center sm:text-left font-medium">
                    Anne et Visith Chem-Lenhof
                  </span>

                  <div className="p-1.5 bg-[#FAF7F2] rounded-full border border-[#C4A475]/35 shadow-xs shrink-0 my-1 sm:my-0">
                    <WeddingLogo size="lg" className="w-12 h-12 sm:w-16 sm:h-16" themeColor="gold" />
                  </div>

                  <span className="text-[11px] sm:text-xs font-serif tracking-widest uppercase text-[#13263B]/70 text-center sm:text-right font-medium">
                    Anny-Claude et Marc Bénard
                  </span>
                </div>

                {/* Invitation phrase */}
                <p className="text-xs sm:text-sm font-serif italic text-[#3B6FA0] tracking-wider pt-1 mb-4 sm:mb-6">
                  sont heureux de vous inviter au mariage de leurs enfants
                </p>

                {/* Main Script Heading */}
                <h1 className="font-script text-[clamp(3.5rem,8vw,7rem)] text-[#13263B] my-2 leading-tight drop-shadow-xs select-none">
                  Valentine <span className="font-serif italic text-[#C4A475]">&amp;</span> Jean
                </h1>

                {/* Simple & Authentic Date Display */}
                <div className="mt-3 flex flex-col items-center space-y-1.5 pb-2">
                  <div className="inline-flex items-center gap-4 text-xl sm:text-2xl font-display text-[#13263B] tracking-widest border-y border-[#C4A475]/40 py-1.5 px-6">
                    <span>17</span>
                    <span className="text-[#C4A475] font-light">|</span>
                    <span>04</span>
                    <span className="text-[#C4A475] font-light">|</span>
                    <span>2027</span>
                  </div>
                  
                  <div className="text-xs sm:text-sm font-serif text-[#13263B] pt-1 space-y-0.5">
                    <p className="font-medium">à 14 heures, en l'église Saint-Ribert à Torcy-Le-Grand</p>
                    <p className="text-[11px] sm:text-xs italic text-[#3B6FA0]">Suivi de la réception au Manoir d'Auffay, Oherville</p>
                  </div>

                  {/* Authentic Underlined Link (No AI button outline!) */}
                  <div className="pt-3">
                    <button
                      onClick={() => handlePageChange('rsvp')}
                      className="font-serif italic text-base sm:text-lg text-[#13263B] hover:text-[#C4A475] underline decoration-[#C4A475] underline-offset-4 cursor-pointer transition-colors"
                    >
                      Confirmer votre présence &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. ALBUM SOUVENIR SECTION */}
            <section id="home-content" className="py-6 sm:py-8 px-4 max-w-5xl mx-auto overflow-hidden">
              <DynamicPhotoStack />
            </section>
          </div>
        )}

        {/* OUR STORY PAGE */}
        {activePage === 'story' && (
          <div id="story-page" className="py-8 animate-fade-in">
            <OurStory />
          </div>
        )}

        {/* PROGRAMME & ITINERARY PAGE */}
        {activePage === 'itinerary' && (
          <div id="itinerary-page" className="py-8 animate-fade-in">
            <InteractiveMapRoute onShowLodging={() => handlePageChange('lodging')} />
          </div>
        )}

        {/* LODGING PAGE */}
        {activePage === 'lodging' && (
          <div id="lodging-page" className="py-8 animate-fade-in">
            <Lodging />
          </div>
        )}

        {/* REGISTRY PAGE */}
        {activePage === 'registry' && (
          <div id="registry-page" className="py-8 animate-fade-in">
            <Registry />
          </div>
        )}

        {/* RSVP FORM PAGE */}
        {activePage === 'rsvp' && (
          <div id="rsvp-page" className="py-8 animate-fade-in">
            <RSVPForm />
          </div>
        )}

        {/* CONTACT PAGE */}
        {activePage === 'contact' && (
          <div id="contact-page" className="py-8 animate-fade-in">
            <Contact />
          </div>
        )}

        {/* SECRET BRIDE & GROOM DASHBOARD PAGE */}
        {activePage === 'admin' && (
          <div id="admin-dashboard-page" className="py-8 animate-fade-in">
            <SecretAdminDashboard onBackToHome={() => handlePageChange('home')} />
          </div>
        )}

        {/* GLOBAL RSVP REINFORCEMENT BANNER (Shown on inner content pages, excluded from Home, Story, RSVP, Admin, Lodging, and Contact) */}
        {activePage !== 'home' && activePage !== 'story' && activePage !== 'rsvp' && activePage !== 'admin' && activePage !== 'lodging' && activePage !== 'contact' && (
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="bg-[#FAF7F2] border border-[#C4A475]/40 border-t-2 border-t-[#C4A475] rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
              <span className="font-serif italic text-xs text-[#C4A475] uppercase tracking-widest block">
                — Réponse Souhaitée Avant le 15 Février 2027 —
              </span>
              <h3 className="font-script text-[clamp(2rem,5vw,3.5rem)] text-[#13263B]">
                Serez-vous parmi nous ?
              </h3>
              <p className="text-xs sm:text-sm text-[#5A5040] font-serif italic max-w-md mx-auto">
                Afin de nous aider à organiser au mieux notre réception au Manoir d'Auffay, merci de confirmer votre présence.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handlePageChange('rsvp')}
                  className="font-serif italic text-base sm:text-lg text-[#13263B] hover:text-[#C4A475] underline decoration-[#C4A475] underline-offset-4 cursor-pointer transition-colors"
                >
                  Confirmer votre présence &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#FFFEF5] border-t border-[#3B6FA0]/15 py-10 px-6 text-center text-[#1A3A5C] font-serif space-y-4">
        <div className="flex items-center justify-center gap-2">
          <WeddingLogo size="sm" className="w-8 h-8" themeColor="gold" />
          <span className="font-display font-semibold tracking-widest text-sm">
            VALENTINE &amp; JEAN
          </span>
        </div>
        
        <p className="text-xs text-[#3B6FA0] italic">
          17 Avril 2027 • Torcy-Le-Grand &amp; Manoir d'Auffay, Oherville (Normandie)
        </p>

        <div className="pt-2 text-[10px] text-slate-400 font-sans uppercase tracking-widest flex items-center justify-center gap-4">
          <span>Créé avec amour</span>
          <span>•</span>
          <span>Tous droits réservés © 2027</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => handlePageChange('admin')}
            className="hover:text-[#13263B] transition-colors cursor-pointer"
            title="Espace Mariés"
          >
            Admin
          </button>
        </div>
      </footer>
    </div>
  );
}
