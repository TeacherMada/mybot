const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'story',
  description: 'Publie une story sur la page Facebook',
  usage: '/story <image_url>',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝗮 𝘃𝗮𝗹𝗶𝗱 𝗶𝗺𝗮𝗴𝗲 𝗼𝗿 𝘃𝗶𝗱𝗲𝗼 𝗨𝗥𝗟\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: /story https://example.com/image.jpg'
      }, pageAccessToken);
      return;
    }

    const mediaUrl = args[0]; // URL de l'image ou de la vidéo
    const fbPageId = '61553462575063'; // Remplacez par l'ID de votre page

    try {
      // Envoi de la story à l'API Graph Facebook
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${fbPageId}/stories`,
        {
          file_url: mediaUrl,
          access_token: pageAccessToken
        }
      );

      // Vérification de la réponse
      if (response.data && response.data.id) {
        await sendMessage(senderId, {
          text: '✅ 𝗧𝗵𝗲 𝘀𝘁𝗼𝗿𝘆 𝗵𝗮𝘀 𝗯𝗲𝗲𝗻 𝗽𝗼𝘀𝘁𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆!'
        }, pageAccessToken);
      } else {
        throw new Error('Réponse invalide de Facebook');
      }
    } catch (error) {
      console.error('Erreur lors de la publication de la story :', error);
      await sendMessage(senderId, {
        text: '❌ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗽𝗼𝘀𝘁 𝘁𝗵𝗲 𝘀𝘁𝗼𝗿𝘆. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻.'
      }, pageAccessToken);
    }
  }
};