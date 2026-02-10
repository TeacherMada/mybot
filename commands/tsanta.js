const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'tsanta',
  description: 'TeacherMada AI',
  author: 'TeacherMada',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "Posez votre question 😊" }, pageAccessToken);
    }

    try {
      const { data } = await axios.get(
        'https://teachermada-agent.onrender.com/api/agent/chat',
        {
          params: {
            message: prompt,
            user_id: senderId // 🔥 mémoire AUTO
          },
          timeout: 20000
        }
      );

      if (!data.success) {
        return sendMessage(senderId, { text: '⚠️ Erreur du serveur.' }, pageAccessToken);
      }

      // Messenger limite = 2000 chars
      const text = data.response;
      for (let i = 0; i < text.length; i += 1999) {
        await sendMessage(
          senderId,
          { text: text.substring(i, i + 1999) },
          pageAccessToken
        );
      }

    } catch (err) {
      console.error('Messenger TSANTA Error:', err.message);
      await sendMessage(
        senderId,
        { text: '❌❌ Erreur système. Réessayez plus tard.' },
        pageAccessToken
      );
    }
  }
};
