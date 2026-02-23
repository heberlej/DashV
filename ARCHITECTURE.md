# 🎯 DashV - Architektur & Workflow

## System-Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ DashV Frontend (React + Tailwind)                        │  │
│  │ ┌─────────────────┐ ┌──────────────────────────────────┐ │  │
│  │ │  Service Grid   │ │   Proxmox Connector Form        │ │  │
│  │ │  - Service List │ │   - Host Input                  │ │  │
│  │ │  - Icons        │ │   - User Input                  │ │  │
│  │ │  - Port Info    │ │   - Token Input                 │ │  │
│  │ └─────────────────┘ └──────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                      ↑ HTTP + WebSocket ↓                       │
└─────────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            ↓                ↓                ↓
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ GET/POST     │ │ WebSocket    │ │ REST API     │
    │ /api/        │ │ Events:      │ │ /health      │
    │              │ │ - connected  │ │ /api/services│
    │ /health      │ │ - updated    │ │              │
    │ /services    │ │ - added      │ │              │
    │ /proxmox/    │ │ - removed    │ │              │
    │  connect     │ │              │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
            │                │                │
            └────────────────┼────────────────┘
                             ↓
    ┌──────────────────────────────────────────────────────────┐
    │           Express.js Backend (Node.js)                   │
    │  ┌─────────────────────────────────────────────────────┐ │
    │  │  Express Routes & Socket.io Server                 │ │
    │  │  - HTTP endpoints handling                         │ │
    │  │  - WebSocket connection management                 │ │
    │  │  - Business logic                                  │ │
    │  └─────────────────────────────────────────────────────┘ │
    │  ┌─────────────────────────────────────────────────────┐ │
    │  │  Service Managers                                  │ │
    │  │  ┌──────────────┐ ┌──────────────┐ ┌───────────┐  │ │
    │  │  │  Proxmox     │ │ ServiceDiscov│ │ Database  │  │ │
    │  │  │  Manager     │ │ ery (Polling)│ │ Manager   │  │ │
    │  │  │              │ │              │ │           │  │ │
    │  │  │ - API Auth   │ │ - List       │ │ - Save    │  │ │
    │  │  │ - Container  │ │   Containers │ │   Services│  │ │
    │  │  │   Listing    │ │ - Get IPs    │ │ - Track   │  │ │
    │  │  │ - Get Status │ │ - Scan Ports │ │   Changes │  │ │
    │  │  │ - Exec Cmd   │ │ - Detect     │ │ - Query   │  │ │
    │  │  │              │ │   Services   │ │   History │  │ │
    │  │  └──────────────┘ └──────────────┘ └───────────┘  │ │
    │  └─────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────┘
            │                     │
            ↓                     ↓
    ┌──────────────────┐  ┌──────────────────┐
    │  Proxmox API     │  │  PostgreSQL      │
    │  (https://...)   │  │  (localhost:5432)│
    │                  │  │                  │
    │ - Token Auth     │  │ - services table │
    │ - Container Info │  │ - connections    │
    │ - Status Check   │  │ - change_history │
    │ - Execute Cmds   │  │                  │
    │   (pct exec)     │  │                  │
    └──────────────────┘  └──────────────────┘
            │
            ↓
    ┌──────────────────────────────────────────────────────────┐
    │              Proxmox Infrastructure                      │
    │  ┌────────────────────────────────────────────────────┐ │
    │  │  LXC Container 101                                │ │
    │  │  - nginx Port 80                                  │ │
    │  │  - Dashboard Port 8080                            │ │
    │  │  - App Port 3000                                  │ │
    │  └────────────────────────────────────────────────────┘ │
    │  ┌────────────────────────────────────────────────────┐ │
    │  │  LXC Container 102                                │ │
    │  │  - Grafana Port 3000                              │ │
    │  │  - API Port 5000                                  │ │
    │  └────────────────────────────────────────────────────┘ │
    │  ┌────────────────────────────────────────────────────┐ │
    │  │  QEMU VM 200                                      │ │
    │  │  - Application Port 8443                          │ │
    │  │  - Service Port 9000                              │ │
    │  └────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────┘
```

## Service Discovery Workflow

```
START
  │
  ├─> [Proxmox Connection]
  │   ├─> Get Proxmox Host Config
  │   ├─> Authenticate with API Token
  │   └─> Verify Connection → Success/Fail
  │
  └─> [Service Discovery Loop] (alle 30 Sekunden)
      ├─> GET /api2/json/nodes → List all nodes
      │
      ├─> FOR EACH NODE
      │   ├─> GET /api2/json/nodes/{node}/lxc → LXC Container
      │   └─> GET /api2/json/nodes/{node}/qemu → QEMU VMs
      │
      ├─> FOR EACH CONTAINER/VM
      │   ├─> Get Container IP
      │   │   ├─> Via Proxmox API
      │   │   └─> Via SSH pct exec
      │   │
      │   ├─> Detect Open Ports
      │   │   ├─> Common Port List (80, 443, 8080, etc.)
      │   │   ├─> Port Scanning (optional)
      │   │   └─> Docker Labels (optional)
      │   │
      │   └─> FOR EACH OPEN PORT
      │       ├─> Create Service Object
      │       ├─> Check against Previous Services
      │       │   ├─> NEW: Emit 'service:added' event
      │       │   ├─> CHANGED: Emit 'service:updated' event
      │       │   └─> REMOVED: Emit 'service:removed' event
      │       │
      │       └─> Save to Database
      │
      ├─> Emit WebSocket Events to Connected Clients
      └─> Update Previous Services Map

LOOP (30 seconds)
```

## Data Models

### Service
```json
{
  "id": "101-8080",
  "name": "Dashboard",
  "url": "http://10.0.0.10:8080",
  "icon": "https://...",
  "description": "Service on container dashboard",
  "containerName": "dashboard",
  "containerType": "lxc",
  "containerId": 101,
  "port": 8080,
  "ip": "10.0.0.10",
  "lastUpdated": "2026-02-22T16:05:00Z"
}
```

### ProxmoxConnection
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "host": "proxmox.example.com",
  "user": "root@pam",
  "token": "***",
  "createdAt": "2026-02-22T16:00:00Z"
}
```

### ServiceChange
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "serviceId": "101-8080",
  "changeType": "ip_changed",
  "oldValue": "10.0.0.9",
  "newValue": "10.0.0.10",
  "createdAt": "2026-02-22T16:05:00Z"
}
```

## WebSocket Events

### Client → Server
```
connect             // Automatisch bei Connection
disconnect          // Automatisch bei Disconnect
```

### Server → Client
```
service:added       // Neuer Service entdeckt
{
  "id": "101-8080",
  "name": "Dashboard",
  "url": "http://10.0.0.10:8080",
  ...
}

service:updated     // Service aktualisiert
{
  "id": "101-8080",
  "name": "Dashboard",
  ...
}

service:removed     // Service entfernt
{
  "id": "101-8080",
  "name": "Dashboard"
}
```

## Technology Stack Details

### Frontend
- **React 18**: UI Framework
- **TypeScript**: Type-Safe Development
- **Tailwind CSS**: Utility-First Styling
- **Vite**: Modern Build Tool
- **Socket.io Client**: Real-time Communication
- **Axios**: HTTP Client (optional)

### Backend
- **Node.js 20+**: Runtime
- **Express 4.18**: HTTP Server
- **TypeScript**: Type-Safe Development
- **Socket.io**: WebSocket Server
- **PostgreSQL 16**: Relational Database
- **pg Driver**: PostgreSQL Client
- **Axios**: HTTP Client for Proxmox API
- **Joi**: Schema Validation (optional)
- **CORS**: Cross-Origin Support
- **Dotenv**: Environment Variables

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-Container Setup
- **PostgreSQL**: Data Persistence
- **Proxmox**: Container/VM Host (external)

## Performance Considerations

- **Service Discovery Interval**: 30 Sekunden (konfigurierbar)
- **Database**: Connection Pool für Performance
- **WebSocket**: Live Updates statt Polling
- **Caching**: Services in Memory während Laufzeit
- **Change Detection**: Nur bei tatsächlichen Änderungen

## Security Considerations

⚠️ **Production Wichtig**:
- SSL/TLS für alle Connections
- Environment Variables für Secrets
- API Token Management
- CORS richtig konfigurieren
- Input Validation auf allen Endpoints
- Database Access Control

---

**Weitere Infos**: Siehe README.md und DEVELOPMENT.md
