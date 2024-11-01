const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'help',
  description: 'Show available commands',
  usage: 'help\nhelp [command name]',
  author: 'System',
  execute(senderId, args, pageAccessToken) {
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const commandFile = commandFiles.find(file => {
        const command = require(path.join(commandsDir, file));
        return command.name.toLowerCase() === commandName;
      });

      if (commandFile) {
        const command = require(path.join(commandsDir, commandFile));
        const commandDetails = `
▪︎𝙲𝚘𝚖𝚖𝚊𝚗𝚍e: ${command.name}
▪︎𝙳𝚎𝚜𝚌𝚛𝚒p𝚝𝚒𝚘𝚗: ${command.description}
▪︎𝚄𝚜𝚊𝚐𝚎: ${command.usage}
`;
        
        sendMessage(senderId, { text: commandDetails }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `Command "${commandName}" not found.` }, pageAccessToken);
      }
      return;
    }

    // Créer des quick replies pour chaque commande
    const quick_replies = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return {
        content_type: "text",
        title: command.name,
        payload: command.name.toUpperCase()  // Payload peut être utilisé pour identifier la commande
      };
    });

    // Créer un message avec boutons et quick replies
    const helpMessage = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: `🤖 | Voici les commandes disponibles sur TsantaBot. Cliquez sur une commande pour voir plus de détails.`,
          buttons: [
            {
              type: "web_url",
              url: "https://www.facebook.com/profile.php?id=61552825191002",
              title: "Fb Admin"
            },
            {
              type: "phone_number",
              title: "Contact Admin",
              payload: "+261349310268"  // Numéro de téléphone de l'admin
            }
          ]
        }
      },
      quick_replies  // Ajout des quick replies
    };

    sendMessage(senderId, helpMessage, pageAccessToken);
  }
};
