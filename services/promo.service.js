const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Chemin vers la base de données promos.json
const filePath = path.resolve(__dirname, "../database/promos.json");

// =======================
// Lecture/Écriture DB
// =======================
function readDB() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// =======================
// ADMIN génère code promo
// =======================
function createPromo(book) {
  const db = readDB();

  const code = "TM-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  const promo = {
    code,
    book,
    used: false,
    downloadToken: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24h
  };

  db.push(promo);
  saveDB(db);
  return promo;
}

// =======================
// USER valide code promo
// =======================
function validatePromo(code) {
  const db = readDB();

  // Comparaison insensible à la casse
  const promo = db.find(p => p.code.toUpperCase() === code.toUpperCase());

  if (!promo) return { error: "❌ Code invalide." };
  if (promo.used) return { error: "❌ Code déjà utilisé." };
  if (Date.now() > promo.expiresAt) return { error: "❌ Code expiré." };

  // Générer un token sécurisé pour téléchargement
  const token = crypto.randomBytes(32).toString("hex");
  promo.used = true;
  promo.downloadToken = token;
  saveDB(db);

  return { ...promo, downloadToken: token };
}

// =======================
// Vérifier token PDF
// =======================
function verifyToken(token) {
  const db = readDB();
  const promo = db.find(p => p.downloadToken === token);

  if (!promo) return null;
  if (Date.now() > promo.expiresAt) return null;

  return promo;
}

// =======================
// Marquer token comme utilisé après téléchargement
// =======================
function markTokenUsed(token) {
  const db = readDB();
  const promo = db.find(p => p.downloadToken === token);
  if (!promo) return;

  promo.downloadToken = null; // Invalide le lien
  saveDB(db);
}

// =======================
// Export CommonJS
// =======================
module.exports = {
  createPromo,
  validatePromo,
  verifyToken,
  markTokenUsed
};
