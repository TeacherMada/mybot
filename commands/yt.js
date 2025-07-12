const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('../handles/sendMessage');
const FormData = require('form-data');

const TMP_DIR = path.join(__dirname, '../tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Cache des résultats de recherche par utilisateur
const searchResults = {};

module.exports = {
  name: 'yt',
  description: 'Recherche vidéo YouTube et envoie le MP3',
  usage: 'yt [mot-clé]',
  author: 'tsanta',

  // Commande de recherche
  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '🔍 Ampidiro ny lohateny tianao tadiavina.\n\nOhatra: `yt Mr Sayda`'
      }, pageAccessToken);
      return;
    }

    const keyword = args.join(' ');
    const apiUrl = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${encodeURIComponent(keyword)}&apikey=4fbe737b-9f02-4151-9290-34e3d83c7c4f`;

    await sendMessage(senderId, { text: '⏳ Mitady Mp3 amin\'ny YouTube...' }, pageAccessToken);

    try {
      const res = await axios.get(apiUrl);
      const items = res.data.items?.slice(0, 5);

      if (!items || items.length === 0) {
        await sendMessage(senderId, { text: '❌ Tsy nisy vidéo hita amin\'io lohateny io.' }, pageAccessToken);
        return;
      }

      // Enregistre les résultats pour l'utilisateur
      searchResults[senderId] = items;

      // Prépare le texte à afficher
      const listText = items.map((item, i) => {
        return `${i + 1}. ${item.title} (${item.duration})`;
      }).join('\n');

      await sendMessage(senderId, {
        text: `🎬 Résultats :\n\n${listText}\n\n⤵️ Safidio amin'ny chiffre etsy ambany`,
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

  // Quick reply handler pour choix de vidéo
  async handleQuickReply(senderId, payload, pageAccessToken) {
    if (!payload.startsWith('YT_SELECT_')) return;

    const index = parseInt(payload.replace('YT_SELECT_', ''), 10) - 1;
    const selected = searchResults[senderId]?.[index];

    if (!selected) {
      await sendMessage(senderId, { text: '❌ Tsy nahita an\'ilay vidéo. Andramo indray azafady.' }, pageAccessToken);
      return;
    }

    await sendMessage(senderId, { text: `🎧 Maka ny audio: ${selected.title}...` }, pageAccessToken);

    const apiKey = '4fbe737b-9f02-4151-9290-34e3d83c7c4f';
    const downloadApi = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(selected.url)}&apikey=${apiKey}`;

    const tempPath = path.join(TMP_DIR, `yt-${Date.now()}.mp3`);

    try {
      const res = await axios.get(downloadApi);
      const audioUrl = res.data.audio_url || res.data.url;
      if (!audioUrl) throw new Error('Audio URL not found');

      // Vérifie la taille
      const head = await axios.head(audioUrl);
      const sizeMB = head.headers['content-length'] / (1024 * 1024);
      console.log(`🎵 Taille MP3: ${sizeMB.toFixed(2)} Mo`);

      if (sizeMB > 25) {
        await sendMessage(senderId, {
          text: `⚠️ Le audio est trop grand pour Messenger (${sizeMB.toFixed(1)} Mo > 25Mo).\nTsindrio "▶️ Regarder" raha hijery mivantana.\n\nLien: ${selected.url}`
        }, pageAccessToken);
        return;
      }

      // Télécharger le fichier audio
      const writer = fs.createWriteStream(tempPath);
      const stream = await axios({ method: 'get', url: audioUrl, responseType: 'stream' });
      stream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Préparer le fichier à envoyer
      const audioBuffer = fs.readFileSync(tempPath);
      const form = new FormData();
      form.append('recipient', JSON.stringify({ id: senderId }));
      form.append('message', JSON.stringify({
        attachment: { type: 'audio', payload: { is_reusable: false } }
      }));
      form.append('filedata', audioBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg'
      });

      await axios.post(`https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`, form, {
        headers: form.getHeaders()
      });

      // Supprimer le fichier après envoi
      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error('❌ Erreur téléchargement ou envoi audio:', err.message);
      await sendMessage(senderId, {
        text: '⚠️ Tsy afaka nandefa ilay audio. Mety ho diso na lehibe loatra ilay fichier.'
      }, pageAccessToken);

      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }
};
