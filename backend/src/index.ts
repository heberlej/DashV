import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { ProxmoxManager } from './services/ProxmoxManager.js';
import { DatabaseManager, Service } from './services/DatabaseManager.js';
import { ServiceDiscovery } from './services/ServiceDiscovery.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: true, // Allow all origins for development
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: true, // Allow all origins (safe for development)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());

// Database
const db = new DatabaseManager();

// Initialize Proxmox and Service Discovery
const proxmox = new ProxmoxManager();
const serviceDiscovery = new ServiceDiscovery(db, proxmox, io);

// In-memory preferences and manual services (persisted for all clients)
const hiddenServices = new Map<string, { id: string; name: string }>();
const iconOverrides = new Map<string, string>();
const manualServices = new Map<string, Service>();

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/services', async (_req, res) => {
  try {
    // Return services from discovery cache + manual services
    const discoveredServices = serviceDiscovery.getServices();
    const combined = [...discoveredServices, ...manualServices.values()];

    const editOverrides = app.locals.editOverrides as Map<string, { name?: string; port?: number }> || new Map();

    const services = combined
      .filter((service) => !hiddenServices.has(service.id))
      .map((service) => {
        let result = { ...service };
        
        // Apply icon override
        const iconUrl = iconOverrides.get(service.id);
        if (iconUrl) {
          result.iconUrl = iconUrl;
        }
        
        // Apply edit overrides
        const edits = editOverrides.get(service.id);
        if (edits) {
          if (edits.name !== undefined) {
            result.name = edits.name;
          }
          if (edits.port !== undefined) {
            result.port = edits.port;
          }
        }
        
        return result;
      });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Service preferences (hidden + icon overrides)
app.get('/api/services/preferences', (_req, res) => {
  res.json({
    hidden: Array.from(hiddenServices.values()),
    iconOverrides: Array.from(iconOverrides.entries()).map(([id, iconUrl]) => ({ id, iconUrl })),
  });
});

app.post('/api/services/hide', (req, res) => {
  const { id, name, hidden } = req.body || {};

  if (!id) {
    res.status(400).json({ error: 'Missing service id' });
    return;
  }

  if (hidden) {
    hiddenServices.set(id, { id, name: name || id });
  } else {
    hiddenServices.delete(id);
  }

  res.json({ success: true });
});

app.post('/api/services/icon', (req, res) => {
  const { id, iconUrl } = req.body || {};

  if (!id || !iconUrl) {
    res.status(400).json({ error: 'Missing id or iconUrl' });
    return;
  }

  iconOverrides.set(id, iconUrl);
  res.json({ success: true });
});

app.post('/api/services/manual', (req, res) => {
  const { name, url, iconUrl, description } = req.body || {};

  if (!name || !url) {
    res.status(400).json({ error: 'Missing name or url' });
    return;
  }

  const id = `manual-${Date.now()}`;
  const manualService: Service = {
    id,
    name,
    url,
    iconUrl,
    description,
    containerName: 'manual',
    containerType: 'lxc',
    containerId: 0,
    port: 0,
    ip: 'manual',
    lastUpdated: new Date(),
    source: 'manual',
  };

  manualServices.set(id, manualService);
  io.emit('service:added', manualService);
  res.json({ success: true, service: manualService });
});

app.delete('/api/services/manual/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Missing id' });
    return;
  }

  manualServices.delete(id);
  io.emit('service:removed', { id, name: id });
  res.json({ success: true });
});

// Edit service name and port
app.post('/api/services/edit/:id', (req, res) => {
  const { id } = req.params;
  const { name, port } = req.body || {};

  if (!id) {
    res.status(400).json({ error: 'Missing service id' });
    return;
  }

  // Check if it's a manual service
  const manualService = manualServices.get(id);
  if (manualService) {
    if (name !== undefined) {
      manualService.name = name;
    }
    if (port !== undefined) {
      manualService.port = port;
    }
    io.emit('service:updated', manualService);
    res.json({ success: true, service: manualService });
    return;
  }

  // For discovered services, we store name/port edits in a separate map
  // and apply them when returning services
  if (!("editOverrides" in app.locals)) {
    app.locals.editOverrides = new Map<string, { name?: string; port?: number }>();
  }
  
  const editOverrides = app.locals.editOverrides as Map<string, { name?: string; port?: number }>;
  const existing = editOverrides.get(id) || {};
  
  if (name !== undefined) {
    existing.name = name;
  }
  if (port !== undefined) {
    existing.port = port;
  }
  
  editOverrides.set(id, existing);

  // Get the service to emit back with changes
  const allServices = [...serviceDiscovery.getServices(), ...manualServices.values()];
  const service = allServices.find(s => s.id === id);
  if (service) {
    const updated = { ...service, ...existing };
    io.emit('service:updated', updated);
    res.json({ success: true, service: updated });
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

app.post('/api/containers/start', async (req, res) => {
  const { node, id, type } = req.body || {};

  if (!node || !id || !type) {
    res.status(400).json({ error: 'Missing node, id or type' });
    return;
  }

  try {
    const started = await proxmox.startContainer({ node, vmid: Number(id), type });
    if (!started) {
      res.status(500).json({ error: 'Failed to start container' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting container:', error);
    res.status(500).json({ error: 'Failed to start container' });
  }
});

// Check if Proxmox is already connected
app.get('/api/proxmox/status', async (_req, res) => {
  try {
    const isConnected = proxmox.isConnected();
    const config = isConnected ? proxmox.getConnectionInfo() : null;
    res.json({ 
      connected: isConnected,
      config: config ? { host: config.host, user: config.user } : null
    });
  } catch (error) {
    console.error('Error checking Proxmox status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Disconnect from Proxmox
app.post('/api/proxmox/disconnect', async (_req, res): Promise<void> => {
  try {
    serviceDiscovery.stopDiscovery();
    proxmox.disconnect();
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting from Proxmox:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Auto-setup via SSH: Create token and connect
app.post('/api/proxmox/auto-setup', async (req, res): Promise<void> => {
  try {
    const { host, sshUser, sshPassword, tokenName } = req.body;
    
    if (!host || !sshUser || !sshPassword) {
      res.status(400).json({ error: 'Missing required fields: host, sshUser, sshPassword' });
      return;
    }

    console.log(`[AUTO-SETUP] Starting auto-setup for ${host}...`);
    console.log(`[AUTO-SETUP] SSH User: ${sshUser}, Token Name: ${tokenName || 'dashv-auto'}`);
    
    const result = await proxmox.autoSetupViaSSH({
      host,
      sshUser,
      sshPassword,
      tokenName: tokenName || 'dashv-auto',
    });

    if (!result.success) {
      console.error(`[AUTO-SETUP] ❌ Failed: ${result.error}`);
      res.status(500).json({ error: result.error || 'Auto-setup failed' });
      return;
    }

    console.log(`[AUTO-SETUP] ✅ Token created successfully!`);
    console.log(`[AUTO-SETUP] Connecting with token to ${result.apiHost}:${result.apiPort}...`);
    
    // Connect with the new token
    const connected = await proxmox.connect({
      host: result.apiHost!,
      port: result.apiPort || 8006,
      user: result.user!,
      token: result.token!,
      tokenId: result.tokenName || 'dashv-auto',
    });

    if (!connected) {
      console.error(`[AUTO-SETUP] ❌ Token created but connection failed`);
      res.status(401).json({ error: 'Token created but connection failed' });
      return;
    }

    console.log(`[AUTO-SETUP] ✅ Connected to Proxmox successfully!`);

    // Save connection (ignore DB errors)
    try {
      await db.saveProxmoxConnection({ 
        host: result.apiHost!, 
        user: result.user!, 
        token: result.token! 
      });
    } catch (dbError) {
      console.warn('⚠️ Could not save connection to database (running in memory mode)');
    }

    // Start service discovery
    serviceDiscovery.startDiscovery();

    console.log(`[AUTO-SETUP] ✅ Setup completed - Starting service discovery...`);

    res.json({ 
      success: true, 
      message: 'Auto-setup completed successfully',
      tokenInfo: {
        user: result.user,
        tokenName: result.tokenName,
      }
    });
  } catch (error) {
    console.error('[AUTO-SETUP] ❌ Error in auto-setup:', error);
    res.status(500).json({ error: 'Failed to auto-setup' });
  }
});

app.post('/api/proxmox/connect', async (req, res): Promise<void> => {
  try {
    const { host, port, user, token } = req.body;
    
    console.log(`[DEBUG] Proxmox connect request: host=${host}, port=${port}, user=${user}, token=${token?.substring(0, 10)}...`);
    
    if (!host || !user || !token) {
      console.log('[DEBUG] Missing required fields');
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    console.log('[DEBUG] Attempting to connect to Proxmox...');
    // Validate connection
    const connected = await proxmox.connect({
      host,
      port: port || 8006,
      user,
      token,
    });

    console.log(`[DEBUG] Proxmox connection result: ${connected}`);
    if (!connected) {
      res.status(401).json({ error: 'Failed to connect to Proxmox' });
      return;
    }

    // Save connection (ignore DB errors in memory mode)
    try {
      await db.saveProxmoxConnection({ host, user, token });
    } catch (dbError) {
      console.warn('⚠️ Could not save connection to database (running in memory mode)');
    }

    // Start service discovery
    serviceDiscovery.startDiscovery();

    console.log('[DEBUG] Connection successful, sending response');
    res.json({ success: true });
  } catch (error) {
    console.error('Error connecting to Proxmox:', error);
    res.status(500).json({ error: 'Failed to connect to Proxmox' });
  }
});

// Manual discovery trigger
app.post('/api/proxmox/discover', async (_req, res): Promise<void> => {
  try {
    console.log('[DISCOVERY] Manual discovery triggered');
    
    // Get services before
    const containersBefore = serviceDiscovery.getServices().length;
    console.log(`[DISCOVERY] Services before: ${containersBefore}`);
    
    // Trigger discovery
    await serviceDiscovery.triggerDiscovery();
    
    const containersAfter = serviceDiscovery.getServices().length;
    console.log(`[DISCOVERY] Services after: ${containersAfter}`);
    
    res.json({ 
      success: true, 
      message: 'Discovery triggered',
      servicesBefore: containersBefore,
      servicesAfter: containersAfter,
      newServices: containersAfter - containersBefore,
    });
  } catch (error) {
    console.error('[DISCOVERY] Error during manual discovery:', error);
    res.status(500).json({ 
      error: 'Failed to trigger discovery',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Discovery status and diagnostics
app.get('/api/proxmox/discover-status', async (_req, res): Promise<void> => {
  try {
    const services = serviceDiscovery.getServices();
    const status = {
      running: true,
      servicesFound: services.length,
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        containerName: s.containerName,
        containerType: s.containerType,
        status: s.status,
        ip: s.ip,
        port: s.port,
      })),
      lastUpdate: new Date(),
    };
    
    res.json(status);
  } catch (error) {
    console.error('[DISCOVERY] Error getting discovery status:', error);
    res.status(500).json({ 
      error: 'Failed to get discovery status',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    await db.initialize();
    console.log('Database initialized');
  } catch (error) {
    console.warn('⚠️ Database not available - running in memory mode');
  }
  
  try {
    // Try to auto-reconnect to previously saved Proxmox config
    const savedConnection = await db.getProxmoxConnection();
    if (savedConnection && savedConnection.host && savedConnection.user && savedConnection.token) {
      console.log(`[INIT] Attempting to reconnect to previously saved Proxmox host: ${savedConnection.host}`);
      const connected = await proxmox.connect({
        host: savedConnection.host,
        user: savedConnection.user,
        token: savedConnection.token,
      });
      if (connected) {
        console.log('[INIT] ✅ Successfully reconnected to Proxmox');
        serviceDiscovery.startDiscovery();
      } else {
        console.warn('[INIT] ⚠️ Could not reconnect to saved Proxmox config');
      }
    }
  } catch (error) {
    console.warn('[INIT] Could not auto-reconnect:', error instanceof Error ? error.message : String(error));
  }
  
  try {
    // Auto-start service discovery in MOCK mode
    if (process.env.MOCK_PROXMOX === 'true') {
      console.log('[MOCK MODE] Auto-starting service discovery...');
      await proxmox.connect({
        host: 'mock',
        port: 8006,
        user: 'mock',
        token: 'mock',
      });
      serviceDiscovery.startDiscovery();
    }
  } catch (error) {
    console.error('Failed to auto-start discovery:', error);
  }
});
