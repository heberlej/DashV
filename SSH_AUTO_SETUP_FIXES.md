# SSH Auto-Setup Fixes & Debugging

## Problem

Beim Versuch der SSH Auto-Setup erhielt man Fehler: "The string did not match the expected pattern."

Dies war ein Validierungsfehler von Proxmox selbst bei der Token-Erstellung.

## Ursachen identifiziert und behoben

### 1. **Token-Namen mit Bindestrichen** ❌→✅
   - **Problem**: Proxmox validiert Token-Namen mit Regex, Bindestriche können abgelehnt werden
   - **Fix**: Token-Namen werden jetzt zu Unterstrichen konvertiert
   - **Beispiel**: `dashv-auto` → `dashv_auto`
   - **Code**: `ProxmoxManager.ts` Zeile 327

### 2. **Token-Format-Fehler** ❌→✅
   - **Problem**: Vollständiger Token-String war falsch konstruiert
   - **Fehlerhaft**: `root@pam=<secret>`
   - **Korrekt**: `root@pam!tokenname=<secret>`
   - **Fix**: `ProxmoxManager.ts` Zeilen 69-77, tokenId wird jetzt richtig übergeben
   - **Code**: Token wird mit `tokenId` Parameter konstruiert

### 3. **Unterschiedliche Proxmox-Versionen Support** ❌→✅
   - **Problem**: `pveum user token add` hat verschiedene Syntax in unterschiedlichen Proxmox-Versionen
   - **Lösungen versucht** (in Fallback-Reihenfolge):
     1. Mit `-output-format json` (Moderne Versionen)
     2. Ohne `-output-format` (Ältere Versionen)
     3. Mit `-privsep 0` Flag
     4. Mit `-privsep 0` und JSON Output
   - **Code**: `SSHHelper.ts` Zeilen 63-82

### 4. **Token-Wert-Parsing** ❌→✅
   - **Problem**: Unterschiedliche Ausgabeformate der `pveum` Befehle
   - **Lösungen** (in Reihenfolge versucht):
     1. JSON Parsing (moderne Versionen)
     2. UUID Regex Pattern: `[a-f0-9]{8}-[a-f0-9]{4}-...`
     3. Key-Value Parsing nach "value"
   - **Code**: `SSHHelper.ts` Zeilen 100-125

### 5. **Eingabe-Validierung** ❌→✅
   - **Problem**: Frontend akzeptierte beliebige Zeichen im Token-Namen
   - **Fix**: HTML5 Input `pattern` Attribut hinzugefügt
   - **Pattern**: `[a-zA-Z0-9_-]*`
   - **Code**: `ProxmoxConnector.tsx` Zeile 187

## Detaillierte Logging

Die folgende Logging wurde hinzugefügt um Debugging zu vereinfachen:

```typescript
// ProxmoxManager.ts
console.log(`[AUTO-SETUP] Using token name: ${tokenName}`);

// SSHHelper.ts
console.log('[SSH] Executing create command:', createCmd);
console.log('[SSH] Create token result:', { success, error, outputLength, outputPreview });
console.log('[SSH] Parsed JSON token:', JSON.stringify(json));
console.log('[SSH] Extracted token via UUID regex:', fullToken);
```

## Testing

### Mit curl testen
```bash
./test-ssh-setup.sh <host> <user> <password> [tokenName]

# Beispiel:
./test-ssh-setup.sh proxmox.example.com root mypassword
```

### Logs überprüfen
```bash
docker compose logs backend --tail=50 | grep -i ssh
```

## Erwartetes Verhalten nach Fix

1. Frontend: Token-Name-Input akzeptiert nur alphanumerische Zeichen + Unterstrich/Bindestrich
2. Backend: Token-Name wird normalisiert (Bindestriche → Unterstriche)
3. SSH: `pveum` Befehl wird mit mehreren Fallback-Versuchen ausgeführt
4. Parser: Token-Wert wird aus verschiedenen Ausgabeformaten extrahiert
5. API: Token wird im korrekten Format `USER@REALM!TOKENID=SECRET` konstruiert

## Weitere Verbesserungen

Falls weiterhin Fehler auftreten:

1. **Backend Logs analysieren**: `docker compose logs backend` auf SSH-bezogene Fehler prüfen
2. **SSH-Verbindung testen**:
   ```bash
   ssh -v <user>@<host> 'pveum user token add root@pam test123'
   ```
3. **Token-Format überprüfen**:
   ```bash
   curl -H "Authorization: PVEAPIToken=root@pam!dashv_auto=<secret>" \
     https://<host>:8006/api2/json/version \
     --insecure
   ```

## GitHub Release Readiness

✅ SSH Auto-Setup Funktion ist nun:
- Robust gegen unterschiedliche Proxmox-Versionen
- Benutzerdaten-validiert
- Mit ausreichendem Fehler-Logging
- Dokumentiert

Das Projekt ist nun bereit für GitHub Publishing.
