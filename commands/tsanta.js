const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'tsanta',
  description: 'TeacherMada AI Agent (Mémoire auto)',
  usage: 'tsanta [message]',
  author: 'TeacherMada',

  async execute(senderId, args, pageAccessToken) {

    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: "💬 Écris ta question après la commande.\n\nExemple:\ntsanta Je veux apprendre anglais" },
        pageAccessToken
      );
    }

    try {

      // 🔥 Appel Backend avec senderId comme mémoire
      const { data } = await axios.get(
        'https://teachermada-agent.onrender.com/api/agent/chat',
        {
          params: {
            message: prompt,
            user_id: senderId   // 🎯 Clé mémoire Facebook
          },
          timeout: 45000,        // ⚡ évite timeout Render sleep
          validateStatus: () => true
        }
      );

      // 🔍 Vérification sécurité
      if (!data || data.success === false || !data.response) {
        console.log("⚠️ Mauvaise réponse backend:", data);
        return sendMessage(
          senderId,
          { text: "⚠️ Le serveur ne répond pas correctement. Réessayez." },
          pageAccessToken
        );
      }

      const fullText = data.response;

      // ✂️ Découpage automatique Messenger (max 2000 char)
      const parts = fullText.match(/.{1,1999}/g) || [];

      for (const part of parts) {
        await sendMessage(
          senderId,
          { text: part },
          pageAccessToken
        );
      }

    } catch (error) {

      console.log("❌ ERREUR AXIOS:");
      console.log(error.message);

      return sendMessage(
        senderId,
        { text: "❌ Erreur système. Réessayez dans quelques secondes." },
        pageAccessToken
      );
    }
  }
};
