const axios = require('axios');

const getImageUrl = async (event, token) => {
  try {
    // Vérifier si l'utilisateur a répondu à un message contenant une image
    const replyMessage = event?.message?.reply_to;
    if (!replyMessage || !replyMessage.mid) return null;

    // Récupérer les pièces jointes du message répondu
    const { data } = await axios.get(`https://graph.facebook.com/v21.0/${replyMessage.mid}/attachments`, {
      params: { access_token: token }
    });

    // Vérifier si une image est présente dans les pièces jointes
    if (!data || !data.data || data.data.length === 0) return null;

    for (let attachment of data.data) {
      if (attachment.type === 'image' && attachment.payload?.url) {
        return attachment.payload.url;
      }
    }

    return null;
  } catch (err) {
    console.error("Erreur lors de la récupération de l'image:", err);
    return null;
  }
};

module.exports = { getImageUrl };