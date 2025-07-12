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

module.exports = { handlePostback };
