// index.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { handleMessage } from './handles/handleMessage.js';
import { handlePostback } from './handles/handlePostback.js';
import 'dotenv/config';

const app = express();
app.use(express.json());

// =======================
// ROUTES STATIQUES
// =======================
app.get("/privacy", (req, res) => {
  res.sendFile(path.join(process.cwd(), "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(process.cwd(), "terms.html"));
});

// =======================
// CONFIG MULTI-PAGES
// =======================
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'pagebot';

// Format .env : PAGE_TOKENS=PAGEID1:TOKEN1,PAGEID2:TOKEN2,...
const PAGE_TOKENS = process.env.PAGE_TOKENS.split(',').reduce((acc, entry) => {
  const [id, token] = entry.split(':');
  if (id && token) acc[id] = token.trim();
  return acc;
}, {});

const getPageToken = (pageId) => PAGE_TOKENS[pageId];

// =======================
// WEBHOOK VERIFICATION
// =======================
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } 
    return res.sendStatus(403);
  }

  res.sendStatus(400);
});

// =======================
// WEBHOOK EVENT HANDLER
// =======================
app.post('/webhook', async (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const pageId = entry.id;
      const pageToken = getPageToken(pageId);

      if (!pageToken) {
        console.warn(`❌ No PAGE_ACCESS_TOKEN configured for Page ID: ${pageId}`);
        continue;
      }

      for (const event of entry.messaging || []) {
        const sender_psid = event.sender.id;

        try {
          if (event.message && event.message.text) {
            // ✅ Appel direct backend TeacherMada
            await handleMessage(event, pageToken);
          } else if (event.postback) {
            await handlePostback(event, pageToken);
          }
        } catch (err) {
          console.error(`❌ Error handling message for user ${sender_psid}:`, err.message);
          // Message d'erreur simple côté Messenger
          await axios.post(
            `https://graph.facebook.com/v21.0/me/messages?access_token=${pageToken}`,
            { recipient: { id: sender_psid }, message: { text: '⚠️ Le serveur ne répond pas correctement. Réessayez.' } }
          ).catch(console.error);
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  }

  res.sendStatus(404);
});

// =======================
// HELPER AXIOS POUR FACEBOOK PROFILE
// =======================
const sendMessengerProfileRequest = async (method, url, data = {}, pageToken) => {
  try {
    const response = await axios({
      method,
      url: `https://graph.facebook.com/v21.0${url}?access_token=${pageToken}`,
      headers: { 'Content-Type': 'application/json' },
      data
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} request for page token ${pageToken}:`, error.response?.data || error.message);
    throw error;
  }
};

// =======================
// COMMANDS DYNAMIQUES
// =======================
const COMMANDS_PATH = path.join(process.cwd(), 'commands');

const loadCommands = () => {
  return fs.readdirSync(COMMANDS_PATH)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const command = require(path.join(COMMANDS_PATH, file));
      return command.name && command.description ? { name: command.name, description: command.description } : null;
    })
    .filter(Boolean);
};

const loadMenuCommandsForAllPages = async () => {
  const commands = loadCommands();

  for (const pageId in PAGE_TOKENS) {
    const token = PAGE_TOKENS[pageId];
    try {
      await sendMessengerProfileRequest('post', '/me/messenger_profile', { commands }, token);
      console.log(`✅ Menu commands loaded for Page ${pageId}`);
    } catch (err) {
      console.error(`❌ Failed to load menu for Page ${pageId}:`, err.message);
    }
  }
};

// Watch commands directory for changes
fs.watch(COMMANDS_PATH, (eventType, filename) => {
  if (['change', 'rename'].includes(eventType) && filename.endsWith('.js')) {
    loadMenuCommandsForAllPages().catch(err => console.error('❌ Error reloading menu commands:', err));
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`✅ Server running on port ${PORT}`);
  try {
    await loadMenuCommandsForAllPages();
  } catch (err) {
    console.error('❌ Error loading initial menu commands:', err.message);
  }
});
