import React, { useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Line, Rect, Ellipse, Circle } from 'react-konva';
import useImage from 'use-image';
import { Loader2 } from 'lucide-react';
import { useProjectStore, APP_CONFIG } from '../store/useProjectStore';
import { generateImage } from '../services/geminiService';
import { ErrorModal } from './ErrorModal';

export const Workspace = () => {
  const {
    targetImage, overallPrompt, setOverallPrompt, setTargetImage,
    canvasView, setCanvasView, layers, activeLayerId, activeTool,
    brushSize, maskColor, updateLayer,
    isGenerating, setIsGenerating, generatedImage, setGeneratedImage, apiKey,
    isShowingGeneratedImage, setIsShowingGeneratedImage
  } = useProjectStore();

  const [genImage] = useImage(generatedImage?.fileData || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorLayerRef = useRef<any>(null);
  const cursorRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const isDrawing = useRef(false);
  const lastDist = useRef<number>(0);

  const [image] = useImage(targetImage?.fileData || '');

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        if (containerRef.current) {
          const containerRatio = containerRef.current.offsetWidth / containerRef.current.offsetHeight;
          const imageRatio = img.width / img.height;
          let scale = 1;

          if (imageRatio > containerRatio) {
            scale = (containerRef.current.offsetWidth * 0.8) / img.width;
          } else {
            scale = (containerRef.current.offsetHeight * 0.8) / img.height;
          }

          setCanvasView({
            scale,
            offsetX: (containerRef.current.offsetWidth - img.width * scale) / 2,
            offsetY: (containerRef.current.offsetHeight - img.height * scale) / 2
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = canvasView.scale;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - canvasView.offsetX) / oldScale,
      y: (pointer.y - canvasView.offsetY) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

    setCanvasView({
      scale: newScale,
      offsetX: pointer.x - mousePointTo.x * newScale,
      offsetY: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleDragEnd = (e: any) => {
    setCanvasView({ offsetX: e.target.x(), offsetY: e.target.y() });
  };

  // Drawing event handlers
  const handleMouseDown = (e: any) => {
    if (isShowingGeneratedImage) return;
    if (activeTool === 'pan' || activeTool === 'select' || !activeLayerId) return;

    isDrawing.current = true;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    const scale = canvasView.scale;

    const x = (pos.x - canvasView.offsetX) / scale;
    const y = (pos.y - canvasView.offsetY) / scale;

    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer || !layer.isVisible) return;

    const newStroke: any = {
      id: Math.random().toString(36).substring(2, 9),
      type: (activeTool === 'brush' || activeTool === 'eraser') ? 'freehand' : activeTool,
      color: activeTool === 'eraser' ? '#000000' : layer.color,
      mode: activeTool === 'eraser' ? 'erase' : 'draw',
    };

    if (newStroke.type === 'freehand') {
      newStroke.brushSize = brushSize;
      newStroke.points = [{ x, y }];
    } else {
      newStroke.x = x;
      newStroke.y = y;
      newStroke.width = 0;
      newStroke.height = 0;
    }

    updateLayer(activeLayerId, { maskStrokes: [...layer.maskStrokes, newStroke] });
  };

  const handleMouseMove = (e: any) => {
    if (isShowingGeneratedImage) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const scale = canvasView.scale;

    const x = (pos.x - canvasView.offsetX) / scale;
    const y = (pos.y - canvasView.offsetY) / scale;

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const activeColor = activeLayer?.color || maskColor;

    if (cursorRef.current && (activeTool === 'brush' || activeTool === 'eraser')) {
      cursorRef.current.show();
      cursorRef.current.position({ x, y });
      cursorRef.current.fill(activeTool === 'eraser' ? '#ffffff66' : activeColor);
      cursorLayerRef.current?.batchDraw();
    }

    if (!isDrawing.current || activeTool === 'pan' || activeTool === 'select' || !activeLayerId) return;

    const layer = layers.find(l => l.id === activeLayerId);
    if (!layer || !layer.maskStrokes.length) return;

    const strokes = [...layer.maskStrokes];
    const lastStroke = { ...strokes[strokes.length - 1] };

    if (lastStroke.type === 'freehand') {
      lastStroke.points = [...(lastStroke.points || []), { x, y }];
    } else {
      lastStroke.width = x - (lastStroke.x || 0);
      lastStroke.height = y - (lastStroke.y || 0);
      if (lastStroke.type === 'ellipse') {
        lastStroke.radiusX = Math.abs(x - (lastStroke.x || 0));
        lastStroke.radiusY = Math.abs(y - (lastStroke.y || 0));
      }
    }

    strokes[strokes.length - 1] = lastStroke;
    updateLayer(activeLayerId, { maskStrokes: strokes });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleTouchStart = (e: any) => {
    if (e.evt.touches.length > 1) {
      isDrawing.current = false;
      return;
    }
    handleMouseDown(e);
  };

  const handleTouchMove = (e: any) => {
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      isDrawing.current = false;

      const stage = e.target.getStage();
      if (!stage) return;

      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (!lastDist.current) {
        lastDist.current = dist;
      }

      const rect = stage.container().getBoundingClientRect();
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2 - rect.left,
        y: (touch1.clientY + touch2.clientY) / 2 - rect.top,
      };

      const mousePointTo = {
        x: (center.x - canvasView.offsetX) / canvasView.scale,
        y: (center.y - canvasView.offsetY) / canvasView.scale,
      };

      const scaleBy = dist / lastDist.current;
      lastDist.current = dist;
      const newScale = canvasView.scale * scaleBy;

      setCanvasView({
        scale: newScale,
        offsetX: center.x - mousePointTo.x * newScale,
        offsetY: center.y - mousePointTo.y * newScale,
      });
    } else {
      handleMouseMove(e);
    }
  };

  const handleTouchEnd = () => {
    lastDist.current = 0;
    handleMouseUp();
  };

  const handleMouseLeave = () => {
    if (cursorRef.current) {
      cursorRef.current.hide();
      cursorLayerRef.current?.batchDraw();
    }
  };

  const handleMouseEnter = () => {
    if (cursorRef.current && (activeTool === 'brush' || activeTool === 'eraser')) {
      cursorRef.current.show();
      cursorLayerRef.current?.batchDraw();
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setErrorModalMessage("Please set your Gemini API key in the settings first.");
      return;
    }

    if (!targetImage) {
      setErrorModalMessage("Please upload a target image first.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {

      let layerIndex = 1;

      for (const layer of layers) {
        if (!layer.isVisible) continue;
        if (layer.maskStrokes.length === 0) continue;

        let layerMaskBase64: string | null = null;
        let maskImage: typeof targetImage | null = null;

        // Extract mask if strokes exist
        if (layer.maskStrokes.length > 0) {
          // Create an off-screen container
          const container = document.createElement('div');
          const stage = new Konva.Stage({
            container,
            width: targetImage.width,
            height: targetImage.height,
          });

          const konvaLayer = new Konva.Layer();

          // Add all strokes matching the layer
          for (const stroke of layer.maskStrokes) {
            const compOp = stroke.mode === 'erase' ? 'destination-out' : 'source-over';

            if (stroke.type === 'freehand') {
              const pts = stroke.points?.flatMap(p => [p.x, p.y]) || [];
              konvaLayer.add(new Konva.Line({
                points: pts,
                stroke: APP_CONFIG.DEFAULT_MASK_COLOR, // Use default color for the mask output
                strokeWidth: stroke.brushSize,
                tension: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: compOp,
                opacity: 1
              }));
            } else if (stroke.type === 'rectangle') {
              konvaLayer.add(new Konva.Rect({
                x: stroke.width! < 0 ? stroke.x! + stroke.width! : stroke.x,
                y: stroke.height! < 0 ? stroke.y! + stroke.height! : stroke.y,
                width: Math.abs(stroke.width || 0),
                height: Math.abs(stroke.height || 0),
                fill: APP_CONFIG.DEFAULT_MASK_COLOR,
                globalCompositeOperation: compOp,
                opacity: 1
              }));
            } else if (stroke.type === 'ellipse') {
              konvaLayer.add(new Konva.Ellipse({
                x: stroke.x,
                y: stroke.y,
                radiusX: stroke.radiusX || 0,
                radiusY: stroke.radiusY || 0,
                fill: APP_CONFIG.DEFAULT_MASK_COLOR,
                globalCompositeOperation: compOp,
                opacity: 1
              }));
            }
          }

          stage.add(konvaLayer);
          layerMaskBase64 = stage.toDataURL({ mimeType: 'image/png' });
          stage.destroy();

          // Save back to store
          maskImage = {
            id: Math.random().toString(36).substring(2, 9),
            fileData: layerMaskBase64,
            width: targetImage.width,
            height: targetImage.height,
            mimeType: 'image/png'
          };
          updateLayer(layer.id, { maskImage });
        }

        layerIndex++;
      }

      // Call API
      try {
        const result = await generateImage(apiKey, targetImage, useProjectStore.getState().layers, overallPrompt);
        setGeneratedImage(result);
      } catch (err: any) {
        console.error(err);
        setErrorModalMessage(`Generation failed: ${err.message}`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="flex-1 bg-background flex flex-col relative overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center bg-zinc-900 border-zinc-800 m-4 rounded-xl border border-dashed relative"
      >
        {isGenerating && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-primary font-semibold text-lg animate-pulse">Generating your image...</p>
          </div>
        )}

        {generatedImage && (
          <div className="absolute top-4 right-4 z-40 bg-zinc-800 text-zinc-200 px-2 py-2 rounded-full shadow-lg border border-zinc-700 font-medium flex items-center gap-2">
            <button
              onClick={() => setIsShowingGeneratedImage(!isShowingGeneratedImage)}
              className="px-3 py-1 hover:bg-zinc-700 rounded-full transition-colors text-sm font-semibold"
            >
              {isShowingGeneratedImage ? 'Show Original' : 'Show Generated'}
            </button>
          </div>
        )}

        {!targetImage ? (
          <div className="text-zinc-500 flex flex-col items-center gap-4">
            <p>Upload an image to start editing</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md transition-colors shadow"
            >
              Upload Image
            </button>
          </div>
        ) : (
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onWheel={handleWheel}
            draggable={activeTool === 'pan'}
            x={canvasView.offsetX}
            y={canvasView.offsetY}
            scaleX={canvasView.scale}
            scaleY={canvasView.scale}
            onDragEnd={handleDragEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            className={activeTool === 'pan' ? 'cursor-move' : (activeTool === 'select' ? 'cursor-default' : (activeTool === 'brush' || activeTool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'))}
            style={{ touchAction: 'none' }}
          >
            {/* Base Image Layer */}
            <Layer>
              {image && <KonvaImage image={image} />}
            </Layer>

            {/* Mask Layers */}
            {!isShowingGeneratedImage && layers.filter(l => l.isVisible).map(layer => (
              <Layer key={layer.id}>
                {layer.maskStrokes.map(stroke => {
                  const compOp = stroke.mode === 'erase' ? 'destination-out' : 'source-over';
                  const shapeOpacity = stroke.mode === 'erase' ? 1.0 : (activeLayerId === layer.id ? 0.7 : 0.4);

                  if (stroke.type === 'freehand') {
                    const pts = stroke.points?.flatMap(p => [p.x, p.y]) || [];
                    return (
                      <Line
                        key={stroke.id}
                        points={pts}
                        stroke={stroke.color}
                        strokeWidth={stroke.brushSize}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation={compOp}
                        opacity={shapeOpacity}
                      />
                    );
                  } else if (stroke.type === 'rectangle') {
                    return (
                      <Rect
                        key={stroke.id}
                        x={stroke.width! < 0 ? stroke.x! + stroke.width! : stroke.x}
                        y={stroke.height! < 0 ? stroke.y! + stroke.height! : stroke.y}
                        width={Math.abs(stroke.width || 0)}
                        height={Math.abs(stroke.height || 0)}
                        fill={stroke.color}
                        globalCompositeOperation={compOp}
                        opacity={shapeOpacity}
                      />
                    );
                  } else if (stroke.type === 'ellipse') {
                    return (
                      <Ellipse
                        key={stroke.id}
                        x={stroke.x}
                        y={stroke.y}
                        radiusX={stroke.radiusX || 0}
                        radiusY={stroke.radiusY || 0}
                        fill={stroke.color}
                        globalCompositeOperation={compOp}
                        opacity={shapeOpacity}
                      />
                    );
                  }
                  return null;
                })}
              </Layer>
            ))}

            {/* Cursor UI Layer */}
            {!isShowingGeneratedImage && (activeTool === 'brush' || activeTool === 'eraser') && (
              <Layer ref={cursorLayerRef}>
                <Circle
                  ref={cursorRef}
                  radius={brushSize / 2}
                  stroke={activeTool === 'eraser' ? '#ffffff' : (layers.find(l => l.id === activeLayerId)?.color || maskColor)}
                  strokeWidth={2 / canvasView.scale}
                  listening={false}
                  visible={false}
                />
              </Layer>
            )}

            {/* Generated Image Overlay */}
            {isShowingGeneratedImage && generatedImage && genImage && (
              <Layer>
                <KonvaImage
                  image={genImage}
                  width={image?.width}
                  height={image?.height}
                />
              </Layer>
            )}
          </Stage>
        )}
      </div>

      <div className="h-20 bg-panel border-t border-zinc-800 py-3 shrink-0 flex gap-4 items-center relative z-10">
        <textarea
          className="flex-1 h-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:border-primary transition-colors"
          placeholder="Overall image generation prompt. e.g. Replace background with forest, add a hat to the person, etc."
          value={overallPrompt}
          onChange={(e) => setOverallPrompt(e.target.value)}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`h-12 px-8 font-bold rounded-lg shadow-lg flex items-center justify-center transition-all ${isGenerating
            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            : 'bg-primary hover:bg-primary-hover text-zinc-900'
            }`}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <ErrorModal
        message={errorModalMessage}
        onClose={() => setErrorModalMessage(null)}
      />
    </main>
  );
};
