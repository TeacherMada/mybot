const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "aria",
  description: "interact with aria ai",
  author: "Julian ELEVN",

  async execute(senderId, args, pageAccessToken, event, imageUrl) {
    const userPrompt = args.join(" ").trim();

    if (!userPrompt) {
      return sendMessage(
        senderId,
        {
          text: `❌ Please provide a question😊.`
        },
        pageAccessToken
      );
    }

    try {
      const apiUrl = "https://yt-video-production.up.railway.app/Aria";
      const response = await handleAriaRequest(apiUrl, userPrompt);

      const result = response.response;

      await sendConcatenatedMessage(senderId, result, pageAccessToken);

    } catch (error) {
      console.error("Error in Aria command:", error);
      sendMessage(
        senderId,
        { text: `❌ Error: ${error.message || "Something went wrong."}` },
        pageAccessToken
      );
    }
  }
};

async function handleAriaRequest(apiUrl, query) {
  const { data } = await axios.get(apiUrl, {
    params: {
      q: query || "",
      userid: "4"
    }
  });

  return data;
}

async function sendConcatenatedMessage(senderId, text, pageAccessToken) {
  const maxMessageLength = 2000;

  if (text.length > maxMessageLength) {
    const messages = splitMessageIntoChunks(text, maxMessageLength);

    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}