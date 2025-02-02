const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'post',
  description: 'Publie une image sur la page Facebook',
  usage: '/post <image_url>',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Please provide a valid image URL.\n\nExample: /post https://example.com/image.jpg'
      }, pageAccessToken);
      return;
    }

    const imageUrl = args[0]; // URL de l'image
    const fbPageId = '61553462575063'; // ID de votre page

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${fbPageId}/photos`,
        {
          url: imageUrl,
          published: true,
          access_token: pageAccessToken
        }
      );

      if (response.data && response.data.id) {
        await sendMessage(senderId, { text: '✅ The image has been posted successfully!' }, pageAccessToken);
      } else {
        throw new Error('Invalid response from Facebook');
      }
    } catch (error) {
      console.error('Error posting the image:', error);
      await sendMessage(senderId, { text: '❌ Failed to post the image. Please try again.' }, pageAccessToken);
    }
  }
};