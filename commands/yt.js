const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');
const FormData = require('form-data');

const TMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Sauvegarde temporaire des résultats par user
const searchResults = {};

module.exports = {
  name: 'yt',
  description: 'Recherche vidéo YouTube avec téléchargement',
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
      const res = await axios.get(apiUrl);
      const items = res.data.items?.slice(0, 5);

      if (!items || items.length === 0) {
        await sendMessage(senderId, { text: '❌ Tsy nisy vidéo hita amin\'io lohateny io.' }, pageAccessToken);
        return;
      }

      // Stocke les vidéos dans un cache temporaire
      searchResults[senderId] = items;

      // Envoie sous forme de texte + quick replies
      const listText = items.map((item, i) => {
        return `[${i + 1}] ${item.title} (${item.duration})`;
      }).join('\n');

      await sendMessage(senderId, {
        text: `🎬 Résultats :\n\n${listText}\n\n⤵️ Safidio amin'ny Quick Reply etsy ambany`,
        quick_replies: items.map((_, i) => ({
          content_type: 'text',
          title: `${i + 1}`,
          payload: `YT_SELECT_${i + 1}`
        }))
      }, pageAccessToken);

    } catch (err) {
      console.error('❌ Erreur API:', err.message);
      await sendMessage(senderId, {
        text: '🚫 Nisy olana tamin\'ny fanovàna ilay mot-clé. Andramo indray azafady.'
      }, pageAccessToken);
    }
  },

  async handleQuickReply(senderId, payload, pageAccessToken) {
    if (!payload.startsWith('YT_SELECT_')) return;

    const index = parseInt(payload.replace('YT_SELECT_', ''), 10) - 1;
    const selected = searchResults[senderId]?.[index];

    if (!selected) {
      await sendMessage(senderId, { text: '❌ Tsy nahita an\'ilay vidéo. Andramo indray azafady.' }, pageAccessToken);
      return;
    }

    await sendMessage(senderId, { text: `📥 Maka an'ilay vidéo: ${selected.title}...` }, pageAccessToken);

    const apiKey = '4fbe737b-9f02-4151-9290-34e3d83c7c4f';
    const downloadApi = `https://kaiz-apis.gleeze.com/api/ytmp4?url=${encodeURIComponent(selected.url)}&apikey=${apiKey}`;

    try {
      const res = await axios.get(downloadApi);
      const videoUrl = res.data.video_url;
      if (!videoUrl) throw new Error('Video URL not found');

      // Télécharger localement
      const tempPath = path.join(TMP_DIR, `yt-${Date.now()}.mp4`);
      const writer = fs.createWriteStream(tempPath);
      const videoStream = await axios({ method: 'get', url: videoUrl, responseType: 'stream' });
      videoStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Lire fichier pour envoyer
      const videoBuffer = fs.readFileSync(tempPath);
      const form = new FormData();
      form.append('recipient', JSON.stringify({ id: senderId }));
      form.append('message', JSON.stringify({
        attachment: { type: 'video', payload: { is_reusable: false } }
      }));
      form.append('filedata', videoBuffer, {
        filename: 'video.mp4',
        contentType: 'video/mp4'
      });

      await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`, form, {
        headers: form.getHeaders()
      });

      fs.unlinkSync(tempPath); // Supprime le fichier après envoi

    } catch (err) {
      console.error('❌ Erreur téléchargement:', err.message);
      await sendMessage(senderId, {
        text: '⚠️ Tsy afaka nandefa ilay vidéo. Mety lehibe loatra na diso.'
      }, pageAccessToken);
    }
  }
};
