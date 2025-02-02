const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'post',
  description: 'Publishes the replied image or video on the Facebook page with a description',
  usage: '/post <description>',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken, messageData) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Please provide a description.\n\nExample: /post My new photo!'
      }, pageAccessToken);
      return;
    }

    const description = args.join(' '); // Get the provided description
    const fbPageId = '61553462575063'; // Your Facebook Page ID

    try {
      // Check if the message is a reply to an image or video
      if (!messageData || !messageData.reply_to || !messageData.reply_to.attachments) {
        await sendMessage(senderId, {
          text: '❌ Please reply to an image or video.\n\nSend a media file first, then reply with /post <description>.'
        }, pageAccessToken);
        return;
      }

      const attachment = messageData.reply_to.attachments[0]; // Get the replied media
      if (!attachment || !attachment.payload || !attachment.payload.url) {
        throw new Error('No valid media found in the reply.');
      }

      const mediaUrl = attachment.payload.url; // URL of the replied media
      const mediaType = attachment.type === 'video' ? 'videos' : 'photos'; // Determine the type (image or video)

      // Publish the image or video on Facebook Page
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${fbPageId}/${mediaType}`,
        {
          url: mediaUrl,
          caption: description,
          access_token: pageAccessToken
        }
      );

      if (response.data && response.data.id) {
        await sendMessage(senderId, {
          text: '✅ The media has been posted successfully on the page!'
        }, pageAccessToken);
      } else {
        throw new Error('Invalid response from Facebook');
      }
    } catch (error) {
      console.error('Error posting the media:', error);
      await sendMessage(senderId, { text: '❌••• Failed to post the media. Please try again.' }, pageAccessToken);
    }
  }
};