const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'genai',
    description: 'Interact with GPT-4 Turbo',
    usage: 'ai [your message]',
    author: 'coffee',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) return sendMessage(senderId, { text: "Usage: ai <question>" }, pageAccessToken);

        try {
            const apiUrl = `https://zetbot-page.onrender.com/api/unlimited-ai?model=gpt-4-turbo-2024-04-09&system=Tu es TsantaBot créé par Tsanta Rabe. Tu es un assistant en tant que professeur des langues en ligne. si on te demande une aide tu es très sérieux de répondre mais en fin comique&question=${encodeURIComponent(prompt)}`;
            const { data } = await axios.get(apiUrl);

            // Supposons que la réponse de l'API est directement le texte (ajustez si la structure diffère)
            const response = data; 

            const parts = [];

            // Diviser la réponse en morceaux de 1999 caractères max
            for (let i = 0; i < response.length; i += 1999) {
                parts.push(response.substring(i, i + 1999));
            }

            // Envoyer toutes les parties du message
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
        }
    }
};