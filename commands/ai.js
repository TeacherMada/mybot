const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'ai',
  description: 'Discuter avec Gemini 2.5 Flash',
  author: 'Tata',
  usage:'ai [ta question]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const input = (args.join(' ') || 'salut').trim();

    try {
      const response = await axios.get(
        `https://norch-project.gleeze.com/api/gemini?prompt=${encodeURIComponent(input)}`
      );
      
      // Supposant que l'API retourne un objet avec une propriété 'response' ou 'text'
      // Vous devrez peut-être ajuster cela selon le format réel de la réponse
      const data = response.data;
      
      // Formatage de la réponse selon la structure de l'API
      // Si l'API retourne directement le texte:
      const responseText = data.response || data.text || data.message || data;
      const formattedMessage = `🤖| ${responseText}`;

      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Error: Unexpected error.' }, pageAccessToken);
    }
  }
};
