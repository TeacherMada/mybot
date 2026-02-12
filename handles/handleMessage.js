const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { handleUserResponse } = require('../commands/Traduction'); // Importez handleUserResponse depuis Traduction.js
const { validatePromo } = require('../services/promo.service.js');

const commands = new Map();
const prefix = '@';

// Charger les modules de commande
fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(`../commands/${file}`);
    commands.set(command.name.toLowerCase(), command);
  });

async function handleMessage(event, pageAccessToken) {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim();
  const quickReply = event?.message?.quick_reply; // Récupérer la réponse rapide

  // 🔹 Si une réponse rapide est détectée
  if (quickReply) {
    const selectedLang = quickReply.payload; // La langue sélectionnée par l'utilisateur
    await handleUserResponse(senderId, selectedLang, messageText, pageAccessToken);
    return;
  }

  if (!messageText) return console.log('Received event without message text');

  // 🔹 Détection automatique du code promo TM-XXXXXX
  const promoMatch = messageText.match(/TM-\w{6}/i);
  if (promoMatch) {
    const code = promoMatch[0].toUpperCase();

    const result = validatePromo(code);

    if (result.error) {
      await sendMessage(senderId, { text: result.error }, pageAccessToken);
      return;
    }

    const link = `${process.env.BASE_URL}/download?token=${result.downloadToken}`;

    await sendMessage(senderId, {
      text: `✅ Code valide ! Paiement confirmé.\n\n` +
            `Téléchargez votre livre ici :\n${link}\n\n` +
            `⚠️ Ce lien est valable une seule fois.`
    }, pageAccessToken);
    return; // important pour ne pas continuer vers les commandes
  }

  // 🔹 Gestion des commandes avec le préfixe
  const [commandName, ...args] = messageText.startsWith(prefix)
    ? messageText.slice(prefix.length).split(' ')
    : messageText.split(' ');

  try {
    if (commands.has(commandName.toLowerCase())) {
      await commands.get(commandName.toLowerCase()).execute(senderId, args, pageAccessToken, sendMessage);
    } else {
      await commands.get('tsanta').execute(senderId, [messageText], pageAccessToken);
    }
  } catch (error) {
    console.error(`Error executing command:`, error);
    await sendMessage(senderId, { text: error.message || 'There was an error executing that command.' }, pageAccessToken);
  }
}

module.exports = { handleMessage };
