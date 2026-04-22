import { create } from 'zustand';

export type Point = { x: number; y: number };

export type MaskStroke = {
  id: string;
  type: 'freehand' | 'rectangle' | 'ellipse';
  color: string;
  brushSize?: number;
  points?: Point[];
  x?: number; y?: number; width?: number; height?: number;
  radiusX?: number; radiusY?: number;
  mode: 'draw' | 'erase';
};

export type ImageAsset = {
  id: string;
  fileData: string; // Base64
  width: number;
  height: number;
  mimeType?: string;
};

export type Layer = {
  id: string;
  name: string;
  isVisible: boolean;
  maskStrokes: MaskStroke[];
  prompt: string;
  usePredefinedPrompt: boolean;
  predefinedPromptId?: string;
  color: string;
  maskImage?: ImageAsset;
};

export interface ProjectState {
  version: '1.0';
  targetImage: ImageAsset | null;
  overallPrompt: string;
  layers: Layer[];
  canvasView: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  generatedImage: ImageAsset | null;
  apiKey: string | null;
  activeLayerId: string | null;
  activeTool: 'select' | 'pan' | 'brush' | 'eraser' | 'rectangle' | 'ellipse';
  brushSize: number;
  maskColor: string;

  // Actions
  setApiKey: (key: string | null) => void;
  setTargetImage: (image: ImageAsset | null) => void;
  addLayer: (layer: Omit<Layer, 'id' | 'color'>) => void;
  deleteLayer: (id: string) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  setCanvasView: (view: Partial<ProjectState['canvasView']>) => void;
  setOverallPrompt: (prompt: string) => void;
  setActiveLayerId: (id: string | null) => void;
  setActiveTool: (tool: ProjectState['activeTool']) => void;
  setBrushSize: (size: number) => void;
  setMaskColor: (color: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const PREDEFINED_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#eab308', // yellow
  '#f43f5e', // rose
];

export const useProjectStore = create<ProjectState>((set) => ({
  version: '1.0',
  targetImage: null,
  overallPrompt: '',
  layers: [],
  canvasView: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  generatedImage: null,
  apiKey: localStorage.getItem('gemini_api_key'),
  activeLayerId: null,
  activeTool: 'select',
  brushSize: 20,
  maskColor: '#ef4444', // default red

  setApiKey: (key) => {
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    set({ apiKey: key });
  },

  setTargetImage: (image) => set({ targetImage: image }),

  addLayer: (layerOmitIdColor) => set((state) => {
    if (state.layers.length >= 13) return state;

    const existingColors = new Set(state.layers.map(l => l.color));
    let color = PREDEFINED_COLORS.find(c => !existingColors.has(c));
    return {
      layers: [...state.layers, { ...layerOmitIdColor, id: generateId(), color }]
    };
  }),

  updateLayer: (id, partial) => set((state) => ({
    layers: state.layers.map(layer =>
      layer.id === id ? { ...layer, ...partial } : layer
    )
  })),

  deleteLayer: (id) => set((state) => ({
    layers: state.layers.filter(layer => layer.id !== id),
    activeLayerId: state.activeLayerId === id ? null : state.activeLayerId
  })),

  setCanvasView: (view) => set((state) => ({
    canvasView: { ...state.canvasView, ...view }
  })),

  setOverallPrompt: (prompt) => set({ overallPrompt: prompt }),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setBrushSize: (size) => set({ brushSize: size }),
  setMaskColor: (color) => set({ maskColor: color })
}));
