const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Stockage temporaire de l'historique par userId
const userHistories = {};

module.exports = {
    name: 'tsanta',
    description: 'Parler avec TSANTA (Commercial TeacherMada) via API backend',
    usage: 'tsanta [votre message]',
    author: 'TeacherMada',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) {
            return sendMessage(senderId, 
                { text: "Usage: tsanta <votre question>" }, 
                pageAccessToken
            );
        }

        try {
            // Initialiser l'historique pour cet utilisateur si inexistant
            if (!userHistories[senderId]) userHistories[senderId] = [];
            const history = userHistories[senderId];

            // Appel à ton API TSANTA
            const { data } = await axios.post(
                'https://teachermada-agent.onrender.com/api/agent/chat',
                {
                    message: prompt,
                    history: history // envoyer l'historique pour contexte
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const responseText = data.reply || "Pas de réponse.";

            // Ajouter prompt et réponse à l'historique
            history.push({ role: 'user', content: prompt });
            history.push({ role: 'tsanta', content: responseText });

            // Limiter l'historique (ex: 20 derniers échanges)
            if (history.length > 40) history.splice(0, history.length - 40);

            // Découper si message > 2000 caractères (limite Messenger)
            const parts = [];
            for (let i = 0; i < responseText.length; i += 1999) {
                parts.push(responseText.substring(i, i + 1999));
            }

            // Envoyer chaque partie
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error('TSANTA API Error:', error);
            await sendMessage(senderId, 
                { text: '⚠️ Une erreur est survenue. Veuillez réessayer plus tard.' }, 
                pageAccessToken
            );
        }
    }
};
