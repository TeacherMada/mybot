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
      // URL corrigée avec le bon endpoint
      const apiUrl = `https://zetbot-page.onrender.com/api/gemini?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      
      const { data } = await axios.get(apiUrl);

      // Vérifiez la structure de la réponse ici
      if (!data?.reply) {
        throw new Error(`Réponse inattendue : ${JSON.stringify(data)}`);
      }

      sendMessage(senderId, { text: data.reply }, pageAccessToken);
      
    } catch (error) {
      // Log détaillé
      console.error("Erreur API:", error.response?.data || error.message);
      sendMessage(senderId, { text: 'Erreur : réponse non générée' }, pageAccessToken);
    }
  }
};