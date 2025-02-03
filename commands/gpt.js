const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt',
  description: 'Interact with GPT-4o',
  usage: 'gpt [your message]',
  author: 'tsanta',
  
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "❌ Usage: gpt <votre question>" }, pageAccessToken);
    }

    try {
      // 1. Construction sécurisée de l'URL
      const apiUrl = new URL('https://zetbot-page.onrender.com/api/gemini');
      apiUrl.searchParams.append('prompt', prompt);
      apiUrl.searchParams.append('uid', senderId);

      // 2. Ajout de headers et vérification de la méthode HTTP
      const config = {
        headers: {
          'User-Agent': 'FacebookBot/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 secondes timeout
      };

      console.log(`🌐 Appel de l'API : ${apiUrl.toString()}`);
      
      const response = await axios.get(apiUrl.toString(), config);
      const data = response.data;

      // 3. Journalisation complète pour débogage
      console.log('🔍 Réponse brute de l\'API:', JSON.stringify(data, null, 2));

      // 4. Vérification approfondie de la structure de réponse
      if (!data?.reply) {
        throw new Error(`Structure de réponse inattendue : ${JSON.stringify(data)}`);
      }

      // 5. Découpage des réponses longues pour Messenger
      const MAX_LENGTH = 2000;
      if (data.reply.length > MAX_LENGTH) {
        const chunks = [];
        for (let i = 0; i < data.reply.length; i += MAX_LENGTH) {
          chunks.push(data.reply.substring(i, i + MAX_LENGTH));
        }
        for (const chunk of chunks) {
          await sendMessage(senderId, { text: chunk }, pageAccessToken);
        }
      } else {
        await sendMessage(senderId, { text: data.reply }, pageAccessToken);
      }

    } catch (error) {
      // 6. Journalisation détaillée des erreurs
      console.error('🔥 Erreur critique:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });

      // 7. Envoi d'un message d'erreur contextuel
      const errorMessage = error.response?.status === 429 
        ? '🔄 Trop de demandes. Merci de patienter 1 minute.'
        : '❌ Erreur technique. Notre équipe a été notifiée.';

      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};