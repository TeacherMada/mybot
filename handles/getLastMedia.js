const axios = require('axios');

async function getLastMedia(senderId, pageAccessToken) {
  try {
    const messagesUrl = `https://graph.facebook.com/v19.0/${senderId}/messages?fields=attachments{type,url},message&limit=5&access_token=${pageAccessToken}`;
    const { data } = await axios.get(messagesUrl);

    if (data && data.data.length > 0) {
      // Find the most recent media attachment
      for (const message of data.data) {
        if (message.attachments && message.attachments.data.length > 0) {
          const media = message.attachments.data[0];
          return {
            url: media.payload.url,
            type: media.type
          };
        }
      }
    }
  } catch (error) {
    console.error('Error retrieving last media:', error);
  }
  return