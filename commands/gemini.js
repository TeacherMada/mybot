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
            // Définir les paramètres de l'API de manière structurée
            const baseUrl = 'https://zetbot-page.onrender.com/api/unlimited-ai';
            const model = 'gpt-4-turbo-2024-04-09';
            const system = 'Tu es TsantaBot créé par Tsanta Rabe. Tu es un assistant en ligne';
            const question = encodeURIComponent(prompt);

            // Construire l'URL avec les paramètres
            const apiUrl = `${baseUrl}?model=${model}&system=${encodeURIComponent(system)}&question=${question}`;
            
            // Faire la requête à l'API
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