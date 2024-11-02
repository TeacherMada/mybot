const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'help',
  description: 'Liste commandes',
  usage: 'help [commande]',
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
▪︎Commande: ${command.name}
▪︎Description: ${command.description}
▪︎Usage: ${command.usage}`;
        
        sendMessage(senderId, { text: commandDetails }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `Aucune commande "${commandName}" trouvé`}, pageAccessToken);
      }
      return;
    }

    const commands = commandFiles.map(file => {
      const command = require(path.join(commandsDir, file));
      return `│─➤ ${command.name}`;
    });

    const helpMessage = `
 TsantaBot Commandes disponibles 
╭──○○○
${commands.join('\n')}
╰──────────○
#Aide:
▪︎help [commande]
▪︎Contact: 0349310268
▪︎Fb: https://www.facebook.com/profile.php?id=61552825191002
✅ Afaka manambotra Chatbot ho anao ihany koa aho 
`;

    sendMessage(senderId, { text: helpMessage }, pageAccessToken);
  }
};
