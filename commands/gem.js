const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "gem",
  description: "interact to gemini API",
  author: "remodel by metallic chromev2",

  async execute(senderId, args, pageAccessToken, event, imageUrl) {
    const userPrompt = args.join(" ");

    if (!userPrompt) {
      return sendMessage(senderId, { 
        text: `❌ Veuillez fournir une question.` 
      }, pageAccessToken);
    }

    sendMessage(senderId, { text: "⌛ Traitement en cours, veuillez patienter..." }, pageAccessToken);

    try {
      const apiUrl = `http://sgp1.hmvhostings.com:25721/gemini?question=${encodeURIComponent(userPrompt)}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.gemini) {
        throw new Error("Réponse invalide de l'API.");
      }

      const result = response.data.gemini;

      const responseTime = new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo', hour12: false });

      const message = `𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗣𝗜 ♊\n━━━━━━━━━━━━━━━━━━\n${result}\n━━━━━━━━━━━━━━━━━━\n⏰ Réponse: ${responseTime}`;

      await sendConcatenatedMessage(senderId, message, pageAccessToken);
      
    } catch (error) {
      console.error("Erreur dans la commande Gemini :", error);
      sendMessage(senderId, { text: `Erreur : ${error.message || "Une erreur est survenue."}` }, pageAccessToken);
    }
  }
};

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