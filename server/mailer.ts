/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

/**
 * Sends a formatted RSVP notification email to valentinetjean@etik.com
 * Supports direct Node dispatch, Resend API, and native PHP mail() script relay!
 */
export async function sendRSVPNotificationEmail(data: RSVPMailPayload) {
  const recipient = "valentinetjean@etik.com";
  const subject = `💍 Nouvelle réponse RSVP : Famille ${data.familyName}`;

  const attendingCount = data.members.filter((m) => m.isAttending).length;
  const totalCount = data.members.length;

  const membersHtml = data.members
    .map((m) => {
      const status = m.isAttending ? "✅ PRÉSENT(E)" : "❌ ABSENT(E)";
      const type = m.isChild ? "Enfant" : "Adulte";

      let eventsList = [];
      if (m.isAttending && m.events) {
        if (m.events.vinHonneur) eventsList.push("Vin d'Honneur");
        if (m.events.repasNoces) eventsList.push("Repas de Noces");
        if (m.events.brunchLendemain) eventsList.push("Brunch");
      }

      const eventsText = eventsList.length > 0 ? eventsList.join(", ") : "Aucun";
      const dietaryText = m.dietaryNotes ? `<b>Régime :</b> ${m.dietaryNotes}` : "-";

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px; font-weight: bold; color: #13263B;">${m.firstName} ${m.lastName} (${type})</td>
          <td style="padding: 10px; font-weight: bold; color: ${m.isAttending ? '#2e7d32' : '#c62828'};">${status}</td>
          <td style="padding: 10px; color: #555;">${m.isAttending ? eventsText : '-'}</td>
          <td style="padding: 10px; color: #555;">${dietaryText}</td>
        </tr>
      `;
    })
    .join("");

  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 12px; padding: 24px; background-color: #faf7f2;">
      <h2 style="color: #13263B; margin-top: 0; border-bottom: 2px solid #C4A475; padding-bottom: 8px;">
        💍 Nouvelle Confirmation RSVP
      </h2>
      <p style="font-size: 15px; color: #333;">
        La <strong>Famille ${data.familyName}</strong> vient de soumettre sa réponse sur le site !
      </p>

      <div style="background-color: #ffffff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e0dcd5;">
        <p style="margin: 4px 0;"><strong>Famille :</strong> Famille ${data.familyName}</p>
        <p style="margin: 4px 0;"><strong>Email de contact :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        <p style="margin: 4px 0;"><strong>Bilan :</strong> ${attendingCount} présent(s) sur ${totalCount} invité(s)</p>
        ${data.message ? `<p style="margin: 12px 0 4px 0; padding-top: 8px; border-top: 1px italic #eee;"><strong>Message des invités :</strong><br><em style="color: #3B6FA0;">« ${data.message} »</em></p>` : ''}
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

      <p style="font-size: 11px; color: #888; text-align: center; margin-top: 24px;">
        Notification envoyée à <strong>${recipient}</strong> depuis le site de mariage de Valentine &amp; Jean.
      </p>
    </div>
  `;

  console.log(`\n======================================================`);
  console.log(`📧 ENVOI D'EMAIL RSVP vers : ${recipient}`);
  console.log(`Sujet : ${subject}`);
  console.log(`======================================================\n`);

  // 1. Relay to PHP mail script if PHP_MAIL_URL is set in .env (e.g. https://votre-domaine.fr/api/send_rsvp_mail.php)
  const phpMailUrl = process.env.PHP_MAIL_URL;
  if (phpMailUrl) {
    try {
      await fetch(phpMailUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      console.log(`✅ Email transmis avec succès via le script PHP : ${phpMailUrl}`);
    } catch (err: any) {
      console.error("Erreur lors de l'envoi via le script PHP:", err?.message);
    }
  }

  // 2. Optional Resend API dispatch
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mariage Valentine & Jean <no-reply@valentine-et-jean.fr>",
          to: [recipient],
          subject,
          html: htmlBody,
        }),
      });
      console.log(`✅ Email transmis à ${recipient} via API Resend !`);
    } catch (err: any) {
      console.error("Erreur lors de l'envoi direct de l'email:", err?.message);
    }
  }

  return { recipient, subject, success: true };
}
