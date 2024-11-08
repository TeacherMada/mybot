const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

module.exports = {
  name: 'music',
  description: 'Search YouTube audio and send audio',
  author: 'Tata',

  async execute(senderId, args) {
    const pageAccessToken = token;
    const query = args.join(' ');

    try {
      // Recherche de vidéos YouTube en fonction de l'entrée utilisateur
      const searchResponse = await axios.get(`https://me0xn4hy3i.execute-api.us-east-1.amazonaws.com/staging/api/resolve/resolveYoutubeSearch?search=${encodeURIComponent(query)}`);
      const videos = searchResponse.data.data;

      if (!videos.length) {
        await sendMessage(senderId, { text: "Aucune vidéo trouvée pour votre recherche." }, pageAccessToken);
        return;
      }

      // Envoi de la liste des vidéos avec le bouton "écouter"
      for (const video of videos) {
        const videoTitle = video.title;
        const videoId = video.videoId;

        // Bouton "écouter" pour chaque vidéo trouvée
        const buttons = [
          {
            type: "postback",
            title: "Écouter",
            payload: `LISTEN_AUDIO_${videoId}`
          }
        ];

        const messageData = {
          text: `▪︎Titre: ${videoTitle}\n▪︎Durée: ${video.duration}\n▪︎Vues: ${video.views}`,
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: `🎧 ${videoTitle}`,
              buttons
            }
          }
        };

        await sendMessage(senderId, messageData, pageAccessToken);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche YouTube:', error);
      await sendMessage(senderId, { text: "Erreur lors de la recherche de vidéos." }, pageAccessToken);
    }
  },

  // Traitement des postbacks pour écouter l'audio
  async handlePostback(senderId, payload) {
    const pageAccessToken = token;

    if (payload.startsWith("LISTEN_AUDIO_")) {
      const videoId = payload.split("_")[2];
      const downloadUrl = `https://api-improve-production.up.railway.app/yt/download?url=https://www.youtube.com/watch?v=${videoId}&format=mp3&quality=180`;

      try {
        // Téléchargement de l'audio de la vidéo
        const downloadResponse = await axios.get(downloadUrl);
        const audioUrl = downloadResponse.data.audio;

        // Envoi du message vocal à l'utilisateur
        await sendMessage(senderId, {
          attachment: {
            type: "audio",
            payload: { url: audioUrl }
          }
        }, pageAccessToken);
      } catch (error) {
        console.error('Erreur lors du téléchargement de l\'audio:', error);
        await sendMessage(senderId, { text: "Erreur lors du téléchargement de l'audio." }, pageAccessToken);
      }
    }
  }
};
