const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'nano', // J'ai changé le nom de la commande pour correspondre à l'API
  description: 'Generates an image based on a prompt using Google Nano Banana',
  usage: 'nano-banana [prompt]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝘆𝗼𝘂𝗿 𝗽𝗿𝗼𝗺𝗽𝘁\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: nano-banana 𝗰at.'
      }, pageAccessToken);
      return;
    }

    const prompt = args.join(' ');
    // URL de l'API Nano Banana - ajustez les paramètres si nécessaire
    const apiUrl = `https://norch-project.gleeze.com/api/gemini/nano-banana?prompt=${encodeURIComponent(prompt)}`;

    await sendMessage(senderId, { text: '⌛ Miandrasa kely azafady...😉' }, pageAccessToken);

    try {
      // Appel API pour générer l'image
      const response = await axios.get(apiUrl);

      // IMPORTANT : Vous devez vérifier la structure de la réponse de l'API
      // La réponse pourrait être différente de l'ancienne API
      // Essayez d'abord de logger la réponse pour voir sa structure
      console.log('API Response:', response.data);

      // Extraction de l'URL de l'image - À ADAPTER selon la structure réelle
      // Quelques possibilités selon les APIs d'image courantes :
      const imageUrl = response.data.image_url || 
                       response.data.url || 
                       response.data.image || 
                       response.data.data?.url || 
                       response.data.images?.[0]?.url;

      if (!imageUrl) {
        // Si aucun format ne correspond, affichez la réponse complète pour débogage
        console.error('Unexpected API response structure:', response.data);
        throw new Error('No image URL found in API response');
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
        text: '🚫 Nisy olana tamin\'ny famoronana sary. Andramo indray azafady.'
      }, pageAccessToken);
    }
  }
};
