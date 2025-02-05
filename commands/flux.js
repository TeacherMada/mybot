const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'flux',
  description: 'Generate an image using Flux Realism API.',
  usage: 'flux [@{model}] [image prompt]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: 'Provide an image prompt.' }, pageAccessToken);
    }

    // Extraire le modèle si spécifié avec @
    let model = 4; // Modèle par défaut
    let prompt = args.join(' ').trim();
    const modelMatch = prompt.match(/@(\d+)/);

    if (modelMatch) {
      model = modelMatch[1]; // Extraire le numéro du modèle
      prompt = prompt.replace(modelMatch[0], '').trim(); // Supprimer le @model du prompt
    }

    if (!prompt) {
      return sendMessage(senderId, { text: 'Provide a valid image prompt.' }, pageAccessToken);
    }

    const apiUrl = `https://api.zetsu.xyz/api/flux?prompt=${encodeURIComponent(prompt)}&model=${model}`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data.status) {
        const imgUrl = response.data.response;
        await sendMessage(senderId, { attachment: { type: 'image', payload: { url: imgUrl } } }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Failed to generate image using Flux Realism API.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      sendMessage(senderId, { text: 'An error occurred while generating the image.' }, pageAccessToken);
    }
  }
};