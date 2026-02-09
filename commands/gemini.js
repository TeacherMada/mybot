const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gemini',
    description: 'Free Google Gemini AI',
    usage: 'gemini [question]',

    async execute(senderId, args) {
        const prompt = args.join(' ');
        if (!prompt) return sendMessage(senderId, { text: 'Ask me anything! Usage: gemini [question]' });

        try {
            // Vérifier la clé API
            if (!process.env.GOOGLE_API_KEY) {
                return sendMessage(senderId, { 
                    text: 'Set GOOGLE_API_KEY first. Get free key: https://makersuite.google.com/app/apikey' 
                });
            }

            // Initialiser
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // Générer
            const result = await model.generateContent(prompt);
            const text = result.response.text();

            // Envoyer (diviser si long)
            for (let i = 0; i < text.length; i += 1900) {
                await sendMessage(senderId, { 
                    text: text.substring(i, i + 1900) 
                });
                await new Promise(resolve => setTimeout(resolve, 300));
            }

        } catch (error) {
            sendMessage(senderId, { 
                text: `Error: ${error.message.includes('quota') ? 'Rate limit' : 'API issue'}. Try again later.` 
            });
        }
    }
};
