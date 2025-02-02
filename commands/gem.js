const axios = require("axios");
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: "gem",
  description: "Interagit avec l'API Gemini 1.5 Vision",
  author: "Refonte par Metallic ChromeV2",

  async execute(senderId, args, pageAccessToken, event, imageUrl) {
    const userPrompt = args.join(" ");

    if (!userPrompt && !imageUrl) {
      return sendMessage(senderId, { 
        text: "❌ Veuillez fournir une question ou une image avec une description."
      }, pageAccessToken);
    }

    sendMessage(senderId, { text: "⌛ Traitement en cours, veuillez patienter..." }, pageAccessToken);

    try {
      // Vérifie si une image est jointe à la conversation
      if (!imageUrl) {
        imageUrl = await extractImageFromEvent(event, pageAccessToken);
      }

      // Appel de l'API Gemini Vision
      const apiUrl = `http://sgp1.hmvhostings.com:25721/geminiv`;
      const response = await fetchApiResponse(apiUrl, userPrompt, imageUrl);

      // Vérifier si la réponse est bien une chaîne de caractères
      if (typeof response !== "string") {
        console.error("Réponse invalide de l'API :", response);
        return sendMessage(senderId, { text: "❌ Erreur : réponse invalide de l'API." }, pageAccessToken);
      }

      // Vérifie si une image a été générée
      if (response.includes('TOOL_CALL: generateImage')) {
        const generatedImageUrl = extractImageUrl(response);
        if (generatedImageUrl) {
          return sendMessage(senderId, {
            attachment: { type: 'image', payload: { url: generatedImageUrl } }
          }, pageAccessToken);
        }
      }

      // Formatage du message de réponse
      const responseTime = new Date().toLocaleString('fr-FR', { timeZone: 'Indian/Antananarivo' });
      const message = `💡 **Réponse de Gemini Vision**\n━━━━━━━━━━━━━━━━━━\n${response}\n━━━━━━━━━━━━━━━━━━\n⏰ **Heure de réponse** : ${responseTime}`;

      await sendLongMessage(senderId, message, pageAccessToken);

    } catch (error) {
      console.error("Erreur dans le traitement :", error);
      sendMessage(senderId, { text: `❌ Erreur : ${error.message || "Une erreur est survenue."}` }, pageAccessToken);
    }
  }
};

/**
 * Effectue un appel à l'API et retourne la réponse.
 */
async function fetchApiResponse(apiUrl, prompt, imageUrl) {
  try {
    const { data } = await axios.get(apiUrl, { params: { prompt, image_url: imageUrl || "" } });

    if (typeof data === "object" && data.response) {
      return data.response; // Si l'API retourne un objet avec une clé "response"
    } else if (typeof data === "string") {
      return data; // Si la réponse est directement une chaîne
    } else {
      console.error("Réponse inattendue de l'API :", data);
      return "❌ Réponse inattendue de l'API.";
    }
  } catch (error) {
    console.error("Erreur lors de l'appel API :", error);
    return `❌ Erreur API : ${error.message}`;
  }
}

/**
 * Extrait une image d'un message auquel l'utilisateur a répondu.
 */
async function extractImageFromEvent(event, pageAccessToken) {
  if (!event || !event.message) return ""; 

  // Vérifie si l'utilisateur répond à un message contenant une image
  if (event.message.reply_to && event.message.reply_to.mid) {
    return await getImageFromMessage(event.message.reply_to.mid, pageAccessToken);
  }

  // Vérifie si une image est attachée directement au message
  if (event.message.attachments && event.message.attachments[0]?.type === 'image') {
    return event.message.attachments[0].payload.url;
  }

  return "";
}

/**
 * Récupère l'URL d'une image à partir d'un message en réponse.
 */
async function getImageFromMessage(mid, pageAccessToken) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${mid}/attachments`, {
      params: { access_token: pageAccessToken }
    });
    return data?.data?.[0]?.image_data?.url || "";
  } catch (error) {
    console.error("Erreur lors de la récupération de l'image :", error);
    return "";
  }
}

/**
 * Envoie un message long en plusieurs morceaux si nécessaire.
 */
async function sendLongMessage(senderId, text, pageAccessToken) {
  const maxMessageLength = 2000;

  if (text.length > maxMessageLength) {
    const messages = splitTextIntoChunks(text, maxMessageLength);
    for (const message of messages) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await sendMessage(senderId, { text: message }, pageAccessToken);
    }
  } else {
    await sendMessage(senderId, { text }, pageAccessToken);
  }
}

/**
 * Découpe un message en morceaux de taille maximale.
 */
function splitTextIntoChunks(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Extrait une URL d'image d'une réponse contenant "TOOL_CALL: generateImage".
 */
function extractImageUrl(responseText) {
  const match = responseText.match(/\!.*?(https:\/\/.*?)/);
  return match ? match[1] : null;
}