const axios = require('axios');
const { sendMessage, getLastMedia } = require('../handles/sendMessage');

module.exports = {
  name: 'post',
  description: 'Publishes the last sent image or video on the Facebook page with a description',
  usage: '/post <description>',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '❌ Please provide a description.\n\nExample: /post My new photo!'
      }, pageAccessToken);
      return;
    }

    const description = args.join(' '); // Get the provided description
    const fbPageId = '61553462575063'; // Your Facebook Page ID

    try {
      // Retrieve the last image or video sent by the user
      const lastMedia = await getLastMedia(senderId, pageAccessToken);

      if (!lastMedia || !lastMedia.url) {
        await sendMessage(senderId, {
          text: '❌ No recent image or video found. Please send a media file first, then reply with /post <description>.'
        }, pageAccessToken);
        return;
      }

      // Check if the media is an image or video
      const mediaType = lastMedia.type === 'video' ? 'videos' : 'photos';

      // Post the media to Facebook
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${fbPageId}/${mediaType}`,
        {
          url: lastMedia.url,
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
      await sendMessage(senderId, { text: '❌ Failed to post the media. Please try again.' }, pageAccessToken);
    }
  }
};