import { Server as SocketIOServer } from 'socket.io';
import { ProxmoxManager, ProxmoxContainer } from './ProxmoxManager.js';
import { DatabaseManager, Service } from './DatabaseManager.js';

export class ServiceDiscovery {
  private interval: NodeJS.Timeout | null = null;
  private previousServices: Map<string, Service> = new Map();

  constructor(
    private db: DatabaseManager,
    private proxmox: ProxmoxManager,
    private io: SocketIOServer,
  ) {}

  startDiscovery(): void {
    console.log('Starting service discovery');
    
    // Run discovery immediately
    this.discoverServices();
    
    // Run every 30 seconds
    this.interval = setInterval(() => {
      this.discoverServices();
    }, 30000);
  }

  stopDiscovery(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  // Public method for manual discovery trigger
  async triggerDiscovery(): Promise<void> {
    console.log('[Discovery] Manual discovery triggered');
    await this.discoverServices();
  }

  getServices(): Service[] {
    return Array.from(this.previousServices.values());
  }

  private async discoverServices(): Promise<void> {
    try {
      console.log('[Discovery] Starting discovery cycle...');
      const containers = await this.proxmox.getContainers();
      console.log(`[Discovery] Found ${containers.length} containers`);
      const currentServices = new Map<string, Service>();

      for (const container of containers) {
        try {
          const services = await this.getServicesFromContainer(container);
          
          for (const service of services) {
            currentServices.set(service.id, service);
            
            // Check if this is a new or updated service
            const previousService = this.previousServices.get(service.id);
            
            if (!previousService) {
              // New service
              try {
                await this.db.saveService({
                  name: service.name,
                  url: service.url,
                  icon: service.icon,
                  description: service.description,
                  containerName: service.containerName,
                  containerType: service.containerType,
                  containerId: service.containerId,
                  port: service.port,
                  ip: service.ip,
                });
              } catch (dbError) {
                console.warn('⚠️ Could not save service to database (memory mode)');
              }

              this.io.emit('service:added', service);
              console.log('New service discovered:', service.name);
            } else if (JSON.stringify(previousService) !== JSON.stringify(service)) {
              // Service updated
              try {
                await this.db.saveService({
                  name: service.name,
                  url: service.url,
                  icon: service.icon,
                  description: service.description,
                  containerName: service.containerName,
                  containerType: service.containerType,
                  containerId: service.containerId,
                  port: service.port,
                  ip: service.ip,
                });
              } catch (dbError) {
                console.warn('⚠️ Could not update service in database (memory mode)');
              }

              this.io.emit('service:updated', service);
              console.log('Service updated:', service.name);
            }
          }
        } catch (error) {
          console.error(`Error discovering services in container ${container.name}:`, error);
        }
      }

      // Check for removed services
      for (const [serviceId, service] of this.previousServices) {
        if (!currentServices.has(serviceId)) {
          this.io.emit('service:removed', { id: serviceId, name: service.name });
          console.log('Service removed:', service.name);
        }
      }

      this.previousServices = currentServices;
    } catch (error) {
      console.error('Error during service discovery:', error);
    }
  }

  private async getServicesFromContainer(
    container: ProxmoxContainer,
  ): Promise<Service[]> {
    const services: Service[] = [];

    // Extract IP from tags (format: "10.10.10.194;tag1;tag2")
    const tags = (container as any).tags || '';
    const tagList = tags.split(';').filter((t: string) => t.trim());
    
    // Find IP address in tags (10.x.x.x format)
    let ip = tagList.find((tag: string) => /^10\.\d+\.\d+\.\d+$/.test(tag.trim())) || null;

    if (!ip) {
      ip = await this.proxmox.getContainerIp(container);
    }

    if (!ip) {
      console.log(`[Discovery] No IP found for container ${container.name}, marking as unknown`);
      ip = 'unknown';
    }

    // Extract service name (remove common suffixes)
    const serviceName = container.name
      .replace(/-docker$/i, '')
      .replace(/-lxc$/i, '')
      .replace(/-container$/i, '')
      .replace(/^lxc-/i, '')
      .trim();

    // Common service ports mapping
    const servicePortMap: Record<string, number[]> = {
      'immich': [2283],
      'jellyfin': [8096],
      'plex': [32400],
      'radarr': [7878],
      'sonarr': [8989],
      'lidarr': [8686],
      'prowlarr': [9696],
      'qbittorrent': [8080],
      'transmission': [9091],
      'nextcloud': [80, 443],
      'bitwarden': [80],
      'vaultwarden': [80],
      'grafana': [3000],
      'prometheus': [9090],
      'portainer': [9000],
      'heimdall': [80, 443],
      'homarr': [7575],
      'homepage': [3000],
      'nginx': [80, 443],
      'nginxproxymanager': [81],
      'pihole': [80],
      'adguard': [3000],
      'homeassistant': [8123],
      'hassio': [8123],
      'homebridge': [8581],
      'n8n': [5678],
      'paperless': [8000],
      'metube': [8081],
      'librespeed': [80],
      'cloudflare': [80],
      'magicmirror': [8080],
      'patchmon': [3000],
    };

    // Find matching ports for this service
    const lowerName = serviceName.toLowerCase();
    let ports: number[] = [80]; // default to port 80
    
    for (const [key, servicePorts] of Object.entries(servicePortMap)) {
      if (lowerName.includes(key)) {
        ports = servicePorts;
        break;
      }
    }

    // Create service for each port
    for (const port of ports) {
      services.push({
        id: `${container.vmid}-${port}`,
        name: serviceName,
        url: ip === 'unknown' ? '#' : `http://${ip}:${port}`,
        containerName: container.name,
        containerType: container.type as 'lxc' | 'qemu',
        containerId: container.vmid,
        node: container.node,
        status: container.status,
        port: port,
        ip: ip,
        icon: this.getServiceIcon(lowerName),
        description: `${container.type.toUpperCase()} Container - ${container.status}`,
        lastUpdated: new Date(),
        source: 'discovered',
      });
    }

    return services;
  }

  private getServiceIcon(serviceName: string): string {
    const iconMap: Record<string, string> = {
      'immich': '📸',
      'jellyfin': '🎬',
      'plex': '▶️',
      'radarr': '🎥',
      'sonarr': '📺',
      'lidarr': '🎵',
      'prowlarr': '🔍',
      'qbittorrent': '⬇️',
      'transmission': '⬇️',
      'nextcloud': '☁️',
      'bitwarden': '🔐',
      'vaultwarden': '🔐',
      'grafana': '📊',
      'prometheus': '📈',
      'portainer': '🐳',
      'heimdall': '🏠',
      'homarr': '🏠',
      'homepage': '🏠',
      'nginx': '🌐',
      'nginxproxymanager': '🔀',
      'pihole': '🛡️',
      'adguard': '🛡️',
      'homeassistant': '🏡',
      'hassio': '🏡',
      'homebridge': '🏠',
      'n8n': '⚙️',
      'paperless': '📄',
      'metube': '📹',
      'librespeed': '🚀',
      'cloudflare': '☁️',
      'magicmirror': '🪞',
      'patchmon': '🔧',
      'ubuntu': '🐧',
      'debian': '🌀',
      'server': '🖥️',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (serviceName.includes(key)) {
        return icon;
      }
    }

    return '🔧'; // Default icon
  }
}
