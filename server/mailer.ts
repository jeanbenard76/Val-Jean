/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import path from "path";

export interface RSVPMailPayload {
  familyName: string;
  email: string;
  message?: string;
  members: Array<{
    firstName: string;
    lastName: string;
    isChild?: boolean;
    isAttending: boolean;
    events?: {
      vinHonneur?: boolean;
      repasNoces?: boolean;
      brunchLendemain?: boolean;
    };
    dietaryNotes?: string;
  }>;
}

export interface ContactMailPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Couple's inboxes (Infomaniak, "+" sub-addresses of valentinetjean@etik.com)
const COUPLE_RSVP_ADDRESS = "valentinetjean+rsvp@etik.com";
const COUPLE_CONTACT_ADDRESS = "valentinetjean+contactmariage@etik.com";

// Same values as the <select> of the contact form (src/components/Contact.tsx)
const CONTACT_SUBJECT_LABELS: Record<string, string> = {
  question: "Question sur l'organisation",
  lodging: "Question hébergement",
  surprise: "Préparation d'une surprise",
  "sweet-word": "Un mot doux pour les mariés",
};

/**
 * Escape user-provided strings before injecting them into the HTML email body.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- SMTP Infomaniak transport ---
// EMAIL_ADDRESS / EMAIL_PASSWORD: Infomaniak address + app password (Coolify env vars).
// Without them, emails are skipped (logged only) and everything else keeps working.
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.EMAIL_ADDRESS || !process.env.EMAIL_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.infomaniak.com",
      port: 587,
      secure: false, // STARTTLS
      requireTLS: true,
      auth: { user: process.env.EMAIL_ADDRESS, pass: process.env.EMAIL_PASSWORD },
    });
  }
  return transporter;
}

async function sendMail(mail: { to: string; subject: string; html: string; replyTo?: string; attachments?: any[] }) {
  const smtp = getTransporter();
  if (!smtp) {
    console.log(`[Mail] EMAIL_ADDRESS / EMAIL_PASSWORD absents : email non envoyé à ${mail.to} (« ${mail.subject} »)`);
    return;
  }
  await smtp.sendMail({
    from: { name: "Mariage Valentine & Jean", address: process.env.EMAIL_ADDRESS! },
    ...mail,
  });
  console.log(`[Mail] ✅ Email envoyé à ${mail.to} (« ${mail.subject} »)`);
}

/**
 * Send all emails in parallel; one failure (e.g. a mistyped guest address)
 * must not prevent the others from being sent.
 */
async function sendAll(mails: Parameters<typeof sendMail>[0][]) {
  const results = await Promise.allSettled(mails.map(sendMail));
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[Mail] ❌ Échec de l'envoi à ${mails[i].to}:`, r.reason?.message || r.reason);
    }
  });
}

function layout(title: string, content: string) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #faf7f2;">
      <h2 style="color: #13263B; margin-top: 0; border-bottom: 2px solid #C4A475; padding-bottom: 8px;">
        ${title}
      </h2>
      ${content}
    </div>
  `;
}

function getImagePath() {
  const distPath = path.join(process.cwd(), "dist", "toile_de_jouy_mail.jpg");
  if (fs.existsSync(distPath)) return distPath;
  return path.join(process.cwd(), "public", "toile_de_jouy_mail.jpg");
}

const defaultAttachments = [
  {
    filename: "toile_de_jouy.jpg",
    path: getImagePath(),
    cid: "toileDeJouy",
  }
];

function eventsOf(m: RSVPMailPayload["members"][number]) {
  const events = [];
  if (m.events?.vinHonneur) events.push("Vin d'Honneur");
  if (m.events?.repasNoces) events.push("Repas de Noces");
  if (m.events?.brunchLendemain) events.push("Brunch");
  return events.length > 0 ? events.join(", ") : "Aucun";
}

/**
 * RSVP: notification to the couple + confirmation to the guest.
 */
export async function sendRSVPNotificationEmail(data: RSVPMailPayload) {
  const attendingCount = data.members.filter((m) => m.isAttending).length;
  const totalCount = data.members.length;

  const membersHtml = data.members
    .map((m) => {
      const status = m.isAttending ? "✅ PRÉSENT(E)" : "❌ ABSENT(E)";
      const type = m.isChild ? "Enfant" : "Adulte";
      const dietaryText = m.dietaryNotes ? `<b>Régime :</b> ${esc(m.dietaryNotes)}` : "-";

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; font-weight: bold; color: #13263B;">${esc(m.firstName)} ${esc(m.lastName)} (${type})</td>
          <td style="padding: 10px; font-weight: bold; color: ${m.isAttending ? '#2e7d32' : '#c62828'};">${status}</td>
          <td style="padding: 10px; color: #555;">${m.isAttending ? eventsOf(m) : '-'}</td>
          <td style="padding: 10px; color: #555;">${dietaryText}</td>
        </tr>
      `;
    })
    .join("");

  const coupleHtml = layout("💍 Nouvelle Confirmation RSVP", `
      <p style="font-size: 15px; color: #333;">
        La <strong>Famille ${esc(data.familyName)}</strong> vient de soumettre sa réponse sur le site !
      </p>

      <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0dcd5;">
        <p style="margin: 4px 0;"><strong>Famille :</strong> Famille ${esc(data.familyName)}</p>
        <p style="margin: 4px 0;"><strong>Email de contact :</strong> <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>
        <p style="margin: 4px 0;"><strong>Bilan :</strong> ${attendingCount} présent(s) sur ${totalCount} invité(s)</p>
        ${data.message ? `<p style="margin: 12px 0 4px 0; padding-top: 8px; border-top: 1px solid #eee;"><strong>Message des invités :</strong><br><em style="color: #3B6FA0;">« ${esc(data.message)} »</em></p>` : ''}
      </div>

      <h3 style="color: #13263B; font-size: 16px; margin-top: 20px;">Détails des invités :</h3>
      <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; font-size: 13px;">
        <thead>
          <tr style="background-color: #13263B; color: #ffffff; text-align: left;">
            <th style="padding: 10px;">Membre</th>
            <th style="padding: 10px;">Présence</th>
            <th style="padding: 10px;">Événements</th>
            <th style="padding: 10px;">Allergies / Régime</th>
          </tr>
        </thead>
        <tbody>
          ${membersHtml}
        </tbody>
      </table>
  `);

  const guestRecap = data.members
    .map((m) => {
      const presence = m.isAttending ? `Sera parmi nous (${eventsOf(m)})` : "Ne pourra malheureusement pas se joindre à nous";
      return `<div style="margin-bottom: 12px; font-size: 15px;">
        <span style="font-weight: 500; color: #1c2833;">${esc(m.firstName)} ${esc(m.lastName)}</span><br>
        <span style="color: #6c7a89; font-size: 14px; font-style: italic;">${presence}</span>
      </div>`;
    })
    .join("");

  const guestHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 40px 20px; color: #1c2833; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="cid:toileDeJouy" alt="Valentine & Jean" style="max-width: 100%; height: auto; border-radius: 4px;" />
      </div>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 24px; line-height: 1.8;">
        Chère famille ${esc(data.familyName)},
      </p>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 24px; line-height: 1.8;">
        C’est avec une immense joie que nous avons pris connaissance de votre réponse. Nous vous remercions chaleureusement pour votre retour !
      </p>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 16px; line-height: 1.8;">
        À titre de confirmation, voici ce que nous avons noté :
      </p>
      
      <div style="margin: 0 0 32px 16px; border-left: 1px solid #e2e8f0; padding-left: 20px;">
        ${guestRecap}
      </div>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 40px; line-height: 1.8;">
        Si le moindre imprévu venait modifier ces informations, n’hésitez pas à nous en faire part en répondant simplement à ce courriel.
      </p>
      
      <p style="font-size: 15px; font-weight: 300; line-height: 1.8;">
        Dans l’attente de célébrer ce moment précieux à vos côtés,<br><br>
        Très affectueusement,<br><br>
        <span style="font-size: 17px; font-weight: 400; letter-spacing: 0.5px; color: #13263B;">Valentine & Jean</span>
      </p>
    </div>
  `;

  await sendAll([
    {
      to: COUPLE_RSVP_ADDRESS,
      replyTo: data.email,
      subject: `💍 Nouvelle réponse RSVP : Famille ${data.familyName}`,
      html: coupleHtml,
    },
    {
      to: data.email,
      replyTo: COUPLE_RSVP_ADDRESS,
      subject: "[RSVP Mariage de Valentine & Jean] Merci pour votre réponse.",
      html: guestHtml,
      attachments: defaultAttachments,
    },
  ]);
}

/**
 * Contact form: notification to the couple + acknowledgement to the sender.
 */
export async function sendContactNotificationEmail(data: ContactMailPayload) {
  const subjectLabel = CONTACT_SUBJECT_LABELS[data.subject] || data.subject || "Message";

  const coupleHtml = layout("💌 Nouveau Message", `
      <p style="font-size: 15px; color: #333;">
        Vous avez reçu un nouveau message depuis le formulaire de contact du site.
      </p>
      <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0dcd5;">
        <p style="margin: 4px 0;"><strong>Nom :</strong> ${esc(data.name)}</p>
        <p style="margin: 4px 0;"><strong>Email :</strong> <a href="mailto:${esc(data.email)}">${esc(data.email)}</a></p>
        <p style="margin: 4px 0;"><strong>Sujet :</strong> ${esc(subjectLabel)}</p>
        <p style="margin: 12px 0 4px 0; padding-top: 8px; border-top: 1px solid #eee; white-space: pre-line;"><strong>Message :</strong><br><em style="color: #3B6FA0;">« ${esc(data.message)} »</em></p>
      </div>
      <p style="font-size: 12px; color: #888;">Répondez directement à cet email pour écrire à ${esc(data.name)}.</p>
  `);

  const guestHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 40px 20px; color: #1c2833; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 40px;">
        <img src="cid:toileDeJouy" alt="Valentine & Jean" style="max-width: 100%; height: auto; border-radius: 4px;" />
      </div>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 24px; line-height: 1.8;">
        Bonjour ${esc(data.name)},
      </p>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 32px; line-height: 1.8;">
        Nous avons bien reçu votre message. Un grand merci de nous avoir écrit ! Nous en prenons soin et vous répondrons dans les plus brefs délais.
      </p>
      
      <p style="font-size: 14px; font-weight: 300; margin-bottom: 16px; line-height: 1.8; color: #6c7a89;">
        Pour rappel, voici la teneur de votre message :
      </p>
      
      <div style="margin: 0 0 40px 16px; border-left: 1px solid #e2e8f0; padding-left: 20px; font-style: italic; color: #4a5568; line-height: 1.8; white-space: pre-line; font-size: 15px;">
        ${esc(data.message)}
      </div>
      
      <p style="font-size: 15px; font-weight: 300; line-height: 1.8;">
        À très bientôt,<br><br>
        Très affectueusement,<br><br>
        <span style="font-size: 17px; font-weight: 400; letter-spacing: 0.5px; color: #13263B;">Valentine & Jean</span>
      </p>
    </div>
  `;

  await sendAll([
    {
      to: COUPLE_CONTACT_ADDRESS,
      replyTo: data.email,
      subject: `[${subjectLabel}] Message de contact de ${data.name}`,
      html: coupleHtml,
    },
    {
      to: data.email,
      replyTo: COUPLE_CONTACT_ADDRESS,
      subject: "[Mariage Valentine & Jean] Accusé réception de votre message",
      html: guestHtml,
      attachments: defaultAttachments,
    },
  ]);
}
