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
      return sendMessage(senderId, { text: "❌ Veuillez envoyer une image ou poser une question." }, pageAccessToken);
    }

    // Récupère l'image si elle est attachée ou envoyée en réponse
    if (!imageUrl) {
      imageUrl = getAttachmentUrl(event) || (await getRepliedImage(event, pageAccessToken));
    }

    try {
      // Nouvelle API
      const apiUrl = `http://sgp1.hmvhostings.com:25721/geminiv`;
      const query = {
        prompt: userPrompt || "Réponds à toutes les questions nécessaires.",
        image_url: imageUrl || ""
      };

      console.log("🔍 Requête envoyée à l'API :", apiUrl, query); // Debugging

      const { data } = await axios.get(apiUrl, { params: query });

      console.log("✅ Réponse API :", data); // Affiche la réponse de l'API

      if (!data || !data.response) {
        return sendMessage(senderId, { text: "❌ Impossible de traiter votre demande." }, pageAccessToken);
      }

      await sendMessage(senderId, { text: data.response }, pageAccessToken);

    } catch (error) {
      console.error("❌ Erreur API :", error.response?.data || error.message || error);
      await sendMessage(senderId, {
        text: `❌ Une erreur est survenue : ${error.message}`
      }, pageAccessToken);
    }
  }
};

function getAttachmentUrl(event) {
  const attachment = event.message?.attachments?.[0];
  return attachment?.type === "image" ? attachment.payload.url : null;
}

async function getRepliedImage(event, pageAccessToken) {
  if (event.message?.reply_to?.mid) {
    try {
      const { data } = await axios.get(`https://graph.facebook.com/v21.0/${event.message.reply_to.mid}/attachments`, {
        params: { access_token: pageAccessToken }
      });
      return data?.data?.[0]?.image_data?.url || null;
    } catch (error) {
      console.error("Erreur récupération image :", error.message || error);
      return null;
    }
  }
  return null;
}