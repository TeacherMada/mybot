const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'sdxl',
  description: 'Generate an image using sdxl Realism.',
  usage: 'sdxl [image prompt]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    if (!prompt) return sendMessage(senderId, { text: 'Provide an image prompt.' }, pageAccessToken);

    const apiUrl = `https://zaikyoo-api.onrender.com/api/fluxultra?prompt=${encodeURIComponent(prompt)}`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data.status) {
        const imgUrl = response.data.response;
        await sendMessage(senderId, { attachment: { type: 'image', payload: { url: imgUrl } } }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Failed to generate image using sdxl Realism API.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      sendMessage(senderId, { text: 'An error occurred while generating the image.' }, pageAccessToken);
    }
  }
};