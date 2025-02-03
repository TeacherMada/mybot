const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "gemini2",
  description: "Analyse une image ou répond à une question.",
  usage: "gemini <question> | Répondre à une image",
  author: "developer",

  async execute(senderId, args, pageAccessToken, event, imageUrl) {
    const userPrompt = args.join(" ").trim();

    // Vérifie si une question ou une image est fournie
    if (!userPrompt && !imageUrl && !getAttachmentUrl(event)) {
      return sendMessage(senderId, {
        text: "❌ Veuillez envoyer une image ou poser une question."
      }, pageAccessToken);
    }

    // Vérifie et récupère l'image attachée ou en réponse
    if (!imageUrl) {
      imageUrl = getAttachmentUrl(event) || (await getRepliedImage(event, pageAccessToken));
    }

    try {
      // Nouvelle API à utiliser
      const apiUrl = `http://sgp1.hmvhostings.com:25721/geminiv`;
      const query = {
        prompt: userPrompt || "Réponds à toutes les questions nécessaires.",
        image_url: imageUrl || ""
      };

      const { data } = await axios.get(apiUrl, { params: query });

      if (!data || !data.response) {
        return sendMessage(senderId, {
          text: "❌ Impossible de traiter votre demande."
        }, pageAccessToken);
      }

      await sendMessage(senderId, { text: data.response }, pageAccessToken);

    } catch (error) {
      console.error("Erreur:", error.message || error);
      await sendMessage(senderId, {
        text: "❌ Une erreur est survenue."
      }, pageAccessToken);
    }
  }
};

/**
 * Extrait l'URL d'une image attachée dans le message.
 */
function getAttachmentUrl(event) {
  const attachment = event.message?.attachments?.[0];
  return attachment?.type === "image" ? attachment.payload.url : null;
}

/**
 * Récupère l'URL d'une image envoyée en réponse à un message.
 */
async function getRepliedImage(event, pageAccessToken) {
  if (event.message?.reply_to?.mid) {
    try {
      const { data } = await axios.get(`https://graph.facebook.com/v21.0/${event.message.reply_to.mid}/attachments`, {
        params: { access_token: pageAccessToken }
      });
      return data?.data?.[0]?.image_data?.url || null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'image :", error.message || error);
      return null;
    }
  }
  return null;
}