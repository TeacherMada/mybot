import { createPromo } from "../services/promo.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = "admin";

// Liste des Admins autorisés (peut être plusieurs séparés par une virgule)
const ADMINS = (process.env.ADMIN_ID || "")
  .split(",")
  .map(a => a.trim());

export async function execute(senderId, args, pageAccessToken, sendMessage) {
  // Vérification admin
  if (!ADMINS.includes(senderId.toString())) {
    return sendMessage(senderId, { text: "❌ Accès refusé." }, pageAccessToken);
  }

  // Commande list
  if (args[0] && args[0].toLowerCase() === "list") {
    const pdfDir = path.join(__dirname, "../pdf");
    const files = fs.readdirSync(pdfDir).filter(f => f.endsWith(".pdf"));

    if (!files.length) {
      return sendMessage(senderId, { text: "📂 Aucun livre disponible actuellement." }, pageAccessToken);
    }

    const listText = files.map(f => `- ${f}`).join("\n");

    return sendMessage(senderId, { text: `📚 Liste des livres disponibles :\n${listText}` }, pageAccessToken);
  }

  // Création promo pour un livre spécifique
  const book = args[0];
  if (!book) {
    return sendMessage(senderId, {
      text: "Usage:\nadminpromo list → Voir tous les livres\nadminpromo nom-fichier.pdf → Créer un code promo"
    }, pageAccessToken);
  }

  // Vérifier si le livre existe
  const pdfPath = path.join(__dirname, "../pdf", book);
  if (!fs.existsSync(pdfPath)) {
    return sendMessage(senderId, { text: `❌ Livre non trouvé: ${book}` }, pageAccessToken);
  }

  const promo = createPromo(book);

  await sendMessage(senderId, {
    text: `✅ Code promo généré pour "${book}":\n\n${promo.code}\n\nEnvoyez ce code au client. Valable 24h et utilisable une seule fois.`
  }, pageAccessToken);
}
