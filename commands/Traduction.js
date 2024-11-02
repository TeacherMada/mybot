const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'traduction',
  description: 'Traduire un texte vers une langue cible',
  author: 'Tata',
  usage: 'trans [langue cible] [texte à traduire]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    
    // Vérifier si l'utilisateur a spécifié une langue cible
    if (args.length === 0) {
      // Liste de langues pour `quick_replies`
      const languages = [
        { title: 'Français', code: 'fr' },
        { title: 'Anglais', code: 'en' },
        { title: 'Espagnol', code: 'es' },
        { title: 'Allemand', code: 'de' },
        { title: 'Italien', code: 'it' },
        { title: 'Japonais', code: 'ja' },
        { title: 'Chinois', code: 'zh' },
        { title: 'Arabe', code: 'ar' },
        { title: 'Malagasy', code: 'mg' },
        { title: 'Portugais', code: 'pt' },
        // Ajoutez d'autres langues ici si nécessaire
      ];

      // Création des `quick_replies`
      const quickReplies = languages.map(lang => ({
        content_type: 'text',
        title: lang.title,
        payload: `TRANSLATE_${lang.code}`, // Code de la langue comme payload
      }));

      // Envoyer un message pour demander la langue cible
      await sendMessage(senderId, {
        text: "Choisissez une langue pour la traduction :",
        quick_replies: quickReplies
      }, pageAccessToken);

      return;
    }

    const targetLanguage = args[0];
    const content = args.slice(1).join(' ').trim();

    if (!content) {
      return await sendMessage(senderId, { text: 'Veuillez fournir un texte à traduire.' }, pageAccessToken);
    }

    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(content)}`;

    try {
      const response = await axios.get(translateUrl);
      const data = response.data;

      let translatedText = '';
      data[0].forEach(item => {
        if (item[0]) translatedText += item[0];
      });

      const fromLang = data[2] === data[8][0][0] ? data[2] : data[8][0][0];
      const formattedMessage = `Traduction: ${translatedText}\n- Traduite de ${fromLang} vers ${targetLanguage}`;

      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Erreur : Une erreur inattendue est survenue.' }, pageAccessToken);
    }
  }
};
