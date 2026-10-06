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
    invitedTo?: {
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

// Templates pour les emails envoyés aux mariés (fonctionnels et lisibles)
function coupleLayout(title: string, content: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="background-color: #1e293b; padding: 16px 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 500;">
            ${title}
          </h2>
        </div>
        <div style="padding: 24px;">
          ${content}
        </div>
      </div>
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
      const statusBadge = m.isAttending 
        ? `<span style="display: inline-block; padding: 4px 8px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-size: 12px; font-weight: bold;">✅ PRÉSENT(E)</span>` 
        : `<span style="display: inline-block; padding: 4px 8px; background-color: #fee2e2; color: #991b1b; border-radius: 4px; font-size: 12px; font-weight: bold;">❌ ABSENT(E)</span>`;
      
      const type = m.isChild ? `<span style="color: #64748b; font-size: 12px;">(Enfant)</span>` : `<span style="color: #64748b; font-size: 12px;">(Adulte)</span>`;
      const dietaryText = m.dietaryNotes ? `<span style="color: #b91c1c; font-weight: 500;">⚠️ ${esc(m.dietaryNotes)}</span>` : "-";

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 8px; color: #0f172a; font-weight: 500;">${esc(m.firstName)} ${esc(m.lastName)} ${type}</td>
          <td style="padding: 12px 8px;">${statusBadge}</td>
          <td style="padding: 12px 8px; color: #334155; font-size: 14px;">${m.isAttending ? eventsOf(m) : '-'}</td>
          <td style="padding: 12px 8px; font-size: 14px;">${dietaryText}</td>
        </tr>
      `;
    })
    .join("");

  const guestRecap = data.members
    .map((m) => {
      let presenceHtml = "";
      
      if (!m.isAttending) {
        presenceHtml = `<span style="font-weight: 500; color: #64748B;">Ne sera malheureusement pas des nôtres</span>`;
      } else {
        const attendingEvents: string[] = [];
        const declinedEvents: string[] = [];
        
        const invitedVin = m.invitedTo?.vinHonneur !== false;
        if (invitedVin) {
          if (m.events?.vinHonneur) attendingEvents.push("Vin d'Honneur");
          else declinedEvents.push("Vin d'Honneur");
        }
        
        const invitedRepas = m.invitedTo?.repasNoces !== false;
        if (invitedRepas) {
          if (m.events?.repasNoces) attendingEvents.push("Repas de Noces");
          else declinedEvents.push("Repas de Noces");
        }
        
        const invitedBrunch = m.invitedTo?.brunchLendemain !== false;
        if (invitedBrunch) {
          if (m.events?.brunchLendemain) attendingEvents.push("Brunch");
          else declinedEvents.push("Brunch");
        }
        
        const formatAttending = (evs: string[]) => {
          if (evs.length === 1) return `au ${evs[0]}`;
          if (evs.length === 2) return `au ${evs[0]} et au ${evs[1]}`;
          return `au ${evs[0]}, au ${evs[1]} et au ${evs[2]}`;
        };
        
        const formatDeclined = (evs: string[]) => {
          if (evs.length === 1) return `au ${evs[0]}`;
          if (evs.length === 2) return `au ${evs[0]} ni au ${evs[1]}`;
          return `au ${evs[0]}, au ${evs[1]} ni au ${evs[2]}`;
        };
        
        if (attendingEvents.length > 0) {
          presenceHtml += `<span style="font-weight: 500; color: #13263B;">Sera présent(e)</span> ${formatAttending(attendingEvents)}`;
        }
        
        if (declinedEvents.length > 0) {
          if (presenceHtml !== "") presenceHtml += "<br>";
          presenceHtml += `<span style="font-weight: 500; color: #64748B;">Ne sera pas présent(e)</span> ${formatDeclined(declinedEvents)}`;
        }
        
        if (presenceHtml === "") presenceHtml = `<span style="font-weight: 500; color: #13263B;">Sera présent(e)</span>`;
      }

      return `<div style="margin-bottom: 16px; font-size: 15px;">
        <span style="font-weight: 500; color: #1c2833;">${esc(m.firstName)} ${esc(m.lastName)}</span><br>
        <span style="color: #6c7a89; font-size: 14px; font-style: italic; line-height: 1.5; display: inline-block; margin-top: 2px;">${presenceHtml}</span>
      </div>`;
    })
    .join("");

  const anyAttending = data.members.some(m => m.isAttending);
  const introText = anyAttending
    ? "C’est avec une grande joie que nous avons pris connaissance de votre réponse. Nous vous remercions pour votre retour !"
    : "Nous avons bien pris note de votre réponse. Nous regrettons de ne pas pouvoir vous compter parmi nous, mais nous vous remercions sincèrement d'avoir pris le temps de nous répondre.";

  const coupleHeaderHtml = `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; min-width: 200px; background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Contact</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 500;"><a href="mailto:${esc(data.email)}" style="color: #2563eb; text-decoration: none;">${esc(data.email)}</a></p>
        </div>
        <div style="flex: 1; min-width: 150px; background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Bilan</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 500;">${attendingCount} présent(s) sur ${totalCount}</p>
        </div>
      </div>

      ${data.message ? `
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #1e3a8a; text-transform: uppercase; font-weight: bold;">Message joint</p>
          <p style="margin: 0; font-size: 15px; color: #1e3a8a; font-style: italic; white-space: pre-line;">« ${esc(data.message)} »</p>
        </div>
      ` : ''}
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
  `;

  const guestBodyHtml = `
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 24px; line-height: 1.8;">
        Bonjour,
      </p>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 24px; line-height: 1.8;">
        ${introText}
      </p>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 16px; line-height: 1.8;">
        À titre de confirmation, voici ce que nous avons noté :
      </p>
      
      <div style="margin: 0 0 32px 16px; border-left: 1px solid #e2e8f0; padding-left: 20px;">
        ${guestRecap}
      </div>
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 40px; line-height: 1.8;">
        Si le moindre imprévu venait modifier ces informations, n’hésitez pas à nous en faire part sur le site internet ou en répondant simplement à ce courriel.
      </p>
      
      <p style="font-size: 15px; font-weight: 300; line-height: 1.8;">
        Dans l’attente de célébrer ce moment précieux à vos côtés,<br><br>
        <span style="font-size: 17px; font-weight: 400; letter-spacing: 0.5px; color: #13263B;">Valentine & Jean</span>
      </p>
  `;

  const guestHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 40px 20px; color: #1c2833; background-color: #ffffff;">
      ${guestBodyHtml}
    </div>
  `;

  const coupleHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 40px 20px; color: #1c2833; background-color: #ffffff;">
      ${coupleHeaderHtml}
      ${guestBodyHtml}
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
    },
  ]);
}

/**
 * Contact form: notification to the couple + acknowledgement to the sender.
 */
export async function sendContactNotificationEmail(data: ContactMailPayload) {
  const subjectLabel = CONTACT_SUBJECT_LABELS[data.subject] || data.subject || "Message";

  const coupleHtml = coupleLayout(`💌 Message : ${esc(subjectLabel)}`, `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; min-width: 200px; background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">De</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 500;">${esc(data.name)}</p>
        </div>
        <div style="flex: 1; min-width: 200px; background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Email</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 500;"><a href="mailto:${esc(data.email)}" style="color: #2563eb; text-decoration: none;">${esc(data.email)}</a></p>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 15px; color: #1e293b; line-height: 1.6; white-space: pre-line;">${esc(data.message)}</p>
      </div>

      <p style="margin: 0; font-size: 13px; color: #64748b;">
        💡 <em>Astuce : Vous pouvez répondre directement à cet email pour envoyer un message à ${esc(data.name)}.</em>
      </p>
  `);

  const guestHtml = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 40px 20px; color: #1c2833; background-color: #ffffff;">
      
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
    },
  ]);
}
