import React, { useState, useEffect, useRef } from 'react';
import { Settings, Download, Upload, AlertCircle } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { useProjectStore } from '../store/useProjectStore';
import { exportProject, importProject } from '../services/projectSyncService';

export const NavBar = () => {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const { apiKey } = useProjectStore();

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
