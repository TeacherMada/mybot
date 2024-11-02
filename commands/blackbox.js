const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'blackbox',
  description: 'Discuter avec ChatGPT via le modèle GPT-4o de Blackbox',
  author: 'Tsanta',
  usage: 'blackbox [ta question]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const input = (args.join(' ') || 'salut').trim();
    const conversationId = '435HGS'; // ID de conversation fixe pour cet exemple
    const model = 'gpt-4o'; // Modèle spécifié dans l'API

    try {
      // Appel à l'API Blackbox
      const response = await axios.get(`https://blackbox-api-chi.vercel.app/api/blackbox`, {
        params: {
          text: input,
          conversationId: conversationId,
          model: model
        }
      });

      const data = response.data;
      const formattedMessage = `🤖: ${data.message || 'Réponse non disponible'}`;

      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Erreur : Une erreur inattendue est survenue.' }, pageAccessToken);
    }
  }
};
