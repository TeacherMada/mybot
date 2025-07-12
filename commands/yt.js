const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');

// Crée dossier temporaire si inexistant
const TMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

module.exports = {
  name: 'yt',
  description: 'Recherche des vidéos YouTube avec téléchargement',
  usage: 'yt [mot-clé]',
  author: 'tsanta',

  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '🔍 Ampidiro ny lohateny tianao tadiavina.\n\nOhatra: `yt Mr Sayda`'
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
        await sendMessage(senderId, { text: '❌ Tsy nisy vidéo hita amin\'ity mot-clé ity.' }, pageAccessToken);
        return;
      }

      const elements = items.slice(0, 5).map((item) => ({
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
      console.error('❌ Erreur recherche vidéo:', error.response?.data || error.message);
      await sendMessage(senderId, {
        text: '🚫 Nisy olana tamin\'ny API YouTube. Andramo indray azafady.'
      }, pageAccessToken);
    }
  },

  // Lors du clic sur 📥 Télécharger
  async handlePostback(senderId, payload, pageAccessToken) {
    if (!payload.startsWith('DOWNLOAD_YT_')) return;

    const videoUrl = payload.replace('DOWNLOAD_YT_', '');
    const apiKey = '4fbe737b-9f02-4151-9290-34e3d83c7c4f';
    const downloadApi = `https://kaiz-apis.gleeze.com/api/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=${apiKey}`;

    await sendMessage(senderId, {
      text: '📥 Maka ilay vidéo... miandrasa kely.'
    }, pageAccessToken);

    try {
      const res = await axios.get(downloadApi);
      const video = res.data;

      if (!video || !video.video_url) {
        throw new Error('URL de la vidéo introuvable.');
      }

      // Télécharger la vidéo localement
      const tempPath = path.join(TMP_DIR, `video-${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempPath);

      const downloadResponse = await axios({
        method: 'get',
        url: video.video_url,
        responseType: 'stream'
      });

      downloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Lire le fichier et envoyer la vidéo
      const videoData = fs.readFileSync(tempPath);
      const formData = {
        recipient: JSON.stringify({ id: senderId }),
        message: JSON.stringify({
          attachment: {
            type: 'video',
            payload: {
              is_reusable: false
            }
          }
        }),
        filedata: {
          value: videoData,
          options: {
            filename: 'video.mp4',
            contentType: 'video/mp4'
          }
        }
      };

      const FormData = require('form-data');
      const form = new FormData();
      for (let key in formData) {
        form.append(key, formData[key]);
      }

      await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`, form, {
        headers: form.getHeaders()
      });

      // Supprimer le fichier local après envoi
      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error('❌ Erreur téléchargement vidéo:', err.message);
      await sendMessage(senderId, {
        text: '❌ Tsy afaka nandefa ilay vidéo. Mety ho lehibe loatra na nisy olana.'
      }, pageAccessToken);
    }
  }
};
