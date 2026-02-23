import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { SSHHelper } from './SSHHelper.js';

export interface ProxmoxConfig {
  host: string;
  port?: number;
  user: string;
  token: string; // Format: "TOKENID:SECRET" or "USER@REALM!TOKENID:SECRET"
  tokenId?: string; // The token ID part (e.g. 'dashv-auto'), used when constructing full token
}

export interface ProxmoxContainer {
  vmid: number;
  name: string;
  status: string;
  type: string;
  node?: string;
  tags?: string;
}

export interface AutoSetupConfig {
  host: string;
  sshUser: string;
  sshPassword: string;
  tokenName?: string;
  proxmoxUser?: string;
}

export interface AutoSetupResult {
  success: boolean;
  token?: string;
  user?: string;
  tokenName?: string;
  apiHost?: string;
  apiPort?: number;
  error?: string;
}

export class ProxmoxManager {
  private client: AxiosInstance | null = null;
  private mockMode = process.env.MOCK_PROXMOX === 'true';
  private connectionInfo: ProxmoxConfig | null = null;
  private sshHelper = new SSHHelper();

  async connect(config: ProxmoxConfig): Promise<boolean> {
    try {
      if (this.mockMode) {
        console.log('[MOCK MODE] Simulating Proxmox connection...');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[MOCK MODE] Connection successful');
        return true;
      }
      
      // Parse host and port if provided together
      let host = config.host;
      let port = config.port || 8006;
      
      if (host.includes(':')) {
        const parts = host.split(':');
        host = parts[0];
        port = parseInt(parts[1], 10) || port;
      }
      
      // Build the full token string
      // Expected format: USER@REALM!TOKENID=SECRET
      let fullToken = config.token;
      
      // If token doesn't contain the user part, it's just the secret value
      if (!fullToken.includes('@') && !fullToken.includes('!')) {
        // Token is just the secret, build full token with user and tokenid
        // config.user might be "root@pam" or "root@pam!tokenname"
        if (config.user.includes('!')) {
          // User already has tokenid, just append secret
          fullToken = `${config.user}=${config.token}`;
        } else {
          // Need to add tokenid from config.tokenId
          fullToken = `${config.user}!${config.tokenId || 'dashv-auto'}=${config.token}`;
        }
      } else if (fullToken.includes(':')) {
        // Token uses : instead of =, fix it
        fullToken = fullToken.replace(/:([^:]+)$/, '=$1');
      }
      
      console.log(`[Proxmox] Full token: ${fullToken.substring(0, 50)}...`);
      
      // Create axios instance with Proxmox API settings
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: false,
        timeout: 10000,
      });
      
      this.client = axios.create({
        baseURL: `https://${host}:${port}/api2/json`,
        headers: {
          'Authorization': `PVEAPIToken=${fullToken}`,
        },
        httpAgent: undefined,
        httpsAgent: httpsAgent,
        timeout: 10000,
      });

      // Test connection using axios with proper HTTPS agent
      console.log(`[Proxmox] Testing connection to ${host}:${port}...`);
      
      try {
        const response = await this.client.get('/version');
        
        if (response.status === 200 && response.data) {
          console.log('[Proxmox] ✓ Connection successful');
          this.connectionInfo = { host, port, user: config.user, token: config.token };
          return true;
        } else {
          console.error(`[Proxmox] ✗ Server returned: ${response.status}`);
          return false;
        }
      } catch (fetchError: any) {
        console.error(`[Proxmox] ✗ Request failed: ${fetchError.message}`);
        if (fetchError.response) {
          console.error(`[Proxmox] Response status: ${fetchError.response.status}`);
          console.error(`[Proxmox] Response data:`, fetchError.response.data);
        }
        return false;
      }
      
    } catch (error) {
      console.error('[Proxmox] ✗ Connection error:', error);
      this.client = null;
      return false;
    }
  }

  async getContainers(): Promise<ProxmoxContainer[]> {
    if (this.mockMode) {
      console.log('[MOCK MODE] Returning mock containers');
      return [
        { vmid: 100, name: 'immich', status: 'running', type: 'lxc' },
        { vmid: 101, name: 'jellyfin', status: 'running', type: 'lxc' },
        { vmid: 102, name: 'radarr', status: 'running', type: 'lxc' },
        { vmid: 103, name: 'sonarr', status: 'running', type: 'lxc' },
        { vmid: 104, name: 'lidarr', status: 'running', type: 'lxc' },
        { vmid: 105, name: 'qbittorrent', status: 'running', type: 'lxc' },
        { vmid: 106, name: 'nextcloud', status: 'running', type: 'lxc' },
        { vmid: 107, name: 'bitwarden', status: 'running', type: 'lxc' },
        { vmid: 108, name: 'grafana', status: 'running', type: 'lxc' },
        { vmid: 109, name: 'prometheus', status: 'running', type: 'lxc' },
        { vmid: 110, name: 'portainer', status: 'running', type: 'lxc' },
      ];
    }
    
    if (!this.client) {
      throw new Error('Not connected to Proxmox');
    }

    try {
      // Get all nodes
      console.log('[Proxmox] Fetching nodes...');
      const nodesResponse = await this.client.get('/nodes');
      const nodes = nodesResponse.data.data;
      console.log(`[Proxmox] Found ${nodes?.length || 0} nodes`);

      const containers: ProxmoxContainer[] = [];

      // For each node, get containers
      for (const node of nodes) {
        console.log(`[Proxmox] Fetching containers from node: ${node.node}`);
        try {
          const lxcResponse = await this.client.get(`/nodes/${node.node}/lxc`);
          const lxcContainers = lxcResponse.data.data || [];
          console.log(`[Proxmox] Found ${lxcContainers.length} LXC containers on ${node.node}`);
          if (lxcResponse.data.data) {
            console.log('[Proxmox] LXC Response:', JSON.stringify(lxcContainers, null, 2));
          }
          containers.push(
            ...lxcContainers.map((c: any) => ({
              vmid: c.vmid,
              name: c.name,
              status: c.status,
              type: 'lxc',
              node: node.node,
              tags: c.tags,
            }))
          );

          const qemuResponse = await this.client.get(`/nodes/${node.node}/qemu`);
          const qemuVMs = qemuResponse.data.data || [];
          console.log(`[Proxmox] Found ${qemuVMs.length} QEMU VMs on ${node.node}`);
          if (qemuResponse.data.data) {
            console.log('[Proxmox] QEMU Response:', JSON.stringify(qemuVMs, null, 2));
          }
          containers.push(
            ...qemuVMs.map((vm: any) => ({
              vmid: vm.vmid,
              name: vm.name,
              status: vm.status,
              type: 'qemu',
              node: node.node,
              tags: vm.tags,
            }))
          );
        } catch (error) {
          console.error(`Error fetching containers from node ${node.node}:`, error);
        }
      }

      console.log(`[Proxmox] Total containers/VMs found: ${containers.length}`);
      return containers;
    } catch (error) {
      console.error('Error getting containers:', error);
      throw error;
    }
  }

  async getContainerIp(container: ProxmoxContainer): Promise<string | null> {
    if (this.mockMode) {
      return '10.0.0.1';
    }

    if (!this.client || !container.node) {
      return null;
    }

    try {
      if (container.type === 'lxc') {
        const configResponse = await this.client.get(
          `/nodes/${container.node}/lxc/${container.vmid}/config`,
        );
        const config = configResponse.data?.data || {};
        const netKeys = Object.keys(config).filter((key) => key.startsWith('net'));

        for (const key of netKeys) {
          const netValue = String(config[key] || '');
          const ipMatch = netValue.match(/ip=([0-9.]+)(?:\/\d+)?/i);
          if (ipMatch && ipMatch[1] && ipMatch[1].toLowerCase() !== 'dhcp') {
            return ipMatch[1];
          }
        }

        try {
          const statusResponse = await this.client.get(
            `/nodes/${container.node}/lxc/${container.vmid}/status/current`,
          );
          const statusData = statusResponse.data?.data || {};
          const ipFromStatus = statusData.ip || null;
          if (ipFromStatus && typeof ipFromStatus === 'string' && !ipFromStatus.startsWith('127.')) {
            return ipFromStatus;
          }

          const statusIps = statusData['ip-addresses'] || [];
          for (const addr of statusIps) {
            if (addr['ip-address-type'] === 'ipv4' && !addr['ip-address'].startsWith('127.')) {
              return addr['ip-address'];
            }
          }
        } catch (statusError) {
          console.warn(`[Proxmox] LXC status IP not available for ${container.vmid}`);
        }
      }

      if (container.type === 'qemu') {
        try {
          const agentResponse = await this.client.get(
            `/nodes/${container.node}/qemu/${container.vmid}/agent/network-get-interfaces`,
          );
          const interfaces = agentResponse.data?.data?.result || [];

          for (const iface of interfaces) {
            const ipAddrs = iface['ip-addresses'] || [];
            for (const addr of ipAddrs) {
              if (addr['ip-address-type'] === 'ipv4' && !addr['ip-address'].startsWith('127.')) {
                return addr['ip-address'];
              }
            }
          }
        } catch (agentError) {
          console.warn(`[Proxmox] Guest agent not available for VM ${container.vmid}`);
        }
      }
    } catch (error) {
      console.warn(`[Proxmox] Failed to resolve IP for ${container.name} (${container.vmid})`);
    }

    return null;
  }

  async executeInContainer(
    node: string,
    vmid: number,
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Not connected to Proxmox');
    }

    try {
      // Note: This is a simplified version. Actual implementation would need
      // to handle LXC exec properly via Proxmox API
      const response = await this.client.post(
        `/nodes/${node}/lxc/${vmid}/status/current`,
      );
      return response.data.toString();
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.client !== null || this.mockMode;
  }

  getConnectionInfo(): ProxmoxConfig | null {
    return this.connectionInfo;
  }

  disconnect(): void {
    this.client = null;
    this.connectionInfo = null;
    console.log('[Proxmox] Disconnected');
  }

  async startContainer(params: { node: string; vmid: number; type: 'lxc' | 'qemu' }): Promise<boolean> {
    if (!this.client) {
      throw new Error('Not connected to Proxmox');
    }

    const { node, vmid, type } = params;
    try {
      await this.client.post(`/nodes/${node}/${type}/${vmid}/status/start`);
      return true;
    } catch (error) {
      console.error('[Proxmox] Failed to start container:', error);
      return false;
    }
  }

  async autoSetupViaSSH(config: AutoSetupConfig): Promise<AutoSetupResult> {
    try {
      let tokenName = config.tokenName || 'dashv-auto';
      
      // Proxmox token names may not support hyphens, convert to underscores or alphanumeric
      tokenName = tokenName.replace(/[^a-zA-Z0-9_]/g, '_');
      
      const proxmoxUser = config.proxmoxUser || 'root@pam';
      
      // Parse host and port
      let sshHost = config.host;
      let apiHost = config.host;
      let apiPort = 8006;
      
      if (config.host.includes(':')) {
        const parts = config.host.split(':');
        sshHost = parts[0];
        apiHost = parts[0];
        apiPort = parseInt(parts[1], 10) || 8006;
      }

      console.log(`[AUTO-SETUP] Connecting to ${sshHost} via SSH...`);
      console.log(`[AUTO-SETUP] Using token name: ${tokenName}`);
      
      // Create token via SSH
      const result = await this.sshHelper.createProxmoxToken(
        {
          host: sshHost,
          username: config.sshUser,
          password: config.sshPassword,
        },
        proxmoxUser,
        tokenName
      );

      if (!result.success) {
        console.error('[AUTO-SETUP] Failed to create token:', result.error);
        return { 
          success: false, 
          error: result.error || 'Failed to create token via SSH' 
        };
      }

      console.log(`[AUTO-SETUP] Token created successfully: ${proxmoxUser}!${tokenName}`);

      return {
        success: true,
        token: result.token,
        user: `${proxmoxUser}!${tokenName}`,
        tokenName,
        apiHost,
        apiPort,
      };
    } catch (error) {
      console.error('[AUTO-SETUP] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
