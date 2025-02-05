const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'flux',
  description: 'Generate an image using Flux Realism API.',
  usage: 'flux [image prompt]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ').trim();
    if (!prompt) {
      return sendMessage(senderId, { text: 'Provide an image prompt.' }, pageAccessToken);
    }

    // Informer l'utilisateur que la demande est en cours de traitement
    await sendMessage(senderId, { text: "Attendez svp lorsqu'on traite la demande." }, pageAccessToken);

    // Utilisation du nouvel endpoint API avec le modèle 4
    const apiUrl = `https://api.zetsu.xyz/api/flux?prompt=${encodeURIComponent(prompt)}&model=4`;

    try {
      const response = await axios.get(apiUrl);
      if (response.data.status) {
        const imgUrl = response.data.response;

        // Téléchargement de l'image dans un fichier temporaire
        const tempFilePath = path.join(os.tmpdir(), `flux_${Date.now()}.jpg`);
        const writer = fs.createWriteStream(tempFilePath);
        const imageResponse = await axios.get(imgUrl, { responseType: 'stream' });
        imageResponse.data.pipe(writer);

        // Attendre la fin de l'écriture du fichier
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Préparation du formulaire pour uploader l'image vers Facebook
        const form = new FormData();
        // On prépare le payload de l'attachment (l'upload renverra un attachment_id)
        form.append('message', JSON.stringify({ attachment: { type: 'image', payload: {} } }));
        form.append('filedata', fs.createReadStream(tempFilePath));

        // Upload de l'image via l'API Messenger
        const uploadUrl = `https://graph.facebook.com/v11.0/me/message_attachments?access_token=${pageAccessToken}`;
        const uploadResponse = await axios.post(uploadUrl, form, {
          headers: form.getHeaders(),
        });

        if (!uploadResponse.data.attachment_id) {
          throw new Error('No attachment_id returned');
        }

        // Envoyer le message à l'utilisateur en utilisant l'attachment_id obtenu
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'image',
              payload: {
                attachment_id: uploadResponse.data.attachment_id,
              },
            },
          },
          pageAccessToken
        );

        // Supprimer le fichier temporaire
        fs.unlink(tempFilePath, (err) => {
          if (err) {
            console.error('Error deleting temporary file:', err);
          }
        });
      } else {
        sendMessage(senderId, { text: 'Failed to generate image using Flux Realism API.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      sendMessage(senderId, { text: 'An error occurred while generating the image.' }, pageAccessToken);
    }
  }
};