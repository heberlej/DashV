import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import ServiceGrid from './components/ServiceGrid';
import ProxmoxConnector from './components/ProxmoxConnector';
import IconSearchModal from './components/IconSearchModal';
import DiscoveryPanel from './components/DiscoveryPanel';

interface Service {
  id: string;
  name: string;
  url: string;
  icon?: string;
  iconUrl?: string;
  description?: string;
  containerName: string;
  containerType: 'lxc' | 'qemu';
  containerId: number;
  node?: string;
  status?: string;
  port: number;
  ip: string;
  source?: 'discovered' | 'manual';
}

interface ProxmoxConfig {
  host: string;
  port: number;
  user: string;
  token: string;
}

interface HiddenService {
  id: string;
  name: string;
}

interface ConnectionInfo {
  host: string;
  user: string;
}

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [proxmoxConnected, setProxmoxConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hiddenServices, setHiddenServices] = useState<HiddenService[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualIconUrl, setManualIconUrl] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  const [showIconSearch, setShowIconSearch] = useState(false);
  const [selectedServiceForIcon, setSelectedServiceForIcon] = useState<Service | null>(null);

  // Dynamically set API URL based on current hostname
  // IMPORTANT: Always use window.location, never import.meta.env.VITE_API_URL
  // because environment variables are hardcoded at build time
  const getApiUrl = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3003`;
  };

  const apiUrl = getApiUrl();

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/services`);
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/services/preferences`);
      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.status}`);
      }
      const data = await response.json();
      setHiddenServices(data.hidden || []);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setHiddenServices([]);
    }
  };

  const checkBackendConnection = async () => {
    try {
      console.log('[Init] Checking backend connection...');
      const response = await fetch(`${apiUrl}/api/proxmox/status`);
      console.log('[Init] Backend response:', response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const data = await response.json();
      console.log('[Init] Backend data:', data);

      if (data.connected) {
        console.log('[Init] Already connected to Proxmox');
        setProxmoxConnected(true);
        setConnectionInfo(data.config || null);
        setupWebSocket();
        try {
          await fetchPreferences();
          await fetchServices();
        } catch (fetchError) {
          console.error('Failed to fetch services:', fetchError);
          // Don't fail - services will be empty but connection is OK
        }
      } else {
        console.log('[Init] Not connected to Proxmox - showing form');
      }
    } catch (error) {
      console.error('[Init] Failed to check backend connection:', error);
      // Silently fail - user will see connection form
    }
  };

  const setupWebSocket = () => {
    try {
      const socket = io(apiUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        setConnected(true);
        console.log('[WebSocket] Connected');
      });

      socket.on('disconnect', () => {
        setConnected(false);
        console.log('[WebSocket] Disconnected');
      });

      socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error);
      });

      socket.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

      socket.on('service:added', () => {
        fetchServices();
      });

      socket.on('service:updated', () => {
        fetchServices();
      });

      socket.on('service:removed', () => {
        fetchServices();
      });
    } catch (error) {
      console.error('[WebSocket] Failed to setup:', error);
      // Continue even if WebSocket fails
    }
  };

  const connectToProxmox = async (config: ProxmoxConfig) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/proxmox/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setProxmoxConnected(true);
        setupWebSocket();
        await fetchPreferences();
        await fetchServices();
      } else {
        const error = await response.json();
        alert(`Failed to connect: ${error.error}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect to Proxmox');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${apiUrl}/api/proxmox/disconnect`, { method: 'POST' });
      setProxmoxConnected(false);
      setServices([]);
      setShowSettings(false);
      setConnectionInfo(null);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleHideService = async (service: Service) => {
    await fetch(`${apiUrl}/api/services/hide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: service.id, name: service.name, hidden: true }),
    });
    await fetchPreferences();
    await fetchServices();
  };

  const handleUnhideService = async (id: string) => {
    await fetch(`${apiUrl}/api/services/hide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, hidden: false }),
    });
    await fetchPreferences();
    await fetchServices();
  };

  const handleSetIconUrl = async (service: Service) => {
    setSelectedServiceForIcon(service);
    setShowIconSearch(true);
  };

  const handleSelectIcon = async (iconUrl: string) => {
    if (!selectedServiceForIcon) return;
    
    await fetch(`${apiUrl}/api/services/icon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedServiceForIcon.id, iconUrl }),
    });
    await fetchServices();
    setShowIconSearch(false);
    setSelectedServiceForIcon(null);
  };

  const handleManualAdd = async () => {
    if (!manualName || !manualUrl) {
      alert('Name und URL sind erforderlich.');
      return;
    }

    await fetch(`${apiUrl}/api/services/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: manualName,
        url: manualUrl,
        iconUrl: manualIconUrl || undefined,
        description: manualDescription || undefined,
      }),
    });

    setManualName('');
    setManualUrl('');
    setManualIconUrl('');
    setManualDescription('');
    await fetchServices();
  };

  const handleStartContainer = async (service: Service) => {
    if (!service.node) {
      alert('Node fehlt für diesen Container.');
      return;
    }

    await fetch(`${apiUrl}/api/containers/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        node: service.node,
        id: service.containerId,
        type: service.containerType,
      }),
    });

    setTimeout(fetchServices, 1500);
  };

  const handleEditService = async (service: Service, changes: { name?: string; port?: number }) => {
    await fetch(`${apiUrl}/api/services/edit/${service.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    });
    await fetchServices();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-x-hidden">
      <div className="relative z-10">
        <header className="border-b border-gray-800/50 backdrop-blur-xl bg-gray-900/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">🚀</div>
                  <h1 className="text-4xl font-bold">DashV</h1>
                </div>
                <p className="text-gray-400 text-sm">Smart Service Dashboard for Proxmox VE</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${connected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-700/20 text-gray-400 border-gray-600/30'}`}>
                  {connected ? 'Verbunden' : 'Offline'}
                </span>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 rounded-xl bg-gray-800/60 hover:bg-gray-700 transition-all"
                >
                  ⚙️
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!proxmoxConnected ? (
            <ProxmoxConnector onConnect={connectToProxmox} loading={loading} />
          ) : (
            <div className="space-y-8">
              {services.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl">📦</div>
                  <h2 className="text-2xl font-bold mt-4">Keine Services gefunden</h2>
                  <p className="text-gray-400 mt-2">Die Discovery läuft oder es sind keine Container mit Tags vorhanden.</p>
                </div>
              )}
              
              <ServiceGrid
                services={services}
                onHideService={handleHideService}
                onSetIconUrl={handleSetIconUrl}
                onStartContainer={handleStartContainer}
                onEditService={handleEditService}
              />
              
              <DiscoveryPanel apiUrl={apiUrl} />
            </div>
          )}
        </main>

        <IconSearchModal
          isOpen={showIconSearch}
          onClose={() => {
            setShowIconSearch(false);
            setSelectedServiceForIcon(null);
          }}
          onSelect={handleSelectIcon}
          serviceName={selectedServiceForIcon?.name || ''}
        />

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-8 max-w-lg w-full mx-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Einstellungen</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
              </div>

              {connectionInfo && (
                <div className="text-sm text-gray-400 space-y-1">
                  <p><span className="text-gray-500">Host:</span> {connectionInfo.host}</p>
                  <p><span className="text-gray-500">User:</span> {connectionInfo.user}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Manuell hinzufügen</h4>
                <input
                  type="text"
                  placeholder="Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="URL (https://...)"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="Icon URL (optional)"
                  value={manualIconUrl}
                  onChange={(e) => setManualIconUrl(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2"
                />
                <input
                  type="text"
                  placeholder="Beschreibung (optional)"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2"
                />
                <button
                  onClick={handleManualAdd}
                  className="w-full bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 font-semibold py-2 rounded-lg"
                >
                  ➕ Hinzufügen
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Ausgeblendete Services</h4>
                {hiddenServices.length === 0 ? (
                  <p className="text-sm text-gray-500">Keine ausgeblendeten Services</p>
                ) : (
                  <div className="space-y-2">
                    {hiddenServices.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-800/40 border border-gray-700 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-200">{s.name}</span>
                        <button
                          onClick={() => handleUnhideService(s.id)}
                          className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                        >
                          Einblenden
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-500 text-red-400 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                Verbindung trennen
              </button>
            </div>
          </div>
        )}

        <footer className="border-t border-gray-800/50 backdrop-blur-xl bg-gray-900/30 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
              <p>🎯 Smart Service Dashboard for Proxmox VE</p>
              <p>Made with ❤️ • {new Date().getFullYear()}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
