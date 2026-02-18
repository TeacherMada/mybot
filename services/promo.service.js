const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { validatePromo } = require('../services/promo.service.js');

const commands = new Map();
const prefix = '@';

// ===============================
// Charger automatiquement les commandes
// ===============================
fs.readdirSync(path.join(__dirname, '../commands'))
  .filter(file => file.endsWith('.js'))
  .forEach(file => {
    const command = require(`../commands/${file}`);
    if (command.name && command.execute) {
      commands.set(command.name.toLowerCase(), command);
    }
  });

// ===============================
// MAIN HANDLER
// ===============================
async function handleMessage(event, pageAccessToken) {
  try {
    const senderId = event?.sender?.id;
    if (!senderId) return console.error('❌ Invalid sender');

    const rawMessage = event?.message?.text || '';
    // Normaliser le texte pour détecter le code promo (supprime espaces, majuscule)
    const messageText = rawMessage.replace(/\s+/g, '').trim();

    // ===============================
    // 🔥 AUTO DETECT PROMO CODE
    // ===============================
    // Regex pour détecter TM-XXXXXX (6 caractères hexadécimaux)
    const promoMatch = messageText.match(/TM-[A-F0-9]{6}/gi);

    if (promoMatch && promoMatch.length > 0) {
      // On prend le **premier code** détecté
      const code = promoMatch[0].toUpperCase();
      const result = validatePromo(code); // function synchrone côté service

      if (result.error) {
        return await sendMessage(senderId, { text: result.error }, pageAccessToken);
      }

      const link = `${process.env.BASE_URL}/download?token=${result.downloadToken}`;

      return await sendMessage(senderId, {
        text:
          `✅ Code valide ! Paiement confirmé.\n\n` +
          `📥 Téléchargez votre livre ici :\n${link}\n\n` +
          `⚠️ Lien valable une seule fois.`
      }, pageAccessToken);
    }

    // ===============================
    // 🔥 COMMAND SYSTEM (with prefix)
    // ===============================
    if (messageText.startsWith(prefix)) {
      const args = messageText.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (commands.has(commandName)) {
        return await commands.get(commandName).execute(senderId, args, pageAccessToken);
      }

      return await sendMessage(senderId, {
        text: "❌ Commande inconnue."
      }, pageAccessToken);
    }

    // ===============================
    // 🔥 DEFAULT AI (tsanta)
    // ===============================
    const defaultCommand = commands.get('tsanta');

    if (defaultCommand) {
      return await defaultCommand.execute(senderId, [rawMessage], pageAccessToken);
    }

    // Aucun agent par défaut configuré
    await sendMessage(senderId, {
      text: "⚠️ Aucun agent par défaut configuré."
    }, pageAccessToken);

  } catch (error) {
    console.error("❌ Global Messenger Error:", error);
    await sendMessage(event?.sender?.id, {
      text: "❌ Erreur système. Réessayez plus tard."
    }, pageAccessToken);
  }
}

module.exports = { handleMessage };
