const axios = require("axios");
const { sendMessage } = require("../handles/sendMessage");

module.exports = {
  name: "zombie",
  description: "Make Your Picture Zombie",
  author: "developer",
  usage: "Send any picture first then reply 'zombie'",

  async execute(senderId, args, pageAccessToken, imageUrl) {
    // Vérifier si une image a été envoyée
    if (!imageUrl) {
      return sendMessage(senderId, {
        text: `❌... Please send an image first, then type "zombie" to enhance it.`
      }, pageAccessToken);
    }

    console.log("🔍 Image URL reçue :", imageUrl); // Debugging

    // Informer l'utilisateur que le traitement est en cours
    sendMessage(senderId, {
      text: "⌛ 💓Enhancing image, please wait....!"
    }, pageAccessToken);

    try {
      // Effectuer la requête à l'API
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`, {
        timeout: 10000, // Timeout de 10 secondes
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Accepter uniquement les statuts 200-299
        }
      });

      console.log("✅ Réponse API reçue :", response.data); // Debugging

      // Vérifier si la réponse contient bien une URL d'image traitée
      const processedImageURL = response.data.response;
      if (!processedImageURL) {
        throw new Error("L'API n'a pas retourné d'URL d'image.");
      }

      // Envoyer l'image transformée à l'utilisateur
      await sendMessage(senderId, {
        attachment: {
          type: "image",
          payload: { url: processedImageURL }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error("❌ Erreur lors du traitement de l'image :", error.message);

      // Envoyer un message d'erreur personnalisé à l'utilisateur
      await sendMessage(senderId, {
        text: `❌ An error occurred while processing the image: ${error.message}`
      }, pageAccessToken);
    }
  }
};