const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'zombie',
  description: 'Transforme une image en style zombie',
  usage: 'Répondez à une image avec le mot "zombie"',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken, message) {
    let imageUrl = null;

    // Vérifier si l'utilisateur répond à un message contenant une image
    if (message && message.message && message.message.reply_to) {
      const repliedMessage = message.message.reply_to;
      if (repliedMessage.attachments && repliedMessage.attachments.length > 0) {
        const attachment = repliedMessage.attachments[0];
        if (attachment.type === 'image') {
          imageUrl = attachment.payload.url;
        }
      }
    }

    // Vérifier si une image est trouvée
    if (!imageUrl) {
      await sendMessage(senderId, {
        text: '❌ Veuillez répondre à une image avec le mot "zombie".\n\n📌 Astuce : Envoyez une image, puis répondez à cette image en écrivant "zombie".'
      }, pageAccessToken);
      return;
    }

    // Construire l'URL de l'API avec l'image
    const apiUrl = `https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`;

    // Informer l'utilisateur que la transformation est en cours
    await sendMessage(senderId, { text: '🧟‍♂️ Transformation en zombie en cours...⏰' }, pageAccessToken);

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