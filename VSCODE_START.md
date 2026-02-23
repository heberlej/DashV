# 🎬 DashV - VS Code Getting Started

Willkommen! Du hast DashV erfolgreich eingerichtet. Hier ist dein Schnellstart-Guide für VS Code.

## ✅ Setup-Status

```
✅ Project strukturiert
✅ Dependencies installiert
✅ TypeScript konfiguriert
✅ Docker Ready
✅ Dokumentation komplett
✅ Build erfolgreich
```

## 🚀 Sofort-Start (3 Schritte)

### 1️⃣ Terminal öffnen
- Drücke `Ctrl+` (oder `View → Terminal`)
- Du bist automatisch im Projekt-Verzeichnis

### 2️⃣ Docker starten
```bash
docker-compose up -d
```
Dies startet PostgreSQL im Hintergrund.

### 3️⃣ Development starten
```bash
npm run dev
```

Dann öffne diese URLs:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:3003/health

## 📁 Dateien Übersicht

### Frontend (`frontend/`)
- **`src/App.tsx`** - Hauptkomponente mit WebSocket
- **`src/components/ServiceGrid.tsx`** - Service-Anzeige
- **`src/components/ProxmoxConnector.tsx`** - Verbindungsformular
- **`vite.config.ts`** - Vite Konfiguration
- **`tailwind.config.js`** - Tailwind Styling

### Backend (`backend/`)
- **`src/index.ts`** - Express Server & Routes
- **`src/services/ProxmoxManager.ts`** - Proxmox API
- **`src/services/DatabaseManager.ts`** - PostgreSQL
- **`src/services/ServiceDiscovery.ts`** - Service Polling

### Konfiguration (Root)
- **`package.json`** - Dependencies & Scripts
- **`tsconfig.json`** - TypeScript Config
- **`docker-compose.yml`** - PostgreSQL Setup
- **`.env`** - Environment Variables

## 🔧 Wichtigste Commands

```bash
# Development (Frontend + Backend gleichzeitig)
npm run dev

# Nur Backend
npm run dev -w backend

# Nur Frontend
npm run dev -w frontend

# Kompilieren
npm run build

# Type-Check (TypeScript)
npm run type-check

# Linting
npm run lint

# Docker
docker-compose up -d      # Start
docker-compose logs -f    # Logs
docker-compose down       # Stop
```

## 🐛 Debugging

### Backend Debugging
1. Setze einen Breakpoint in `backend/src/` Dateien
2. Nutze `npm run dev -w backend`
3. Chrome: `chrome://inspect` → "Inspect Proxmox Backend"

### Frontend Debugging
1. Öffne http://localhost:80
2. Nutze Browser DevTools (F12)
3. Console & Network Tab für WebSocket Events

### PostgreSQL Debugging
```bash
# Mit Container verbinden
docker-compose exec postgres psql -U dashv -d dashv

# Beispiel Query
SELECT * FROM services;
SELECT * FROM proxmox_connections;
```

## 📚 Dokumentation im Projekt

| Datei | Für |
|-------|-----|
| **QUICKSTART.md** | Schneller Überblick |
| **DEVELOPMENT.md** | Nächste Entwicklungs-Schritte |
| **ARCHITECTURE.md** | System Design & Data Flow |
| **README.md** | Vollständige Dokumentation |
| **PROJECT_SUMMARY.md** | Projekt-Übersicht |

## 🎯 Dein Nächstes Ziel

1. **Starte `npm run dev`**
2. **Öffne http://localhost:80**
3. **Verbinde einen Proxmox-Host** (oder nutze Test-Daten)
4. **Schaue die WebSocket Events** in Browser Console

## 🔗 Wichtige Links

- [Proxmox API Docs](https://pve.proxmox.com/pve-docs/api-viewer/)
- [React Docs](https://react.dev)
- [Express Docs](https://expressjs.com)
- [Socket.io Docs](https://socket.io/docs/)

## 💡 Tipps

1. **Änderungen live sehen**: Mit `npm run dev` werden Dateien automatisch reloaded
2. **WebSocket testen**: Browser Console → `io` Object
3. **DB-Schema ansehen**: [backend/src/services/DatabaseManager.ts](backend/src/services/DatabaseManager.ts#L33)
4. **API testen**: `curl http://localhost:3003/health`

## ⚡ Schnelle Änderungen

### Service Grid Farben ändern
`frontend/src/components/ServiceGrid.tsx` Zeile 18:
```tsx
className="bg-gray-800 rounded-lg p-6..."  // ← Hier
```

### API Timeout ändern
`backend/src/services/ServiceDiscovery.ts` Zeile 17:
```ts
setInterval(() => {
  this.discoverServices();
}, 30000);  // ← 30 Sekunden, hier ändern
```

### Service Grid Layout
`frontend/src/components/ServiceGrid.tsx` Zeile 18:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// columns: mobile=1, tablet=2, desktop=3
```

## 🚀 Deployment (später)

```bash
# Production Build
npm run build

# Docker Image
docker build -f backend/Dockerfile.prod -t dashv-backend .
docker build -f frontend/Dockerfile.prod -t dashv-frontend .
```

## ❓ Probleme?

### Port 80 belegt?
```bash
lsof -i :80
kill -9 <PID>
# oder ändern in vite.config.ts
```

### Database-Fehler?
```bash
docker-compose restart postgres
docker-compose logs postgres
```

### Module not found?
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🎓 Lernen

Das Projekt ist perfekt zum Lernen:
- **Frontend**: React Hooks, WebSocket, Tailwind
- **Backend**: Express, Socket.io, PostgreSQL
- **DevOps**: Docker, TypeScript, npm Workspaces

Schau die Quellen an und experimentiere!

---

## 🎯 Nächster Schritt

**Öffne ein Terminal und führe aus:**

```bash
npm run dev
```

Dann öffne http://localhost:80 und viel Spaß! 🚀

**Fragen?** Schau in DEVELOPMENT.md oder ARCHITECTURE.md!

---
**Versioniert mit VS Code für optimale Entwicklung** ✨
