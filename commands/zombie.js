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
        text: `❌ Please send an image first, then type "zombie" to enhance it.`
      }, pageAccessToken);
    }

    console.log("🔍 Image URL reçue :", imageUrl);

    // Informer l'utilisateur que le traitement est en cours
    sendMessage(senderId, {
      text: "⌛➡️ Enhancing image, please wait....!"
    }, pageAccessToken);

    try {
      // Tester l'accessibilité de l'image avant d'appeler l'API
      const imageCheck = await axios.get(imageUrl, { timeout: 5000 });
      if (imageCheck.status !== 200) {
        throw new Error("L'image n'est pas accessible.");
      }

      // Effectuer la requête à l'API
      const response = await axios.get(`https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status >= 200 && status < 300; 
        }
      });

      console.log("✅ Réponse API :", response.data);

      // Vérifier si la réponse contient bien une URL d'image
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
      console.error("❌ Erreur :", error.message);

      let errorMessage = "❌ An error occurred while processing the image.";
      if (error.response && error.response.status === 500) {
        errorMessage = "❌ The image processing server is currently down. Please try again later.";
      } else if (error.message.includes("L'image n'est pas accessible")) {
        errorMessage = "❌ The image URL is not accessible. Please try another image.";
      }

      await sendMessage(senderId, { text: errorMessage }, pageAccessToken);
    }
  }
};