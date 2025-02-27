const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'zombie',
  description: 'Transforme une image en style zombie',
  usage: 'zombie [URL de l’image]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    // Vérifier si une URL d'image est fournie
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Veuillez fournir une URL d’image.\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: zombie https://exemple.com/image.jpg'
      }, pageAccessToken);
      return;
    }

    // Récupérer l'URL de l'image
    const imageUrl = args[0];  
    const apiUrl = `https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`;

    // Informer l'utilisateur que la transformation est en cours
    await sendMessage(senderId, { text: '🧟‍♂️ Transformation en zombie en cours...' }, pageAccessToken);

    try {
      // Envoyer l'image transformée à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: apiUrl
          }
        }
      }, pageAccessToken);
    } catch (error) {
      console.error('Erreur lors de la transformation en zombie:', error);

      // Envoyer un message d'erreur à l'utilisateur
      await sendMessage(senderId, {
        text: '❌ Une erreur est survenue lors de la transformation. Veuillez réessayer avec une autre image.'
      }, pageAccessToken);
    }
  }
};