import { FC, useState } from 'react';

interface Service {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
  containerName: string;
  port: number;
  ip: string;
  hidden?: boolean;
  isManual?: boolean;
}

interface ServiceCardProps {
  service: Service;
  onToggleVisibility?: (id: string) => void;
  onUpdateIcon?: (id: string, iconUrl: string) => void;
  onDelete?: (id: string) => void;
}

const ServiceCard: FC<ServiceCardProps> = ({ 
  service, 
  onToggleVisibility,
  onUpdateIcon,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editingIcon, setEditingIcon] = useState(false);
  const [iconUrl, setIconUrl] = useState(service.icon || '');

  const handleIconUpdate = () => {
    if (onUpdateIcon && iconUrl.trim()) {
      onUpdateIcon(service.id, iconUrl);
      setEditingIcon(false);
    }
  };

  return (
    <div className="relative group">
      <a
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10"
      >
        <div className="p-6 space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-3xl backdrop-blur">
            {service.icon?.startsWith('http') ? (
              <img src={service.icon} alt={service.name} className="w-12 h-12 object-contain" />
            ) : (
              <span>{service.icon || '📦'}</span>
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              {service.name}
              {service.isManual && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Manual</span>
              )}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-2">{service.description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {service.ip}:{service.port}
            </span>
            <span>{service.containerName}</span>
          </div>
        </div>
      </a>

      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-gray-800/90 backdrop-blur text-gray-400 hover:text-white hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
      >
        ⋮
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-12 right-3 z-50 w-48 rounded-lg bg-gray-800 border border-gray-700 shadow-xl overflow-hidden">
            <button
              onClick={() => {
                setEditingIcon(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              🎨 Change Icon
            </button>
            {onToggleVisibility && (
              <button
                onClick={() => {
                  onToggleVisibility(service.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {service.hidden ? '👁️ Show' : '🙈 Hide'}
              </button>
            )}
            {service.isManual && onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Delete "${service.name}"?`)) {
                    onDelete(service.id);
                  }
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* Icon Editor Modal */}
      {editingIcon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Change Icon</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Icon URL or Emoji
                </label>
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => setIconUrl(e.target.value)}
                  placeholder="https://... or 🚀"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Preview */}
              <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg">
                <div className="w-16 h-16 flex items-center justify-center text-4xl">
                  {iconUrl.startsWith('http') ? (
                    <img src={iconUrl} alt="Preview" className="w-14 h-14 object-contain" />
                  ) : (
                    <span>{iconUrl || '❓'}</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingIcon(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIconUpdate}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCard;
