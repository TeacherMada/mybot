const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt',
  description: 'Interact with GPT-4o',
  usage: 'gpt [your message]',
  author: 'tsanta',
  
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "Usage: gpt <question ou message>" }, pageAccessToken);
    }

    try {
      const apiUrl = `https://zaikyoo-api.onrender.com/api/4ov2?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.gemini) {
        throw new Error("Réponse invalide de l'API.");
      }

      sendMessage(senderId, { text: data.gemini }, pageAccessToken);
      
    } catch (error) {
      console.error("Erreur dans la commande GPT :", error);
      sendMessage(senderId, { text: 'Erreur lors de la génération de la réponse. Réessayez plus tard.' }, pageAccessToken);
    }
  }
};