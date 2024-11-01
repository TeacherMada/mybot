const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'help',
  description: 'Show available commands',
  usage: 'help\nhelp [command name]',
  author: 'System',
  async execute(senderId, args, pageAccessToken) {
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
━━━━━━━━━━━━━━
▪︎𝙲𝚘𝚖𝚖𝚊𝚗𝚍 𝙽𝚊𝚖𝚎: ${command.name}
▪︎𝙳𝚎𝚜𝚌𝚛𝚒p𝚝𝚒𝚘𝚗: ${command.description}
▪︎𝚄𝚜𝚊𝚐𝚎: ${command.usage}
━━━━━━━━━━━━━━`;
        
        sendMessage(senderId, { text: commandDetails }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `Command "${commandName}" not found.` }, pageAccessToken);
      }
      return;
    }

    // Define quick replies for each command
    const quickReplies = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return {
        content_type: "text",
        title: command.name,
        payload: `HELP_${command.name.toUpperCase()}`
      };
    });

    // Send the initial message with quick replies
    await sendMessage(senderId, {
      text: "🙋‍♂️ | Voici les commandes disponibles sur le bot. Cliquez sur une commande pour voir plus de détails.",
      quick_replies: quickReplies
    }, pageAccessToken);

    // Define buttons for additional links or actions
    const buttons = [
      {
        type: "web_url",
        url: "https://www.facebook.com/YourAdminProfile",
        title: "Contact Admin"
      },
      {
        type: "postback",
        title: "Voir plus de commandes",
        payload: "SEE_MORE_COMMANDS"
      }
    ];

    // Send the follow-up message with buttons
    await sendMessage(senderId, {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Options supplémentaires:",
          buttons: buttons
        }
      }
    }, pageAccessToken);
  }
};
