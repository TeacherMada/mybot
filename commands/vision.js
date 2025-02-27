const axios = require('axios');
const { getImageUrl } = require('../handles/getImageUrl');

module.exports = {
  name: 'vision',
  description: 'Analyze an image and provide an answer.',
  usage: 'Reply to an image and chat\n-vision [prompt]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken, event) {
    // Get the image URL through the replied message's ID
    const imageUrl = await getImageUrl(event, pageAccessToken);

    if (!imageUrl && !args.length) {
      return sendError(senderId, 'Please reply to an image and add a question.', pageAccessToken);
    }

    if (!imageUrl) {
      return sendError(senderId, 'Error: No image found to analyze. Please reply to an image.', pageAccessToken);
    }

    if (imageUrl && !args.length) {
      return sendError(senderId, 'Please add a question.', pageAccessToken);
    }

    const prompt = args.join(' ');
    const apiUrl = `https://joshweb.click/gemini?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`;

    try {
      // Fetch image recognition results
      const { data } = await axios.get(apiUrl);
      const description = data?.gemini 
        ? `🖼️ | Image Description\n・───────────・\n${data.gemini}\n・────── >ᴗ< ──────・` 
        : 'Error: Could not retrieve image description.';
      await sendMessage(senderId, { text: description }, pageAccessToken);
    } catch (error) {
      console.error('Error fetching image description:', error);
      sendError(senderId, 'Error: Unable to analyze the image.', pageAccessToken);
    }
  },
};

const sendError = async (senderId, errorMessage, pageAccessToken) => {
  await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
};