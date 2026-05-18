# Exécution locale d'AMENA (Windows)

Ce document rassemble tout ce qu'il faut pour démarrer le projet AMENA sur un autre PC Windows.

Prérequis
- Node.js >= 16 (installer depuis https://nodejs.org)
- npm (inclus avec Node.js)
- XAMPP / MariaDB (ou toute instance MariaDB accessible)
- Git (si vous clonez le dépôt)

Ports utilisés (par défaut)
- Backend API: `http://127.0.0.1:5000/api`
- Frontend preview: `http://127.0.0.1:5173`

Fichiers importants fournis dans `docs/`
- `run-local.ps1` : script PowerShell pour démarrer MariaDB (XAMPP), backend et frontend en arrière-plan.
- `fix_admin.js` : script Node pour créer ou mettre à jour le compte administrateur (email `admin@amena.tn`).

Étapes rapides
1. Installer Node.js et XAMPP (MariaDB).
2. Copier le dépôt sur la nouvelle machine (git clone ou extraction zip).
3. Importer la base de données initiale si nécessaire : `database/amena_simple.sql` (utiliser phpMyAdmin ou mysql client).
4. Ouvrir PowerShell en tant qu'administrateur et exécuter :

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
cd C:\xampp\htdocs\amena1
.\docs\run-local.ps1
```

5. (Optionnel) Mettre à jour ou créer l'admin si besoin :

```powershell
cd C:\xampp\htdocs\amena1
node .\docs\fix_admin.js
```

Comportement du script `fix_admin.js`
- Crée ou met à jour un utilisateur avec l'email `admin@amena.tn` et le mot de passe `secret123`.
- Crée/assure l'entrée dans la table `Admin` pour donner le rôle d'administrateur.

Dépendances pour `fix_admin.js`
- Depuis le dossier racine, installez :

```powershell
cd backend
npm install mysql2 bcrypt
```

Remarques et dépannage
- Si MariaDB est géré par XAMPP, vérifiez que le chemin `C:\xampp\mysql\bin\mysqld.exe` existe. Le script `run-local.ps1` l'utilisera.
- Si la base de données a un nom/données différents, adaptez les variables d'environnement : `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.
- Le backend lit les variables d'environnement depuis `.env` dans `backend/` (voir `backend/config/db.js`).

Identifiants administrateur par défaut
- Email : `admin@amena.tn`
- Mot de passe : `secret123`

Si vous voulez que je prépare un zip `docs/amena-local-bundle.zip` avec les fichiers buildés (`web/dist`), dites-le-moi et je l'ajouterai.

---
Fait par l'assistant — instructions en français. Contactez-moi si vous voulez que j'inclus aussi le `dist/` du frontend dans un bundle ZIP.
