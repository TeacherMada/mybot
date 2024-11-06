const axios = require('axios');

module.exports = {
  name: 'bing',
  description: 'Generate and send images directly from Bing based on your prompt.',
  author: 'Jerome',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (args.length === 0) {
      return sendMessage(senderId, { text: 'Please provide a prompt. Example: bing dog' }, pageAccessToken);
    }

    // Combine args to form the prompt
    const prompt = args.join(' ');
    const apiUrl = `https://jerome-web.onrender.com/service/api/bing?prompt=${encodeURIComponent(prompt)}`;

    // Loading messages to keep the user engaged
    const loadingMessages = [
      '🔄 Hold on! Generating your image...',
      '✨ Crafting your image, please wait...',
      '🎨 Creating your visual masterpiece...'
    ];
    const loadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    await sendMessage(senderId, { text: loadingMessage }, pageAccessToken);

    // Confirming prompt
    await sendMessage(senderId, { text: `You requested: "${prompt}". Let's see what we get!` }, pageAccessToken);

    try {
      // Call the Bing API
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.success && data.result && data.result.length > 0) {
        // Send up to 4 images if available
        const imageMessages = data.result.slice(0, 4).map((imageUrl) => ({
          attachment: {
            type: 'image',
            payload: {
              url: imageUrl,
              is_reusable: true
            }
          }
        }));

        for (const imageMessage of imageMessages) {
          await sendMessage(senderId, imageMessage, pageAccessToken);
        }

        // Success messages
        const successMessages = [
          "Here's what I found! Hope you like it! 🎉",
          "Done! Enjoy your images. 😊",
          "Here’s your request—let me know what you think! 🤩"
        ];
        const successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
        await sendMessage(senderId, { text: successMessage }, pageAccessToken);

      } else {
        // Notify user if no images found
        await sendMessage(senderId, { text: `Sorry, no images were found for "${prompt}".` }, pageAccessToken);
      }
      
    } catch (error) {
      console.error('Error fetching Bing images:', error);

      // Enhanced error messages
      let errorMessage = 'Sorry, there was an error processing your request.';
      if (error.response) {
        errorMessage = 'There was an issue with the Bing Image Generator. Please try again later.';
      } else if (error.request) {
        errorMessage = 'It looks like there’s a network problem. Please check your connection and try again.';
      }

      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};
      
