import React, { useState, useEffect, useRef } from 'react';
import { Settings, Download, Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { useProjectStore } from '../store/useProjectStore';
import { exportProject, importProject } from '../services/projectSyncService';

export const NavBar = () => {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const { apiKey, generatedImage } = useProjectStore();

  // Optionally auto-open if no key
  useEffect(() => {
    if (!apiKey) {
      setIsApiModalOpen(true);
    }
  }, [apiKey]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const state = useProjectStore.getState();
      await exportProject(state);
    } catch (e) {
      console.error('Failed to export project:', e);
      alert('Failed to export project');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const state = await importProject(file);
      useProjectStore.getState().hydrateState(state);
    } catch (e) {
      console.error('Failed to import project:', e);
      alert('Failed to import project. Make sure it is a valid project zip file.');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadImage = async () => {
    if (!generatedImage) return;
    
    const defaultFilename = `masked-banana-result-${Date.now()}.png`;
    
    if ('showSaveFilePicker' in window) {
      try {
        const response = await fetch(generatedImage.fileData);
        const blob = await response.blob();
        
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: 'PNG Image',
            accept: { 'image/png': ['.png'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return; // Success, exit
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to save file:', err);
          alert('Failed to save image.');
        }
        return; // Either user cancelled or error handled, don't fall back
      }
    }

    // Fallback for browsers that do not support showSaveFilePicker
    const a = document.createElement('a');
    a.href = generatedImage.fileData;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <header className="h-14 bg-background border-b border-zinc-800 flex items-center justify-between px-4 select-none">
        <div className="font-bold text-lg text-primary flex items-center gap-2">
          <img src="/favicon.png" alt="Masked Banana" className="h-6 w-6" /> Masked Banana
        </div>
        <div className="flex gap-4 text-sm text-zinc-300">
          <button
            onClick={() => setIsApiModalOpen(true)}
            className={`flex items-center gap-2 hover:text-primary transition-colors ${!apiKey ? 'text-red-400' : ''}`}
          >
            {!apiKey ? <AlertCircle size={16} /> : <Settings size={16} />}
            {apiKey ? 'API Settings' : 'Missing API Key'}
          </button>
          {generatedImage && (
            <button 
              onClick={handleDownloadImage}
              className="flex items-center gap-2 text-primary hover:text-amber-400 transition-colors font-medium mr-2"
              title="Save the generated image to your computer"
            >
              <ImageIcon size={16} /> Save Image
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".zip" 
            className="hidden" 
            onChange={handleImport} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Upload size={16} /> Import
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
    </>
  );
};
