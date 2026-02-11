const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

require('dotenv').config();

const app = express();
app.use(express.json());

// --- Routes static HTML ---
app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "terms.html"));
});

// --- Verification Token pour Facebook Webhook ---
const VERIFY_TOKEN = 'pagebot';

// --- Charger dynamiquement les tokens des Pages depuis .env ---
const PAGE_TOKENS = {};
(process.env.PAGE_TOKENS || '').split(',').forEach(entry => {
  const [pageId, token] = entry.split(':').map(s => s.trim());
  if (pageId && token) PAGE_TOKENS[pageId] = token;
});

// --- Webhook Verification ---
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

// --- Webhook Event Handling multi-Pages ---
app.post('/webhook', async (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    body.entry?.forEach(entry => {
      const pageId = entry.id;
      const PAGE_ACCESS_TOKEN = PAGE_TOKENS[pageId];
      if (!PAGE_ACCESS_TOKEN) return;

      entry.messaging?.forEach(event => {
        const senderId = event.sender.id;

        // 🔹 Message texte
        if (event.message && event.message.text) {
          handleMessage(event, PAGE_ACCESS_TOKEN);
        }

        // 🔹 Postbacks
        else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN);
        }
      });
    });

    return res.status(200).send('EVENT_RECEIVED');
  }

  res.sendStatus(404);
});

// --- Server initialization ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
