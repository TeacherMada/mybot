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

// ADMIN génère code
export function createPromo(book) {

  const db = readDB();

  const code = "TM-" + crypto.randomBytes(3).toString("hex").toUpperCase();

  const promo = {
    code,
    book,
    used: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };

  db.push(promo);
  saveDB(db);

  return promo;
}

// USER valide code
export function validatePromo(code) {

  const db = readDB();

  const promo = db.find(p => p.code === code);

  if (!promo) return { error: "❌ Code invalide." };

  if (promo.used) return { error: "❌ Code déjà utilisé." };

  if (Date.now() > promo.expiresAt)
    return { error: "❌ Code expiré." };

  // générer token sécurisé
  const token = crypto.randomBytes(32).toString("hex");

  promo.used = true;
  promo.downloadToken = token;

  saveDB(db);

  return promo;
}

export function verifyToken(token) {
  const db = readDB();
  return db.find(p => p.downloadToken === token);
}
