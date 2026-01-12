# Guide de déploiement sur Render.com (Kousossou AI)

Ce guide explique comment déployer votre application sur Render.com à partir de l'archive `okooo.zip`.

## 1. Prérequis
- Un compte sur [Render.com](https://render.com).
- Un dépôt GitHub (ou GitLab) contenant les fichiers extraits de `okooo.zip`.

## 2. Configuration sur Render
1. **New > Web Service**
2. Connectez votre dépôt GitHub.
3. **Paramètres de base :**
   - **Name :** kousossou-ai (ou le nom de votre choix)
   - **Region :** Sélectionnez la plus proche de vos utilisateurs (ex: Frankfurt)
   - **Branch :** main
   - **Runtime :** Node
   - **Build Command :** `npm install && npm run build`
   - **Start Command :** `npm start`

## 3. Variables d'Environnement
Dans l'onglet **Environment**, ajoutez les clés suivantes :
- `PORT` : `10000` (Déjà configuré par défaut dans le code, mais Render l'utilise)
- `NODE_ENV` : `production`
- `DATABASE_URL` : (Si vous utilisez une base de données Postgres sur Render)
- `REPLIT_AI_MODEL_KEY` : (Si votre application utilise des fonctions AI spécifiques)

## 4. Notes importantes
- Le serveur est configuré pour écouter sur `0.0.0.0` et le port `10000`.
- Les fichiers statiques du frontend sont servis par le backend Express après le build (`npm run build`).
- Le fichier `package.json` contient tous les scripts nécessaires (`build`, `start`).
