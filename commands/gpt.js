const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt',
  description: 'Interact with GPT-4o',
  usage: 'gpt [your message]',
  author: 'tsanta',
  
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    
    if (!prompt) {
      return sendMessage(senderId, { text: "🚦 Veuillez poser une question après la commande /gpt" }, pageAccessToken);
    }

    try {
      // 1. Configuration robuste de la requête
      const apiUrl = new URL('https://zetbot-page.onrender.com/api/gemini');
      apiUrl.searchParams.append('prompt', prompt);
      apiUrl.searchParams.append('uid', senderId);
      apiUrl.searchParams.append('source', 'facebook-bot'); // Nouveau paramètre

      const config = {
        headers: {
          'Authorization': `Bearer ${process.env.API_SECRET}`, // Si nécessaire
          'Content-Type': 'application/json',
          'Accept-Version': '1.0.0'
        },
        timeout: 15000,
        validateStatus: (status) => status < 500
      };

      // 2. Journalisation de débogage
      console.log(`[DEBUG] Request to API: ${apiUrl.href}`);

      const response = await axios.get(apiUrl.href, config);
      
      // 3. Gestion des erreurs HTTP personnalisées
      if (response.data?.status === 'FAIL') {
        throw new Error(`API Error: ${response.data.error}`);
      }

      // 4. Vérification renforcée de la réponse
      const reply = response.data?.reply || response.data?.response?.output;
      
      if (!reply) {
        console.error('[ERROR] Structure de réponse inconnue:', JSON.stringify(response.data));
        return sendMessage(senderId, { text: "⚠️ Erreur de format de réponse" }, pageAccessToken);
      }

      // 5. Envoi progressif avec gestion des limites
      const messageChunks = reply.match(/[\s\S]{1,1900}/g) || [];
      for (const chunk of messageChunks) {
        await sendMessage(senderId, { text: chunk }, pageAccessToken);
        await new Promise(resolve => setTimeout(resolve, 300)); // Anti-flood
      }

    } catch (error) {
      // 6. Gestion d'erreur granulaire
      console.error(`[CRITICAL] ${error.code} | ${error.message}`, {
        config: error.config,
        response: error.response?.data
      });

      // 7. Messages d'erreur contextuels
      const errorMapping = {
        ECONNABORTED: "⌛ Le service met trop de temps à répondre",
        ERR_BAD_REQUEST: "🔧 Configuration API incorrecte",
        ERR_BAD_RESPONSE: "📛 Réponse corrompue du serveur",
        Quota: "💸 Quota API épuisé - contactez l'administrateur"
      };

      const userMessage = Object.entries(errorMapping).find(([key]) => 
        error.message.includes(key)
      )?.[1] || "❌ Problème technique imprévu";

      await sendMessage(senderId, { text: userMessage }, pageAccessToken);
    }
  }
};