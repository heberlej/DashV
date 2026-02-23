# DashV Development Guide

## 🎯 Nächste Schritte

Das Projekt ist jetzt strukturiert und kann ausgeführt werden. Hier sind die wichtigsten nächsten Schritte:

### 1. **Service Discovery Engine verbessern**

Die aktuelle Service-Erkennung (`ServiceDiscovery.ts`) ist ein Grundgerüst. Du solltest:

```typescript
// In backend/src/services/ServiceDiscovery.ts

// 1. getContainerIP() implementieren
// Optionen:
// - Proxmox API für Container-Informationen nutzen
// - SSH in Container gehen mit `pct exec`
// - ARP-Tabellen parsen

// 2. detectOpenPorts() implementieren
// Optionen:
// - `netstat` / `ss` in Container ausführen
// - Port-Scanning mit nmap
// - Docker/LXC Konfigurationen parsen für exponierte Ports

// 3. Service-Fingerprinting
// - HTTP-Header prüfen zur Service-Identifikation
// - Container-Labels/Metadaten auslesen (z.B. Docker Labels)
```

### 2. **Proxmox API Integration komplettieren**

Die `ProxmoxManager.ts` hat ein Grundgerüst. Wichtig:

- **pct exec nutzen** zum Ausführen von Befehlen in LXC Containern
- **qm exec** für QEMU VMs (wenn nötig)
- **Authentifizierung** mit Proxmox API Token testen

```typescript
// Beispiel für pct exec
const response = await this.client.post(
  `/nodes/${node}/lxc/${vmid}/status/current`,
);
```

### 3. **UI erweitern**

Das aktuelle Frontend zeigt nur eine Service-Grid. Gute Ergänzungen:

- [ ] **Verbindungs-Management**: Mehrere Proxmox-Hosts verwalten
- [ ] **Service-Filter**: Nach Container-Typ, Status, etc. filtern
- [ ] **Change-Benachrichtigungen**: Toast/Alert bei Service-Änderungen
- [ ] **Service-Details**: Modal mit mehr Informationen
- [ ] **Icons/Favicons**: Automatische Icon-Erkennung von Services
- [ ] **Kategorisierung**: Services in Gruppen organisieren

### 4. **Datenbank-Features**

Nutze `DatabaseManager.ts` um:

```typescript
// Tracking von Service-Änderungen
await db.logServiceChange(
  serviceId,
  'port_change',
  '8080',
  '8081'
);

// History anschauen
const changes = await db.getServiceHistory(serviceId);
```

### 5. **Error Handling & Logging**

Aktuell sehr basic. Sollte verbessert werden:

- [ ] Winston/Pino Logger konfigurieren
- [ ] Structured Logging für Debugging
- [ ] Error Recovery bei Connection-Drops
- [ ] Retry-Logik für flüchtige Fehler

## 🚀 Starten der Entwicklung

### Terminal 1 - Docker Services (PostgreSQL)
```bash
cd /Users/janheberle/dashv
docker-compose up -d
```

### Terminal 2 - Development
```bash
cd /Users/janheberle/dashv
npm run dev
```

Dies startet:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:3003

### Browser
Öffne http://localhost:80 und verbinde deinen Proxmox-Host

## 🔑 Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `backend/src/services/ProxmoxManager.ts` | Proxmox API Kommunikation |
| `backend/src/services/ServiceDiscovery.ts` | Service-Erkennung & Polling |
| `backend/src/services/DatabaseManager.ts` | Datenspeicherung |
| `frontend/src/App.tsx` | Hauptkomponente & WebSocket |
| `frontend/src/components/ServiceGrid.tsx` | Service-Anzeige |
| `frontend/src/components/ProxmoxConnector.tsx` | Verbindungsformular |

## 📊 Architektur

```
Frontend (React)
    ↓ HTTP + WebSocket
Backend (Express + Socket.io)
    ↓ HTTP
Proxmox API
    ↓ SSH (pct exec)
Container/VMs
```

## 🧪 Testing

Später sollte getestet werden:

```bash
# Unit Tests
npm test

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e
```

## 🐛 Debugging

### Backend Debugging
```bash
# Mit Node Debugger starten
node --inspect-brk dist/index.js

# Dann öffne chrome://inspect in Chrome
```

### WebSocket Debugging
- Browser DevTools → Network → Filter "WS"
- Socket.io Events in Console loggen

## 📝 Code-Style

- TypeScript strict mode ist aktiviert
- ESLint konfiguriert
- Prettier (optional) kann hinzugefügt werden

```bash
npm run lint
npm run type-check
```

## 🔐 Security Notes

⚠️ **Production-Wichtig**:
- `PROXMOX_VERIFY_CERT=false` ist nur für Entwicklung
- API-Tokens sollten nicht im Code hinterlegt sein
- HTTPS für API-Kommunikation erzwingen
- CORS richtig konfigurieren
- SQL Injection ist auf der Todo

## 📚 Nützliche Resources

- [Proxmox API Docs](https://pve.proxmox.com/pve-docs/api-viewer/)
- [LXC Container Docs](https://pve.proxmox.com/wiki/Linux_Container)
- [Socket.io Docs](https://socket.io/docs/)
- [Vite Docs](https://vitejs.dev/)

## 🚢 Production

Wenn du bereit für Production bist:

```bash
# Build everything
npm run build

# Docker Images bauen
docker build -f backend/Dockerfile.prod -t dashv-backend .
docker build -f frontend/Dockerfile.prod -t dashv-frontend .

# Deployen (z.B. mit docker-compose.prod.yml)
```

---

**Happy coding! 🎉**
