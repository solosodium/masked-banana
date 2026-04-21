import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

export const ApiKeyModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { apiKey, setApiKey } = useProjectStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(apiKey || '');
    }
  }, [isOpen, apiKey]);

  // If no api key exists on mount, we can force open it, but the parent handles `isOpen`
  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(inputValue.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-panel border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-primary mb-2">
          <Key size={24} />
          <h2 className="text-xl font-bold text-zinc-100">API Key Configuration</h2>
        </div>
        
        <p className="text-sm text-zinc-400">
          This application operates completely locally. Your Gemini API key is stored securely in your browser's local storage and is sent directly to Google's API during generation.
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Gemini API Key</label>
          <input 
            type="password"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary transition-colors"
            placeholder="AIzaSy..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-zinc-900 font-bold rounded-lg transition-colors shadow-lg"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};
