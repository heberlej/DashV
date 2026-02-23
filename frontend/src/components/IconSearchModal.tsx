import { FC, useState, useMemo } from 'react';

interface IconSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconUrl: string) => void;
  serviceName: string;
}

const IconSearchModal: FC<IconSearchModalProps> = ({ isOpen, onClose, onSelect, serviceName }) => {
  const [searchTerm, setSearchTerm] = useState(serviceName.toLowerCase());
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});

  // Popular icons and common service names
  const iconDatabase = [
    // Media
    'immich', 'jellyfin', 'plex', 'kaleidescape', 'radarr', 'sonarr', 'lidarr', 'qbittorrent', 'transmission', 'sabnzbd',
    // Productivity
    'nextcloud', 'synology', 'bitwarden', 'vaultwarden', 'paperless-ngx', 'calibre-web', 'obsidian',
    // Development
    'gitea', 'gitlab', 'jenkins', 'github', 'portainer', 'docker', 'vs-code', 'vscode',
    // Monitoring
    'prometheus', 'grafana', 'influxdb', 'telegraf', 'netdata', 'uptime-kuma', 'statping',
    // Storage
    'postgresql', 'mysql', 'mongodb', 'redis', 'mariadb', 'minio', 'couchdb', 'elasticsearch',
    // System
    'pihole', 'adguard', 'openvpn', 'wireguard', 'nginx', 'apache', 'traefik', 'haproxy',
    // Home Automation
    'home-assistant', 'homebridge', 'node-red', 'zigbee2mqtt', 'z-wave-js', 'esphome',
    // Other
    'openssh', 'ubuntu', 'debian', 'alpine', 'centos', 'proxmox', 'truenas', 'unraid',
    'adguard-home', 'nginx-proxy-manager', 'fail2ban', 'watchtower', 'duplicati',
    'dockge', 'yacht', 'dashy', 'homer', 'organizr', 'heimdall', 'linkding', 'shaarli',
  ];

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
      'paperless-ngx': 'paperless-ngx',
    };

    return overrides[normalized] || normalized;
  };

  const getDashboardIconUrl = (slug: string): string => {
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${slug}.png`;
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const query = searchTerm.toLowerCase();
    const results = iconDatabase
      .filter((icon) => icon.includes(query) || query.split(' ').some(word => icon.includes(word)))
      .map((icon) => ({
        slug: toDashboardIconSlug(icon),
        name: icon,
        url: getDashboardIconUrl(toDashboardIconSlug(icon)),
      }))
      .slice(0, 20); // Limit to 20 results

    return results;
  }, [searchTerm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full space-y-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">Icon suchen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Icon suchen (z.B. nginx, jellyfin, home-assistant)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400">
            {searchResults.length > 0 
              ? `${searchResults.length} Icons gefunden` 
              : searchTerm.trim() 
              ? 'Keine Icons gefunden. Versuchen Sie einen anderen Namen.' 
              : 'Geben Sie einen Icon-Namen ein'}
          </p>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto">
          {searchResults.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {searchResults.map((result) => (
                <button
                  key={result.slug}
                  onClick={() => {
                    onSelect(result.url);
                    onClose();
                  }}
                  className="group flex flex-col items-center justify-center p-3 rounded-lg bg-gray-800/40 border border-gray-700 hover:border-blue-500 hover:bg-gray-700/60 transition-all"
                  title={result.name}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    {failedIcons[result.slug] ? (
                      <span className="text-2xl">🖼️</span>
                    ) : (
                      <img
                        src={result.url}
                        alt={result.name}
                        className="w-full h-full object-contain"
                        onError={() =>
                          setFailedIcons((prev) => ({ ...prev, [result.slug]: true }))
                        }
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-300 text-center line-clamp-2 group-hover:text-blue-300 transition-colors">
                    {result.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual URL Input Option */}
        <div className="border-t border-gray-700 pt-4 space-y-3">
          <p className="text-sm text-gray-400">Oder URL manuell eingeben:</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Icon URL (https://...)"
              id="manualIconUrl"
              className="flex-1 bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => {
                const input = document.getElementById('manualIconUrl') as HTMLInputElement;
                if (input && input.value.trim()) {
                  onSelect(input.value.trim());
                  onClose();
                }
              }}
              className="bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 font-semibold px-4 py-2 rounded-lg transition-all"
            >
              ✓ Nutzen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconSearchModal;
