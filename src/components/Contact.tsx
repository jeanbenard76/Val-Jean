/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Phone, Mail, Send, Check, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('question');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: name,
          email: email,
          sujet: subject,
          message: message,
          website: honeypot
        })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.status === 'success') {
        setSuccess(true);
        setName('');
        setEmail('');
        setMessage('');
        setHoneypot('');
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setErrorMessage(data?.message || "Une erreur s'est produite. Veuillez réessayer.");
      }
    } catch (error) {
      setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-8" id="contact-page-section">
      {/* Editorial Header */}
      <div className="text-center mb-6 sm:mb-8">
        <span className="font-serif italic text-xs sm:text-sm text-[#C4A475] tracking-wider uppercase block mb-4">Une Question, une Surprise ?</span>
        <h3 className="font-script text-[clamp(3rem,6vw,5rem)] text-[#13263B] leading-tight pt-2">
          Nous Contacter
        </h3>
        <div className="w-16 h-[1px] bg-[#F5C842] mx-auto my-3" />
        <p className="font-serif italic text-[#3B6FA0] text-xs sm:text-base mt-2 max-w-2xl mx-auto leading-relaxed">
          Que ce soit pour coordonner une surprise avec nos témoins, nous poser une question pratique sur votre trajet, ou simplement nous transmettre un message de tendresse, nous sommes à votre entière écoute.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
        
        {/* Left Column: Direct Phone Contacts */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-[#FFFEF5] border border-[#3B6FA0]/15 rounded-2xl p-6 sm:p-8 shadow-sm flex-1">
            <h4 className="font-display text-2xl text-[#1A3A5C] font-semibold mb-6 border-b border-[#3B6FA0]/10 pb-3">
              Vos Contacts
            </h4>

            <div className="space-y-6">
              {/* Valentine */}
              <div className="flex items-start gap-4">
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Valentine Chem-Lenhof <span className="text-xs text-[#5A5040]/70 font-serif italic">(La Mariée)</span>
                  </h5>
                  <a href="tel:+33612345678" className="inline-flex items-center gap-1.5 mt-1 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 12 34 56 78</span>
                  </a>
                </div>
              </div>

              {/* Jean */}
              <div className="flex items-start gap-4">
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Jean Benard <span className="text-xs text-[#5A5040]/70 font-serif italic">(Le Marié)</span>
                  </h5>
                  <a href="tel:+33687654321" className="inline-flex items-center gap-1.5 mt-1 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 87 65 43 21</span>
                  </a>
                </div>
              </div>

              {/* Divider */}
              <div className="w-24 h-[1px] bg-[#3B6FA0]/10 mx-auto" />

              {/* Juliette */}
              <div className="flex items-start gap-4">
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Juliette Chem-Lenhof <span className="text-xs text-[#5A5040]/70 font-serif italic">(Témoin de Valentine)</span>
                  </h5>
                  <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">Pour organiser des surprises, discours et animations</p>
                  <a href="tel:+33611223344" className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 11 22 33 44</span>
                  </a>
                </div>
              </div>

              {/* Eloïse */}
              <div className="flex items-start gap-4">
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Eloïse Benard <span className="text-xs text-[#5A5040]/70 font-serif italic">(Témoin de Jean)</span>
                  </h5>
                  <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">Pour les questions logistiques</p>
                  <a href="tel:+33642751588" className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 42 75 15 88</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Contact/Message Form */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-[#FFFEF5] border border-[#3B6FA0]/15 rounded-2xl p-6 sm:p-8 shadow-sm flex-1">
            <h4 className="font-display text-2xl text-[#1A3A5C] font-semibold mb-2">
              Écrire aux Mariés
            </h4>
            <p className="font-serif italic text-xs text-[#5A5040] mb-6">
              Laissez-nous un message directement depuis ce formulaire. Nous vous répondrons par e-mail au plus vite.
            </p>

            {/* Success message banner */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-[#FFFEF5] border border-[#F5C842] rounded-xl text-left flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FAE28A]/30 flex items-center justify-center text-[#1A3A5C] border border-[#F5C842]/40 flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-display font-semibold text-sm text-[#1A3A5C]">Message bien envoyé !</h5>
                    <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">
                      Merci pour vos mots délicats. Valentine et Jean ont bien reçu votre message et trépignent d'impatience de vous lire.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
                {errorMessage && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">
                    {errorMessage}
                  </div>
                )}
                {/* Honeypot field (hidden from real users) */}
                <input 
                  type="text" 
                  name="website" 
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden" 
                  tabIndex={-1} 
                  autoComplete="off" 
                />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-serif uppercase tracking-wider text-[#1A3A5C] font-semibold mb-1.5">
                    Votre Nom
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Marine de Courcy"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#3B6FA0]/30 bg-white text-sm text-[#1A3A5C] focus:outline-none focus:border-[#F5C842] transition-colors font-sans"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-serif uppercase tracking-wider text-[#1A3A5C] font-semibold mb-1.5">
                    Votre Adresse E-mail
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex. marine@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#3B6FA0]/30 bg-white text-sm text-[#1A3A5C] focus:outline-none focus:border-[#F5C842] transition-colors font-sans"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-serif uppercase tracking-wider text-[#1A3A5C] font-semibold mb-1.5">
                  Sujet de votre message
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#3B6FA0]/30 bg-white text-sm text-[#1A3A5C] focus:outline-none focus:border-[#F5C842] transition-colors font-serif"
                >
                  <option value="question">Question sur l'organisation</option>
                  <option value="lodging">Question hébergement</option>
                  <option value="surprise">Préparation d'une surprise (witnesses only)</option>
                  <option value="sweet-word">Un mot doux pour les mariés</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-serif uppercase tracking-wider text-[#1A3A5C] font-semibold mb-1.5">
                  Votre Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#3B6FA0]/30 bg-white text-sm text-[#1A3A5C] focus:outline-none focus:border-[#F5C842] transition-colors font-sans leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1A3A5C] hover:bg-[#1A3A5C]/90 text-white font-serif tracking-widest text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <Send className="w-4 h-4 text-[#F5C842]" />
                <span>Envoyer mon message</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
