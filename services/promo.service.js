import fs from "fs";
import path from "path";
import crypto from "crypto";

const filePath = path.resolve("database/promos.json");

function readDB() {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath));
}

function saveDB(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// =======================
// ADMIN génère code promo
// =======================
export function createPromo(book) {
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
export function validatePromo(code) {
  const db = readDB();

  const promo = db.find(p => p.code === code);

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
export function verifyToken(token) {
  const db = readDB();
  const promo = db.find(p => p.downloadToken === token);

  if (!promo) return null;
  if (Date.now() > promo.expiresAt) return null;

  return promo;
}

// =======================
// Marquer token comme utilisé après téléchargement
// =======================
export function markTokenUsed(token) {
  const db = readDB();
  const promo = db.find(p => p.downloadToken === token);
  if (!promo) return;

  promo.downloadToken = null; // Invalide le lien
  saveDB(db);
}
