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
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('wedding_contact_messages');
    if (saved) {
      try {
        setMessagesCount(JSON.parse(saved).length);
      } catch (e) {}
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    const newMessage: ContactMessage = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      subject,
      message,
      date: new Date().toLocaleDateString('fr-FR'),
    };

    const saved = localStorage.getItem('wedding_contact_messages') || '[]';
    try {
      const parsed = JSON.parse(saved);
      parsed.push(newMessage);
      localStorage.setItem('wedding_contact_messages', JSON.stringify(parsed));
      setMessagesCount(parsed.length);
    } catch (err) {}

    setSuccess(true);
    setName('');
    setEmail('');
    setMessage('');

    setTimeout(() => {
      setSuccess(false);
    }, 5000);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Direct Phone Contacts */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#FFFEF5] border border-[#3B6FA0]/15 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h4 className="font-display text-2xl text-[#1A3A5C] font-semibold mb-6 border-b border-[#3B6FA0]/10 pb-3">
              L'Équipe du Jour J
            </h4>

            <div className="space-y-6">
              {/* Valentine */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FAE28A]/20 border border-[#F5C842]/40 flex items-center justify-center text-[#1A3A5C] flex-shrink-0">
                  <span className="font-serif italic text-sm font-semibold">V</span>
                </div>
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Valentine <span className="text-xs text-[#5A5040]/70 font-serif italic">(La Mariée)</span>
                  </h5>
                  <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">Pour les questions de déroulement, robe, RSVP</p>
                  <a href="tel:+33612345678" className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 12 34 56 78</span>
                  </a>
                </div>
              </div>

              {/* Jean */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FAE28A]/20 border border-[#F5C842]/40 flex items-center justify-center text-[#1A3A5C] flex-shrink-0">
                  <span className="font-serif italic text-sm font-semibold">J</span>
                </div>
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Jean <span className="text-xs text-[#5A5040]/70 font-serif italic">(Le Marié)</span>
                  </h5>
                  <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">Pour le cortège automobile, logistique, liste</p>
                  <a href="tel:+33687654321" className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 87 65 43 21</span>
                  </a>
                </div>
              </div>

              {/* Witnesses Title */}
              <div className="h-px bg-[#3B6FA0]/10 my-4" />

              {/* Arthur (Témoin) */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#3B6FA0]/10 border border-[#3B6FA0]/20 flex items-center justify-center text-[#1A3A5C] flex-shrink-0">
                  <span className="font-serif italic text-sm font-semibold">A</span>
                </div>
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Arthur <span className="text-xs text-[#5A5040]/70 font-serif italic">(Témoin Général)</span>
                  </h5>
                  <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">Pour organiser des surprises, discours, animations</p>
                  <a href="tel:+33611223344" className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 11 22 33 44</span>
                  </a>
                </div>
              </div>

              {/* Claire (Témoin) */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#3B6FA0]/10 border border-[#3B6FA0]/20 flex items-center justify-center text-[#1A3A5C] flex-shrink-0">
                  <span className="font-serif italic text-sm font-semibold">C</span>
                </div>
                <div>
                  <h5 className="font-display font-semibold text-base text-[#1A3A5C]">
                    Claire <span className="text-xs text-[#5A5040]/70 font-serif italic">(Témoin Valentine)</span>
                  </h5>
                  <p className="text-xs text-[#5A5040] font-serif italic mt-0.5">Pour l'enterrement de vie de jeune fille (EVJF)</p>
                  <a href="tel:+33699887766" className="inline-flex items-center gap-1.5 mt-2 text-xs font-mono font-semibold text-[#3B6FA0] hover:text-[#1A3A5C] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    <span>+33 6 99 88 77 66</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Dynamic Contact/Message Form */}
        <div className="lg:col-span-7">
          <div className="bg-[#FFFEF5] border border-[#3B6FA0]/15 rounded-2xl p-6 sm:p-8 shadow-sm">
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
