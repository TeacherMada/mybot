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

    // Create buttons for each command
    const buttons = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return {
        type: "postback",  // Use postback to trigger actions when buttons are clicked
        title: command.name,
        payload: `HELP_${command.name.toUpperCase()}` // Payload to identify which command was clicked
      };
    });

    // Message payload with buttons for commands
    const helpMessage = {
      text: "🤖 | Voici les commandes disponibles. Cliquez sur un bouton pour en savoir plus.",
      buttons: buttons
    };

    // Send the help message with buttons
    sendMessage(senderId, helpMessage, pageAccessToken);
  }
};
