const { sendMessage } = require('../handles/sendMessage');
import OpenAI from 'openai';

// Configuration de l'API ZukiJourney
const openai = new OpenAI({
  apiKey: 'zu-9fe083eabd5c56b2525827e504047df1',  // Clé API de ZukiJourney
  baseURL: 'https://api.zukijourney.com/v1',
});

module.exports = {
    name: 'ai3',
    description: 'Professeur de langues en ligne avec ZukiJourney',
    usage: 'ai3 [votre question]',
    author: 'tsanta',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ').trim();
        if (!prompt) {
            return sendMessage(senderId, { text: "Usage: ai3 <question>" }, pageAccessToken);
        }

        try {
            // Utilisation de l'API ZukiJourney
            const chatCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "Tu es Tsanta, Professeur de langues en ligne, tu aides les utilisateurs à maîtriser une langue. Pour commencer, demande aux utilisateurs leur choix de langue: Anglais, Français ou Chinois. Ensuite, donne des leçons de niveau débutant jusqu'à avancé (avec explications en Malagasy) pour les aider à bien maîtriser la langue choisie. Tu es aussi un assistant général. Nous sommes à Madagascar, Antananarivo, Contact admin: 0349310268"},
                    {role: "user", content: prompt},
                ],
            });

            const responseText = chatCompletion.choices[0].message.content;

            // Découpage des réponses longues (limite de 1999 caractères)
            const parts = [];
            for (let i = 0; i < responseText.length; i += 1999) {
                parts.push(responseText.substring(i, i + 1999));
            }

            // Envoi des réponses en plusieurs parties si nécessaire
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch (error) {
            console.error('Erreur API:', error);
            sendMessage(senderId, { text: 'Il y a eu une erreur avec l\'assistant. Veuillez réessayer plus tard.' }, pageAccessToken);
        }
    }
};