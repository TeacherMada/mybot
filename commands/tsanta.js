const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'tsanta',
    description: 'Interact with TeacherMada Agent',
    usage: 'tsanta [your message]',
    author: 'TeacherMada',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, { text: "Usage: tsanta <votre question>" }, pageAccessToken);
        }

        try {
            // Appel à ton API GET
            const { data } = await axios.get('https://teachermada-agent.onrender.com/api/agent/chat', {
                params: {
                    message: prompt,
                    user_id: senderId
                }
            });

            if (!data || !data.response) {
                return sendMessage(senderId, { text: '⚠️ Pas de réponse du serveur.' }, pageAccessToken);
            }

            // Découpe en morceaux si trop long pour Messenger
            const chunks = [];
            for (let i = 0; i < data.response.length; i += 1999) {
                chunks.push(data.response.substring(i, i + 1999));
            }

            // Envoi séquentiel
            for (const chunk of chunks) {
                await sendMessage(senderId, { text: chunk }, pageAccessToken);
            }

        } catch (error) {
            console.error('⚠️ TSANTA Bot Error:', error.message);
            await sendMessage(senderId, { text: 'Erreur système. Réessayez plus tard.' }, pageAccessToken);
        }
    }
};
