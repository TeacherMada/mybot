const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'traduction',
  description: 'Traduire un texte vers une langue cible',
  author: 'Tsanta',
  usage: 'Traduction [langue cible] [texte à traduire]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const targetLanguage = args[0];
    const content = args.slice(1).join(' ').trim();

    if (!content) {
      return await sendMessage(senderId, { text: 'Veuillez fournir un texte à traduire. \n\n ▪︎Ex: Traduction mg Hello, How are you?' }, pageAccessToken);
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
      const formattedMessage = `Traduction:\n■ ${translatedText}\n\n- Traduite de ${fromLang} vers ${targetLanguage}`;

      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Erreur : Une erreur inattendue est survenue.' }, pageAccessToken);
    }
  }
};
