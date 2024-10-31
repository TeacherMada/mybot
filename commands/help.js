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

    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return `│ - ${command.name}`;
    });

    const helpMessage = `
━━━━━━━━━━━━━━
  Commande disponible:
╭─╼━━━━━━━━╾─╮
${commands.join('\n')}
╰─━━━━━━━━━╾─╯
▪︎Aide: help nom commande
▪︎Admin contact: 0349310268
▪︎Admin Fb: Tsanta Rabemananjara
━━━━━━━━━━━━━━`;

    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
