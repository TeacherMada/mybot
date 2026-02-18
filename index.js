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

    for for (const event of entry.messaging) {

  // 🔒 Ignore delivery & read events
  if (!event.message && !event.postback) continue;

  // 🔒 Ignore bot's own messages (echo)
  if (event.message && event.message.is_echo) continue;

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
  
  // Template de base réutilisable
  const baseTemplate = (content) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Téléchargement · PDF
      </title>
      <!-- Bootstrap 5 CSS (minimal) -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
      <!-- Une seule ligne de CSS pour l'animation subtile -->
      <style>body{background:linear-gradient(135deg,#f5f7fa 0%,#e9ecef 100%);min-height:100vh;display:flex;align-items:center;}</style>
    </head>
    <body>
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-11 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            ${content}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!token) {
    return res.status(400).send(baseTemplate(`
      <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
        <div class="card-body p-5 text-center">
          <div class="display-1 text-warning mb-4">⚠️</div>
          <h1 class="h3 fw-bold text-dark mb-3">Token manquant</h1>
          <p class="text-secondary-emphasis mb-0">Le lien utilisé ne contient pas de token valide.</p>
          <p class="text-secondary-emphasis small mt-3 mb-0 opacity-75">Vérifiez votre lien ou contactez le support</p>
        </div>
      </div>
    `));
  }

  const promo = verifyToken(token);

  if (!promo) {
    return res.status(404).send(baseTemplate(`
      <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
        <div class="card-body p-5 text-center">
          <div class="display-1 text-danger mb-4">🔒</div>
          <h1 class="h3 fw-bold text-dark mb-3">Lien non valide</h1>
          <p class="text-secondary-emphasis mb-2">Ce lien a expiré ou a déjà été utilisé.</p>
          <p class="text-secondary-emphasis small mt-3 mb-0 opacity-75">Les liens de téléchargement sont à usage unique</p>
        </div>
      </div>
    `));
  }

  const pdfPath = path.join(__dirname, 'pdf', promo.book);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).send(baseTemplate(`
      <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
        <div class="card-body p-5 text-center">
          <div class="display-1 text-secondary mb-4">📄</div>
          <h1 class="h3 fw-bold text-dark mb-3">Fichier introuvable</h1>
          <p class="text-secondary-emphasis mb-2">Le document demandé n'est plus disponible.</p>
          <p class="text-secondary-emphasis small mt-3 mb-0 opacity-75">Notre équipe a été notifiée</p>
        </div>
      </div>
    `));
  }

  // Envoyer le PDF
  res.download(pdfPath, promo.book, (err) => {
    if (err) {
      console.error('Erreur téléchargement PDF:', err);
    } else {
      console.log(`📦 Livre téléchargé: ${promo.book} pour token: ${token}`);
      markTokenUsed(token);
    }
  });
});


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
