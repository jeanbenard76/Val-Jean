/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer, { type Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";

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
  rsvp: "Question sur la validation de présence",
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

async function sendMail(mail: {
  from?: { name: string; address: string } | string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: any[];
  icalEvent?: {
    filename?: string;
    method?: string;
    content?: string | Buffer;
  };
}) {
  const smtp = getTransporter();
  if (!smtp) {
    console.log(`[Mail] EMAIL_ADDRESS / EMAIL_PASSWORD absents : email non envoyé à ${mail.to} (« ${mail.subject} »)`);
    return;
  }
  const defaultFrom = { name: "Mariage Valentine & Jean", address: COUPLE_RSVP_ADDRESS };
  await smtp.sendMail({
    from: mail.from || defaultFrom,
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

function getLogoPath() {
  const distPath = path.join(process.cwd(), "dist", "logo.png");
  if (fs.existsSync(distPath)) return distPath;
  return path.join(process.cwd(), "public", "logo.png");
}

const defaultAttachments = [
  {
    filename: "toile_de_jouy.jpg",
    path: getImagePath(),
    cid: "toileDeJouy",
  }
];

const mailAttachmentsWithLogo = [
  {
    filename: "logo.png",
    path: getLogoPath(),
    cid: "weddingLogo",
  }
];

function eventsOf(m: RSVPMailPayload["members"][number]) {
  const events = [];
  if (m.events?.vinHonneur) events.push("Vin d'Honneur");
  if (m.events?.repasNoces) events.push("Repas de Noces");
  if (m.events?.brunchLendemain) events.push("Brunch");
  return events.length > 0 ? events.join(", ") : "Aucun";
}

export interface WeddingCalendarSlot {
  type: "vin_honneur" | "diner" | "brunch";
  title: string;
  summary: string;
  slotText: string;
  dtStartLocal: string;
  dtEndLocal: string;
  startUtc: string;
  endUtc: string;
  startIso: string;
  endIso: string;
  description: string;
  location: string;
  googleUrl: string;
  outlookUrl: string;
}

function buildGoogleCalendarUrl(params: {
  title: string;
  startUtc: string;
  endUtc: string;
  description: string;
  location: string;
}): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const query = [
    `text=${encodeURIComponent(params.title)}`,
    `dates=${params.startUtc}/${params.endUtc}`,
    `details=${encodeURIComponent(params.description)}`,
    `location=${encodeURIComponent(params.location)}`,
  ].join("&");
  return `${base}&${query}`;
}

function buildOutlookCalendarUrl(params: {
  title: string;
  startIso: string;
  endIso: string;
  description: string;
  location: string;
}): string {
  const base = "https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent";
  const query = [
    `subject=${encodeURIComponent(params.title)}`,
    `startdt=${encodeURIComponent(params.startIso + "+02:00")}`,
    `enddt=${encodeURIComponent(params.endIso + "+02:00")}`,
    `body=${encodeURIComponent(params.description)}`,
    `location=${encodeURIComponent(params.location)}`,
  ].join("&");
  return `${base}&${query}`;
}

export function determineCalendarSlot(members: RSVPMailPayload["members"]): WeddingCalendarSlot | null {
  const attending = members.filter((m) => m.isAttending);
  if (attending.length === 0) return null;

  const location = "Église catholique Notre-Dame-de-l'Assomption, 76880 Arques-la-Bataille & Manoir d'Auffay, 76560 Oherville";

  // 1. Créneau Brunch : samedi 14h30 - dimanche 14h30
  // Si au moins un membre présent participe au brunch
  const hasBrunch = attending.some((m) => Boolean(m.events?.brunchLendemain));
  if (hasBrunch) {
    const title = "Mariage Valentine & Jean — Mariage & Brunch";
    const description = [
      "Mariage de Valentine & Jean",
      "",
      "Programme du Samedi 17 Avril 2027 :",
      "• 14h30 : Cérémonie religieuse (Église catholique Notre-Dame-de-l'Assomption, 76880 Arques-la-Bataille)",
      "• 18h00 : Vin d'honneur & cocktail (Manoir d'Auffay, Promenade du Château, 76560 Oherville)",
      "• 20h00 : Dîner de Noces & Soirée dansante",
      "",
      "Dimanche 18 Avril 2027 :",
      "• Brunch du lendemain au Manoir d'Auffay jusqu'à 14h30",
    ].join("\n");

    const startUtc = "20270417T123000Z";
    const endUtc = "20270418T123000Z";
    const startIso = "2027-04-17T14:30:00";
    const endIso = "2027-04-18T14:30:00";

    return {
      type: "brunch",
      title,
      summary: title,
      slotText: "Du samedi 17 avril 2027 à 14h30 au dimanche 18 avril 2027 à 14h30",
      dtStartLocal: "20270417T143000",
      dtEndLocal: "20270418T143000",
      startUtc,
      endUtc,
      startIso,
      endIso,
      description,
      location,
      googleUrl: buildGoogleCalendarUrl({ title, startUtc, endUtc, description, location }),
      outlookUrl: buildOutlookCalendarUrl({ title, startIso, endIso, description, location }),
    };
  }

  // 2. Créneau Dîner : samedi 14h30 - dimanche 03h00
  // Si au moins un membre présent participe au repas de noces
  const hasDinner = attending.some((m) => Boolean(m.events?.repasNoces));
  if (hasDinner) {
    const title = "Mariage Valentine & Jean — Cérémonie, Dîner & Soirée";
    const description = [
      "Mariage de Valentine & Jean",
      "",
      "Programme du Samedi 17 Avril 2027 :",
      "• 14h30 : Cérémonie religieuse (Église catholique Notre-Dame-de-l'Assomption, 76880 Arques-la-Bataille)",
      "• 18h00 : Vin d'honneur & cocktail (Manoir d'Auffay, Promenade du Château, 76560 Oherville)",
      "• 20h00 : Dîner de Noces & Soirée dansante jusqu'au bout de la nuit (03h00)",
    ].join("\n");

    const startUtc = "20270417T123000Z";
    const endUtc = "20270418T010000Z";
    const startIso = "2027-04-17T14:30:00";
    const endIso = "2027-04-18T03:00:00";

    return {
      type: "diner",
      title,
      summary: title,
      slotText: "Samedi 17 avril 2027 de 14h30 au dimanche 18 avril 2027 à 03h00",
      dtStartLocal: "20270417T143000",
      dtEndLocal: "20270418T030000",
      startUtc,
      endUtc,
      startIso,
      endIso,
      description,
      location,
      googleUrl: buildGoogleCalendarUrl({ title, startUtc, endUtc, description, location }),
      outlookUrl: buildOutlookCalendarUrl({ title, startIso, endIso, description, location }),
    };
  }

  // 3. Créneau Vin d'honneur uniquement : samedi 14h30 - 20h00
  const title = "Mariage Valentine & Jean — Cérémonie & Vin d'Honneur";
  const description = [
    "Mariage de Valentine & Jean",
    "",
    "Programme du Samedi 17 Avril 2027 :",
    "• 14h30 : Cérémonie religieuse (Église catholique Notre-Dame-de-l'Assomption, 76880 Arques-la-Bataille)",
    "• 18h00 - 20h00 : Vin d'honneur & cocktail (Manoir d'Auffay, Promenade du Château, 76560 Oherville)",
  ].join("\n");

  const startUtc = "20270417T123000Z";
  const endUtc = "20270417T180000Z";
  const startIso = "2027-04-17T14:30:00";
  const endIso = "2027-04-17T20:00:00";

  return {
    type: "vin_honneur",
    title,
    summary: title,
    slotText: "Samedi 17 avril 2027 de 14h30 à 20h00",
    dtStartLocal: "20270417T143000",
    dtEndLocal: "20270417T200000",
    startUtc,
    endUtc,
    startIso,
    endIso,
    description,
    location,
    googleUrl: buildGoogleCalendarUrl({ title, startUtc, endUtc, description, location }),
    outlookUrl: buildOutlookCalendarUrl({ title, startIso, endIso, description, location }),
  };
}

function escapeIcsText(str: string): string {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldIcsLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 74) return line;
  let res = "";
  let cur = "";
  let isFirst = true;
  for (const char of line) {
    const limit = isFirst ? 74 : 73;
    if (Buffer.byteLength(cur + char, "utf8") > limit) {
      res += (isFirst ? "" : "\r\n ") + cur;
      cur = char;
      isFirst = false;
    } else {
      cur += char;
    }
  }
  if (cur) res += (isFirst ? "" : "\r\n ") + cur;
  return res;
}

export function generateIcsContent(params: {
  uid: string;
  recipientName: string;
  recipientEmail: string;
  slot: WeddingCalendarSlot;
}): string {
  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const safeAttendeeName = params.recipientName.replace(/["\r\n\\]/g, "");
  const safeAttendeeEmail = params.recipientEmail.replace(/[\r\n]/g, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Valentine & Jean//Mariage 2027//FR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Paris",
    "X-LIC-LOCATION:Europe/Paris",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${dtStamp}`,
    `ORGANIZER;CN="Valentine & Jean":mailto:${COUPLE_RSVP_ADDRESS}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${safeAttendeeName}":mailto:${safeAttendeeEmail}`,
    `DTSTART;TZID=Europe/Paris:${params.slot.dtStartLocal}`,
    `DTEND;TZID=Europe/Paris:${params.slot.dtEndLocal}`,
    `SUMMARY:${escapeIcsText(params.slot.summary)}`,
    `DESCRIPTION:${escapeIcsText(params.slot.description)}`,
    `LOCATION:${escapeIcsText(params.slot.location)}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
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

      const dietaryHtml = (m.isAttending && m.dietaryNotes && m.dietaryNotes.trim())
        ? `<br><span style="font-weight: 500; color: #13263B;">Régime particulier :</span> ${esc(m.dietaryNotes.trim())}`
        : "";

      return `<div style="margin-bottom: 16px; font-size: 15px;">
        <span style="font-weight: 500; color: #1c2833;">${esc(m.firstName)} ${esc(m.lastName)}</span><br>
        <span style="color: #6c7a89; font-size: 14px; font-style: italic; line-height: 1.5; display: inline-block; margin-top: 2px;">${presenceHtml}${dietaryHtml}</span>
      </div>`;
    })
    .join("");

  const anyAttending = data.members.some(m => m.isAttending);
  const introText = anyAttending
    ? "C’est avec une grande joie que nous avons pris connaissance de votre réponse. Nous vous remercions pour votre retour !"
    : "Nous avons bien pris note de votre réponse. Nous regrettons de ne pas pouvoir vous compter parmi nous, mais nous vous remercions sincèrement d'avoir pris le temps de nous répondre.";

  const calendarSlot = determineCalendarSlot(data.members);
  const safeSlug = (data.familyName || "invite")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
  const icsUid = `rsvp-vj-2027-${safeSlug}-${Date.now()}@valentinetjean.fr`;
  const icsContent = calendarSlot && data.email
    ? generateIcsContent({
        uid: icsUid,
        recipientName: `Famille ${data.familyName}`,
        recipientEmail: data.email.trim(),
        slot: calendarSlot,
      })
    : null;

  const calendarSectionHtml = calendarSlot ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #C4A475; border-radius: 8px; padding: 18px 20px; margin: 0 0 28px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #C4A475; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
          📅 Ajouter à votre agenda
        </div>
        <div style="font-size: 16px; font-weight: 600; color: #13263B; margin-bottom: 6px;">
          ${esc(calendarSlot.summary)}
        </div>
        <div style="font-size: 14px; color: #475569; margin-bottom: 16px; line-height: 1.5;">
          🕒 <strong>Créneau réservé :</strong> ${esc(calendarSlot.slotText)}
        </div>
        
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
          <tr>
            <td style="padding-right: 10px; padding-bottom: 8px;">
              <a href="${calendarSlot.googleUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #13263B; color: #ffffff; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;">
                + Google Agenda
              </a>
            </td>
            <td style="padding-bottom: 8px;">
              <a href="${calendarSlot.outlookUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #ffffff; color: #13263B; border: 1px solid #cbd5e1; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;">
                + Outlook
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
          📎 <em>Une invitation <strong>mariage-valentine-et-jean.ics</strong> est également jointe à ce courriel pour l’ajouter d’un clic sur <strong>Apple Calendar (iPhone, Mac)</strong> et autres applications.</em>
        </p>
      </div>
  ` : "";

  const calendarSectionText = calendarSlot ? `
Ajouter à votre agenda :
- Créneau réservé : ${calendarSlot.slotText}
- Google Agenda : ${calendarSlot.googleUrl}
- Outlook : ${calendarSlot.outlookUrl}
(Le fichier d'invitation mariage-valentine-et-jean.ics est également joint à ce courriel pour Apple Calendar, iPhone, Mac, Outlook et autres agendas)
` : "";

  const coupleHeaderHtml = `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; min-width: 200px; background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Contact</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; color: #0f172a; font-weight: 500;">
            ${data.email && data.email.trim() ? `<a href="mailto:${esc(data.email)}" style="color: #2563eb; text-decoration: none;">${esc(data.email)}</a>` : '<span style="color: #64748b; font-style: italic;">Non renseigné</span>'}
          </p>
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

      ${calendarSectionHtml}
      
      <p style="font-size: 15px; font-weight: 300; margin-bottom: 24px; line-height: 1.8;">
        Si le moindre imprévu venait modifier ces informations, n’hésitez pas à nous en faire part sur le site internet ou en répondant simplement à ce courriel.
      </p>
      
      <p style="font-size: 14px; font-weight: 400; margin-bottom: 32px; line-height: 1.8; color: #B58838;">
        <strong>Petit rappel :</strong> Pensez à faire votre procuration si nécessaire pour le 1<sup>er</sup> tour des élections présidentielles 2027 ! Cela tombe le même week-end.
      </p>

      <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 15px; font-weight: 300; line-height: 1.8;">
        <p style="margin: 0 0 16px 0;">Dans l’attente de célébrer ce moment précieux à vos côtés,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
          <tr>
            <td style="vertical-align: middle; padding-right: 14px;">
              <img src="cid:weddingLogo" alt="Valentine & Jean" width="46" height="46" style="display: block; width: 46px; height: 46px; border-radius: 50%;" />
            </td>
            <td style="vertical-align: middle;">
              <span style="font-size: 17px; font-weight: 500; letter-spacing: 0.5px; color: #3B6E9E; display: block;">Valentine &amp; Jean</span>
              <span style="font-size: 12px; color: #B58838; letter-spacing: 0.5px; text-transform: uppercase;">17 Avril 2027</span>
            </td>
          </tr>
        </table>
      </div>
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

  const guestText = `Bonjour,

${introText}

À titre de confirmation, voici ce que nous avons noté :
${data.members.map((m) => {
  if (!m.isAttending) return `- ${m.firstName} ${m.lastName} : Ne sera malheureusement pas des nôtres`;
  const dietStr = m.dietaryNotes && m.dietaryNotes.trim() ? ` [Régime : ${m.dietaryNotes.trim()}]` : '';
  return `- ${m.firstName} ${m.lastName} : Présent(e) (${eventsOf(m)})${dietStr}`;
}).join('\n')}
${calendarSectionText}
Si le moindre imprévu venait modifier ces informations, n’hésitez pas à nous en faire part sur le site internet ou en répondant simplement à ce courriel.

Petit rappel : Pensez à faire votre procuration si nécessaire pour le 1er tour des élections présidentielles 2027 ! Cela tombe le même week-end.

Dans l’attente de célébrer ce moment précieux à vos côtés,
Valentine & Jean — 17 Avril 2027`;

  const coupleText = `Nouvelle réponse RSVP : Famille ${data.familyName}
Contact : ${data.email?.trim() || 'Non renseigné'}
Bilan : ${attendingCount} présent(s) sur ${totalCount}
${calendarSlot ? `Créneau agenda : ${calendarSlot.slotText}\n` : ''}${data.message ? `Message joint : « ${data.message} »\n` : ''}
Détail des membres :
${data.members.map((m) => `- ${m.firstName} ${m.lastName} (${m.isChild ? 'Enfant' : 'Adulte'}) : ${m.isAttending ? 'PRÉSENT(E) - ' + eventsOf(m) : 'ABSENT(E)'}${m.dietaryNotes ? ' [Régime: ' + m.dietaryNotes + ']' : ''}`).join('\n')}`;

  const mails: Parameters<typeof sendMail>[0][] = [
    {
      to: COUPLE_RSVP_ADDRESS,
      replyTo: data.email?.trim() ? data.email.trim() : undefined,
      subject: `💍 Nouvelle réponse RSVP : Famille ${data.familyName}`,
      html: coupleHtml,
      text: coupleText,
      attachments: mailAttachmentsWithLogo,
    },
  ];

  if (data.email && data.email.trim() && data.email.includes('@')) {
    const guestMail: Parameters<typeof sendMail>[0] = {
      to: data.email.trim(),
      replyTo: COUPLE_RSVP_ADDRESS,
      subject: "[RSVP Mariage de Valentine & Jean] Merci pour votre réponse.",
      html: guestHtml,
      text: guestText,
      attachments: mailAttachmentsWithLogo,
    };

    if (calendarSlot && icsContent) {
      guestMail.icalEvent = {
        filename: "mariage-valentine-et-jean.ics",
        method: "REQUEST",
        content: icsContent,
      };
    }

    mails.push(guestMail);
  }

  await sendAll(mails);
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
      
      <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 15px; font-weight: 300; line-height: 1.8;">
        <p style="margin: 0 0 16px 0;">À très bientôt,</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
          <tr>
            <td style="vertical-align: middle; padding-right: 14px;">
              <img src="cid:weddingLogo" alt="Valentine & Jean" width="46" height="46" style="display: block; width: 46px; height: 46px; border-radius: 50%;" />
            </td>
            <td style="vertical-align: middle;">
              <span style="font-size: 17px; font-weight: 500; letter-spacing: 0.5px; color: #3B6E9E; display: block;">Valentine &amp; Jean</span>
              <span style="font-size: 12px; color: #B58838; letter-spacing: 0.5px; text-transform: uppercase;">17 Avril 2027</span>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const coupleText = `Message de contact : ${subjectLabel}
De : ${data.name} (${data.email})

Message :
${data.message}`;

  const guestText = `Bonjour ${data.name},

Nous avons bien reçu votre message. Un grand merci de nous avoir écrit ! Nous en prenons soin et vous répondrons dans les plus brefs délais.

Pour rappel, voici la teneur de votre message :
« ${data.message} »

À très bientôt,
Valentine & Jean — 17 Avril 2027`;

  await sendAll([
    {
      to: COUPLE_CONTACT_ADDRESS,
      replyTo: data.email,
      subject: `[${subjectLabel}] Message de contact de ${data.name}`,
      html: coupleHtml,
      text: coupleText,
    },
    {
      to: data.email,
      replyTo: COUPLE_CONTACT_ADDRESS,
      subject: "[Mariage Valentine & Jean] Accusé réception de votre message",
      html: guestHtml,
      text: guestText,
      attachments: mailAttachmentsWithLogo,
    },
  ]);
}

function invitedEventsOf(m: any): string {
  const events: string[] = [];
  if (m.invitedTo?.vinHonneur !== false) events.push("Vin d'Honneur");
  if (m.invitedTo?.repasNoces) events.push("Repas de Noces");
  if (m.invitedTo?.brunchLendemain) events.push("Brunch");
  return events.length > 0 ? events.join(", ") : "Non spécifié";
}

function memberTypeBadge(m: any): string {
  if (m.isBaby) return `<span style="display: inline-block; padding: 2px 6px; background-color: #f1f5f9; color: #475569; border-radius: 4px; font-size: 11px; font-weight: 600;">Bébé</span>`;
  if (m.isChild) return `<span style="display: inline-block; padding: 2px 6px; background-color: #f1f5f9; color: #475569; border-radius: 4px; font-size: 11px; font-weight: 600;">Enfant</span>`;
  return `<span style="display: inline-block; padding: 2px 6px; background-color: #f1f5f9; color: #475569; border-radius: 4px; font-size: 11px; font-weight: 600;">Adulte</span>`;
}

function memberTypeText(m: any): string {
  if (m.isBaby) return "(Bébé)";
  if (m.isChild) return "(Enfant)";
  return "(Adulte)";
}

function formatMemberPresenceHtml(m: any): string {
  if (!m.isAttending) {
    return `<span style="font-weight: 500; color: #991b1b;">Ne sera malheureusement pas des nôtres</span>`;
  }

  const attendingEvents: string[] = [];
  const declinedEvents: string[] = [];

  const invitedVin = m.invitedTo ? m.invitedTo.vinHonneur !== false : true;
  if (invitedVin) {
    if (m.events?.vinHonneur) attendingEvents.push("Vin d'Honneur");
    else declinedEvents.push("Vin d'Honneur");
  }

  const invitedRepas = m.invitedTo ? Boolean(m.invitedTo.repasNoces) : Boolean(m.events?.repasNoces);
  if (invitedRepas) {
    if (m.events?.repasNoces) attendingEvents.push("Repas de Noces");
    else declinedEvents.push("Repas de Noces");
  }

  const invitedBrunch = m.invitedTo ? Boolean(m.invitedTo.brunchLendemain) : Boolean(m.events?.brunchLendemain);
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

  let presenceHtml = "";

  if (attendingEvents.length > 0) {
    presenceHtml += `<span style="font-weight: 600; color: #166534;">Sera présent(e)</span> ${formatAttending(attendingEvents)}`;
  }

  if (declinedEvents.length > 0) {
    if (presenceHtml !== "") presenceHtml += "<br>";
    presenceHtml += `<span style="font-weight: 600; color: #991b1b;">Ne sera pas présent(e)</span> ${formatDeclined(declinedEvents)}`;
  }

  if (presenceHtml === "") {
    presenceHtml = `<span style="font-weight: 600; color: #166534;">Sera présent(e)</span>`;
  }

  const dietaryHtml = (m.isAttending && m.dietaryNotes && m.dietaryNotes.trim())
    ? `<br><span style="font-weight: 600; color: #b45309;">Régime particulier :</span> <span style="color: #b91c1c; font-weight: 500;">${esc(m.dietaryNotes.trim())}</span>`
    : "";

  return `${presenceHtml}${dietaryHtml}`;
}

function formatMemberPresenceText(m: any): string {
  if (!m.isAttending) {
    return "Ne sera malheureusement pas des nôtres";
  }

  const attendingEvents: string[] = [];
  const declinedEvents: string[] = [];

  const invitedVin = m.invitedTo ? m.invitedTo.vinHonneur !== false : true;
  if (invitedVin) {
    if (m.events?.vinHonneur) attendingEvents.push("Vin d'Honneur");
    else declinedEvents.push("Vin d'Honneur");
  }

  const invitedRepas = m.invitedTo ? Boolean(m.invitedTo.repasNoces) : Boolean(m.events?.repasNoces);
  if (invitedRepas) {
    if (m.events?.repasNoces) attendingEvents.push("Repas de Noces");
    else declinedEvents.push("Repas de Noces");
  }

  const invitedBrunch = m.invitedTo ? Boolean(m.invitedTo.brunchLendemain) : Boolean(m.events?.brunchLendemain);
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

  const parts: string[] = [];
  if (attendingEvents.length > 0) parts.push(`Sera présent(e) ${formatAttending(attendingEvents)}`);
  if (declinedEvents.length > 0) parts.push(`Ne sera pas présent(e) ${formatDeclined(declinedEvents)}`);
  if (m.dietaryNotes && m.dietaryNotes.trim()) parts.push(`Régime particulier : ${m.dietaryNotes.trim()}`);

  return parts.length > 0 ? parts.join(" | ") : "Sera présent(e)";
}

function getStatusStyle(val: any): { fontColor: string; bgColor: string; borderColor?: string } | null {
  if (!val) return null;
  const norm = String(val).trim().toLowerCase();

  // 1. Présent (Vert sur fond vert)
  if (norm.includes("présent") && !norm.includes("non présent")) {
    return {
      fontColor: "FF166534", // vert émeraude foncé soutenu
      bgColor: "FFDCFCE7",   // vert menthe pastel clair
    };
  }

  // 2. Absent / Non présent (Bleu ciel azur franc + texte bleu nuit foncé + fine bordure bleue)
  if (norm.includes("absent") || norm.includes("non présent")) {
    return {
      fontColor: "FF0C4A6E",   // bleu nuit très foncé (#0C4A6E)
      bgColor: "FF93C5FD",     // bleu azur dense et très visible (#93C5FD)
      borderColor: "FF60A5FA", // fine bordure bleue (#60A5FA)
    };
  }

  // 3. Non confirmé / En attente (Jaune sur fond jaune)
  if (
    norm.includes("non confirmé") ||
    norm.includes("non confirme") ||
    norm.includes("en attente") ||
    norm.includes("attente")
  ) {
    return {
      fontColor: "FF92400E", // ambre / jaune foncé soutenu
      bgColor: "FFFEF3C7",   // jaune clair pastel
    };
  }

  // 4. Non invité (Gris sur fond gris)
  if (norm.includes("non invité") || norm.includes("non invite")) {
    return {
      fontColor: "FF64748B", // gris ardoise moyen
      bgColor: "FFF1F5F9",   // gris très clair doux
    };
  }

  return null;
}

export async function generateHostRecapExcel(hostLabel: string, families: any[], stats: any): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Mariage Valentine & Jean";
  wb.lastModifiedBy = "Bot Récapitulatif Vendredi 20h";
  wb.created = new Date();
  wb.modified = new Date();

  // ----------------------------------------------------
  // FEUILLE 1 : LISTE DES INVITÉS
  // ----------------------------------------------------
  const wsInvites = wb.addWorksheet("Liste des Invités", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const columns = [
    { header: "Famille", key: "famille", width: 24 },
    { header: "Prénom", key: "prenom", width: 20 },
    { header: "Nom", key: "nom", width: 20 },
    { header: "Catégorie", key: "categorie", width: 14 },
    { header: "Statut Réponse", key: "statut", width: 26 },
    { header: "Vin d'Honneur", key: "vin", width: 20 },
    { header: "Repas de Noces", key: "repas", width: 20 },
    { header: "Brunch", key: "brunch", width: 20 },
    { header: "Régime / Allergies", key: "regime", width: 30 },
    { header: "Email de contact", key: "email", width: 28 },
    { header: "Date réponse", key: "date", width: 22 },
    { header: "Mot des mariés (lettre)", key: "motMaries", width: 38 },
  ];

  wsInvites.columns = columns;

  // LIGNE 1 : EN-TÊTE (Gras, centré, fond gris, filtre activé)
  const headerRow = wsInvites.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FF0F172A" }, // Slate 900
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" }, // Fond gris demandé
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  // Activation du filtre automatique sur la première ligne
  wsInvites.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };

  // DONNÉES : Segmente chaque famille, rien de gras
  const sortedFamilies = [...families].sort((a, b) =>
    (a.familyName || "").localeCompare(b.familyName || "", "fr", { sensitivity: "base" })
  );

  sortedFamilies.forEach((fam, famIdx) => {
    const isResponded = Boolean(
      fam.hasResponded ||
      fam.respondedAt ||
      fam.notes === "has_responded" ||
      (fam.lastMessage && fam.lastMessage.trim().length > 0)
    );

    // Teinte neutre alternée par foyer pour renforcer la segmentation visuelle
    const familyBaseBg = famIdx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
    const members = fam.members && fam.members.length > 0 ? fam.members : [{}];

    members.forEach((m: any, memberIdx: number) => {
      const isLastMember = memberIdx === members.length - 1;

      const typeStr = m.isBaby ? "Bébé" : (m.isChild ? "Enfant" : "Adulte");
      let statutReponse = "Non confirmé";
      let presenceVin = "Non invité";
      let presenceRepas = "Non invité";
      let presenceBrunch = "Non invité";

      const invitedVin = m.invitedTo ? m.invitedTo.vinHonneur !== false : true;
      const invitedRepas = m.invitedTo ? Boolean(m.invitedTo.repasNoces) : Boolean(m.events?.repasNoces);
      const invitedBrunch = m.invitedTo ? Boolean(m.invitedTo.brunchLendemain) : Boolean(m.events?.brunchLendemain);

      if (isResponded) {
        if (m.isAttending) {
          statutReponse = "Présent";
          if (invitedVin) presenceVin = m.events?.vinHonneur ? "Présent" : "Absent";
          if (invitedRepas) presenceRepas = m.events?.repasNoces ? "Présent" : "Absent";
          if (invitedBrunch) presenceBrunch = m.events?.brunchLendemain ? "Présent" : "Absent";
        } else {
          statutReponse = "Absent";
          if (invitedVin) presenceVin = "Absent";
          if (invitedRepas) presenceRepas = "Absent";
          if (invitedBrunch) presenceBrunch = "Absent";
        }
      } else {
        statutReponse = "Non confirmé (en attente)";
        if (invitedVin) presenceVin = "Invité (en attente)";
        if (invitedRepas) presenceRepas = "Invité (en attente)";
        if (invitedBrunch) presenceBrunch = "Invité (en attente)";
      }

      const firstNameVal = (m.firstName || "").trim();
      const lastNameVal = (m.lastName || "").trim();
      const isFirstNameEmpty = firstNameVal.length === 0;
      const isLastNameEmpty = lastNameVal.length === 0;

      const weddingNoteVal = (m.weddingNote || "").trim();
      const hasWeddingNote = weddingNoteVal.length > 0;

      // Un invité venant au dîner (Repas de Noces = Présent) ou déclaré présent au mariage (sans être absent au repas)
      const isPresentAtDinner = presenceRepas === "Présent" || (statutReponse === "Présent" && presenceRepas !== "Absent" && presenceRepas !== "Non invité");
      const isMissingDinnerNote = isPresentAtDinner && !hasWeddingNote;

      let displayNote = "-";
      if (hasWeddingNote) {
        displayNote = weddingNoteVal;
      } else if (isMissingDinnerNote) {
        displayNote = "À rédiger";
      }

      const rowValues = {
        famille: fam.familyName || "-",
        prenom: firstNameVal,
        nom: lastNameVal,
        categorie: typeStr,
        statut: statutReponse,
        vin: presenceVin,
        repas: presenceRepas,
        brunch: presenceBrunch,
        regime: m.dietaryNotes && m.dietaryNotes.trim() ? m.dietaryNotes.trim() : "-",
        email: fam.email ? fam.email : "-",
        date: fam.respondedAt ? fam.respondedAt : "-",
        motMaries: displayNote,
      };

      const row = wsInvites.addRow(rowValues);
      row.height = 22;

      // Bordure basse : marquée (medium) sur le dernier membre de la famille pour segmenter chaque famille
      const bottomBorderStyle = isLastMember ? "medium" : "thin";
      const bottomBorderColor = isLastMember ? "FF64748B" : "FFE2E8F0";

      const defaultBorder: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: bottomBorderStyle, color: { argb: bottomBorderColor } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // STRICTEMENT AUCUN GRAS DANS LES DONNÉES ("puis rien de gras")
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = {
          name: "Calibri",
          size: 10.5,
          bold: false, // Rien de gras
          color: { argb: "FF1E293B" },
        };
        cell.border = defaultBorder;

        // Fond par défaut de la famille
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: familyBaseBg },
        };

        // Alignement et colorations spécifiques
        if (colNumber === 1) {
          // Famille
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else if (colNumber === 2) {
          // Prénom (Si vide -> fond rouge)
          cell.alignment = { vertical: "middle", horizontal: "left" };
          if (isFirstNameEmpty) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEE2E2" }, // Fond rouge clair
            };
            cell.font = {
              name: "Calibri",
              size: 10.5,
              bold: false,
              color: { argb: "FF991B1B" }, // Texte rouge foncé
            };
            cell.border = {
              ...defaultBorder,
              left: { style: "thin", color: { argb: "FFF87171" } },
              right: { style: "thin", color: { argb: "FFF87171" } },
            };
          }
        } else if (colNumber === 3) {
          // Nom (Si vide -> fond rouge)
          cell.alignment = { vertical: "middle", horizontal: "left" };
          if (isLastNameEmpty) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEE2E2" }, // Fond rouge clair
            };
            cell.font = {
              name: "Calibri",
              size: 10.5,
              bold: false,
              color: { argb: "FF991B1B" }, // Texte rouge foncé
            };
            cell.border = {
              ...defaultBorder,
              left: { style: "thin", color: { argb: "FFF87171" } },
              right: { style: "thin", color: { argb: "FFF87171" } },
            };
          }
        } else if (colNumber === 4) {
          // Catégorie
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber >= 5 && colNumber <= 8) {
          // Statut Réponse, Vin d'Honneur, Repas de Noces, Brunch
          cell.alignment = { vertical: "middle", horizontal: "center" };
          const style = getStatusStyle(cell.value);
          if (style) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: style.bgColor },
            };
            cell.font = {
              name: "Calibri",
              size: 10.5,
              bold: false, // Rien de gras
              color: { argb: style.fontColor },
            };
            if (style.borderColor) {
              cell.border = {
                top: { style: "thin", color: { argb: style.borderColor } },
                bottom: { style: isLastMember ? "medium" : "thin", color: { argb: isLastMember ? "FF64748B" : style.borderColor } },
                left: { style: "thin", color: { argb: style.borderColor } },
                right: { style: "thin", color: { argb: style.borderColor } },
              };
            }
          }
        } else if (colNumber === 9) {
          // Régime / Allergies
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else if (colNumber === 10) {
          // Email de contact
          cell.alignment = { vertical: "middle", horizontal: "left" };
        } else if (colNumber === 11) {
          // Date réponse
          cell.alignment = { vertical: "middle", horizontal: "center" };
        } else if (colNumber === 12) {
          // Mot des mariés (dernière colonne à droite)
          cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
          if (isMissingDinnerNote) {
            // Si présent mais sans mot : ressort en rouge
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEE2E2" }, // Fond rouge clair
            };
            cell.font = {
              name: "Calibri",
              size: 10.5,
              bold: false,
              italic: true,
              color: { argb: "FF991B1B" }, // Texte rouge foncé
            };
            cell.border = {
              ...defaultBorder,
              left: { style: "thin", color: { argb: "FFF87171" } },
              right: { style: "thin", color: { argb: "FFF87171" } },
            };
          } else if (hasWeddingNote) {
            cell.font = {
              name: "Calibri",
              size: 10.5,
              bold: false,
              color: { argb: "FF0F172A" },
            };
          }
        }
      });
    });
  });

  // ----------------------------------------------------
  // FEUILLE 2 : SYNTHÈSE & DÉCOMPTE
  // ----------------------------------------------------
  const wsSynthese = wb.addWorksheet("Synthèse & Décompte");

  wsSynthese.columns = [
    { width: 34 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  // Titre principal
  const titleRow = wsSynthese.addRow(["MARIAGE VALENTINE & JEAN 2027 — RÉCAPITULATIF DES INVITÉS"]);
  titleRow.height = 32;
  wsSynthese.mergeCells("A1:E1");
  const titleCell = wsSynthese.getCell("A1");
  titleCell.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF13263B" } };

  // Métadonnées
  const r2 = wsSynthese.addRow(["Hôte", hostLabel]);
  r2.font = { name: "Calibri", size: 10.5, bold: false };
  r2.getCell(1).font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF475569" } };

  const r3 = wsSynthese.addRow(["Date de génération", stats.dateFormatted]);
  r3.font = { name: "Calibri", size: 10.5, bold: false };
  r3.getCell(1).font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF475569" } };

  wsSynthese.addRow([]); // Espaceur

  // TABLEAU 1 : INDICATEURS GLOBAUX
  const t1Header = wsSynthese.addRow(["INDICATEUR", "TOTAL", "ADULTES", "ENFANTS", "BÉBÉS"]);
  t1Header.height = 26;
  t1Header.eachCell({ includeEmpty: true }, (c) => {
    c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0F172A" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    c.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  const t1Rows = [
    ["Total Invités", stats.totalInvited, stats.totalAdults, stats.totalChildren, stats.totalBabies, null],
    ["Présents", stats.presentsCount, stats.presentAdults, stats.presentChildren, stats.presentBabies, "present"],
    ["Non Confirmés (en attente)", stats.nonConfirmeCount, stats.nonConfirmeAdults, stats.nonConfirmeChildren, stats.nonConfirmeBabies, "pending"],
    ["Absents", stats.absentsCount, stats.absentAdults, stats.absentChildren, stats.absentBabies, "absent"],
  ];

  t1Rows.forEach(([label, total, ad, enf, bb, type]) => {
    const row = wsSynthese.addRow([label, total, ad, enf, bb]);
    row.height = 22;
    row.eachCell({ includeEmpty: true }, (c, colIdx) => {
      c.font = { name: "Calibri", size: 10.5, bold: false, color: { argb: "FF1E293B" } };
      c.alignment = { vertical: "middle", horizontal: colIdx === 1 ? "left" : "center" };
      c.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      if (type === "present") {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
        if (colIdx === 1) c.font = { name: "Calibri", size: 10.5, bold: false, color: { argb: "FF166534" } };
      } else if (type === "pending") {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
        if (colIdx === 1) c.font = { name: "Calibri", size: 10.5, bold: false, color: { argb: "FF92400E" } };
      } else if (type === "absent") {
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBAE6FD" } };
        if (colIdx === 1) c.font = { name: "Calibri", size: 10.5, bold: false, color: { argb: "FF0C4A6E" } };
      }
    });
  });

  wsSynthese.addRow([]); // Espaceur

  // TABLEAU 2 : DÉCOMPTE PAR REPAS
  const t2Header = wsSynthese.addRow(["DÉCOMPTE PAR REPAS (PRÉSENTS)", "TOTAL", "ADULTES", "ENFANTS", "BÉBÉS"]);
  t2Header.height = 26;
  t2Header.eachCell({ includeEmpty: true }, (c) => {
    c.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF0F172A" } };
    c.alignment = { vertical: "middle", horizontal: "center" };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    c.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });

  const t2Rows = [
    ["Vin d'Honneur", stats.vinCount, stats.vinAdults, stats.vinChildren, stats.vinBabies],
    ["Repas de Noces", stats.repasCount, stats.repasAdults, stats.repasChildren, stats.repasBabies],
    ["Brunch du Lendemain", stats.brunchCount, stats.brunchAdults, stats.brunchChildren, stats.brunchBabies],
  ];

  t2Rows.forEach(([label, total, ad, enf, bb]) => {
    const row = wsSynthese.addRow([label, total, ad, enf, bb]);
    row.height = 22;
    row.eachCell({ includeEmpty: true }, (c, colIdx) => {
      c.font = { name: "Calibri", size: 10.5, bold: false, color: { argb: "FF1E293B" } };
      c.alignment = { vertical: "middle", horizontal: colIdx === 1 ? "left" : "center" };
      c.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export interface HostRecapSummary {
  hostId: string;
  hostLabel: string;
  totalFamilies: number;
  totalInvited: number;
  presentsCount: number;
  absentsCount: number;
  nonConfirmeCount: number;
  recipient: string;
}

export async function sendHostRecapEmails(allFamilies: any[]): Promise<{ sentCount: number; details: HostRecapSummary[] }> {
  const OFFICIAL_HOSTS = [
    { id: "Valentine&Jean", label: "Valentine & Jean" },
    { id: "Anny&Marc", label: "Anny & Marc" },
    { id: "Anne&Visith", label: "Anne & Visith" },
  ];

  const hostMap = new Map<string, string>();
  OFFICIAL_HOSTS.forEach((h) => hostMap.set(h.id, h.label));

  allFamilies.forEach((f) => {
    if (f.invitedBy && !hostMap.has(f.invitedBy)) {
      hostMap.set(f.invitedBy, f.invitedBy);
    }
  });

  const hostsToProcess = Array.from(hostMap.entries()).map(([id, label]) => ({ id, label }));

  const hasUnassigned = allFamilies.some((f) => !f.invitedBy);
  if (hasUnassigned) {
    hostsToProcess.push({ id: "unassigned", label: "Sans hôte assigné" });
  }

  const recipient = process.env.RECAP_EMAIL_TO || COUPLE_RSVP_ADDRESS;
  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(now).replace(":", "h");

  const mails: Parameters<typeof sendMail>[0][] = [];
  const details: HostRecapSummary[] = [];

  for (const host of hostsToProcess) {
    const families = allFamilies.filter((f) => {
      if (host.id === "unassigned") return !f.invitedBy;
      return f.invitedBy === host.id;
    });

    let totalInvited = 0;
    let totalAdults = 0;
    let totalChildren = 0;
    let totalBabies = 0;

    const nonConfirmeFamilies: any[] = [];
    let nonConfirmeCount = 0;
    let nonConfirmeAdults = 0;
    let nonConfirmeChildren = 0;
    let nonConfirmeBabies = 0;

    const presentFamilies: Array<{ family: any; members: any[] }> = [];
    let presentsCount = 0;
    let presentAdults = 0;
    let presentChildren = 0;
    let presentBabies = 0;
    let vinCount = 0, vinAdults = 0, vinChildren = 0, vinBabies = 0;
    let repasCount = 0, repasAdults = 0, repasChildren = 0, repasBabies = 0;
    let brunchCount = 0, brunchAdults = 0, brunchChildren = 0, brunchBabies = 0;

    const absentFamilies: Array<{ family: any; members: any[] }> = [];
    let absentsCount = 0;
    let absentAdults = 0;
    let absentChildren = 0;
    let absentBabies = 0;

    families.forEach((fam) => {
      const isResponded = Boolean(
        fam.hasResponded ||
        fam.respondedAt ||
        fam.notes === "has_responded" ||
        (fam.lastMessage && fam.lastMessage.trim().length > 0)
      );

      fam.members.forEach((m: any) => {
        totalInvited++;
        if (m.isBaby) totalBabies++;
        else if (m.isChild) totalChildren++;
        else totalAdults++;
      });

      if (!isResponded) {
        nonConfirmeFamilies.push(fam);
        fam.members.forEach((m: any) => {
          nonConfirmeCount++;
          if (m.isBaby) nonConfirmeBabies++;
          else if (m.isChild) nonConfirmeChildren++;
          else nonConfirmeAdults++;
        });
      } else {
        const attendingInFam = fam.members.filter((m: any) => m.isAttending);
        const absentInFam = fam.members.filter((m: any) => !m.isAttending);

        if (attendingInFam.length > 0) {
          presentFamilies.push({ family: fam, members: attendingInFam });
          attendingInFam.forEach((m: any) => {
            presentsCount++;
            if (m.isBaby) {
              presentBabies++;
              if (m.events?.vinHonneur) { vinCount++; vinBabies++; }
              if (m.events?.repasNoces) { repasCount++; repasBabies++; }
              if (m.events?.brunchLendemain) { brunchCount++; brunchBabies++; }
            } else if (m.isChild) {
              presentChildren++;
              if (m.events?.vinHonneur) { vinCount++; vinChildren++; }
              if (m.events?.repasNoces) { repasCount++; repasChildren++; }
              if (m.events?.brunchLendemain) { brunchCount++; brunchChildren++; }
            } else {
              presentAdults++;
              if (m.events?.vinHonneur) { vinCount++; vinAdults++; }
              if (m.events?.repasNoces) { repasCount++; repasAdults++; }
              if (m.events?.brunchLendemain) { brunchCount++; brunchAdults++; }
            }
          });
        }

        if (absentInFam.length > 0) {
          absentFamilies.push({ family: fam, members: absentInFam });
          absentInFam.forEach((m: any) => {
            absentsCount++;
            if (m.isBaby) absentBabies++;
            else if (m.isChild) absentChildren++;
            else absentAdults++;
          });
        }
      }
    });

    details.push({
      hostId: host.id,
      hostLabel: host.label,
      totalFamilies: families.length,
      totalInvited,
      presentsCount,
      absentsCount,
      nonConfirmeCount,
      recipient,
    });

    // 1. HTML NON CONFIRMÉS
    const nonConfirmeHtml = nonConfirmeFamilies.length === 0
      ? `<div style="padding: 16px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b; font-size: 14px; font-style: italic;">✨ Toutes les familles de cet hôte ont déjà répondu !</div>`
      : nonConfirmeFamilies.map((fam) => `
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <strong style="font-size: 15px; color: #0f172a;">${esc(fam.familyName)}</strong>
            <span style="font-size: 12px; color: #64748b;">${fam.email ? esc(fam.email) : 'Email non renseigné'}</span>
          </div>
          <ul style="margin: 6px 0 0 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
            ${fam.members.map((m: any) => `
              <li>
                <strong>${esc(m.firstName)} ${esc(m.lastName)}</strong> ${memberTypeBadge(m)}
                <span style="color: #64748b; font-size: 12px; margin-left: 6px;">(Invité(e) : ${esc(invitedEventsOf(m))})</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');

    // 2. HTML PRÉSENTS
    const presentsHtml = presentFamilies.length === 0
      ? `<div style="padding: 16px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b; font-size: 14px; font-style: italic;">Aucune présence confirmée pour le moment.</div>`
      : presentFamilies.map(({ family, members }) => `
        <div style="background-color: #ffffff; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <strong style="font-size: 15px; color: #166534;">Famille ${esc(family.familyName)}</strong>
            <span style="font-size: 12px; color: #64748b;">${family.email ? esc(family.email) : ''}</span>
          </div>
          <div style="margin: 0; padding-left: 2px;">
            ${members.map((m: any) => `
              <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.6;">
                <span style="font-weight: 600; color: #1c2833;">${esc(m.firstName)} ${esc(m.lastName)}</span>
                <span style="margin-left: 6px;">${memberTypeBadge(m)}</span>
                <div style="margin-top: 3px; font-size: 13px; line-height: 1.5; padding-left: 10px; border-left: 2px solid #bbf7d0; color: #475569;">
                  ${formatMemberPresenceHtml(m)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

    // 3. HTML ABSENTS
    const absentsHtml = absentFamilies.length === 0
      ? `<div style="padding: 16px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b; font-size: 14px; font-style: italic;">Aucun absent déclaré pour le moment.</div>`
      : absentFamilies.map(({ family, members }) => `
        <div style="background-color: #ffffff; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px 18px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
            <strong style="font-size: 15px; color: #991b1b;">Famille ${esc(family.familyName)}</strong>
            <span style="font-size: 12px; color: #64748b;">${family.email ? esc(family.email) : ''}</span>
          </div>
          <div style="margin: 0; padding-left: 2px;">
            ${members.map((m: any) => `
              <div style="margin-bottom: 10px; font-size: 14px; line-height: 1.6;">
                <span style="font-weight: 600; color: #1c2833;">${esc(m.firstName)} ${esc(m.lastName)}</span>
                <span style="margin-left: 6px;">${memberTypeBadge(m)}</span>
                <div style="margin-top: 3px; font-size: 13px; line-height: 1.5; padding-left: 10px; border-left: 2px solid #fecaca; color: #991b1b;">
                  <span style="font-weight: 500;">Ne sera malheureusement pas des nôtres</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 16px; background-color: #f8fafc;">
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.06);">
          
          <!-- BANNIÈRE EN-TÊTE -->
          <div style="background: linear-gradient(135deg, #13263B 0%, #1e3a5f 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #C4A475;">
            <div style="background: rgba(196, 164, 117, 0.2); color: #E8D3B1; border: 1px solid rgba(196, 164, 117, 0.4); border-radius: 9999px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; display: inline-block; margin-bottom: 10px;">
              MARIAGE VALENTINE &amp; JEAN • 17 AVRIL 2027
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
              Récapitulatif Invités • ${esc(host.label)}
            </h1>
            <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px;">
              Point arrêté au ${esc(dateFormatted)}
            </p>
          </div>

          <!-- CONTENU PRINCIPAL -->
          <div style="padding: 24px;">
            
            <!-- 1. LE DÉCOMPTE (KPIs) -->
            <div style="margin-bottom: 24px;">
              <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">
                📊 DÉCOMPTE GLOBAL
              </div>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="table-layout: fixed;">
                <tr>
                  <td style="padding: 4px;">
                    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center;">
                      <span style="display: block; font-size: 26px; font-weight: 800; color: #13263B; line-height: 1.1;">${totalInvited}</span>
                      <span style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-top: 4px;">Total Invités</span>
                      <span style="display: block; font-size: 10px; color: #64748b; margin-top: 2px;">${totalAdults} ad • ${totalChildren} enf • ${totalBabies} bb</span>
                    </div>
                  </td>
                  <td style="padding: 4px;">
                    <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; text-align: center;">
                      <span style="display: block; font-size: 26px; font-weight: 800; color: #166534; line-height: 1.1;">${presentsCount}</span>
                      <span style="display: block; font-size: 12px; font-weight: 700; color: #166534; margin-top: 4px;">Présents</span>
                      <span style="display: block; font-size: 10px; color: #15803d; margin-top: 2px;">${presentAdults} ad • ${presentChildren} enf • ${presentBabies} bb</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px;">
                    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; text-align: center;">
                      <span style="display: block; font-size: 26px; font-weight: 800; color: #b45309; line-height: 1.1;">${nonConfirmeCount}</span>
                      <span style="display: block; font-size: 12px; font-weight: 700; color: #b45309; margin-top: 4px;">Non Confirmés</span>
                      <span style="display: block; font-size: 10px; color: #92400e; margin-top: 2px;">${nonConfirmeFamilies.length} famille(s)</span>
                    </div>
                  </td>
                  <td style="padding: 4px;">
                    <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; text-align: center;">
                      <span style="display: block; font-size: 26px; font-weight: 800; color: #991b1b; line-height: 1.1;">${absentsCount}</span>
                      <span style="display: block; font-size: 12px; font-weight: 700; color: #991b1b; margin-top: 4px;">Absents</span>
                      <span style="display: block; font-size: 10px; color: #b91c1c; margin-top: 2px;">${absentFamilies.length} famille(s)</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- DÉTAIL PAR TYPE DE REPAS -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-top: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;">
                  🍽️ Décompte par repas (invités présents) :
                </div>
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 13px; color: #1e293b;">
                  <tr>
                    <td style="padding: 3px 0;">• <strong>Vin d'Honneur :</strong></td>
                    <td style="padding: 3px 0; text-align: right;"><strong style="color: #13263B;">${vinCount}</strong> <span style="color: #64748b; font-size: 11px;">(${vinAdults} ad • ${vinChildren} enf • ${vinBabies} bb)</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0;">• <strong>Repas de Noces :</strong></td>
                    <td style="padding: 3px 0; text-align: right;"><strong style="color: #13263B;">${repasCount}</strong> <span style="color: #64748b; font-size: 11px;">(${repasAdults} ad • ${repasChildren} enf • ${repasBabies} bb)</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 3px 0;">• <strong>Brunch du lendemain :</strong></td>
                    <td style="padding: 3px 0; text-align: right;"><strong style="color: #13263B;">${brunchCount}</strong> <span style="color: #64748b; font-size: 11px;">(${brunchAdults} ad • ${brunchChildren} enf • ${brunchBabies} bb)</span></td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- SECTION 1 : NON CONFIRMÉ -->
            <div style="margin-bottom: 28px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #d97706; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #92400e; font-size: 15px; font-weight: 700;">
                  ⏳ NON CONFIRMÉ (${nonConfirmeCount} invité(s) • ${nonConfirmeFamilies.length} famille(s))
                </h3>
              </div>
              ${nonConfirmeHtml}
            </div>

            <!-- SECTION 2 : PRÉSENTS -->
            <div style="margin-bottom: 28px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #16a34a; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #166534; font-size: 15px; font-weight: 700;">
                  ✅ PRÉSENTS (${presentsCount} invité(s) • ${presentFamilies.length} famille(s))
                </h3>
              </div>
              ${presentsHtml}
            </div>

            <!-- SECTION 3 : ABSENTS -->
            <div style="margin-bottom: 24px;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #dc2626; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 700;">
                  ❌ ABSENTS (${absentsCount} invité(s) • ${absentFamilies.length} famille(s))
                </h3>
              </div>
              ${absentsHtml}
            </div>

            <!-- PIED DE PAGE & SIGNATURE -->
            <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.6;">
              <div style="background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; color: #1e293b; font-size: 13px;">
                📎 <strong>Fichier Excel joint :</strong> Vous trouverez également en pièce jointe de cet email le fichier Excel complet <em>Recapitulatif_Invites_${esc(host.label)}.xlsx</em> avec les onglets <strong>Liste des Invités</strong> et <strong>Synthèse</strong>.
              </div>
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 14px;">
                    <img src="cid:weddingLogo" alt="Valentine & Jean" width="44" height="44" style="display: block; width: 44px; height: 44px; border-radius: 50%;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 16px; font-weight: 600; color: #3B6E9E; display: block;">Valentine &amp; Jean</span>
                    <span style="font-size: 11px; color: #B58838; letter-spacing: 0.5px; text-transform: uppercase;">17 Avril 2027</span>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                🤖 Ce récapitulatif est généré automatiquement par le bot récapitulatif chaque vendredi à 20h00 pour le suivi des invités.
              </p>
            </div>

          </div>
        </div>
      </div>
    `;

    const text = `MARIAGE VALENTINE & JEAN — 17 AVRIL 2027
RÉCAPITULATIF INVITÉS : ${host.label.toUpperCase()}
Point arrêté au : ${dateFormatted}

==================================================
DÉCOMPTE GLOBAL
==================================================
- Total Invités : ${totalInvited} (${totalAdults} adultes, ${totalChildren} enfants, ${totalBabies} bébés)
- Présents : ${presentsCount} (${presentAdults} adultes, ${presentChildren} enfants, ${presentBabies} bébés)
- Non confirmés : ${nonConfirmeCount} (${nonConfirmeFamilies.length} familles)
- Absents : ${absentsCount} (${absentFamilies.length} familles)

Décompte par repas (présents) :
- Vin d'Honneur : ${vinCount} (${vinAdults} ad, ${vinChildren} enf, ${vinBabies} bb)
- Repas de Noces : ${repasCount} (${repasAdults} ad, ${repasChildren} enf, ${repasBabies} bb)
- Brunch : ${brunchCount} (${brunchAdults} ad, ${brunchChildren} enf, ${brunchBabies} bb)

==================================================
1. SECTION "NON CONFIRMÉ" (${nonConfirmeCount} personnes)
==================================================
${nonConfirmeFamilies.length === 0 ? 'Toutes les familles de cet hôte ont déjà répondu.' : nonConfirmeFamilies.map((f) => `
* Famille ${f.familyName} (${f.email || 'Email non renseigné'}) :
${f.members.map((m: any) => `  - ${m.firstName} ${m.lastName} ${memberTypeText(m)} [Invité(e) : ${invitedEventsOf(m)}]`).join('\n')}`).join('\n')}

==================================================
2. SECTION "PRÉSENTS" (${presentsCount} personnes)
==================================================
${presentFamilies.length === 0 ? 'Aucune présence confirmée pour le moment.' : presentFamilies.map(({ family, members }) => `
* Famille ${family.familyName} :
${members.map((m: any) => `  - ${m.firstName} ${m.lastName} ${memberTypeText(m)} : ${formatMemberPresenceText(m)}`).join('\n')}`).join('\n')}

==================================================
3. SECTION "ABSENTS" (${absentsCount} personnes)
==================================================
${absentFamilies.length === 0 ? 'Aucun absent déclaré.' : absentFamilies.map(({ family, members }) => `
* Famille ${family.familyName} :
${members.map((m: any) => `  - ${m.firstName} ${m.lastName} ${memberTypeText(m)} : Ne sera malheureusement pas des nôtres`).join('\n')}`).join('\n')}

--------------------------------------------------
📎 Fichier Excel complet joint à ce courriel.
Valentine & Jean — 17 Avril 2027
Bot de suivi hebdomadaire du vendredi 20h`;

    const excelBuffer = await generateHostRecapExcel(host.label, families, {
      totalFamilies: families.length,
      totalInvited,
      totalAdults,
      totalChildren,
      totalBabies,
      presentsCount,
      presentAdults,
      presentChildren,
      presentBabies,
      nonConfirmeCount,
      nonConfirmeAdults,
      nonConfirmeChildren,
      nonConfirmeBabies,
      absentsCount,
      absentAdults,
      absentChildren,
      absentBabies,
      vinCount, vinAdults, vinChildren, vinBabies,
      repasCount, repasAdults, repasChildren, repasBabies,
      brunchCount, brunchAdults, brunchChildren, brunchBabies,
      dateFormatted,
    });

    const cleanHostName = host.label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_");

    mails.push({
      from: { name: "Valentine & Jean", address: COUPLE_RSVP_ADDRESS },
      to: recipient,
      replyTo: COUPLE_RSVP_ADDRESS,
      subject: `[Mariage JV2027] Récapitulatif invités ${host.label}`,
      html,
      text,
      attachments: [
        ...mailAttachmentsWithLogo,
        {
          filename: `Recapitulatif_Invites_${cleanHostName}.xlsx`,
          content: excelBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });
  }

  await sendAll(mails);

  return {
    sentCount: mails.length,
    details,
  };
}

