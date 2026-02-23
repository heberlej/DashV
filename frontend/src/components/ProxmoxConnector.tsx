import { FC, useState } from 'react';

interface ProxmoxConnectorProps {
  onConnect?: (config: { host: string; port: number; user: string; token: string }) => Promise<void>;
  loading?: boolean;
}

const ProxmoxConnector: FC<ProxmoxConnectorProps> = ({ onConnect, loading: externalLoading }) => {
  const [mode, setMode] = useState<'manual' | 'ssh'>('ssh');
  
  // Manual mode
  const [host, setHost] = useState('');
  const [port, setPort] = useState('8006');
  const [user, setUser] = useState('');
  const [token, setToken] = useState('');
  
  // SSH mode
  const [sshHost, setSshHost] = useState('');
  const [sshUser, setSshUser] = useState('root');
  const [sshPassword, setSshPassword] = useState('');
  const [tokenName, setTokenName] = useState('dashv-auto');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupStatus, setSetupStatus] = useState<string>('');

  const isLoading = externalLoading || loading;

  // Get dynamic API URL based on hostname
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:3003`;
    }
    return 'http://localhost:3003';
  };

  const handleAutoSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSetupStatus('');

    try {
      // Step 1: Establishing connection
      setSetupStatus('🔗 Connecting to Proxmox host...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      // Step 2: Creating SSH connection
      setSetupStatus('🔐 Creating SSH connection to Proxmox...');

      const response = await fetch(
        `${getApiUrl()}/api/proxmox/auto-setup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            host: sshHost, 
            sshUser, 
            sshPassword,
            tokenName,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      
      // Step 3: Generating API token
      if (response.ok) {
        setSetupStatus('🎟️ Generating API token...');
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Auto-setup failed');
      }

      // Step 4: Success
      setSetupStatus('✅ Connection successful! Reloading dashboard...');
      alert(`✅ Successfully connected!\nToken: ${data.tokenInfo.user}`);
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('⏱️ Connection timeout (60s) - please check if the Proxmox host is reachable');
        } else {
          setError(err.message);
        }
      } else {
        setError('Auto-setup failed');
      }
      setSetupStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (onConnect) {
        await onConnect({ host, port: parseInt(port), user, token });
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3003'}/api/proxmox/connect`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ host, port: parseInt(port), user, token }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to connect');
        }

        alert('Connected to Proxmox successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
        <div className="bg-gray-950 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Connect Proxmox</h2>
            <p className="text-gray-400 text-sm">Choose connection method</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('ssh')}
              className={`flex-1 px-4 py-2 rounded-md transition-all ${
                mode === 'ssh'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔐 Auto (SSH)
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`flex-1 px-4 py-2 rounded-md transition-all ${
                mode === 'manual'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔑 Manual Token
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg text-sm backdrop-blur">
              <p className="font-medium mb-1">Connection Error</p>
              <p>{error}</p>
            </div>
          )}

          {setupStatus && (
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 p-4 rounded-lg text-sm backdrop-blur animate-pulse">
              <p className="font-medium">{setupStatus}</p>
            </div>
          )}

          {mode === 'ssh' ? (
            <form onSubmit={handleAutoSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Proxmox Host
                </label>
                <input
                  type="text"
                  placeholder="proxmox.example.com:8006"
                  value={sshHost}
                  onChange={(e) => setSshHost(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  SSH Username
                </label>
                <input
                  type="text"
                  placeholder="root"
                  value={sshUser}
                  onChange={(e) => setSshUser(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  SSH Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={sshPassword}
                  onChange={(e) => setSshPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Token Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="dashv_auto"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  pattern="[a-zA-Z0-9_-]*"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">Alphanumeric, underscore, and hyphen only. Will create API token automatically.</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Setting up...' : '🚀 Auto Setup & Connect'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Proxmox Host
                </label>
                <input
                  type="text"
                  placeholder="proxmox.example.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  placeholder="8006"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  min="1"
                  max="65535"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  User (e.g. root@pam)
                </label>
                <input
                  type="text"
                  placeholder="root@pam"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  API Token
                </label>
                <input
                  type="text"
                  placeholder="root@pam!dashv:secret-token-uuid"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting...' : '🔌 Connect'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProxmoxConnector;
