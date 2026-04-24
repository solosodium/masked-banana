
import { MousePointer2, Move, Brush, Eraser, Square, Circle } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export const ToolBar = () => {
  const { activeTool, setActiveTool, brushSize, setBrushSize } = useProjectStore();

  const tools = [
    { id: 'select', icon: MousePointer2, title: 'Select' },
    { id: 'pan', icon: Move, title: 'Pan' },
    { divider: true, id: 'd1' },
    { id: 'brush', icon: Brush, title: 'Brush' },
    { id: 'eraser', icon: Eraser, title: 'Eraser' },
    { divider: true, id: 'd2' },
    { id: 'rectangle', icon: Square, title: 'Rectangle' },
    { id: 'ellipse', icon: Circle, title: 'Ellipse' },
  ];

  return (
    <aside className="w-16 bg-panel border-r border-zinc-800 flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => {
        if (tool.divider) {
          return <div key={tool.id} className="w-8 h-px bg-zinc-700 my-2" />;
        }

        const Icon = tool.icon as any;
        const isActive = activeTool === tool.id;

        return (
          <div key={tool.id} className="w-full px-2">
            <button
              onClick={() => setActiveTool(tool.id as any)}
              className={`p-2 rounded-lg w-full flex justify-center transition-colors ${isActive
                ? 'bg-zinc-800 text-primary shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
                }`}
              title={tool.title}
            >
              <Icon size={20} />
            </button>
          </div>
        );
      })}
      {/* Brush Size Slider */}
      {(activeTool === 'brush' || activeTool === 'eraser') && (
        <div className="mt-auto mb-4 flex flex-col items-center gap-2 w-full px-2 transition-opacity duration-300">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Size</span>
          <div className="h-32 flex items-center justify-center w-full">
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 -rotate-90 appearance-none bg-zinc-700 h-1 rounded outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />
          </div>
          <span className="text-xs text-primary font-mono">{brushSize}px</span>
        </div>
      )}
    </aside>
  );
};
