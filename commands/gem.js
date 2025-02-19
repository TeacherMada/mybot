const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
    name: 'gem',
    description: 'Interact with GPT-4o',
    usage: 'gpt4 [your message]',
    author: 'coffee',

    async execute(senderId, args, pageAccessToken) {
        const prompt = args.join(' ');
        if (!prompt) return sendMessage(senderId, { text: "Usage: gem <question>" }, pageAccessToken);

        try {
            const { data: { response } } = await axios.get(`https://echoai.zetsu.xyz/ask?q=${encodeURIComponent(prompt)}&uid=${senderId}`);

            const parts = [];

            for (let i = 0; i < response.length; i += 1999) {
                parts.push(response.substring(i, i + 1999));
            }

            // send all msg parts
            for (const part of parts) {
                await sendMessage(senderId, { text: part }, pageAccessToken);
            }

        } catch {
            sendMessage(senderId, { text: '••There was an error generating the content. Please try again later.' }, pageAccessToken);
        }
    }
};