const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'trans',
  description: 'Traduire un texte vers une langue cible',
  author: 'Tata',
  usage: 'trans [texte à traduire]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const content = args.join(' ').trim();

    if (!content) {
      return await sendMessage(senderId, { text: 'Veuillez fournir un texte à traduire.' }, pageAccessToken);
    }

    // Liste des langues disponibles
    const languages = [
      { title: 'Français', code: 'fr' },
      { title: 'Anglais', code: 'en' },
      { title: 'Espagnol', code: 'es' },
      { title: 'Allemand', code: 'de' },
      { title: 'Italien', code: 'it' },
      { title: 'Japonais', code: 'ja' },
      { title: 'Chinois', code: 'zh' },
      { title: 'Arabe', code: 'ar' },
      { title: 'Russe', code: 'ru' },
      { title: 'Portugais', code: 'pt' },
    ];

    // Création des `quick_replies`
    const quickReplies = languages.map(lang => ({
      content_type: 'text',
      title: lang.title,
      payload: `TRANSLATE_${lang.code}`, // Utilisé pour identifier la langue choisie
    }));

    // Stocker le texte à traduire pour cet utilisateur
    userTranslationRequests[senderId] = content;

    // Envoyer un message demandant à l'utilisateur de choisir une langue
    await sendMessage(senderId, {
      text: "▪︎Traduire en :",
      quick_replies: quickReplies
    }, pageAccessToken);
  },

  // Cette fonction est appelée lorsqu'un utilisateur sélectionne une langue
  async handleUserLanguageSelection(senderId, payload) {
    const pageAccessToken = token;

    // Extraire le code de la langue depuis le payload
    const targetLanguage = payload.replace('TRANSLATE_', '');

    // Récupérer le texte à traduire
    const content = userTranslationRequests[senderId];

    // Si aucun texte n'est stocké pour cet utilisateur
    if (!content) {
      return await sendMessage(senderId, { text: "Aucun texte en attente de traduction." }, pageAccessToken);
    }

    // URL de l'API Google Translate
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(content)}`;

    try {
      // Appel de l'API pour obtenir la traduction
      const response = await axios.get(translateUrl);
      const data = response.data;

      // Extraction du texte traduit depuis la réponse de l'API
      let translatedText = '';
      data[0].forEach(item => {
        if (item[0]) translatedText += item[0];
      });

      // Langue source détectée
      const fromLang = data[2] === data[8][0][0] ? data[2] : data[8][0][0];
      const formattedMessage = `Traduction : ${translatedText}\n- Traduit de ${fromLang} vers ${targetLanguage}`;

      // Envoyer le message de traduction à l'utilisateur
      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);

      // Supprimer la requête de traduction de l'utilisateur
      delete userTranslationRequests[senderId];
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Erreur : Une erreur inattendue est survenue.' }, pageAccessToken);
    }
  }
};

// Stock temporaire pour le texte de chaque utilisateur
const userTranslationRequests = {};
