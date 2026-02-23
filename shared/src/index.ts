// Shared types for DashV

export interface Service {
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
  lastUpdated: Date;
  source?: 'discovered' | 'manual';
}

export interface ProxmoxConfig {
  host: string;
  user: string;
  token: string;
}
