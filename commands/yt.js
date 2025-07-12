const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Stockage temporaire des résultats de recherche pour chaque utilisateur
const searchResults = {};

module.exports = {
  name: 'yt',
  description: 'Recherche une vidéo YouTube et envoie un lien audio MP3',
  usage: 'yt [mot-clé]',
  author: 'tsanta',

  // ▶️ Commande principale : yt [mot-clé]
  async execute(senderId, args, pageAccessToken) {
    if (!args || args.length === 0) {
      await sendMessage(senderId, {
        text: '🔍 Ampidiro ny lohateny tianao tadiavina.\n\nOhatra: `yt Mr Sayda`'
      }, pageAccessToken);
      return;
    }

    const keyword = args.join(' ');
    const apiUrl = `https://kaiz-apis.gleeze.com/api/ytsearch?q=${encodeURIComponent(keyword)}&apikey=4fbe737b-9f02-4151-9290-34e3d83c7c4f`;

    await sendMessage(senderId, {
      text: '⏳ Mitady vidéo amin\'ny YouTube...'
    }, pageAccessToken);

    try {
      const res = await axios.get(apiUrl);
      const items = res.data.items?.slice(0, 5);

      if (!items || items.length === 0) {
        await sendMessage(senderId, {
          text: '❌ Tsy nisy vidéo hita amin\'io lohateny io.'
        }, pageAccessToken);
        return;
      }

      // Mémorise les résultats
      searchResults[senderId] = items;

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

  // ▶️ Lorsque l'utilisateur clique sur un Quick Reply
  async handleQuickReply(senderId, payload, pageAccessToken) {
    if (!payload.startsWith('YT_SELECT_')) return;

    const index = parseInt(payload.replace('YT_SELECT_', ''), 10) - 1;
    const selected = searchResults[senderId]?.[index];

    if (!selected) {
      await sendMessage(senderId, {
        text: '❌ Tsy nahita an\'ilay vidéo. Andramo indray azafady.'
      }, pageAccessToken);
      return;
    }

    await sendMessage(senderId, {
      text: `🎧 Maka ny audio: ${selected.title}...`
    }, pageAccessToken);

    const apiKey = '4fbe737b-9f02-4151-9290-34e3d83c7c4f';
    const downloadApi = `https://kaiz-apis.gleeze.com/api/ytmp3?url=${encodeURIComponent(selected.url)}&apikey=${apiKey}`;

    try {
      const res = await axios.get(downloadApi);
      const audioUrl = res.data.audio_url || res.data.url;

      if (!audioUrl) {
        throw new Error('Audio URL not found');
      }

      // 🔗 Envoyer le lien MP3 à écouter
      await sendMessage(senderId, {
        text: `✅ Azonao henoina ato ilay audio :\n\n🎵 ${selected.title}\n▶️ ${audioUrl}`
      }, pageAccessToken);

    } catch (err) {
      console.error('❌ Erreur audio URL:', err.message);
      await sendMessage(senderId, {
        text: '⚠️ Tsy afaka nandefa ilay audio. Mety ho diso ilay rohy na tsy azo alaina.'
      }, pageAccessToken);
    }
  }
};
