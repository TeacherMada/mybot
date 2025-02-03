const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'gpt',
  description: 'Discuter avec ChatGPT, le modèle GPT-4o',
  author: 'Tata',
  usage: 'chatgpt [ta question]',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const input = (args.join(' ') || 'salut').trim();
    const modifiedPrompt = `${input}, direct answer.`;

    try {
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/gpt-4o-pro?ask=${encodeURIComponent(modifiedPrompt)}&uid=${senderId}`);
      const data = response.data;
      
      if (data && data.message) {
        const formattedMessage = `🤖| ${data.message}`;
        await sendMessage(senderId, { text: formattedMessage }, pageAccessToken);
      } else {
        await sendMessage(senderId, { text: 'Error: No response from AI.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error:', error);
      await sendMessage(senderId, { text: 'Error: Unexpected error.' }, pageAccessToken);
    }
  }
};