const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'sdxl',
  description: 'Generate an image using SDXL Realism.',
  usage: 'sdxl [image prompt]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(senderId, { text: '⚠️ Please provide an image prompt.' }, pageAccessToken);
    }

    const apiUrl = `https://zaikyoo-api.onrender.com/api/fluxultra?prompt=${encodeURIComponent(prompt)}`;

    try {
      const response = await axios.get(apiUrl);

      console.log("API Response:", response.data); // Debugging: affiche la réponse API

      if (response.data && response.data.response) {
        const imgUrl = response.data.response;

        if (!imgUrl.startsWith('http')) {
          throw new Error('Invalid image URL received.');
        }

        await sendMessage(senderId, {
          attachment: { type: 'image', payload: { url: imgUrl } }
        }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: '⚠️ The API did not return a valid image. Try again later.' }, pageAccessToken);
      }

    } catch (error) {
      console.error('❌ Error generating image:', error.message || error);
      sendMessage(senderId, { text: '❌ An error occurred while generating the image. Please try again later.' }, pageAccessToken);
    }
  }
};