import JSZip from 'jszip';
import type { ProjectState } from '../store/useProjectStore';

export const exportProject = async (state: ProjectState) => {
  const zip = new JSZip();

  // Extract the state we want to persist
  const stateToSave = {
    version: state.version,
    targetImage: state.targetImage,
    overallPrompt: state.overallPrompt,
    layers: state.layers,
    canvasView: state.canvasView,
    generatedImage: state.generatedImage,
    activeLayerId: state.activeLayerId,
    activeTool: state.activeTool,
    brushSize: state.brushSize,
    maskColor: state.maskColor,
  };

  const jsonString = JSON.stringify(stateToSave);
  zip.file('project.json', jsonString);

  const content = await zip.generateAsync({ type: 'blob' });
  const defaultFilename = 'masked-banana-project.zip';

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [{
          description: 'ZIP Archive',
          accept: { 'application/zip': ['.zip'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to save project:', err);
        throw err;
      }
      return;
    }
  }

  // Fallback for browsers that do not support showSaveFilePicker
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export const importProject = async (file: File): Promise<Partial<ProjectState>> => {
  const zip = await JSZip.loadAsync(file);

  const projectJsonFile = zip.file('project.json');
  if (!projectJsonFile) {
    throw new Error('Invalid project file: missing project.json');
  }

  const jsonString = await projectJsonFile.async('string');
  const parsedState = JSON.parse(jsonString) as Partial<ProjectState>;

  // Additional validation could go here
  if (!parsedState.version || parsedState.version !== '1.0') {
    console.warn('Imported project version mismatch or missing.');
  }

  return parsedState;
};
