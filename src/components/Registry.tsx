/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Check, ExternalLink, ArrowRight, Copy, Sparkles, Compass, Utensils, Home } from 'lucide-react';
import { RegistryItem } from '../types';

import defaultGiftsData from '../data/registry_gifts.json';

const CATEGORIES = [
  { id: 'all', label: 'Tous les cadeaux', icon: Sparkles },
  { id: 'honeymoon', label: 'Lune de Miel', icon: Compass },
  { id: 'tableware', label: 'Art de la Table', icon: Utensils },
  { id: 'home', label: 'Maison & Jardin', icon: Home },
];

export default function Registry() {
  const [items, setItems] = useState<RegistryItem[]>(defaultGiftsData as RegistryItem[]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<RegistryItem | null>(null);
  const [copiedIBAN, setCopiedIBAN] = useState(false);

  const realRegistryUrl = (import.meta as any).env?.VITE_REAL_REGISTRY_URL || "https://liste.zankyou.com/fr/valentine-et-jean-2027";

  // Fetch updated registry JSON data (e.g. populated every 5 min by Millemercis script)
  useEffect(() => {
    fetch('/api/registry')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Fallback to local JSON');
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      })
      .catch(() => {
        // Keep defaultGiftsData
      });
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  const handleCopyIBAN = () => {
    navigator.clipboard.writeText("FR76 3000 4000 0012 3456 7890 123");
    setCopiedIBAN(true);
    setTimeout(() => setCopiedIBAN(false), 2500);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'honeymoon': return 'Lune de Miel';
      case 'tableware': return 'Art de la Table';
      case 'home': return 'Maison & Jardin';
      default: return 'Cadeau';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8" id="wedding-registry-section">
      
      {/* Editorial Header */}
      <div className="text-center mb-6 sm:mb-8">
        <span className="font-serif italic text-xs sm:text-sm text-[#C4A475] tracking-wider uppercase block mb-4">Participer à Notre Bonheur</span>
        <h3 className="font-script text-[clamp(3rem,6vw,5rem)] text-[#13263B] leading-tight pt-2">
          La Liste de Mariage
        </h3>
        <div className="w-12 sm:w-16 h-[1px] bg-[#C4A475] mx-auto my-3 sm:my-4" />
        <p className="font-serif italic text-[#3B6FA0] text-xs sm:text-base mt-2 max-w-2xl mx-auto leading-relaxed px-2">
          Votre présence à nos côtés lors de cette journée est notre plus beau présent. Si vous désirez néanmoins nous accompagner dans l’accomplissement de nos projets de vie futurs, vous trouverez ci-dessous notre carnet d’intentions, façonné à notre image.
        </p>
      </div>

      {/* ELEGANT CATEGORY FILTER PILLS */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-8 sm:mb-10 max-w-3xl mx-auto">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = cat.id === 'all' ? items.length : items.filter((item) => item.category === cat.id).length;

          if (count === 0 && cat.id !== 'all') return null;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold font-sans transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-[#13263B] text-white border-[#13263B] shadow-xs scale-105'
                  : 'bg-white/80 hover:bg-[#FAF7F2] text-[#13263B] border-[#3B6FA0]/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C4A475]' : 'text-[#3B6FA0]'}`} />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isActive ? 'bg-[#C4A475] text-[#13263B]' : 'bg-[#FAF7F2] text-[#5A5040]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Translucent White Gift Cards (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const percentage = item.currentAmount ? Math.round((item.currentAmount / item.targetAmount) * 100) : 0;

            return (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white/75 backdrop-blur-md border-0 rounded-2xl p-4 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                id={`registry-item-block-${item.id}`}
              >
                <div>
                  {/* 1. PHOTO OF GIFT */}
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-[#FAF7F2] shadow-2xs relative group mb-4">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 bg-[#13263B]/90 backdrop-blur-xs text-[#FAF7F2] text-[10px] font-serif italic px-2.5 py-0.5 rounded-full shadow-2xs">
                      {getCategoryLabel(item.category)}
                    </div>
                  </div>

                  {/* 2. GIFT CONTENT */}
                  <div>
                    {/* Title */}
                    <h4 className="font-display text-xl sm:text-2xl text-[#13263B] font-semibold tracking-wide mb-1">
                      {item.title}
                    </h4>

                    {/* Description (Smaller) */}
                    <p className="text-[11px] sm:text-xs text-[#5A5040] leading-relaxed mb-3 font-sans opacity-90">
                      {item.description}
                    </p>

                    {/* GOLD PRICE & FINANCING GAUGE */}
                    <div className="my-3">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-serif italic text-[#3B6FA0]">Valeur du cadeau :</span>
                        <span className="font-display text-xl font-bold text-[#C4A475] tracking-wide">
                          {item.targetAmount.toLocaleString('fr-FR')} €
                        </span>
                      </div>

                      {/* Funding Gauge */}
                      <div className="w-full bg-[#3B6FA0]/10 rounded-full h-2 overflow-hidden border border-[#3B6FA0]/15">
                        <div
                          className="bg-gradient-to-r from-[#C4A475] to-[#AE8E5C] h-full rounded-full transition-all duration-1000 shadow-xs"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#5A5040] mt-1 font-sans">
                        <span>Financé à <strong>{percentage}%</strong></span>
                        <span>{item.currentAmount?.toLocaleString('fr-FR') || 0} € récoltés</span>
                      </div>
                    </div>

                    {/* Newlyweds note (Larger & Gold/Yellow) */}
                    {item.personalNote && (
                      <div className="pt-2.5 my-2 border-t border-[#3B6FA0]/10">
                        <p className="text-sm sm:text-base font-serif italic font-medium text-[#C4A475] leading-relaxed">
                          « {item.personalNote} »
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contribute Action Trigger */}
                <div className="pt-3 border-t border-[#3B6FA0]/10 mt-2 flex justify-start">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#13263B] hover:bg-[#C4A475] text-white hover:text-[#13263B] text-xs font-semibold rounded-full transition-all duration-300 cursor-pointer shadow-2xs flex items-center justify-center gap-2 group"
                  >
                    <span>Participer</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* SECURE PAYMENT MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-[#13263B]/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto" id="payment-redirect-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-left my-auto max-h-[92vh] flex flex-col"
            >
              <div className="h-1.5 bg-gradient-to-r from-[#13263B] via-[#C4A475] to-[#13263B] shrink-0" />
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#3B6FA0]/10 flex items-center justify-center text-[#13263B] transition-colors border border-[#3B6FA0]/15 text-xs font-bold cursor-pointer z-10"
              >
                ✕
              </button>

              <div className="p-5 sm:p-8 overflow-y-auto">
                <span className="block text-[10px] tracking-widest uppercase font-serif font-bold text-[#C4A475] mb-1">
                  Redirection Sécurisée
                </span>
                <h4 className="font-display text-xl sm:text-2xl text-[#13263B] font-semibold mb-2">
                  Contribuer Réellement
                </h4>
                <p className="text-xs sm:text-sm text-[#5A5040] font-serif italic mb-5">
                  Vous vous apprêtez à participer au cadeau : <br />
                  <strong className="text-[#13263B] font-sans font-semibold not-italic">« {selectedItem.title} »</strong>
                </p>

                <div className="space-y-4 sm:space-y-6">
                  {/* Option 1: Real Wedding Registry Link */}
                  <div className="p-4 sm:p-5 bg-[#FAF7F2] rounded-xl text-left">
                    <h5 className="font-display font-semibold text-xs sm:text-sm text-[#13263B] mb-1 flex items-center gap-1.5">
                      <span>Option A : Notre cagnotte en ligne</span>
                    </h5>
                    <p className="text-xs text-[#5A5040] font-serif italic mb-3.5 leading-relaxed">
                      Participez par carte bancaire de façon entièrement sécurisée et sans frais sur notre vraie liste de mariage Zankyou.
                    </p>

                    <a
                      href={realRegistryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#13263B] hover:bg-[#1C3854] text-white text-xs uppercase font-semibold rounded-lg flex items-center justify-center gap-2 shadow-2xs transition-colors"
                    >
                      <span>Accéder au paiement CB sécurisé</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#C4A475]" />
                    </a>
                  </div>

                  {/* Option 2: Bank Transfer (IBAN) */}
                  <div className="p-4 sm:p-5 bg-[#FAF7F2] rounded-xl text-left border border-slate-200">
                    <h5 className="font-display font-semibold text-xs sm:text-sm text-[#13263B] mb-1">
                      Option B : Virement bancaire direct (IBAN)
                    </h5>
                    <p className="text-xs text-[#5A5040] font-serif italic mb-3 leading-relaxed">
                      Vous préférez effectuer un virement bancaire directement sur le compte des mariés ?
                    </p>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">IBAN Valentine &amp; Jean</span>
                        <code className="text-xs font-mono font-bold text-[#13263B] truncate block">
                          FR76 3000 4000 0012 3456 7890 123
                        </code>
                      </div>
                      <button
                        onClick={handleCopyIBAN}
                        className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-slate-200 text-[#13263B] rounded text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedIBAN ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#3B6FA0]" />}
                        <span>{copiedIBAN ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-xs text-[#5A5040] hover:text-[#13263B] underline font-serif italic cursor-pointer"
                  >
                    Fermer et revenir à la liste
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
