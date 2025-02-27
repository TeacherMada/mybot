const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'genvideo',
  description: 'Génère une vidéo basée sur un prompt',
  usage: 'genVideo [prompt]',
  author: 'Tsanta',

  async execute(senderId, args, pageAccessToken) {
    // Vérifier si un prompt est fourni
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Veuillez fournir une description.\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: genVideo un chat qui court.'
      }, pageAccessToken);
      return;
    }

    // Construire le prompt et l'URL de l'API
    const prompt = args.join(' ');
    const apiUrl = `https://zaikyoo-api.onrender.com/api/cogvideox-flash?prompt=${encodeURIComponent(prompt)}`;

    // Informer l'utilisateur que la vidéo est en cours de génération
    await sendMessage(senderId, { text: '⏰ Génération en cours... (cela peut prendre quelques minutes)' }, pageAccessToken);

    try {
      // Envoyer la vidéo générée à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: apiUrl
          }
        }
      }, pageAccessToken);
    } catch (error) {
      console.error('Erreur lors de la génération de la vidéo:', error);

      // Envoyer un message d'erreur à l'utilisateur
      await sendMessage(senderId, {
        text: '❌ Une erreur est survenue lors de la génération de la vidéo. Veuillez réessayer plus tard.'
      }, pageAccessToken);
    }
  }
};