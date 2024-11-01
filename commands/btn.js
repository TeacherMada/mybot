const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'btn',
  description: 'Display admin contact button',
  usage: 'adminHelp',
  async execute(senderId, args, pageAccessToken) {
    const messageWithButton = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "😋 IF YOU HAVE PROBLEMS WITH THE BOT, DON'T HESITATE TO CONTACT US ADMINS BELOW 💕",
          buttons: [
            {
              type: "web_url",
              url: "https://www.facebook.com/profile.php?id=61552825191002", // Replace with your admin's Facebook profile URL
              title: "ADMIN"
            }
          ]
        }
      }
    };

    // Send the message with the button
    await sendMessage(senderId, messageWithButton, pageAccessToken);
  }
};
