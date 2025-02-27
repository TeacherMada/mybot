const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "zombie",
  description: "Make Your Picture Zombie",
  author: "developer",
  usage: "Send any picture first then reply 'zombie'",

  async execute(senderId, args, pageAccessToken, imageUrl) {
    if (!imageUrl) {
      return sendMessage(senderId, {
        text: "❌ Please send an image first, then type 'zombie' to enhance it."
      }, pageAccessToken);
    }

    // Envoyer l'URL reçue à l'utilisateur pour vérification
    await sendMessage(senderId, {
      text: `🔍 Image URL reçue : ${imageUrl}`
    }, pageAccessToken);

    // Informer l'utilisateur que le traitement est en cours
    sendMessage(senderId, {
      text: "⌛ Enhancing image, please wait....!"
    }, pageAccessToken);

    try {
      // Vérifier si l’image est accessible
      const imageCheck = await axios.get(imageUrl, { timeout: 5000 });
      if (imageCheck.status !== 200) {
        throw new Error("L'image n'est pas accessible.");
      }

      // Appeler l'API pour traiter l'image
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`, {
        timeout: 10000
      });

      // Envoyer la réponse de l'API à l'utilisateur pour débogage
      await sendMessage(senderId, {
        text: `✅ Réponse API reçue : ${JSON.stringify(response.data)}`
      }, pageAccessToken);

      const processedImageURL = response.data.response;
      if (!processedImageURL) {
        throw new Error("L'API n'a pas retourné d'image.");
      }

      // Envoyer l'image transformée
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: { url: processedImageURL }
        }
      }, pageAccessToken);

    } catch (error) {
      let errorMessage = `❌ Erreur : ${error.message}`;

      if (error.response && error.response.status === 500) {
        errorMessage = "❌ The image processing server is currently down. Please try again later.";
      } else if (error.message.includes("L'image n'est pas accessible")) {
        errorMessage = "❌ The image URL is not accessible. Please try another image.";
      }

      // Envoyer l'erreur sur Messenger
      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};