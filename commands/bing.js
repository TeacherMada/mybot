const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Define and export the module
module.exports = {
  name: 'bing',
  description: 'Generates an image using the Bing Image Generator based on a prompt.',
  usage: '/bing [prompt]',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken) {
    // Check if prompt arguments are provided
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Please provide your prompt.\n\nExample: /bing dog.'
      }, pageAccessToken);
      return;
    }

    // Concatenate arguments to form the prompt
    const prompt = args.join(' ');
    const apiUrl = `https://jerome-web.gleeze.com/service/api/bing?prompt=${encodeURIComponent(prompt)}`;

    // Notify user that the image is being generated
    await sendMessage(senderId, {
      text: '⌛ Generating image based on your prompt, please wait...'
    }, pageAccessToken);

    try {
      // Make the API call to generate the image
      const response = await axios.get(apiUrl);

      if (response.data && response.data.imageUrl) {
        // Send the generated image to the user
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: {
              url: response.data.imageUrl // Ensure the API returns this field
            }
          }
        }, pageAccessToken);
      } else {
        throw new Error("Image URL not found in response.");
      }

    } catch (error) {
      console.error('Error generating image:', error);
      
      // Notify the user of the error
      await sendMessage(senderId, {
        text: '❌ An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
      
