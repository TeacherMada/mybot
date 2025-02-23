const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'dictionnaire',
  description: 'Obtenir la définition d\'un mot en anglais',
  author: 'Tsanta',
  usage: 'dictionnaire [mot]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const word = (args.join(' ') || '').trim();

    if (!word) {
      await sendMessage(senderId, { text: 'Veuillez fournir un mot à rechercher.' }, pageAccessToken);
      return;
    }

    try {
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const data = response.data;

      if (!data || data.length === 0) {
        await sendMessage(senderId, { text: `Aucune définition trouvée pour "${word}".` }, pageAccessToken);
        return;
      }

      // Construction du message avec la définition
      let message = `📖| Définitions de *${word}*:\n`;

      data[0].meanings.forEach((meaning, index) => {
        message += `\n${index + 1}. (${meaning.partOfSpeech})\n`;
        meaning.definitions.slice(0, 3).forEach((def, i) => { // Limite à 3 définitions
          message += `   - ${def.definition}\n`;
        });
      });

      await sendMessage(senderId, { text: message }, pageAccessToken);
      
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Erreur: Impossible de récupérer la définition.' }, pageAccessToken);
    }
  }
};