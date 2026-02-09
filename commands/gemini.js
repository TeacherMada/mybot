const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gemini',
    description: 'Interact with Google Gemini AI',
    usage: 'gemini [your message]',
    author: 'TeacherMada',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) return sendMessage(senderId, { text: "Usage: gemini <question>" }, pageAccessToken);

        try {
            // Récupérer la clé API depuis les variables d'environnement
            const apiKey = process.env.GEMINI_API_KEY;
            
            if (!apiKey) {
                return sendMessage(senderId, { text: 'API key not configured. Please contact the administrator.' }, pageAccessToken);
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const result = await model.generateContent(prompt);
            const response = result.response.text();

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
            console.error('Gemini API Error:', error);
            sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
        }
    }
};
