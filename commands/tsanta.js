const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'tsanta',
  description: 'TeacherMada AI Agent',
  usage: 'tsanta [message]',
  author: 'TeacherMada',

  async execute(senderId, args, pageAccessToken) {

    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: "💬 Écris ta question après la commande." },
        pageAccessToken
      );
    }

    try {

      const { data } = await axios.get(
        'https://teachermada-agent.onrender.com/api/agent/chat',
        {
          params: {
            message: prompt,
            id: senderId
          },
          timeout: 45000
        }
      );

      console.log("✅ BACKEND RESPONSE:", data);

      // 🔥 Compatibilité totale
      const replyText =
        data?.response ||
        data?.reply ||
        data?.message ||
        null;

      if (!replyText) {
        console.log("❌ Mauvais format:", data);
        return sendMessage(
          senderId,
          { text: "⚠️ Réponse serveur invalide." },
          pageAccessToken
        );
      }

      // ✂️ Découpage Messenger
      const parts = replyText.match(/.{1,1999}/g) || [];

      for (const part of parts) {
        await sendMessage(senderId, { text: part }, pageAccessToken);
      }

    } catch (error) {
      console.log("❌ AXIOS ERROR:", error.message);
      if (error.response) {
        console.log("❌ RESPONSE DATA:", error.response.data);
      }

      return sendMessage(
        senderId,
        { text: "❌🗨️ Erreur système. Réessayez.👍" },
        pageAccessToken
      );
    }
  }
};
