import React, { useState, useEffect } from 'react';
import { Settings, Download, Upload, AlertCircle } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { useProjectStore } from '../store/useProjectStore';

export const NavBar = () => {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const { apiKey } = useProjectStore();

  // Optionally auto-open if no key
  useEffect(() => {
    if (!apiKey) {
      setIsApiModalOpen(true);
    }
  }, [apiKey]);

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
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <Upload size={16} /> Import
          </button>
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      <ApiKeyModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
    </>
  );
};
