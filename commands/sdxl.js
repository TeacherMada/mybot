const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Define and export module
module.exports = {
  // Metadata for the command
  name: 'sdxl',  // Command name
  description: 'Generates an image based on a prompt using 4gen AI',  // Description
  usage: 'sdxl [prompt]',  // Usage
  author: 'tsanta',  // Author of the command

  // Main function that executes the command
  async execute(senderId, args, pageAccessToken) {
    // Check if prompt arguments are provided
    if (!args || args.length === 0) {
      // Send message requesting a prompt if missing
      await sendMessage(senderId, {
        text: '❌ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝘆𝗼𝘂𝗿 𝗽𝗿𝗼𝗺𝗽𝘁\n\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: sdxl 𝗰at.'
      }, pageAccessToken);
      return;  // Exit the function if no prompt is provided
    }

    // Concatenate arguments to form the prompt
    const prompt = args.join(' ');
    const apiUrl = `https://kaiz-apis.gleeze.com/api/4gen?prompt=${encodeURIComponent(prompt)&ratio=9%3A16&stream=false&apikey=4fbe737b-9f02-4151-9290-34e3d83c7c4f`;  // API endpoint with the prompt

    // Notify user that the image is being generated
    await sendMessage(senderId, { text: '⌛ Miandrasa kely azafady...' }, pageAccessToken);

    try {
      // Send the generated image to the user as an attachment
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: apiUrl  // URL of the generated image
          }
        }
      }, pageAccessToken);

    } catch (error) {
      // Handle and log any errors during image generation
      console.error('Error generating image:', error);

      // Notify user of the error
      await sendMessage(senderId, {
        text: 'An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
