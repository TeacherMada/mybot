const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "zombie",
  description: "Transforme votre photo en zombie",
  author: "developer",
  usage: "Envoyez une photo puis répondez avec 'zompic'",

  async execute(senderId, args, pageAccessToken, imageUrl) {
    const urlValidation = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

    // Validation de l'image
    if (!imageUrl || !urlValidation.test(imageUrl)) {
      return await sendMessage(senderId, {
        text: "❌ Envoyez d'abord une photo valide (URL http/https) puis tapez 'zompic'"
      }, pageAccessToken);
    }

    // Feedback visuel
    await axios.post(`https://graph.facebook.com/v13.0/me/messages?access_token=${pageAccessToken}`, {
      recipient: { id: senderId },
      sender_action: "typing_on"
    });

    try {
      // Appel API sécurisé
      const { data } = await axios.get(`https://api.kenliejugarap.com/makeazombie/`, {
        params: { imageurl: imageUrl },
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      // Vérification réponse API
      if (!data?.response?.startsWith('http')) {
        throw new Error('Réponse API inattendue');
      }

      // Envoi résultat
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: { url: data.response }
        }
      }, pageAccessToken);

    } catch (error) {
      // Gestion d'erreurs granulaires
      const errorMap = {
        ECONNABORTED: "⌛ Temps de traitement dépassé, réessayez !",
        ENOTFOUND: "🔌 Problème de connexion à l'API",
        ERR_BAD_REQUEST: "🖼️ L'image est invalide ou corrompue"
      };

      await sendMessage(senderId, {
        text: errorMap[error.code] || "❌ Transformation zombie échouée"
      }, pageAccessToken);

    } finally {
      // Désactiver l'indicateur de frappe
      await axios.post(`https://graph.facebook.com/v13.0/me/messages?access_token=${pageAccessToken}`, {
        recipient: { id: senderId },
        sender_action: "typing_off"
      });
    }
  }
};