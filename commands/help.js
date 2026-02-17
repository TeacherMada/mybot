const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

// 🔐 Liste des Admins autorisés (séparés par virgule dans .env)
const ADMINS = (process.env.ADMIN_ID || "")
  .split(",")
  .map(a => a.trim());

module.exports = {
  name: 'help',
  description: 'Liste commandes',
  usage: 'help [commande]',
  author: 'System',

  execute(senderId, args, pageAccessToken) {

    // 🔐 Vérification Admin
    if (!ADMINS.includes(senderId.toString())) {
      return sendMessage(
        senderId,
        { text: "❌ Accès refusé." },
        pageAccessToken
      );
    }

    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    // 📌 Si help [commande]
    if (args.length > 0) {

      const commandName = args[0].toLowerCase();

      const commandFile = commandFiles.find(file => {
        const command = require(path.join(commandsDir, file));
        return command.name.toLowerCase() === commandName;
      });

      if (commandFile) {

        const command = require(path.join(commandsDir, commandFile));

        const commandDetails = `
▪︎Commande: ${command.name}
▪︎Description: ${command.description || "Aucune description"}
▪︎Usage: ${command.usage || "Non spécifié"}
`;

        return sendMessage(senderId, { text: commandDetails }, pageAccessToken);

      } else {
        return sendMessage(
          senderId,
          { text: `❌ Aucune commande "${commandName}" trouvée.` },
          pageAccessToken
        );
      }
    }

    // 📌 Liste complète
    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return `│─➤ ${command.name}`;
    });

    const helpMessage = `
🔐 TsantaBot – Commandes Admin
╭──○○○
${commands.join('\n')}
╰──────────○

#Aide:
▪︎help [commande]
`;

    return sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
