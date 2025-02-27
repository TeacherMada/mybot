const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "zombie",
  description: "Apply a zombie filter to your picture",
  author: "tsanta",
  usage: "Send any picture first then reply zompic",

  async execute(senderId, args, pageAccessToken, imageUrl) {
    // Vérifie si une URL d'image est fournie
    if (!imageUrl) {
      return sendMessage(senderId, {
        text: `❌ Please send an image first, then reply "zompic" to apply the zombie filter.`
      }, pageAccessToken);
    }

    // Notifie l'utilisateur que le traitement est en cours
    await sendMessage(senderId, { text: "⌛ Applying zombie filter, please wait..." }, pageAccessToken);

    try {
      // Appel à l'API avec l'URL de l'image encodée
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`, {
        timeout: 10000 // Timeout de 10 secondes
      });

      // Vérifie que l'API renvoie une URL valide
      const processedImageURL = response.data; // L'API renvoie directement l'URL ou un objet ?
      if (!processedImageURL || typeof processedImageURL !== "string") {
        throw new Error("Invalid response from API");
      }

      // Envoie l'image transformée à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: {
            url: processedImageURL
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error("❌ Error applying zombie filter:", error.message, error.stack);
      await sendMessage(senderId, {
        text: `❌ An error occurred while applying the zombie filter. Please try again later.`
      }, pageAccessToken);
    }
  }
};