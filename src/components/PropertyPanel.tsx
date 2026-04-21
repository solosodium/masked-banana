import React from 'react';
import { Layers, Plus, Eye, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export const PropertyPanel = () => {
  const { layers, addLayer, deleteLayer, activeLayerId, setActiveLayerId } = useProjectStore();

  const handleAddLayer = () => {
    addLayer({
      name: `Layer ${layers.length + 1}`,
      isVisible: true,
      maskStrokes: [],
      inspirationImages: [],
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
        <button 
          onClick={handleAddLayer}
          className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
          title="Add Layer"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {layers.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm mt-4">
            No layers. Add a layer to start masking.
          </div>
        ) : (
          layers.map((layer) => {
            const isActive = activeLayerId === layer.id;
            return (
              <div 
                key={layer.id} 
                onClick={() => setActiveLayerId(layer.id)}
                className={`group flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-zinc-800 border-primary' 
                    : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-700 hover:border-zinc-600'
                }`}
              >
                <button className="text-zinc-400 hover:text-zinc-200">
                  <Eye size={16} />
                </button>
                <span className="flex-1 text-sm font-medium text-zinc-200 truncate">
                  {layer.name}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLayer(layer.id);
                  }}
                  className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
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
          <h3 className="text-sm font-medium text-zinc-400">Layer Properties</h3>
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
          <div className="h-20 border border-dashed border-zinc-700 rounded-md flex items-center justify-center text-xs text-zinc-500 bg-zinc-800/50 hover:bg-zinc-800 cursor-pointer transition-colors">
            Drop inspiration images here
          </div>
        </div>
      ) : (
        <div className="h-64 border-t border-zinc-800 p-4 flex items-center justify-center text-zinc-500 text-sm">
          Select a layer to edit properties via the panel above.
        </div>
      )}
    </aside>
  );
};
