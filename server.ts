/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  initDatabase,
  getAllFamiliesWithMembers,
  searchFamilies,
  submitRSVP,
  getStats,
  getAllRSVPs,
  getDbFilePath,
  saveDatabaseToDisk,
  updateFamilyInvitations,
  clearAllRSVPs,
} from "./server/db";
import { sendRSVPNotificationEmail } from "./server/mailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize SQLite wedding.db database
  await initDatabase();

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: "wedding.db active" });
  });

  // Get all families or search by query
  app.get("/api/families", (req, res) => {
    try {
      const { q } = req.query;
      if (typeof q === "string" && q.trim()) {
        const results = searchFamilies(q);
        return res.json(results);
      }
      const families = getAllFamiliesWithMembers();
      res.json(families);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Submit RSVP and save to SQLite wedding.db + transmit email to valentinetjean@etik.com
  app.post("/api/rsvp", async (req, res) => {
  try {
    const { familyId, familyName, email, message, members } = req.body;
    if (!familyName || !email || !Array.isArray(members)) {
      return res
        .status(400)
        .json({ error: "Champs requis manquants (familyName, email, members)" });
    }
    const result = submitRSVP({ familyId, familyName, email, message, members });

    // Transmit response notification email to valentinetjean@etik.com
    sendRSVPNotificationEmail({ familyName, email, message, members }).catch((err) => {
      console.error("Erreur envoi notification email RSVP:", err);
    });

    res.json({
      success: true,
      message: "Réponse enregistrée avec succès et transmise à valentinetjean@etik.com !",
      result,
    });
  } catch (err: any) {
    console.error("Erreur enregistrement RSVP dans wedding.db:", err);
    res.status(500).json({ error: err.message });
  }
});

  // Update invitation scopes (Vin / Repas / Brunch) for a family
  app.post("/api/admin/update-invitation", (req, res) => {
    try {
      const { familyId, invitedVin, invitedRepas, invitedBrunch } = req.body;
      if (!familyId) {
        return res.status(400).json({ error: "familyId requis" });
      }
      const result = updateFamilyInvitations(
        familyId,
        Boolean(invitedVin),
        Boolean(invitedRepas),
        Boolean(invitedBrunch)
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear all RSVPs and reset database responses
  app.post("/api/admin/clear-rsvps", (req, res) => {
    try {
      const result = clearAllRSVPs();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get registry gifts JSON data (scraped / updated periodically from Millemercis)
  app.get("/api/registry", (req, res) => {
    try {
      const jsonPath = path.join(process.cwd(), "src", "data", "registry_gifts.json");
      if (require("fs").existsSync(jsonPath)) {
        const data = require("fs").readFileSync(jsonPath, "utf-8");
        return res.json(JSON.parse(data));
      }
      res.status(404).json({ error: "Fichier registry_gifts.json introuvable" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update registry gifts JSON data (for Millemercis scraper script running every 5 minutes)
  app.post("/api/registry", (req, res) => {
    try {
      const jsonPath = path.join(process.cwd(), "src", "data", "registry_gifts.json");
      const gifts = req.body;
      if (!Array.isArray(gifts)) {
        return res.status(400).json({ error: "Tableau de cadeaux valide requis" });
      }
      require("fs").writeFileSync(jsonPath, JSON.stringify(gifts, null, 2), "utf-8");
      res.json({ success: true, message: "Mise à jour des financements Millemercis réussie !" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Real-time guest & event statistics
  app.get("/api/stats", (req, res) => {
    try {
      const stats = getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all RSVP logs
  app.get("/api/rsvps", (req, res) => {
    try {
      const rsvps = getAllRSVPs();
      res.json(rsvps);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Download raw wedding.db binary SQLite file for OVHcloud / local backups
  app.get("/api/admin/download-db", (req, res) => {
    try {
      saveDatabaseToDisk();
      const filePath = getDbFilePath();
      res.download(filePath, "wedding.db");
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Export CSV for caterer / wedding planner
  app.get("/api/admin/export-csv", (req, res) => {
    try {
      const families = getAllFamiliesWithMembers();
      let csv =
        "Famille,Prénom,Nom,Statut,Âge,Présent,Vin d'Honneur,Repas de Noces,Brunch,Régime/Allergies,Email\n";

      families.forEach((fam) => {
        fam.members.forEach((m: any) => {
          csv += `"${fam.familyName}","${m.firstName}","${m.lastName}","${
            m.isChild ? "Enfant" : "Adulte"
          }","${m.age || ""}","${m.isAttending ? "Oui" : "Non"}","${
            m.events.vinHonneur ? "Oui" : "Non"
          }","${m.events.repasNoces ? "Oui" : "Non"}","${
            m.events.brunchLendemain ? "Oui" : "Non"
          }","${m.dietaryNotes || ""}","${fam.email || ""}"\n`;
        });
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="liste_invites_mariage.csv"'
      );
      res.status(200).send("\uFEFF" + csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[Mariage Server] Serveur démarré avec SQLite wedding.db sur http://localhost:${PORT}`
    );
  });
}

startServer();
