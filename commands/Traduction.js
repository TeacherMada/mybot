const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

// Stock temporaire pour le texte à traduire de chaque utilisateur
const userTranslationRequests = {};

module.exports = {
  name: 'traduction',
  description: 'Traduire un texte vers une langue désirée',
  author: 'Tsanta',
  usage: 'Traduction [texte à traduire]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const content = args.join(' ').trim();

    // Vérifie si du texte est fourni pour la traduction
    if (!content) {
      return await sendMessage(senderId, { text: 'Veuillez fournir un texte à traduire. \n ▪︎Ex: Traduction I love you' }, pageAccessToken);
    }

    // Liste complète des langues disponibles
    const languages = [
      { title: 'Malagasy', code: 'mg' },
      { title: 'Français', code: 'fr' },
      { title: 'Anglais', code: 'en' },
      { title: 'Arabic', code: 'ar' },
      { title: 'Chinois', code: 'zh' },
      { title: 'Espagnol', code: 'es' },
      { title: 'Allemand', code: 'de' },
      { title: 'Japonais', code: 'ja' },
      { title: 'Croatian', code: 'hr' },
      { title: 'Czech', code: 'cs' },
      { title: 'Danish', code: 'da' },
      { title: 'Dutch', code: 'nl' },
      { title: 'Estonian', code: 'et' },
      { title: 'Filipino', code: 'fil' },
      { title: 'Tagalog', code: 'tl' },
      { title: 'Finnish', code: 'fi' },
      { title: 'German', code: 'de' },
      { title: 'Greek', code: 'el' },
      { title: 'Gujarati', code: 'gu' },
      { title: 'Hindi', code: 'hi' },
      { title: 'Hungarian', code: 'hu' },
      { title: 'Icelandic', code: 'is' },
      { title: 'Indonesian', code: 'id' },
      { title: 'Italian', code: 'it' },
      { title: 'Japanese', code: 'ja' },
      { title: 'Kannada', code: 'kn' },
      { title: 'Khmer', code: 'km' },
      { title: 'Korean', code: 'ko' },
      { title: 'Latin', code: 'la' },
      { title: 'Latvian', code: 'lv' },
      { title: 'Malayalam', code: 'ml' },
      { title: 'Marathi', code: 'mr' },
      { title: 'Nepali', code: 'ne' },
      { title: 'Norwegian', code: 'nb' },
      { title: 'Polish', code: 'pl' },
      { title: 'Portuguese', code: 'pt' },
      { title: 'Romanian', code: 'ro' },
      { title: 'Russian', code: 'ru' },
      { title: 'Serbian', code: 'sr' },
      { title: 'Sinhalese', code: 'si' },
      { title: 'Slovak', code: 'sk' },
      { title: 'Spanish', code: 'es' },
      { title: 'Swahili', code: 'sw' },
      { title: 'Swedish', code: 'sv' },
      { title: 'Tamil', code: 'ta' },
      { title: 'Telugu', code: 'te' },
      { title: 'Thai', code: 'th' },
      { title: 'Turkish', code: 'tr' },
      { title: 'Ukrainian', code: 'uk' },
      { title: 'Urdu', code: 'ur' },
      { title: 'Vietnamese', code: 'vi' },
    ];

    // Crée les quick replies pour chaque langue
    const quickReplies = languages.map(lang => ({
      content_type: 'text',
      title: lang.title,
      payload: `TRANSLATE_${lang.code}`, // Utilisé pour identifier la langue choisie
    }));

    // Stocke le texte à traduire pour cet utilisateur
    userTranslationRequests[senderId] = content;

    // Envoie un message avec les options de langues
    await sendMessage(senderId, {
      text: "▪︎Traduire en (sélectionnez):",
      quick_replies: quickReplies
    }, pageAccessToken);
  },

  // Fonction pour gérer la réponse de l'utilisateur lorsqu'il choisit une langue
  async handleUserResponse(senderId, payload) {
    const pageAccessToken = token;

    // Vérifie que le payload contient une langue
    if (!payload.startsWith('TRANSLATE_')) return;

    // Récupère le code de la langue depuis le payload
    const targetLanguage = payload.replace('TRANSLATE_', '');

    // Récupère le texte à traduire pour cet utilisateur
    const content = userTranslationRequests[senderId];

    // Si aucun texte en attente de traduction
    if (!content) {
      return await sendMessage(senderId, { text: "Aucun texte en attente de traduction." }, pageAccessToken);
    }

    // URL pour appeler l'API Google Translate
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(content)}`;

    try {
      // Appel de l'API Google Translate
      const response = await axios.get(translateUrl);
      const data = response.data;

      // Extraction du texte traduit
      let translatedText = '';
      data[0].forEach(item => {
        if (item[0]) translatedText += item[0];
      });

      // Envoi du message avec la traduction
      const formattedMessage = `✅ Traduction :\n\n ${translatedText}`;
      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);

      // Supprime la requête de traduction après l'envoi
      delete userTranslationRequests[senderId];
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Erreur : Une erreur inattendue est survenue.' }, pageAccessToken);
    }
  }
};
