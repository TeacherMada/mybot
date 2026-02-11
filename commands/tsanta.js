const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'tsanta',
  description: 'TeacherMada AI',
  author: 'TeacherMada',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: "Posez votre question 😊" },
        pageAccessToken
      );
    }

    try {
      const response = await axios.get(
        'https://teachermada-agent.onrender.com/api/agent/chat',
        {
          params: {
            message: prompt,
            user_id: senderId
          },
          timeout: 30000 // 🔥 important
        }
      );

      const data = response.data;

      if (!data || !data.success || !data.response) {
        console.log("Réponse invalide:", data);
        return sendMessage(
          senderId,
          { text: "⚠️ Serveur indisponible." },
          pageAccessToken
        );
      }

      const text = data.response;

      // découpage Messenger (max 2000)
      for (let i = 0; i < text.length; i += 1999) {
        await sendMessage(
          senderId,
          { text: text.substring(i, i + 1999) },
          pageAccessToken
        );
      }

    } catch (error) {
      console.error("TSANTA ERROR FULL:", error.response?.data || error.message);

      await sendMessage(
        senderId,
        { text: "❌ Erreur système. Réessayez plus tard." },
        pageAccessToken
      );
    }
  }
};
