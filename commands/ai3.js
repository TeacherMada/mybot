const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
import OpenAI from 'openai';

// Configuration de l'API ZukiJourney
const openai = new OpenAI({
  apiKey: 'zu-9fe083eabd5c56b2525827e504047df1',  // Clé de ZukiJourney
  baseURL: 'https://api.zukijourney.com/v1',
});

module.exports = {
    name: 'ai3',
    description: 'Interact with GPT-4o and ZukiJourney',
    usage: 'ai3 [your message]',
    author: 'tsanta',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sendMessage(senderId, { text: "Usage: ai3 <question>" }, pageAccessToken);
        }

        // Vérifier si la question concerne l'apprentissage des langues
        const isLanguageLearning = /apprendre|langue|cours|français|anglais|chinois/i.test(prompt);

        try {
            let responseText = '';

            if (isLanguageLearning) {
                // Utilisation de l'API ZukiJourney
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {role: "system", content: "Tu es Tsanta, Professeur de langues en ligne, tu aides les utilisateurs pour maîtriser une langue. Pour vous commencer à apprendre, demande aux utilisateurs son choix de langue: Anglais ou Français ou Chinois. Puis donnez des leçons débutant jusqu'à avancé (avec explications en Malagasy) pour que les utilisateurs maîtrisent bien la langue de son choix. Tu es un assistant aussi pour aider. Nous sommes à Madagascar, Antananarivo, Contact admin: 0349310268"},
                        {role: "user", content: prompt},
                    ],
                });

                responseText = chatCompletion.choices[0].message.content;
            } else {
                // Utilisation de l'API Gemini (comme dans ton code original)
                const { data: { response } } = await axios.get(`https://gemini-yvcl.onrender.com/api/ai/chat?prompt=${encodeURIComponent(prompt)}&id=${senderId}`);
                responseText = response;
            }

            // Découpage des réponses longues en morceaux de 1999 caractères
            const parts = [];
            for (let i = 0; i < responseText.length; i += 1999) {
                parts.push(responseText.substring(i, i + 1999));
            }

            // Envoi des réponses découpées
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error('Erreur API:', error);
            sendMessage(senderId, { text: 'Il y a eu une erreur. Veuillez réessayer plus tard.' }, pageAccessToken);
        }
    }
};