const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'flux',
  description: 'Génère une image via l\'API Flux Realism.',
  usage: 'flux [@{model}] [image prompt]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    if (!args.length) {
      return sendMessage(senderId, { text: 'Veuillez fournir un prompt pour l\'image.' }, pageAccessToken);
    }

    // Définir le modèle par défaut
    let model = 4;
    let prompt = args.join(' ').trim();

    // Vérifier si un modèle est spécifié avec la syntaxe "@{model}"
    const modelMatch = prompt.match(/@(\d+)/);
    if (modelMatch) {
      model = modelMatch[1]; // Utiliser le modèle fourni
      prompt = prompt.replace(modelMatch[0], '').trim(); // Retirer la mention du modèle du prompt
    }

    if (!prompt) {
      return sendMessage(senderId, { text: 'Veuillez fournir un prompt valide pour l\'image.' }, pageAccessToken);
    }

    // Informer l'utilisateur que la demande est en cours de traitement
    await sendMessage(senderId, { text: 'Attendez svp, nous traitons votre demande...' }, pageAccessToken);

    const apiUrl = `https://api.zetsu.xyz/api/flux?prompt=${encodeURIComponent(prompt)}&model=${model}`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data.status) {
        const imgUrl = response.data.response;
        await sendMessage(senderId, { attachment: { type: 'image', payload: { url: imgUrl } } }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Échec de la génération de l\'image via l\'API Flux Realism.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'image:', error);
      sendMessage(senderId, { text: 'Une erreur est survenue lors de la génération de l\'image.' }, pageAccessToken);
    }
  }
};