const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'post',
  description: 'Publishes the replied image on the Facebook page with a description',
  usage: '/post <description>',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken, messageData) {
    console.log("Received Message Data:", JSON.stringify(messageData, null, 2)); // Debugging

    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌xx Please provide a description.\n\nExample: /post My new photo!'
      }, pageAccessToken);
      return;
    }

    const description = args.join(' '); // Get the provided description
    const fbPageId = '61553462575063'; // Your Facebook Page ID

    try {
      // Ensure the message is a reply to an image
      const repliedMessage = messageData?.message?.reply_to;
      if (!repliedMessage || !repliedMessage.attachments || repliedMessage.attachments.length === 0) {
        await sendMessage(senderId, {
          text: '❌XX Please reply to an image.\n\nSend a photo first, then reply with /post <description>.'
        }, pageAccessToken);
        return;
      }

      const attachment = repliedMessage.attachments.find(att => att.type === 'image'); // Find an image
      if (!attachment || !attachment.payload || !attachment.payload.url) {
        await sendMessage(senderId, {
          text: '❌x No image found in the replied message. Please try again with a photo.'
        }, pageAccessToken);
        return;
      }

      const imageUrl = attachment.payload.url; // URL of the replied image

      // Publish the image on Facebook Page
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${fbPageId}/photos`,
        {
          url: imageUrl,
          caption: description,
          access_token: pageAccessToken
        }
      );

      if (response.data && response.data.id) {
        await sendMessage(senderId, {
          text: '✅ The image has been posted successfully on the page!'
        }, pageAccessToken);
      } else {
        throw new Error('Invalid response from Facebook');
      }
    } catch (error) {
      console.error('Error posting the image:', error);
      await sendMessage(senderId, { text: '❌x Failed to post the image. Please try again.' }, pageAccessToken);
    }
  }
};