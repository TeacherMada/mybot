const getImageUrl = async (event, token) => {
  try {
    // Vérifier si le message actuel contient une image directement
    const attachments = event?.message?.attachments;
    if (attachments && attachments.length > 0) {
      for (let attachment of attachments) {
        if (attachment.type === 'image' && attachment.payload?.url) {
          return attachment.payload.url;
        }
      }
    }

    // Vérifier si l'utilisateur a répondu à un message contenant une image
    const replyMessage = event?.message?.reply_to;
    if (replyMessage && replyMessage.mid) {
      const { data } = await axios.get(`https://graph.facebook.com/v21.0/${replyMessage.mid}/attachments`, {
        params: { access_token: token }
      });

      console.log("Debug - API response:", JSON.stringify(data, null, 2));

      if (!data || !data.data || data.data.length === 0) return null;

      for (let attachment of data.data) {
        if (attachment.type === 'image' && attachment.payload?.url) {
          return attachment.payload.url;
        }
      }
    }

    return null;
  } catch (err) {
    console.error("Erreur lors de la récupération de l'image:", err);
    return null;
  }
};

module.exports = { getImageUrl };