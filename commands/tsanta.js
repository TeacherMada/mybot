const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'tsanta',
    description: 'TeacherMada AI Agent',

    async execute(senderId, args, pageAccessToken) {

        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, { text: "Soraty ny fanontanianao 😊" }, pageAccessToken);
        }

        try {

            const { data } = await axios.get(
                'https://teachermada-agent.onrender.com/api/agent/chat',
                {
                    params: {
                        prompt: prompt,
                        id: senderId
                    }
                }
            );

            if (!data.success) {
                return sendMessage(senderId, { text: "⚠️ Tsy nahazo valiny avy amin'ny serveur." }, pageAccessToken);
            }

            // 🔥 Convert escaped \n to real line breaks
            const cleanText = data.response.replace(/\\n/g, '\n');

            // 🔥 Send ONE message only
            await sendMessage(senderId, { text: cleanText }, pageAccessToken);

        } catch (error) {
            console.error("❌ Messenger Error:", error.response?.data || error.message);

            await sendMessage(senderId, {
                text: "❌ Erreur système. Réessayez plus tard.👍"
            }, pageAccessToken);
        }
    }
};
