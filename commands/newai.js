const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'newai',
  description: 'Chat with GPT-4o and receive text + audio response',
  usage: 'gpt4 <message>',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "Usage: gpt4 <question ou message>" }, pageAccessToken);
    }

    try {
      // Requête à l'API GPT-4o pour obtenir la réponse en texte
      const apiUrl = `https://zaikyoo-api.onrender.com/api/4ov2?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.reply) {
        throw new Error("Réponse invalide de l'API.");
      }

      // Envoyer la réponse texte
      await sendMessage(senderId, { text: data.reply }, pageAccessToken);

      // Générer l'URL pour l'audio de la réponse
      const ttsUrl = `https://zaikyoo-api.onrender.com/api/tts?text=${encodeURIComponent(data.reply)}`;

      // Envoyer l'audio
      await sendMessage(senderId, {
        attachment: {
          type: 'audio',
          payload: {
            url: ttsUrl
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error("Erreur dans la commande GPT-4 :", error);
      sendMessage(senderId, { text: 'Erreur lors de la génération de la réponse. Réessayez plus tard.' }, pageAccessToken);
    }
  }
};