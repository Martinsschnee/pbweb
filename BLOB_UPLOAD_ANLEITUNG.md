# Blob-Daten wiederherstellen

Wenn Sie Ihre lokalen Blob-Daten auf Netlify hochladen möchten, haben Sie mehrere Optionen:

## Option 1: Über die Web-Oberfläche (Empfohlen)

1. Melden Sie sich als Admin an
2. Navigieren Sie zum Admin Panel
3. Klicken Sie auf "Upload Blobs" in der Seitenleiste
4. Wählen Sie Ihre lokale `data.json` Datei aus:
   - Windows: `.netlify\blobs\deploy\records\data.json`
   - Unix: `.netlify/blobs/deploy/records/data.json`
5. Klicken Sie auf "Daten hochladen"

Die Daten werden direkt zu Netlify Blobs hochgeladen.

## Option 2: Mit dem Upload-Skript

### Vorbereitung

Stellen Sie sicher, dass Sie auf Ihrer Netlify-Site angemeldet sind und das Admin-Auth-Token haben:

1. Öffnen Sie Ihre Website im Browser
2. Melden Sie sich als Admin an
3. Öffnen Sie die Browser-Entwicklertools (F12)
4. Gehen Sie zur Konsole und führen Sie aus:
   ```javascript
   localStorage.getItem('token')
   ```
5. Kopieren Sie den Wert (das ist Ihr Auth-Token)

### Upload durchführen

```bash
node upload-blobs.js .netlify/blobs/deploy/records/data.json
```

Das Skript wird Sie nach folgenden Informationen fragen:
- **Netlify Site URL**: z.B. `https://ihre-site.netlify.app`
- **Admin Auth Token**: Das Token aus Schritt 5 oben

### Mit Parametern (Nicht-interaktiv)

```bash
node upload-blobs.js .netlify/blobs/deploy/records/data.json --url=https://ihre-site.netlify.app --token=IHR_TOKEN
```

## Option 3: Manuell mit cURL

Wenn Sie die Daten manuell hochladen möchten:

```bash
curl -X POST https://ihre-site.netlify.app/.netlify/functions/uploadBlobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer IHR_AUTH_TOKEN" \
  -d @.netlify/blobs/deploy/records/data.json
```

Passen Sie den JSON-Body wie gewünscht an:

```json
{
  "storeName": "records",
  "key": "data",
  "data": {
    "records": [...],
    "checked": [...]
  }
}
```

## Fehlerbehebung

### Fehler: "Unauthorized" (401)
- Stellen Sie sicher, dass Sie als Admin angemeldet sind
- Überprüfen Sie, ob Ihr Auth-Token noch gültig ist

### Fehler: "Admin access required" (403)
- Nur Benutzer mit der Rolle "admin" können Blobs hochladen
- Überprüfen Sie Ihre Benutzerrolle im Admin Panel

### Fehler: "Missing data field" (400)
- Stellen Sie sicher, dass Ihre JSON-Datei gültig ist
- Überprüfen Sie, ob die Datei die richtigen Felder enthält

### Fehler: "Failed to upload blob data" (500)
- Überprüfen Sie die Netlify-Logs
- Stellen Sie sicher, dass die Umgebungsvariablen korrekt gesetzt sind:
  - `BLOB_AUTH_TOKEN` (optional)
  - `SITE_ID` (automatisch von Netlify gesetzt)

## Hinweise

- Die lokalen Blob-Daten in `.netlify/blobs/` sind nur ein Cache
- Sie werden nicht automatisch hochgeladen
- Nach dem Upload können Sie die lokalen Dateien löschen
- Die hochgeladenen Daten überschreiben die vorhandenen Daten im Store
