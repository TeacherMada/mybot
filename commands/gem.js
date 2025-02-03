const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');
const path = require('path');

// Path to the stored image data
const imageFilePath = path.join(__dirname, '../data/Image.json');

module.exports = {
  name: 'gem',
  description: 'Interact with Google Gemini for image recognition or text responses.',
  usage: 'gemini [your message] or send an image link for recognition',
  author: 'Raniel',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    const imageData = JSON.parse(fs.readFileSync(imageFilePath, 'utf8')) || {};
    const imgUrl = imageData[senderId] || '';

    try {
      // Construire l'URL de l'API
      const apiUrl = `https://zaikyoo-api.onrender.com/api/gemini-2-0-exp?prompt=${encodeURIComponent(prompt)}&uid=${senderId}&img=${encodeURIComponent(imgUrl)}`;

      // Appel API
      const response = await axios.get(apiUrl);

      if (response.data && response.data.message) {
        await sendMessage(senderId, { text: `🤖| ${response.data.message}` }, pageAccessToken);
      } else {
        await sendMessage(senderId, { text: "⚠️ Je n'ai pas pu générer de réponse. Réessayez plus tard." }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: "❌ Une erreur s'est produite. Réessayez plus tard." }, pageAccessToken);
    } finally {
      // Nettoyer l’image stockée après utilisation
      if (imgUrl) {
        delete imageData[senderId];
        fs.writeFileSync(imageFilePath, JSON.stringify(imageData, null, 2), 'utf8');
        console.log(`Image supprimée pour l'utilisateur ${senderId}`);
      }
    }
  }
};