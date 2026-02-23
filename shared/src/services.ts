/**
 * Service classification and icon mapping
 */

export interface ServiceMetadata {
  name: string;
  category: 'media' | 'productivity' | 'development' | 'system' | 'monitoring' | 'storage' | 'other';
  icon: string;
  color: string;
  description: string;
}

// Service detection patterns
const SERVICE_PATTERNS: Record<string, ServiceMetadata> = {
  immich: {
    name: 'Immich',
    category: 'media',
    icon: '🖼️',
    color: 'from-blue-500 to-blue-600',
    description: 'Photo management'
  },
  jellyfin: {
    name: 'Jellyfin',
    category: 'media',
    icon: '🎬',
    color: 'from-purple-500 to-purple-600',
    description: 'Media server'
  },
  plex: {
    name: 'Plex',
    category: 'media',
    icon: '🎥',
    color: 'from-orange-500 to-orange-600',
    description: 'Media server'
  },
  radarr: {
    name: 'Radarr',
    category: 'media',
    icon: '🎬',
    color: 'from-blue-500 to-blue-600',
    description: 'Movie management'
  },
  sonarr: {
    name: 'Sonarr',
    category: 'media',
    icon: '📺',
    color: 'from-cyan-500 to-cyan-600',
    description: 'TV show management'
  },
  lidarr: {
    name: 'Lidarr',
    category: 'media',
    icon: '🎵',
    color: 'from-amber-500 to-amber-600',
    description: 'Music management'
  },
  prowlarr: {
    name: 'Prowlarr',
    category: 'media',
    icon: '🔍',
    color: 'from-rose-500 to-rose-600',
    description: 'Indexer management'
  },
  sabnzbd: {
    name: 'SABnzbd',
    category: 'media',
    icon: '⬇️',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Usenet downloader'
  },
  qbittorrent: {
    name: 'qBittorrent',
    category: 'media',
    icon: '🌐',
    color: 'from-green-500 to-green-600',
    description: 'Torrent client'
  },
  transmission: {
    name: 'Transmission',
    category: 'media',
    icon: '🌐',
    color: 'from-red-500 to-red-600',
    description: 'Torrent client'
  },
  nextcloud: {
    name: 'Nextcloud',
    category: 'productivity',
    icon: '☁️',
    color: 'from-blue-400 to-blue-500',
    description: 'File sync & share'
  },
  bitwarden: {
    name: 'Bitwarden',
    category: 'productivity',
    icon: '🔐',
    color: 'from-blue-600 to-blue-700',
    description: 'Password manager'
  },
  calibre: {
    name: 'Calibre',
    category: 'productivity',
    icon: '📚',
    color: 'from-green-600 to-green-700',
    description: 'E-book management'
  },
  paperless: {
    name: 'Paperless',
    category: 'productivity',
    icon: '📄',
    color: 'from-orange-600 to-orange-700',
    description: 'Document management'
  },
  gitea: {
    name: 'Gitea',
    category: 'development',
    icon: '🐙',
    color: 'from-red-500 to-red-600',
    description: 'Git service'
  },
  gitlab: {
    name: 'GitLab',
    category: 'development',
    icon: '🦊',
    color: 'from-orange-500 to-orange-600',
    description: 'Git service'
  },
  github: {
    name: 'GitHub',
    category: 'development',
    icon: '🐙',
    color: 'from-gray-700 to-gray-800',
    description: 'Git service'
  },
  jenkins: {
    name: 'Jenkins',
    category: 'development',
    icon: '🔨',
    color: 'from-red-600 to-red-700',
    description: 'CI/CD pipeline'
  },
  docker: {
    name: 'Docker',
    category: 'development',
    icon: '🐋',
    color: 'from-blue-500 to-blue-600',
    description: 'Container platform'
  },
  portainer: {
    name: 'Portainer',
    category: 'development',
    icon: '🐳',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Container management'
  },
  prometheus: {
    name: 'Prometheus',
    category: 'monitoring',
    icon: '📊',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Metrics monitoring'
  },
  grafana: {
    name: 'Grafana',
    category: 'monitoring',
    icon: '📈',
    color: 'from-orange-500 to-orange-600',
    description: 'Data visualization'
  },
  influxdb: {
    name: 'InfluxDB',
    category: 'monitoring',
    icon: '📉',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Time-series database'
  },
  elasticsearch: {
    name: 'Elasticsearch',
    category: 'monitoring',
    icon: '🔎',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Search engine'
  },
  minio: {
    name: 'MinIO',
    category: 'storage',
    icon: '🪣',
    color: 'from-red-500 to-red-600',
    description: 'Object storage'
  },
  postgresql: {
    name: 'PostgreSQL',
    category: 'storage',
    icon: '🐘',
    color: 'from-blue-600 to-blue-700',
    description: 'Database'
  },
  mysql: {
    name: 'MySQL',
    category: 'storage',
    icon: '🐬',
    color: 'from-blue-500 to-blue-600',
    description: 'Database'
  },
  mongodb: {
    name: 'MongoDB',
    category: 'storage',
    icon: '🍃',
    color: 'from-green-500 to-green-600',
    description: 'NoSQL database'
  },
  redis: {
    name: 'Redis',
    category: 'storage',
    icon: '🔴',
    color: 'from-red-500 to-red-600',
    description: 'Cache'
  },
  pihole: {
    name: 'Pi-hole',
    category: 'system',
    icon: '🕳️',
    color: 'from-red-500 to-red-600',
    description: 'DNS blocker'
  },
  openvpn: {
    name: 'OpenVPN',
    category: 'system',
    icon: '🔒',
    color: 'from-green-600 to-green-700',
    description: 'VPN server'
  },
  wireguard: {
    name: 'WireGuard',
    category: 'system',
    icon: '🔐',
    color: 'from-blue-600 to-blue-700',
    description: 'VPN tunnel'
  },
  nginx: {
    name: 'Nginx',
    category: 'system',
    icon: '⚙️',
    color: 'from-green-500 to-green-600',
    description: 'Web server'
  },
  apache: {
    name: 'Apache',
    category: 'system',
    icon: '⚙️',
    color: 'from-red-500 to-red-600',
    description: 'Web server'
  },
  homeassistant: {
    name: 'Home Assistant',
    category: 'system',
    icon: '🏠',
    color: 'from-blue-500 to-blue-600',
    description: 'Home automation'
  },
};

/**
 * Detect service type from name and port
 */
export function detectService(containerName: string, port: number): ServiceMetadata | null {
  const lowerName = containerName.toLowerCase();
  
  // Try exact match
  for (const [key, metadata] of Object.entries(SERVICE_PATTERNS)) {
    if (lowerName.includes(key)) {
      return metadata;
    }
  }

  // Try to detect from common ports
  const portDetection: Record<number, ServiceMetadata> = {
    80: { name: 'Web Server', category: 'system', icon: '🌐', color: 'from-gray-500 to-gray-600', description: 'HTTP server' },
    443: { name: 'Web Server', category: 'system', icon: '🔒', color: 'from-gray-600 to-gray-700', description: 'HTTPS server' },
    3000: { name: 'Web App', category: 'productivity', icon: '💻', color: 'from-blue-500 to-blue-600', description: 'Web application' },
    3001: { name: 'Web App', category: 'productivity', icon: '💻', color: 'from-blue-500 to-blue-600', description: 'Web application' },
    5000: { name: 'Web App', category: 'productivity', icon: '💻', color: 'from-purple-500 to-purple-600', description: 'Web application' },
    5432: { name: 'PostgreSQL', category: 'storage', icon: '🐘', color: 'from-blue-600 to-blue-700', description: 'Database' },
    3306: { name: 'MySQL', category: 'storage', icon: '🐬', color: 'from-blue-500 to-blue-600', description: 'Database' },
    6379: { name: 'Redis', category: 'storage', icon: '🔴', color: 'from-red-500 to-red-600', description: 'Cache' },
    8080: { name: 'Web Service', category: 'system', icon: '🌐', color: 'from-orange-500 to-orange-600', description: 'Web service' },
    8443: { name: 'Web Service', category: 'system', icon: '🔒', color: 'from-orange-600 to-orange-700', description: 'HTTPS service' },
    9090: { name: 'Dashboard', category: 'monitoring', icon: '📊', color: 'from-yellow-500 to-yellow-600', description: 'Monitoring dashboard' },
  };

  if (portDetection[port]) {
    return portDetection[port];
  }

  return null;
}

/**
 * Get service metadata or default
 */
export function getServiceMetadata(containerName: string, port: number): ServiceMetadata {
  return detectService(containerName, port) || {
    name: containerName,
    category: 'other',
    icon: '📦',
    color: 'from-gray-500 to-gray-600',
    description: 'Unknown service'
  };
}
