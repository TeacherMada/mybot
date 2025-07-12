const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'sdxl',
  description: 'Generates an image based on a prompt using 4gen AI',
  usage: 'sdxl [prompt]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝘆𝗼𝘂𝗿 𝗽𝗿𝗼𝗺𝗽𝘁\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: sdxl 𝗰at.'
      }, pageAccessToken);
      return;
    }

    const prompt = args.join(' ');
    const apiUrl = `https://kaiz-apis.gleeze.com/api/4gen?prompt=${encodeURIComponent(prompt)}&ratio=9:16&stream=false&apikey=4fbe737b-9f02-4151-9290-34e3d83c7c4f`;

    await sendMessage(senderId, { text: '⌛ Miandrasa kely azafady...😉' }, pageAccessToken);

    try {
      // Appel API pour générer l'image
      const response = await axios.get(apiUrl);

      // Vérifier et extraire image_url depuis la réponse
      const imageUrl = response.data.image_url;

      if (!imageUrl) {
        throw new Error('No image_url found in API response');
      }

      // Envoyer l'image à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Error generating image:', error.message);

      await sendMessage(senderId, {
        text: '🚫 Nisy olana tamin’ny famoronana sary. Andramo indray azafady.'
      }, pageAccessToken);
    }
  }
};
