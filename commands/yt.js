const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// On garde une mémoire des vidéos par utilisateur si besoin
const userVideos = {};

module.exports = {
  name: 'yt',
  description: 'Recherche vidéo YouTube avec option Télécharger',
  usage: 'yt [mot-clé]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '🔍 Azafady, ampidiro ny mot-clé tadiavina\n\nOhatra: `yt Mr Sayda`'
      }, pageAccessToken);
      return;
    }

    const keyword = args.join(' ');
    const apiUrl = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${encodeURIComponent(keyword)}&apikey=4fbe737b-9f02-4151-9290-34e3d83c7c4f`;

    await sendMessage(senderId, { text: '⏳ Mitady vidéo amin\'ny YouTube...' }, pageAccessToken);

    try {
      const response = await axios.get(apiUrl);
      const items = response.data.items;

      if (!items || items.length === 0) {
        await sendMessage(senderId, { text: '❌ Tsy misy vidéo hita.' }, pageAccessToken);
        return;
      }

      // Enregistrer les vidéos avec leur URL
      userVideos[senderId] = items;

      const elements = items.slice(0, 5).map((item, index) => ({
        title: item.title.substring(0, 80),
        subtitle: `⏱ ${item.duration}`,
        image_url: item.thumbnail,
        default_action: {
          type: "web_url",
          url: item.url,
          webview_height_ratio: "tall"
        },
        buttons: [
          {
            type: "web_url",
            url: item.url,
            title: "▶️ Regarder"
          },
          {
            type: "postback",
            title: "📥 Télécharger",
            payload: `DOWNLOAD_YT_${item.url}`
          }
        ]
      }));

      await sendMessage(senderId, {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Erreur API YouTube:', error.message);
      await sendMessage(senderId, {
        text: '🚫 Nisy olana tamin\'ny fitadiavana vidéo.'
      }, pageAccessToken);
    }
  },

  // Gestion du bouton "Télécharger"
  async handlePostback(senderId, payload, pageAccessToken) {
    if (!payload.startsWith('DOWNLOAD_YT_')) return;

    const videoUrl = payload.replace('DOWNLOAD_YT_', '');
    const apiKey = '4fbe737b-9f02-4151-9290-34e3d83c7c4f';
    const downloadApi = `https://kaiz-apis.gleeze.com/api/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=${apiKey}`;

    await sendMessage(senderId, {
      text: '📥 Maka vidéo... miandrasa azafady.'
    }, pageAccessToken);

    try {
      const res = await axios.get(downloadApi);
      const video = res.data;

      if (!video || !video.video_url) {
        throw new Error('URL vidéo non trouvée');
      }

      // Envoyer la vidéo en pièce jointe
      await sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: video.video_url,
            is_reusable: true
          }
        }
      }, pageAccessToken);

    } catch (err) {
      console.error('Erreur téléchargement:', err.message);
      await sendMessage(senderId, {
        text: '❌ Tsy afaka maka ilay vidéo. Mety ho tafahoatra ny habeny na diso ny lien.'
      }, pageAccessToken);
    }
  }
};
