import { FC, useState } from 'react';

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

interface ServiceGridProps {
  services: Service[];
  onHideService?: (service: Service) => void;
  onSetIconUrl?: (service: Service) => void;
  onStartContainer?: (service: Service) => void;
  onEditService?: (service: Service, changes: { name?: string; port?: number }) => void;
}

const ServiceGrid: FC<ServiceGridProps> = ({ services, onHideService, onSetIconUrl, onStartContainer, onEditService }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editName, setEditName] = useState('');
  const [editPort, setEditPort] = useState<number>(0);

  // Categorize services based on name/port
  const categorizeService = (service: Service): string => {
    const name = service.name.toLowerCase();
    const port = service.port;

    if (name.includes('immich') || name.includes('photo') || name.includes('gallery')) return 'media';
    if (name.includes('jellyfin') || name.includes('plex') || name.includes('kaleidescape')) return 'media';
    if (name.includes('radarr') || name.includes('sonarr') || name.includes('lidarr')) return 'media';
    if (name.includes('qbittorrent') || name.includes('transmission') || name.includes('sab')) return 'media';
    if (name.includes('nextcloud') || name.includes('synology')) return 'productivity';
    if (name.includes('bitwarden') || name.includes('vaultwarden')) return 'productivity';
    if (name.includes('paperless') || name.includes('calibre')) return 'productivity';
    if (name.includes('gitea') || name.includes('gitlab') || name.includes('jenkins')) return 'development';
    if (name.includes('portainer') || name.includes('docker')) return 'development';
    if (name.includes('prometheus') || name.includes('grafana') || name.includes('influx')) return 'monitoring';
    if (name.includes('postgresql') || name.includes('mysql') || name.includes('mongo')) return 'storage';
    if (name.includes('pihole') || name.includes('adguard')) return 'system';
    if (name.includes('openvpn') || name.includes('wireguard')) return 'system';
    if (name.includes('homeassistant') || name.includes('home-assistant')) return 'home';

    // Category by port
    if ([80, 443, 3000, 3001, 5000, 5173, 8000, 8080].includes(port)) return 'productivity';
    if ([3306, 5432, 6379, 27017].includes(port)) return 'storage';
    if ([9090, 9091].includes(port)) return 'monitoring';

    return 'other';
  };

  const getServiceIcon = (service: Service): string => {
    if (service.iconUrl) {
      return '';
    }
    if (service.icon) {
      return service.icon;
    }
    const name = service.name.toLowerCase();

    if (name.includes('immich')) return '🖼️';
    if (name.includes('jellyfin')) return '🎬';
    if (name.includes('plex')) return '🎥';
    if (name.includes('radarr')) return '🎬';
    if (name.includes('sonarr')) return '📺';
    if (name.includes('lidarr')) return '🎵';
    if (name.includes('qbittorrent') || name.includes('transmission')) return '🌐';
    if (name.includes('nextcloud')) return '☁️';
    if (name.includes('bitwarden') || name.includes('vaultwarden')) return '🔐';
    if (name.includes('paperless')) return '📄';
    if (name.includes('calibre')) return '📚';
    if (name.includes('gitea') || name.includes('gitlab')) return '🐙';
    if (name.includes('jenkins')) return '🔨';
    if (name.includes('portainer') || name.includes('docker')) return '🐳';
    if (name.includes('prometheus')) return '📊';
    if (name.includes('grafana')) return '📈';
    if (name.includes('postgresql')) return '🐘';
    if (name.includes('mysql')) return '🐬';
    if (name.includes('mongodb')) return '🍃';
    if (name.includes('redis')) return '🔴';
    if (name.includes('pihole')) return '🕳️';
    if (name.includes('openvpn') || name.includes('wireguard')) return '🔒';
    if (name.includes('homeassistant') || name.includes('home-assistant')) return '🏠';
    if (name.includes('nginx') || name.includes('apache')) return '⚙️';
    if (name.includes('ubuntu') || name.includes('debian')) return '🐧';
    if (name.includes('windows')) return '🪟';

    return '📦';
  };

  const toDashboardIconSlug = (name: string): string => {
    const normalized = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    const overrides: Record<string, string> = {
      'home-assistant': 'home-assistant',
      'homeassistant': 'home-assistant',
      'nginx-proxy-manager': 'nginx-proxy-manager',
      'nginxproxymanager': 'nginx-proxy-manager',
      'grafana': 'grafana',
      'prometheus': 'prometheus',
      'vaultwarden': 'vaultwarden',
      'bitwarden': 'bitwarden',
      'qbittorrent': 'qbittorrent',
      'nextcloud': 'nextcloud',
      'jellyfin': 'jellyfin',
      'immich': 'immich',
      'portainer': 'portainer',
      'paperless': 'paperless-ngx',
    };

    return overrides[normalized] || normalized;
  };

  const getDashboardIconUrl = (service: Service): string => {
    const slug = toDashboardIconSlug(service.name);
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${slug}.png`;
  };

  const getServiceColor = (service: Service): string => {
    const category = categorizeService(service);

    const colors: Record<string, string> = {
      media: 'from-purple-500 to-pink-500',
      productivity: 'from-blue-500 to-cyan-500',
      development: 'from-orange-500 to-red-500',
      monitoring: 'from-yellow-500 to-orange-500',
      storage: 'from-green-500 to-emerald-500',
      system: 'from-gray-600 to-gray-700',
      home: 'from-indigo-500 to-blue-500',
      other: 'from-gray-500 to-gray-600',
    };

    return colors[category] || colors.other;
  };

  // Filter and search
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || categorizeService(service) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(services.map(categorizeService)));

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setEditName(service.name);
    setEditPort(service.port);
  };

  const handleSaveEdit = async () => {
    if (!editingService) return;
    
    const changes: { name?: string; port?: number } = {};
    if (editName !== editingService.name) {
      changes.name = editName;
    }
    if (editPort !== editingService.port) {
      changes.port = editPort;
    }

    if (Object.keys(changes).length > 0 && onEditService) {
      await onEditService(editingService, changes);
    }

    setEditingService(null);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
  };

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="🔍 Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-6 py-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Service Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            {searchTerm ? 'No services found matching your search.' : 'No services available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((service) => {
            const isClickable = service.url && service.url !== '#' && service.ip !== 'unknown';
            const Wrapper = (isClickable ? 'a' : 'div') as 'a' | 'div';
            const wrapperProps = isClickable
              ? { href: service.url, target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <Wrapper
                key={service.id}
                {...wrapperProps}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${getServiceColor(service)} p-[2px] transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:shadow-blue-500/50 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="relative h-full bg-gradient-to-br from-gray-900 to-gray-950 rounded-[15px] p-6 flex flex-col justify-between min-h-[250px]">
                {/* Top Section: Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-6xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-300 drop-shadow-lg">
                    {service.iconUrl ? (
                      <img
                        src={service.iconUrl}
                        alt={service.name}
                        className="w-14 h-14 object-contain rounded-md"
                      />
                    ) : failedIcons[service.id] ? (
                      getServiceIcon(service)
                    ) : (
                      <img
                        src={getDashboardIconUrl(service)}
                        alt={service.name}
                        className="w-14 h-14 object-contain rounded-md"
                        onError={() =>
                          setFailedIcons((prev) => ({ ...prev, [service.id]: true }))
                        }
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-3xl opacity-20 group-hover:opacity-40 transition-opacity group-hover:translate-x-1">
                      ↗
                    </div>
                    <div className="flex gap-2">
                      {onEditService && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditService(service);
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-800/60 text-gray-200 hover:bg-gray-700"
                          title="Bearbeiten"
                        >
                          ✏️
                        </button>
                      )}
                      {onSetIconUrl && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSetIconUrl(service);
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-800/60 text-gray-200 hover:bg-gray-700"
                          title="Icon ändern"
                        >
                          🖼️
                        </button>
                      )}
                      {onHideService && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onHideService(service);
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-800/60 text-gray-200 hover:bg-gray-700"
                          title="Ausblenden"
                        >
                          🙈
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Section: Title and Description */}
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors mb-2 leading-tight">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Bottom Section: Details */}
                <div className="pt-4 border-t border-gray-700/50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Status</span>
                    <span className={`text-[11px] px-2 py-1 rounded ${service.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {service.status || 'unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Container</span>
                    <span className="text-gray-200 font-mono text-[11px] bg-gray-800/50 px-2 py-1 rounded">
                      {service.containerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Address</span>
                    <span className="text-gray-200 font-mono text-[11px] bg-gray-800/50 px-2 py-1 rounded">
                      {service.ip}:{service.port}
                    </span>
                  </div>
                  {!isClickable && (
                    <div className="text-[11px] text-yellow-300/80">IP unbekannt – Link deaktiviert</div>
                  )}
                  {onStartContainer && service.status !== 'running' && service.node && service.containerId ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onStartContainer(service);
                      }}
                      className="w-full mt-2 text-xs px-3 py-2 rounded bg-green-600/20 text-green-300 hover:bg-green-600/30 border border-green-500/40"
                    >
                      ▶️ Starten
                    </button>
                  ) : null}
                </div>

                {/* Animated Border Gradient */}
                <div className="absolute inset-0 rounded-[15px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 pointer-events-none" />
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-8 max-w-sm w-full space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Service bearbeiten</h3>
              <button onClick={handleCancelEdit} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Port</label>
                <input
                  type="number"
                  value={editPort}
                  onChange={(e) => setEditPort(Number(e.target.value))}
                  className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 font-semibold py-2 rounded-lg transition-all"
              >
                💾 Speichern
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-700/30 hover:bg-gray-700/40 border border-gray-600/40 text-gray-200 font-semibold py-2 rounded-lg transition-all"
              >
                ✕ Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Count */}
      <div className="text-center pt-8 border-t border-gray-800">
        <p className="text-gray-400 text-sm">
          Showing {filteredServices.length} of {services.length} services
        </p>
      </div>
    </div>
  );
};

export default ServiceGrid;
