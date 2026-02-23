# 🚀 DashV - Quick Start Guide

## Was ist DashV?

DashV ist ein **automatisches Service-Discovery Dashboard** für Proxmox. Es verbindet sich mit deinem Proxmox-Host, findet automatisch alle laufenden Services in Containern und VMs und zeigt sie in einer modernen Web-UI an - ähnlich wie Heimdall oder Homarr, aber mit automatischer Erkennung statt manueller Konfiguration.

### ✨ Key Features

- 🔍 **Automatische Service-Erkennung**: Findet automatisch Services in LXC Container & QEMU VMs
- 🔄 **Echtzeit-Updates**: WebSocket-basierte Live-Updates bei Service-Änderungen
- 📊 **Modernes Dashboard**: React + Tailwind CSS UI
- 🗄️ **Persistente Datenspeicherung**: PostgreSQL Datenbank
- 🔗 **Change Tracking**: Nachverfolgung von Service-Änderungen
- 🌐 **Responsive Design**: Funktioniert auf Desktop, Tablet und Handy

## 📦 Installation

### Schritt 1: Dependencies installieren
```bash
cd /Users/janheberle/dashv
npm install
```

### Schritt 2: Docker Container starten (PostgreSQL)
```bash
docker-compose up -d
```

Dies startet:
- PostgreSQL Datenbank auf `localhost:5432`
- Nginx reverse proxy (optional)

### Schritt 3: Development starten
```bash
npm run dev
```

Dies startet parallel:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:3003

Öffne http://localhost:80 im Browser.

## 🔐 Proxmox verbinden

1. Im Dashboard klickst du auf "Connect Proxmox Instance"
2. Füll folgende Daten ein:
   - **Proxmox Host**: z.B. `proxmox.example.com`
   - **User**: z.B. `root@pam`
   - **API Token**: Dein Proxmox API Token

### 🔑 Proxmox API Token erstellen

In deiner Proxmox Web-UI:
1. Gehe zu **Datacenter → Permissions → API Tokens**
2. Klicke auf **"Add"**
3. Füll die Felder aus und gib dem Token die nötige Permission
4. Kopiere das Token - es wird danach nicht mehr angezeigt!

## 📊 Projektstruktur

```
dashv/
├── frontend/               # React UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ServiceGrid.tsx      # Grid mit Services
│   │   │   └── ProxmoxConnector.tsx # Verbindungsformular
│   │   ├── App.tsx                  # Main App
│   │   ├── main.tsx                 # Entry Point
│   │   └── index.css                # Tailwind CSS
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── services/
│   │   │   ├── ProxmoxManager.ts      # Proxmox API Integration
│   │   │   ├── DatabaseManager.ts     # PostgreSQL Wrapper
│   │   │   └── ServiceDiscovery.ts    # Service Polling Engine
│   │   ├── index.ts                   # Express App
│   │   └── types/
│   └── package.json
│
├── shared/                 # Gemeinsame Types
│   ├── src/
│   │   └── index.ts
│   └── package.json
│
├── docker-compose.yml      # PostgreSQL + Dev Setup
├── package.json            # Root Monorepo
├── tsconfig.json           # TypeScript Config
├── README.md               # Dokumentation
└── DEVELOPMENT.md          # Entwickler-Guide
```

## 🔧 Wichtige Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Startet Frontend + Backend in Watch-Mode |
| `npm run build` | Kompiliert Projekt zu Production-Build |
| `npm run type-check` | TypeScript Type-Checking |
| `npm run lint` | ESLint-Check |
| `docker-compose up -d` | Startet PostgreSQL Container |
| `docker-compose down` | Stoppt alle Container |
| `docker-compose logs -f backend` | Backend Logs anschauen |

## 📝 Weitere Dokumentation

- [README.md](README.md) - Detaillierte Dokumentation
- [DEVELOPMENT.md](DEVELOPMENT.md) - Developer Guide mit nächsten Schritten
- [Proxmox API Docs](https://pve.proxmox.com/pve-docs/api-viewer/) - Offizielle API Doku

## 🚀 Nächste Entwicklungsschritte

Siehe [DEVELOPMENT.md](DEVELOPMENT.md) für detaillierte Anleitung zu:
- Service Discovery Engine verbessern
- Proxmox API Integration komplettieren
- UI Komponenten erweitern
- Datenbank-Features nutzen
- Error Handling & Logging

## 🐛 Troubleshooting

### Docker läuft nicht
```bash
# Docker starten (macOS)
open /Applications/Docker.app

# oder direktChecker
docker ps
```

### Port schon in Verwendung
```bash
# Prozess auf Port finden
lsof -i :80  # Frontend
lsof -i :3003  # Backend
lsof -i :5432  # PostgreSQL

# Dann killprozess
kill -9 <PID>
```

### Datenbank-Fehler
```bash
# PostgreSQL Container neu starten
docker-compose restart postgres

# Logs anschauen
docker-compose logs postgres
```

## 🎯 Roadmap

- [ ] Multi-Proxmox-Host Support
- [ ] Service-Icons & Kategorisierung
- [ ] Change-Benachrichtigungen (Toast/Email)
- [ ] Service-Details View
- [ ] Favoriten-System
- [ ] Dark/Light Mode
- [ ] Konfigurierbare Port-Detection
- [ ] SSH-basierte Service-Erkennung
- [ ] Docker-Label Support
- [ ] Performance-Optimierungen
- [ ] Mobile App (React Native?)

## 📄 Lizenz

MIT - Frei verwendbar für private und kommerzielle Projekte.

## 💬 Support

Falls du Fragen hast:
1. Schau zuerst in [DEVELOPMENT.md](DEVELOPMENT.md)
2. Checke die [Proxmox API Dokumentation](https://pve.proxmox.com/pve-docs/api-viewer/)
3. Debug-Logs anschauen mit `docker-compose logs -f`

---

**Viel Spaß mit DashV! 🎉**
