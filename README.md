# DashV - Proxmox Service Dashboard

Automatisches Service-Discovery-Dashboard für Proxmox mit Echtzeit-Updates.

## 🚀 Features

- **Automatische Service-Erkennung**: Verbinde deinen Proxmox-Host über API und DashV findet automatisch laufende Dienste
- **Echtzeit-Updates**: WebSocket-basierte Live-Updates wenn sich Services ändern
- **Container-Support**: Unterstützt LXC Container und QEMU VMs
- **Change Tracking**: Nachverfolgung von Service-Änderungen
- **Modernes UI**: React + Tailwind CSS Dashboard
- **Responsive Design**: Funktioniert auf Desktop, Tablet und Handy

## 📋 Anforderungen

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (läuft in Docker Compose)
- Proxmox-Host mit API-Zugriff

## 🛠️ Installation & Setup

### 1. Repository klonen
```bash
git clone https://github.com/heberlej/dashv.git
cd dashv
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Konfiguration setzen
Kopiere die Beispiel-Umgebung und passe die Werte an:
```bash
cp .env.example .env
```

### 4. Services starten (Docker)
```bash
docker-compose up -d
```

Die folgenden Services starten:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:3003
- **PostgreSQL**: localhost:5432

### 5. Frontend & Backend development starten
```bash
npm run dev
```

Dies startet Frontend und Backend in Watch-Mode parallel.

## 📝 Proxmox-Verbindung

1. Öffne das Dashboard unter http://localhost:80
2. Verwende das Verbindungsformular um deinen Proxmox-Host zu verbinden
3. Gib folgende Informationen ein:
   - **Host**: z.B. `proxmox.example.com`
   - **User**: z.B. `root@pam`
   - **API Token**: Dein Proxmox API-Token

> **Tipp**: API-Token erstellst du in Proxmox unter Datacenter → Permissions → API Tokens

## ⚙️ Konfiguration

Alle Konfigurationswerte liegen in [.env](.env) und werden über Umgebungsvariablen geladen. Beispiele findest du in [.env.example](.env.example).

Wichtige Variablen:
- `PROXMOX_HOST`, `PROXMOX_USER`, `PROXMOX_TOKEN_ID`, `PROXMOX_TOKEN_SECRET`
- `FRONTEND_URL`, `PORT`, `VITE_API_URL`

## 🔐 Sicherheit & Datenschutz

- **Keine Secrets im Repo**: `.env` ist in der `.gitignore` enthalten.
- **Tokens nur lokal speichern**: Nutze Proxmox-API-Tokens mit minimalen Rechten.
- **HTTPS empfohlen**: Für öffentliche Deployments TLS terminieren (z. B. Traefik/Nginx).

## 🏗️ Projektstruktur

```
dashv/
├── frontend/           # React + TypeScript UI
│   ├── src/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
├── backend/            # Node.js/Express API
│   ├── src/
│   │   ├── services/
│   │   │   ├── ProxmoxManager.ts
│   │   │   ├── DatabaseManager.ts
│   │   │   └── ServiceDiscovery.ts
│   │   └── index.ts
│   └── tsconfig.json
├── shared/             # Gemeinsame Types
└── docker-compose.yml
```

## 🔧 Technologien

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Vite** - Build Tool
- **Socket.io Client** - WebSocket Client

### Backend
- **Node.js/Express** - HTTP Server
- **TypeScript** - Type Safety
- **Socket.io** - WebSocket Server
- **PostgreSQL** - Datenbank
- **Axios** - HTTP Client (Proxmox API)

### Infrastructure
- **Docker Compose** - Lokale Entwicklung
- **PostgreSQL 16** - Persistente Datenspeicherung

## 📡 API Endpoints

### Services
```
GET /api/services           # Alle bekannten Services
POST /api/proxmox/connect   # Mit Proxmox verbinden
GET /health                 # Health Check
```

### WebSocket Events
```
service:added       # Neuer Service entdeckt
service:updated     # Service aktualisiert
service:removed     # Service entfernt
```

## 🔄 Service Discovery Prozess

1. **Initialisierung**: Verbindung zum Proxmox-Host
2. **Container Listing**: Abrufe aller LXC Container & QEMU VMs
3. **Port Mapping**: Ermittlung typischer Service-Ports anhand des Namens
4. **IP Auflösung**: Abrufe der Container-IPs
5. **Service Erkennung**: Identifikation von laufenden Diensten
6. **Speicherung**: Services in PostgreSQL speichern
7. **Live Updates**: Änderungen via WebSocket an Frontend senden

## 🧪 Development

### Build Backend
```bash
npm run build -w backend
```

### Build Frontend
```bash
npm run build -w frontend
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🐳 Docker

### Lokale Entwicklung
```bash
docker-compose up -d
```

### Logs anschauen
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Alles stoppen
```bash
docker-compose down
```

## 🚀 Production Deployment

Für Production solltest du:
- Environment Variables konfigurieren (`.env`)
- TypeScript kompilieren
- Production Docker Images bauen
- Datenbank-Migrations durchführen
- HTTPS konfigurieren

## 📚 Weitere Informationen

- Architektur: [ARCHITECTURE.md](ARCHITECTURE.md)
- Schnellstart: [QUICKSTART.md](QUICKSTART.md)
- Entwicklung: [DEVELOPMENT.md](DEVELOPMENT.md)
- [Proxmox API Dokumentation](https://pve.proxmox.com/pve-docs/api-viewer/)
- [React Dokumentation](https://react.dev)
- [Tailwind CSS Dokumentation](https://tailwindcss.com)

## 🤝 Contributing

Pull Requests sind willkommen! Bitte öffne zuerst ein Issue, um Änderungen zu diskutieren.

## 📄 Lizenz

MIT

## 👨‍💻 Entwicklung

Entwickelt mit ❤️ für Proxmox-Enthusiasten
