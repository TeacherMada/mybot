const axios = require('axios');
const { sendMessage, getLastAttachment } = require('../handles/sendMessage');

module.exports = {
  name: 'post',
  description: 'Publie une image ou une vidéo envoyée sur la page Facebook avec une description',
  usage: '/post <description>',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Please provide a description for the post.\n\nExample: /post This is my new photo!'
      }, pageAccessToken);
      return;
    }

    const description = args.join(' '); // Récupérer la description fournie
    const fbPageId = '61553462575063'; // ID de votre page

    try {
      // Récupérer la dernière pièce jointe envoyée par l'utilisateur
      const lastAttachment = await getLastAttachment(senderId, pageAccessToken);

      if (!lastAttachment || !lastAttachment.url) {
        await sendMessage(senderId, {
          text: '❌ No recent image or video found. Please send a media file first, then reply with /post <description>.'
        }, pageAccessToken);
        return;
      }

      // Vérifier si le fichier est une image ou une vidéo
      let apiEndpoint = 'photos'; // Par défaut, on suppose une image
      if (lastAttachment.type === 'video') {
        apiEndpoint = 'videos'; // Changer l'endpoint si c'est une vidéo
      }

      // Publier l'image ou la vidéo sur la page Facebook
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${fbPageId}/${apiEndpoint}`,
        {
          url: lastAttachment.url,
          caption: description,
          access_token: pageAccessToken
        }
      );

      if (response.data && response.data.id) {
        await sendMessage(senderId, {
          text: '✅ The media has been posted successfully on the page!'
        }, pageAccessToken);
      } else {
        throw new Error('Invalid response from Facebook');
      }
    } catch (error) {
      console.error('Error posting the media:', error);
      await sendMessage(senderId, { text: '❌ Failed to post the media. Please try again.' }, pageAccessToken);
    }
  }
};