const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'zombie',
  description: 'Transforme une image en style zombie.',
  usage: '1) Envoyez une image et répondez avec "zombie" OU\n2) Envoyez l\'image et le texte "zombie" dans le même message.',
  author: 'MakoyQx',

  async execute(senderId, args, pageAccessToken, event) {
    // 1) Essayer de récupérer l'URL via la "réponse" (quote reply)
    let imageUrl = await getImageUrlFromReply(event, pageAccessToken);

    // 2) Sinon, si on n'a pas trouvé, regarder si l'image est dans ce message même
    if (!imageUrl) {
      imageUrl = getImageUrlFromSameMessage(event);
    }

    // 3) Si toujours pas d'image, on affiche un message d'erreur
    if (!imageUrl) {
      await sendMessage(senderId, {
        text: '❌ Aucune image détectée.\n\n' +
              '1) Essayez de faire un vrai "Répondre" sur l\'image avec "zombie".\n' +
              '2) Ou envoyez une image et le mot "zombie" dans le même message.'
      }, pageAccessToken);
      return;
    }

    // Construire l'URL de l'API avec l'image
    const apiUrl = `https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`;

    // Informer l'utilisateur que la transformation est en cours
    await sendMessage(senderId, { text: '🧟‍♂️ Transformation en zombie en cours...' }, pageAccessToken);

    try {
      // Envoyer l'image transformée à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: apiUrl
          }
        }
      }, pageAccessToken);
    } catch (error) {
      console.error('Erreur lors de la transformation en zombie:', error);

      // Envoyer un message d'erreur à l'utilisateur
      await sendMessage(senderId, {
        text: '❌ Une erreur est survenue lors de la transformation. Réessayez avec une autre image.'
      }, pageAccessToken);
    }
  }
};

/**
 * Tente de récupérer l'image depuis le message auquel l'utilisateur a répondu (quote reply).
 * Cela nécessite que l'utilisateur fasse un "Appui long" + "Répondre" sur Messenger.
 */
async function getImageUrlFromReply(event, pageAccessToken) {
  try {
    const replyMid = event?.message?.reply_to?.mid;
    if (!replyMid) return null;

    // On récupère les attachments du message d'origine grâce à son mid
    const { data } = await axios.get(`https://graph.facebook.com/v17.0/${replyMid}/attachments`, {
      params: { access_token: pageAccessToken }
    });

    if (!data || !data.data || data.data.length === 0) return null;

    for (const attachment of data.data) {
      // On vérifie s'il y a un type image avec un payload.url
      if (attachment.type === 'image' && attachment.payload?.url) {
        return attachment.payload.url;
      }
    }
    return null;
  } catch (err) {
    console.error("Erreur getImageUrlFromReply:", err);
    return null;
  }
}

/**
 * Si on n'a pas récupéré l'image via "reply_to",
 * on regarde si l'image est directement dans le message courant.
 */
function getImageUrlFromSameMessage(event) {
  const attachments = event?.message?.attachments;
  if (!attachments || !attachments.length) return null;

  for (const attachment of attachments) {
    if (attachment.type === 'image' && attachment.payload?.url) {
      return attachment.payload.url;
    }
  }
  return null;
}