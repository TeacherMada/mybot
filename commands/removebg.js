const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'removebg',
  description: 'Remove background from an image using the RemoveBG API.',
  author: 'chilli',

  async execute(senderId, args, pageAccessToken, event) {
    let imageUrl = null;

    // Vérification si une image est attachée au message actuel
    if (event.message?.attachments?.[0]?.type === 'image') {
      imageUrl = event.message.attachments[0].payload.url;
    }
    // Vérification si le message est une réponse à un autre message avec une image
    else if (event.message?.reply_to?.mid) {
      imageUrl = await getRepliedImage(event.message.reply_to.mid, pageAccessToken);
    }

    // Si aucune image n'est trouvée
    if (!imageUrl) {
      return sendMessage(senderId, {
        text: '🙏Please send an image first or reply to a message containing an image with "removebg" to remove its background.'
      }, pageAccessToken);
    }

    await sendMessage(senderId, { text: '>>Removing background from the image, please wait... 🖼️' }, pageAccessToken);

    try {
      const removeBgUrl = `https://kaiz-apis.gleeze.com/api/removebg?url=${encodeURIComponent(imageUrl)}`;

      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: removeBgUrl
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Error removing background:', error);
      await sendMessage(senderId, {
        text: 'An error occurred while processing the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};

// Fonction pour récupérer l'image d'un message répondu
async function getRepliedImage(mid, pageAccessToken) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: pageAccessToken }
    });

    if (data?.data?.[0]?.image_data?.url) {
      return data.data[0].image_data.url;
    }
    return null;
  } catch (error) {
    console.error('Error fetching replied image:', error);
    return null;
  }
}