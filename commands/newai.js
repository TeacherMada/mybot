const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Tableau pour stocker les IDs autorisés (dans un environnement réel, utilisez une base de données)
let authorizedUserIds = [];

// Fonction pour vérifier si un utilisateur est autorisé
function isUserAuthorized(userId) {
  return authorizedUserIds.includes(userId);
}

module.exports = {
  name: 'newai',
  description: 'Chat with GPT-4o and receive text + audio response',
  usage: 'gpt4 <message>',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    // Vérifier si l'utilisateur est autorisé
    if (!isUserAuthorized(senderId)) {
      return sendMessage(senderId, { text: "Accès interdit. Veuillez contacter un administrateur pour obtenir l'autorisation." }, pageAccessToken);
    }

    const prompt = args.join(' ');
    if (!prompt) {
      return sendMessage(senderId, { text: "Usage: gpt4 <question ou message>" }, pageAccessToken);
    }

    try {
      // Requête à l'API GPT-4o pour obtenir la réponse en texte
      const apiUrl = `https://zaikyoo-api.onrender.com/api/4ov2?prompt=${encodeURIComponent(prompt)}&uid=${senderId}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.reply) {
        throw new Error("Réponse invalide de l'API.");
      }

      // Envoyer la réponse texte
      await sendMessage(senderId, { text: data.reply }, pageAccessToken);

      // Générer l'URL pour l'audio de la réponse
      const ttsUrl = `https://zaikyoo-api.onrender.com/api/tts?text=${encodeURIComponent(data.reply)}`;

      // Envoyer l'audio
      await sendMessage(senderId, {
        attachment: {
          type: 'audio',
          payload: {
            url: ttsUrl
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error("Erreur dans la commande GPT-4 :", error);
      sendMessage(senderId, { text: 'Erreur lors de la génération de la réponse. Réessayez plus tard.' }, pageAccessToken);
    }
  }
};

// Commande d'administration pour autoriser un utilisateur
module.exports.authorize = {
  name: 'authorize',
  description: 'Autoriser un utilisateur à utiliser la commande GPT-4',
  usage: 'authorize <user_id>',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    // Vérifier si l'utilisateur est un administrateur (vous devrez définir votre propre logique d'administrateur)
    if (!isAdmin(senderId)) { // <-- Fonction isAdmin à implémenter
      return sendMessage(senderId, { text: "Vous n'êtes pas autorisé à utiliser cette commande." }, pageAccessToken);
    }

    const userId = args[0];
    if (!userId) {
      return sendMessage(senderId, { text: "Usage: authorize <user_id>" }, pageAccessToken);
    }

    authorizedUserIds.push(userId); // Ajouter l'ID à la liste (dans un environnement réel, utilisez une base de données)
    sendMessage(senderId, { text: `L'utilisateur ${userId} a été autorisé.` }, pageAccessToken);
  }
};

// Fonction factice pour vérifier si un utilisateur est un administrateur (à remplacer par votre logique)
function isAdmin(userId) {
  // Implémentez votre logique ici (par exemple, vérifiez si l'ID est dans une liste d'administrateurs)
  return userId === '100085883202512'; // <-- Remplacez 'YOUR_ADMIN_ID' par l'ID de votre administrateur
}