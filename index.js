import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleMessage } from './handles/handleMessage.js';
import { handlePostback } from './handles/handlePostback.js';
import { readdir } from 'fs/promises';
import { verifyToken, markTokenUsed } from './services/promo.service.js'; // Pour vérifier le token PDF

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ===============================
// 🔥 MULTI PAGE TOKEN PARSING
// ===============================
const PAGE_TOKENS = {};

process.env.PAGE_TOKENS.split(',').forEach(entry => {
  const [pageId, token] = entry.split(':');
  PAGE_TOKENS[pageId] = token;
});

// ===============================
// PRIVACY & TERMS
// ===============================
app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "terms.html"));
});

// ===============================
// WEBHOOK VERIFY
// ===============================
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// ===============================
// WEBHOOK EVENTS
// ===============================
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object !== 'page') {
    return res.sendStatus(404);
  }

  for (const entry of body.entry) {
    const pageId = entry.id;
    const pageToken = PAGE_TOKENS[pageId];

    if (!pageToken) {
      console.error(`❌ No token found for Page ID: ${pageId}`);
      continue;
    }

    for (const event of entry.messaging) {
      const sender_psid = event.sender.id;

      if (event.message) {
        await handleMessage(event, pageToken);
      }

      if (event.postback) {
        await handlePostback(event, pageToken);
      }
    }
  }

  res.status(200).send('EVENT_RECEIVED');
});

// ===============================

// ===============================
// DOWNLOAD PDF ROUTE (TOKEN SECURISE & UTILISATION UNIQUE)
// ===============================
app.get('/download', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send(renderCard('❌ Token manquant', 'Veuillez vérifier le lien reçu.'));

  const promo = verifyToken(token);

  let title = '';
  let message = '';
  let showButton = false;

  if (!promo) {
    title = '❌ Lien invalide';
    message = 'Le lien est expiré, déjà utilisé ou invalide.';
  } else {
    const pdfPath = path.join(__dirname, 'pdf', promo.book);
    if (!fs.existsSync(pdfPath)) {
      title = '❌ Fichier introuvable';
      message = 'Le PDF demandé est manquant.';
    } else {
      title = '✅ Téléchargement prêt';
      const expires = new Date(promo.expiresAt).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      message = `
        Votre livre <strong>${promo.book}</strong> est prêt à être téléchargé.<br>
        ⚠️ Ce lien est valable jusqu'au <strong>${expires}</strong> et utilisable une seule fois.
      `;
      showButton = true;
    }
  }

  // Afficher la card
  res.send(renderCard(title, message, showButton, token));
});

// ===============================
// Fonction utilitaire pour générer une "card" responsive
// ===============================
function renderCard(title, message, showButton = false, token = '') {
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #f4f6f8;
      }
      .card {
        background: #fff;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
      }
      .card h1 {
        font-size: 1.6rem;
        margin-bottom: 16px;
        color: #333;
      }
      .card p {
        font-size: 1rem;
        color: #555;
        margin-bottom: 24px;
        line-height: 1.5;
      }
      .card a.button {
        display: inline-block;
        padding: 12px 24px;
        background: #0078ff;
        color: #fff;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: 0.2s;
      }
      .card a.button:hover {
        background: #005fcc;
      }
      @media (max-width: 480px) {
        .card {
          padding: 16px;
        }
        .card h1 {
          font-size: 1.4rem;
        }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      ${showButton ? `<a class="button" href="/download?token=${token}" download>📥 Télécharger maintenant</a>` : ''}
    </div>
  </body>
  </html>
  `;
}


// ===============================
// DYNAMIC MENU LOADER
// ===============================
const COMMANDS_PATH = new URL('./commands/', import.meta.url).pathname;

const loadCommands = async () => {
  const files = await readdir(COMMANDS_PATH);
  const commands = [];

  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const modulePath = `./commands/${file}`;
    const commandModule = await import(modulePath);
    const command = commandModule.default || commandModule;

    if (command.name && command.description) {
      commands.push({ name: command.name, description: command.description });
    }
  }

  return commands;
};

const sendMessengerProfileRequest = async (method, url, data, token) => {
  return axios({
    method,
    url: `https://graph.facebook.com/v21.0${url}`,
    params: { access_token: token },
    data
  });
};

const loadMenuCommandsForAllPages = async () => {
  const commands = await loadCommands();

  for (const pageId in PAGE_TOKENS) {
    try {
      await sendMessengerProfileRequest(
        'post',
        '/me/messenger_profile',
        { commands: [{ locale: 'default', commands }] },
        PAGE_TOKENS[pageId]
      );

      console.log(`✅ Menu loaded for Page ${pageId}`);
    } catch (err) {
      console.error(`❌ Menu load failed for Page ${pageId}`);
    }
  }
};

// ===============================
// SERVER START
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 Multi-Page Bot running on port ${PORT}`);

  try {
    await loadMenuCommandsForAllPages();
  } catch (err) {
    console.error('❌ Initial menu load failed');
  }
});
