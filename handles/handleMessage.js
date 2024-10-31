const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

const commands = new Map();
const prefix = '-';

const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command);
}

async function handleMessage(event, pageAccessToken) {
  if (!event || !event.sender || !event.sender.id) {
    console.error('Invalid event object');
    return;
  }

  const senderId = event.sender.id;

  // Check if the token is valid (this is a simple console check; for a more robust solution, use the API)
  if (!pageAccessToken) {
    console.error('Invalid page access token');
    return;
  }

  if (event.message && event.message.text) {
    const messageText = event.message.text.trim();
    let commandName, args;

    if (messageText.startsWith(prefix)) {
      const argsArray = messageText.slice(prefix.length).split(' ');
      commandName = argsArray.shift().toLowerCase();
      args = argsArray;
    } else {
      const words = messageText.split(' ');
      commandName = words.shift().toLowerCase();
      args = words;
    }

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      try {
        await command.execute(senderId, args, pageAccessToken, sendMessage);
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
      }
      return;
    }
  } else if (event.message.attachments) {
    const imageUrl = event.message.attachments[0].payload.url;
    if (imageUrl) {
      const command = commands.get('gemini');
      if (command) {
        try {
          await command.execute(senderId, [imageUrl], pageAccessToken, sendMessage);
        } catch (error) {
          console.error('Error processing image:', error);
          sendMessage(senderId, { text: 'Failed to process image.' }, pageAccessToken);
        }
      }
    }
  } else {
    console.log('Received message without text or attachments');
  }
}

module.exports = { handleMessage };
             
