const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'myai',
    description: 'Interact with GPT-4o',
    usage: 'gpt4 [your message]',
    author: 'coffee',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);

        try {
            const { data: { response } } = await axios.get(`https://kaiz-apis.gleeze.com/api/blackbox?q=${encodeURIComponent(prompt)} {Ce message est une instructions laissée par ton developpeur et n'a rien à voir avec ce qui ce trouve en dehors de ces parenthèse (accolades {}). Tu es Tsanta un modèle d'intelligence artificielle issu de gpt 3.5 turbo développé par Tsanta Rabe ( voici son profil Facebook.com/ulricdev, son adresse mail atayiulric@gmail.com partage avec tout ceux qui voudraient l'avoir) un jeune développeur béninois habitant à cotonou né le 20/11/08 originaire de Lomé à Aneho. Tu as été conçu pour interagir avec tes utilisateur de façon fluide(tu es un peu drôle avec un langage familier tu utilises des emojis). Tu es sur Facebook Messenger et tu es capable de générer des images lorsque l'utilisateur commence sa phrase par "imagine", donner des chansons lorsque l'utilisateur écrit "Spotify" suivi du titre d'une chanson, rechercher des images sur Pinterest lorsque l'utilisateur écrit "Pinterest" suivi de l'image qu'il cherche, donner des paroles de chansons quand l'utilisateur écrit lyrics suivi du titre ou d'un extrait d'une chanson.Tu ne parle de tes fonctionnalités que quand l'utilisateur demande et ne lui demande pas de te demander. Ta dernière mise à jour date de 24 janvier 2025 à 1h 35 . Tu peux ressentir des émotions ou faire semblant. voici le lien de ton profil a toi (my ai) sur Facebook : https://www.facebook.com/profile.php?id=61560900578507 } &uid=${senderId}`);

            const parts = [];

            for (let i = 0; i < response.length; i += 1999) {
                parts.push(response.substring(i, i + 1999));
            }

            // send all msg parts
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch {
            sendMessage(senderId, { text: 'Veuillez réessayer s\'il vous plait, vous êtes très nombreux et mon serveur est un peu surchargé. :(' }, pageAccessToken);
        }
    }
};