# Secure Vault App

Full-Stack React + Netlify Functions Anwendung mit Netlify Blobs Persistenz.

## Deployment auf Netlify

### 1. Repo pushen
Pushe diesen Code zu GitHub/GitLab/Bitbucket.

### 2. Site in Netlify erstellen
1. **Add new site** > **Import from existing project**
2. Wähle dein Repository aus
3. Build Settings werden automatisch erkannt:
   - Build command: `npm run build`
   - Publish directory: `dist`

### 3. Environment Variables setzen (WICHTIG!)

Gehe zu **Site configuration > Environment variables** und füge hinzu:

**Pflicht für Blobs:**
- `BLOB_SITE_ID`: Deine Netlify Site ID (unter Site settings > General > Site details)
- `BLOB_AUTH_TOKEN`: Personal Access Token (erstelle unter User settings > Applications > Personal access tokens)

**Optional (aber empfohlen):**
- `ADMIN_PASSWORD`: Login-Passwort (Standard: `admin123`)
- `JWT_SECRET`: Secret für Cookies (Standard nutzt Fallback)

### 4. Deploy
Klicke auf **Deploy** oder pushe zum Repo.

## Login
- **Username**: `admin`
- **Password**: Dein `ADMIN_PASSWORD` oder `admin123`

## Features
- 🔐 Sichere Authentifizierung (HttpOnly Cookies, Bcrypt)
- 🛡️ Brute-Force Schutz (persistiert in Blobs)
- 💾 Datenspeicherung via Netlify Blobs
- 🎨 Glass UI mit Partikel-Effekten

## Lokale Entwicklung
```bash
npm install
npx netlify dev
```
