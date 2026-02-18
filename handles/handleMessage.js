const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { validatePromo } = require('../services/promo.service.js');

const commands = new Map();
const prefix = '@';

// ===============================
// Charger automatiquement commandes
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

    const messageText = event?.message?.text?.trim();
    if (!messageText) return;

    // ===============================
    // 🔥 AUTO DETECT PROMO CODE
    // ===============================
    const promoMatch = messageText.match(/TM-[A-F0-9]{6}/i);

    if (promoMatch) {
      const code = promoMatch[0].toUpperCase();
      const result = validatePromo(code);

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
        return await commands
          .get(commandName)
          .execute(senderId, args, pageAccessToken);
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
      return await defaultCommand.execute(
        senderId,
        [messageText],
        pageAccessToken
      );
    }

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
