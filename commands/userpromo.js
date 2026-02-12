import { validatePromo, markPromoUsed } from "../services/promo.service.js";
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = "promo";

export async function execute(senderId, args, pageAccessToken, sendMessage) {
  const code = args[0];

  if (!code) {
    return sendMessage(senderId, {
      text: "Usage: promo CODE\n\nEntrez ici le CODE envoyé par l'admin via SMS.\n\nAdmin Facebook : https://www.facebook.com/tsanta.rabemananjara.2025"
    }, pageAccessToken);
  }

  // Vérification code promo
  const result = validatePromo(code);

  if (result.error) {
    return sendMessage(senderId, { text: result.error }, pageAccessToken);
  }

  // Récupération fichier PDF
  const pdfPath = path.join(__dirname, "../pdf", result.book);
  if (!fs.existsSync(pdfPath)) {
    return sendMessage(senderId, { text: `❌ Livre non trouvé: ${result.book}` }, pageAccessToken);
  }

  // Envoyer PDF via Messenger
  try {
    const fileStream = fs.createReadStream(pdfPath);

    const formData = new FormData();
    formData.append("recipient", JSON.stringify({ id: senderId }));
    formData.append("message", JSON.stringify({ attachment: { type: "file", payload: {} } }));
    formData.append("filedata", fileStream, result.book);

    await axios.post(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`,
      formData,
      { headers: formData.getHeaders() }
    );

    // Marquer le code promo comme utilisé
    markPromoUsed(code);

    await sendMessage(senderId, {
      text: `✅ Votre PDF "${result.book}" a été envoyé !\n🙏 Merci pour votre confiance.\n\n 🧑🏻‍🎓 Je suis toujours là si vous voulez d'autres choses..`
    }, pageAccessToken);

  } catch (error) {
    console.error("❌ Error sending PDF:", error.message);
    return sendMessage(senderId, { text: "Erreur lors de l'envoi du PDF. Réessayez plus tard." }, pageAccessToken);
  }
}
