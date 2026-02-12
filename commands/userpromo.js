import { validatePromo } from "../services/promo.service.js";

export const name = "promo";

export async function execute(senderId, args, pageAccessToken, sendMessage) {

  const code = args[0];

  if (!code) {
    return sendMessage(senderId, {
      text: "Usage: promo CODE \n\n Soraty eto ilay CODE nalefan'ny admin tamin'ny SMS.\n\n Admin Facebook : https://www.facebook.com/tsanta.rabemananjara.2025"
    }, pageAccessToken);
  }

  const result = validatePromo(code);

  if (result.error) {
    return sendMessage(senderId, { text: result.error }, pageAccessToken);
  }

  const link = `${process.env.BASE_URL}/download?token=${result.downloadToken}`;

  await sendMessage(senderId, {
    text: `✅ Paiement confirmé !

Téléchargez votre livre ici :
${link}

⚠️ Lien valide une seule fois.`
  }, pageAccessToken);
}
