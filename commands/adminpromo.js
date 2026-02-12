import { createPromo } from "../services/promo.service.js";

export const name = "adminpromo";

export async function execute(senderId, args, pageAccessToken, sendMessage) {

  if (senderId !== process.env.ADMIN_ID) {
    return sendMessage(senderId, { text: "❌ Accès refusé." }, pageAccessToken);
  }

  const book = args[0];

  if (!book) {
    return sendMessage(senderId, {
      text: "Usage: adminpromo nom-fichier-pdf"
    }, pageAccessToken);
  }

  const promo = createPromo(book);

  await sendMessage(senderId, {
    text: `✅ Code promo généré :

${promo.code}

Envoyez ce code par SMS au client.
Valable 24h et utilisable une seule fois.`
  }, pageAccessToken);
}
