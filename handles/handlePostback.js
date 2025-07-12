const { sendMessage } = require('./sendMessage');

const handlePostback = async (event, pageAccessToken) => {
  const { id: senderId } = event.sender || {};
  const { payload } = event.postback || {};

  if (!senderId || !payload) return console.error('Invalid postback event object');

  try {
    await sendMessage(senderId, { text: `Bonjour | Welcome \n\n▪︎Raha hijery Menu dia soraty: help \n\n▪︎Raha hanamboarana Chatbot Professionnel dia: 0349310268\n\n 🙋‍♂️| TsantaBot: \nBon, Comment puis-je vous aider aujourd'hui ?` }, pageAccessToken);
  } catch (err) {
    console.error('Error sending postback response:', err.message || err);
  }
};

const ytCommand = require('./commands/yt.js');

// Si postback (ex: bouton "Télécharger")
if (webhook_event.postback && webhook_event.postback.payload) {
  const payload = webhook_event.postback.payload;

  if (payload.startsWith('DOWNLOAD_YT_')) {
    await ytCommand.handlePostback(sender_psid, payload, PAGE_ACCESS_TOKEN);
    return;
  }
}

module.exports = { handlePostback };
