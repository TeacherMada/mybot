import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleMessage } from './handles/handleMessage.js';
import { handlePostback } from './handles/handlePostback.js';
import { readdir } from 'fs/promises';

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
      commands.push({
        name: command.name,
        description: command.description
      });
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
        {
          commands: [{ locale: 'default', commands }]
        },
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
