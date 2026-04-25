import React, { useState, useEffect, useRef } from 'react';
import { Settings, Download, Upload, AlertCircle, Image as ImageIcon, Menu, X } from 'lucide-react';
import { ApiKeyModal } from './ApiKeyModal';
import { useProjectStore } from '../store/useProjectStore';
import { exportProject, importProject } from '../services/projectSyncService';

export const NavBar = () => {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { apiKey, generatedImage, isShowingGeneratedImage, setTargetImage, setCanvasView } = useProjectStore();

  // Optionally auto-open if no key
  useEffect(() => {
    if (!apiKey) {
      setIsApiModalOpen(true);
    }
  }, [apiKey]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setTargetImage({
          id: Math.random().toString(36).substring(2, 9),
          fileData: dataUrl,
          width: img.width,
          height: img.height
        });

        const containerWidth = window.innerWidth - 384;
        const containerHeight = window.innerHeight - 136;
        const containerRatio = containerWidth / containerHeight;
        const imageRatio = img.width / img.height;
        let scale = 1;

        if (imageRatio > containerRatio) {
          scale = (containerWidth * 0.8) / img.width;
        } else {
          scale = (containerHeight * 0.8) / img.height;
        }

        setCanvasView({
          scale,
          offsetX: (containerWidth - img.width * scale) / 2,
          offsetY: (containerHeight - img.height * scale) / 2
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
      <header className="h-14 bg-background border-b border-zinc-800 flex items-center justify-between px-4 select-none relative z-50">
        <div className="font-bold text-lg text-primary flex items-center gap-2">
          <img src="/favicon.png" alt="Masked Banana" className="h-6 w-6" /> Masked Banana
        </div>

        <button 
          className="md:hidden text-zinc-300 hover:text-primary transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`${isMobileMenuOpen ? 'absolute top-full left-0 w-full bg-background border-b border-zinc-800 flex flex-col p-4 z-50 items-start shadow-xl' : 'hidden'} md:flex md:static md:w-auto md:border-none md:p-0 md:flex-row md:items-center md:shadow-none gap-4 text-sm text-zinc-300`}>
          <button
            onClick={() => {
              setIsApiModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center gap-2 hover:text-primary transition-colors ${!apiKey ? 'text-red-400' : ''}`}
          >
            {!apiKey ? <AlertCircle size={16} /> : <Settings size={16} />}
            {apiKey ? 'API Settings' : 'Missing API Key'}
          </button>
          {isShowingGeneratedImage ? (
            <button
              onClick={() => {
                handleDownloadImage();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-primary hover:text-amber-400 transition-colors font-medium mr-2"
              title="Save the generated image to your computer"
            >
              <ImageIcon size={16} /> Save Image
            </button>
          ) : (
            <>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleImageUpload(e);
                  setIsMobileMenuOpen(false);
                }}
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 hover:text-primary transition-colors mr-2"
                title="Upload a new target image"
              >
                <ImageIcon size={16} /> Upload Image
              </button>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              handleImport(e);
              setIsMobileMenuOpen(false);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Upload size={16} /> Import
          </button>
          <button
            onClick={() => {
              handleExport();
              setIsMobileMenuOpen(false);
            }}
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
