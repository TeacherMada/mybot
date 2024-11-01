const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'ai',
  description: 'Ai TsantaBot',
  author: 'Coffee',

  async execute(senderId, args, message) {
    const pageAccessToken = token;
    const input = (args.join(' ') || 'salut').trim();
    const modifiedPrompt = `${input}, direct answer.`;

    const header = "(⁠◍⁠•⁠ᴗ⁠•⁠◍⁠) | 𝙼𝚘𝚌𝚑𝚊 𝙰𝚒\n・──────────────・";
    const footer = "・───── >ᴗ< ──────・";

    // Check if message contains an image (optional)
    if (message && message.attachments && message.attachments[0]?.type === 'photo') {
      const imageUrl = message.attachments[0].url;
      
      const geminiUrl = `https://ccprojectapis.ddns.net/api/gemini?ask=${encodeURIComponent(modifiedPrompt)}&imgurl=${encodeURIComponent(imageUrl)}`;
      try {
        const response = await axios.get(geminiUrl);
        const { vision } = response.data;

        const formattedMessage = `${header}\n${vision || 'Failed to recognize the image.'}\n${footer}`;
        return await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
      } catch (error) {
        console.error('Error fetching image recognition:', error);
        return await sendMessage(senderId, { text: `${header}\nAn error occurred while processing the image.\n${footer}` }, pageAccessToken);
      }
    }

    // Handle text queries using a GPT-like API
    try {
      const response = await axios.get(`https://ccprojectapis.ddns.net/api/gpt4turbo?q=${encodeURIComponent(query)}&id=1`);
      const data = response.data;

      const formattedMessage = `${header}\n${data.response || 'This is an example response.'}\n${footer}`;
      await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
    } catch (error) {
      console.error('Error fetching from API:', error);
      await sendMessage(senderId, { text: `${header}\nAn error occurred while trying to reach the API.\n${footer}` }, pageAccessToken);
    }
  }
};
