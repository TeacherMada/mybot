const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'flux',
  description: 'Generate an image using Flux Realism API.',
  usage: 'flux [image prompt]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    if (!prompt)
      return sendMessage(senderId, { text: 'Provide an image prompt.' }, pageAccessToken);

    // Informer l'utilisateur que la demande est en cours de traitement
    await sendMessage(senderId, { text: "Attendez svp !" }, pageAccessToken);

    // Utilisation du nouvel endpoint API avec le modèle 4
    const apiUrl = `https://api.zetsu.xyz/api/flux?prompt=${encodeURIComponent(prompt)}&model=4`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data.status) {
        const imgUrl = response.data.response;
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: { url: imgUrl }
          }
        }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Failed to generate image using Flux Realism API.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      sendMessage(senderId, { text: 'An error occurred while generating the image.' }, pageAccessToken);
    }
  }
};