const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

// Liste des Admins autorisés (peut être plusieurs séparés par une virgule)
const ADMINS = (process.env.ADMIN_ID || "")
  .split(",")
  .map(a => a.trim());

module.exports = {
  name: 'help', // Changé de 'help' à 'admin' pour correspondre au nom du fichier
  description: 'Liste commandes',
  usage: 'help [commande]',
  author: 'System',
  execute(senderId, args, pageAccessToken) {
    // Vérification admin
    if (!ADMINS.includes(senderId.toString())) {
      return sendMessage(senderId, { text: "❌ Accès refusé." }, pageAccessToken);
    }

    const commandsDir = path.join(__dirname, '../commands');
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(commandsDir)) {
      return sendMessage(senderId, { text: "❌ Dossier commands introuvable." }, pageAccessToken);
    }
    
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const commandFile = commandFiles.find(file => {
        try {
          const command = require(path.join(commandsDir, file));
          return command.name && command.name.toLowerCase() === commandName;
        } catch (error) {
          console.error(`Erreur chargement commande ${file}:`, error);
          return false;
        }
      });

      if (commandFile) {
        try {
          const command = require(path.join(commandsDir, commandFile));
          const commandDetails = `
▪︎ Commande: ${command.name}
▪︎ Description: ${command.description || 'Aucune description'}
▪︎ Usage: ${command.usage || 'Aucun usage spécifié'}`;
          
          sendMessage(senderId, { text: commandDetails }, pageAccessToken);
        } catch (error) {
          sendMessage(senderId, { text: `❌ Erreur chargement commande "${commandName}"`}, pageAccessToken);
          console.error(error);
        }
      } else {
        sendMessage(senderId, { text: `❌ Aucune commande "${commandName}" trouvée`}, pageAccessToken);
      }
      return;
    }

    // Lister toutes les commandes disponibles
    const commands = [];
    commandFiles.forEach(file => {
      try {
        const command = require(path.join(commandsDir, file));
        if (command.name) {
          commands.push(`│─➤ ${command.name}`);
        }
      } catch (error) {
        console.error(`Erreur chargement ${file}:`, error);
      }
    });

    const helpMessage = `
╭─── TsantaBot Commandes ───╮
${commands.join('\n')}
├───────────────────────────┤
│ #Aide:                    │
│ • help [commande]         │
│ • Contact: 0349310268     │
│ • FB: Tsanta Rabe.        │
╰───────────────────────────╯
`;

    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
