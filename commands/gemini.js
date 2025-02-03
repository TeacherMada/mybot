const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "gemini2",
  description: "Analyse une image ou répond à une question.",
  usage: "gemini <question> | Répondre à une image",
  author: "developer",

  async execute(senderId, args, pageAccessToken, event, imageUrl) {
    const userPrompt = args.join(" ").trim();

    // Vérification si une image a été envoyée
    if (!userPrompt && !imageUrl && !getAttachmentUrl(event)) {
      return sendMessage(senderId, { text: "❌ Veuillez envoyer une image ou poser une question." }, pageAccessToken);
    }

    // Récupération de l'URL de l'image si disponible
    if (!imageUrl) {
      imageUrl = getAttachmentUrl(event) || (await getRepliedImage(event, pageAccessToken));
    }

    // Vérification et correction de l'URL d'image
    if (imageUrl && !/^https?:\/\//.test(imageUrl)) {
      console.warn("⚠️ URL d'image invalide détectée :", imageUrl);
      imageUrl = "";
    }

    try {
      const apiUrl = `http://sgp1.hmvhostings.com:25721/geminiv`;

      // Création des paramètres à envoyer
      const query = { prompt: userPrompt || "Réponds à toutes les questions nécessaires." };
      if (imageUrl) query.image_url = imageUrl; // Ajouter uniquement si l'image est valide

      console.log("🔍 Requête envoyée à l'API :", apiUrl, query);

      const { data } = await axios.get(apiUrl, { params: query });

      console.log("✅ Réponse API :", data);

      if (!data || !data.response) {
        return sendMessage(senderId, { text: "❌ Réponse invalide de l'API." }, pageAccessToken);
      }

      await sendMessage(senderId, { text: data.response }, pageAccessToken);

    } catch (error) {
      console.error("❌ Erreur API :", error.response?.data || error.message || error);
      const errorMsg = error.response?.data?.detail || error.message || "Erreur inconnue.";
      await sendMessage(senderId, {
        text: `❌ Une erreur est survenue : ${errorMsg}`
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