const { createPromo } = require("../services/promo.service.js");
const fs = require("fs");
const path = require("path");
const { sendMessage } = require("../handles/sendMessage");

const ADMINS = (process.env.ADMIN_ID || "")
  .split(",")
  .map(a => a.trim());

module.exports = {
  name: "admin",

  async execute(senderId, args, pageAccessToken) {

    if (!ADMINS.includes(senderId.toString())) {
      return sendMessage(senderId, { text: "❌ Accès refusé." }, pageAccessToken);
    }

    if (args[0] && args[0].toLowerCase() === "list") {

      const pdfDir = path.join(__dirname, "../pdf");
      const files = fs.readdirSync(pdfDir).filter(f => f.endsWith(".pdf"));

      if (!files.length) {
        return sendMessage(senderId, { text: "📂 Aucun livre disponible." }, pageAccessToken);
      }

      return sendMessage(senderId, {
        text: `📚 Liste des livres :\n${files.join("\n")}`
      }, pageAccessToken);
    }

    const book = args[0];

    if (!book) {
      return sendMessage(senderId, {
        text: "Usage:\n@admin list\n@admin nom-fichier.pdf"
      }, pageAccessToken);
    }

    const pdfPath = path.join(__dirname, "../pdf", book);

    if (!fs.existsSync(pdfPath)) {
      return sendMessage(senderId, { text: `❌ Livre non trouvé: ${book}` }, pageAccessToken);
    }

    const promo = createPromo(book);

    return sendMessage(senderId, {
      text: `✅ Code promo généré:\n\n${promo.code}\n\nValable 24h.`
    }, pageAccessToken);
  }
};
