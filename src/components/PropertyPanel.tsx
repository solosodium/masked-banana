import React from 'react';
import { Layers, Plus, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useProjectStore, APP_CONFIG } from '../store/useProjectStore';

export const PropertyPanel = () => {
  const { layers, addLayer, deleteLayer, activeLayerId, setActiveLayerId } = useProjectStore();

  const getNextLayerNumber = () => {
    if (layers.length === 0) {
      return 1;
    }
    const layerNumbers = layers.map(l => parseInt(l.name.split(' ')[1] || '0'));
    const maxLayerNumber = Math.max(...layerNumbers);
    return isNaN(maxLayerNumber) ? 1 : maxLayerNumber + 1;
  }

  const handleAddLayer = () => {
    addLayer({
      name: `Layer ${getNextLayerNumber()}`,
      isVisible: true,
      maskStrokes: [],
      prompt: '',
      usePredefinedPrompt: false
    });
    // activeLayerId doesn't auto-set here unless we wanted to lookup the last id,
    // for simplicity users can click it.
  };

  return (
    <aside className="w-80 bg-panel border-l border-zinc-800 flex flex-col">
      {/* Layers Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
          <Layers size={18} /> Layers
        </h2>
        <div className="flex items-center gap-2">
          {layers.length >= APP_CONFIG.MAX_LAYERS && (
            <span className="text-xs text-amber-500 font-medium">{APP_CONFIG.MAX_LAYERS} layers max</span>
          )}
          <button
            onClick={handleAddLayer}
            disabled={layers.length >= APP_CONFIG.MAX_LAYERS}
            className={`p-1 rounded transition-colors ${layers.length >= APP_CONFIG.MAX_LAYERS ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700'}`}
            title="Add Layer"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {layers.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-4">
            No layers yet. Add a layer to start masking.
          </div>
        ) : (
          layers.map((layer) => {
            const isActive = activeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setActiveLayerId(layer.id)}
                className={`group flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isActive
                  ? 'bg-zinc-800 border-primary'
                  : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-700 hover:border-zinc-600'
                  }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    useProjectStore.getState().updateLayer(layer.id, { isVisible: !layer.isVisible });
                  }}
                  className={`hover:text-zinc-200 transition-colors ${layer.isVisible ? 'text-zinc-400' : 'text-zinc-600'}`}
                  title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
                >
                  {layer.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <div className="flex-1 flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
                  <span className="text-sm font-medium text-zinc-200 truncate">
                    {layer.name}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Active Layer Prompt */}
      {activeLayerId ? (
        <div className="h-64 border-t border-zinc-800 p-4 bg-zinc-900/50 flex flex-col gap-3">
          <h3 className="text-sm font-medium text-zinc-400">Layer Mask Prompt</h3>
          <textarea
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-primary transition-colors"
            placeholder="Specific prompt for this masked area..."
            value={layers.find(l => l.id === activeLayerId)?.prompt || ''}
            onChange={(e) => {
              const layer = layers.find(l => l.id === activeLayerId);
              if (layer) {
                useProjectStore.getState().updateLayer(layer.id, { prompt: e.target.value });
              }
            }}
          />
        </div>
      ) : (
        <div className="h-64 border-t border-zinc-800 p-4 flex items-center justify-center text-center text-zinc-500 text-sm">
          Select a layer to edit layer mask prompt.
        </div>
      )}
    </aside>
  );
};
