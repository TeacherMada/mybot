const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

// Path to the stored image data
const imageFilePath = path.join(__dirname, '../data/image.json');

module.exports = {
  name: 'bgremove',
  description: 'Remove the background from the user\'s image and send it directly to the user.',
  usage: 'bgremove',
  author: 'kenlie',

  async execute(senderId, args, pageAccessToken) {
    // Load image data from the JSON file
    const imageData = JSON.parse(fs.readFileSync(imageFilePath, 'utf8')) || {};

    // Check if the senderId has an associated image URL
    if (imageData[senderId]) {
      const imgUrl = imageData[senderId];
      try {
        // Call the background removal API
        const response = await axios.get(`https://api.kenliejugarap.com/bgremoved/?imgurl=${encodeURIComponent(imgUrl)}`);
        
        if (response.data.status) {
          const processedImageUrl = response.data.response; // Extract the image URL from the response

          // Send the processed image URL as an attachment
          await sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: {
                url: processedImageUrl,
                is_reusable: true
              }
            }
          }, pageAccessToken);

          console.log(`Sent processed image for user ${senderId}`);
        } else {
          await sendMessage(senderId, {
            text: 'Failed to process the image. Please try again later. ❌'
          }, pageAccessToken);
        }
      } catch (error) {
        console.error('Error:', error);
        await sendMessage(senderId, {
          text: 'An error occurred while processing the image. Please try again later. ⚠️'
        }, pageAccessToken);
      } finally {
        // Remove the entry from image.json after processing
        delete imageData[senderId];
        fs.writeFileSync(imageFilePath, JSON.stringify(imageData, null, 2), 'utf8');
        console.log(`Removed stored image URL for user ${senderId}`);
      }
    } else {
      // If no image URL is found for the user
      await sendMessage(senderId, {
        text: 'No image found for your ID. Please send an image first before using this command. 📸'
      }, pageAccessToken);
    }
  }
};