import { FC, useState, useEffect } from 'react';

interface DiscoveryStatus {
  running: boolean;
  servicesFound: number;
  services: Array<{
    id: string;
    name: string;
    containerName: string;
    containerType: 'lxc' | 'qemu';
    status: string;
    ip: string;
    port: number;
  }>;
  lastUpdate: string;
}

interface DiscoveryPanelProps {
  apiUrl: string;
}

const DiscoveryPanel: FC<DiscoveryPanelProps> = ({ apiUrl }) => {
  const [status, setStatus] = useState<DiscoveryStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/proxmox/discover-status`);
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const triggerDiscovery = async () => {
    try {
      setDiscovering(true);
      setError('');
      const response = await fetch(`${apiUrl}/api/proxmox/discover`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to trigger discovery');
      const data = await response.json();
      
      // Refresh status
      await fetchStatus();
      
      alert(`Discovery triggered!\nFound ${data.servicesAfter} services${data.newServices > 0 ? ` (+${data.newServices} new)` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger discovery');
    } finally {
      setDiscovering(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [apiUrl]);

  const sortedServices = status
    ? [...status.services].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    : [];

  return (
    <div className="mt-8 p-6 bg-gray-900/50 border border-gray-700 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🔍 Service Discovery
          {status?.running && <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Active</span>}
        </h2>
        <button
          onClick={triggerDiscovery}
          disabled={discovering || loading}
          className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-200 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {discovering ? '⏳ Discovering...' : '🔄 Trigger Discovery'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">
          Loading status...
        </div>
      ) : status ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400">Services Found</div>
              <div className="text-2xl font-bold text-blue-400">{status.servicesFound}</div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400">Status</div>
              <div className="text-lg font-semibold">{status.running ? '✅ Active' : '⚠️ Inactive'}</div>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400">Last Update</div>
              <div className="text-xs text-gray-300">{new Date(status.lastUpdate).toLocaleString()}</div>
            </div>
          </div>

          {status.servicesFound > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-400">Service</th>
                    <th className="text-left py-2 px-3 text-gray-400">Container</th>
                    <th className="text-left py-2 px-3 text-gray-400">Type</th>
                    <th className="text-left py-2 px-3 text-gray-400">Status</th>
                    <th className="text-left py-2 px-3 text-gray-400">IP:Port</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedServices.map((service) => (
                    <tr key={service.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-2 px-3 text-white font-medium">{service.name}</td>
                      <td className="py-2 px-3 text-gray-300 text-xs">{service.containerName}</td>
                      <td className="py-2 px-3 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          service.containerType === 'lxc' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {service.containerType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          service.status === 'running' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {service.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-300 font-mono text-xs">{service.ip}:{service.port}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-gray-800/30 rounded-lg text-center text-gray-400">
              <div className="text-sm">⚠️ No services discovered yet</div>
              <div className="text-xs mt-2 text-gray-500">
                Click "Trigger Discovery" to start scanning for services, or check Proxmox API permissions
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DiscoveryPanel;
