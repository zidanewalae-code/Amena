// Script pour créer ou mettre à jour l'administrateur
// Usage: depuis la racine du repo:
//   cd backend
//   npm install mysql2 bcrypt
//   node ..\docs\fix_admin.js

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const DB_NAME = process.env.DB_NAME || 'AmenaDB';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@amena.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'secret123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function upsertAdmin() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    await conn.beginTransaction();

    // Rechercher utilisateur
    const [rows] = await conn.execute('SELECT user_id FROM `User` WHERE email = ?', [ADMIN_EMAIL]);
    let userId;
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

    if (rows.length > 0) {
      userId = rows[0].user_id;
      console.log(`Utilisateur existant trouvé (user_id=${userId}), mise à jour du mot de passe...`);
      await conn.execute('UPDATE `User` SET password = ?, name = ? WHERE user_id = ?', [hashed, ADMIN_NAME, userId]);
    } else {
      console.log('Aucun utilisateur admin trouvé — insertion...');
      const [res] = await conn.execute('INSERT INTO `User` (name,email,password) VALUES (?, ?, ?)', [ADMIN_NAME, ADMIN_EMAIL, hashed]);
      userId = res.insertId;
      console.log(`Utilisateur créé avec user_id=${userId}`);
    }

    // Vérifier/inserer Admin
    const [adminRows] = await conn.execute('SELECT admin_id FROM `Admin` WHERE admin_id = ?', [userId]);
    if (adminRows.length > 0) {
      console.log('Ligne Admin existante trouvée — mise à jour du role.');
      await conn.execute('UPDATE `Admin` SET role = ? WHERE admin_id = ?', ['admin', userId]);
    } else {
      console.log('Insertion d\'une ligne Admin pour cet utilisateur...');
      await conn.execute('INSERT INTO `Admin` (admin_id, role) VALUES (?, ?)', [userId, 'admin']);
    }

    await conn.commit();
    console.log(`Compte administrateur assuré: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (err) {
    await conn.rollback();
    console.error('Erreur pendant la création de l\'admin:', err.message || err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

upsertAdmin();
