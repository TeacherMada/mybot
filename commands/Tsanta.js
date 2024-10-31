const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'tsanta',
  description: 'Répondre aux questions des utilisateurs et analyser des images',
  author: 'Tata',
  usage: 'llamavision [ta question] ou envoyez une image',

  async execute(senderId, args, imageUrl = null) {
    const pageAccessToken = token;
    const prompt = imageUrl 
      ? 'Analyse cette image' 
      : (args.join(' ') || 'Analyse cette image').trim();
      
    const apiUrl = `https://www.geo-sevent-tooldph.site/api/llamavision?prompt=${encodeURIComponent(prompt)}`;

    // Ajoute l'URL de l'image dans la requête si elle est fournie
    const apiRequest = imageUrl ? `${apiUrl}&imageUrl=${encodeURIComponent(imageUrl)}` : apiUrl;

    try {
      const response = await axios.get(apiRequest);
      const description = response.data.response.description;
      const formattedMessage = `・────llamavision────・\n${description}\n・──── >ᴗ< ────・`;

      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Error: Une erreur inattendue est survenue.' }, pageAccessToken);
    }
  }
};
