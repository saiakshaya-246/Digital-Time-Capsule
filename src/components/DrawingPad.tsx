/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Undo, Redo, Trash2, Eraser, Paintbrush, Circle } from 'lucide-react';
import { playClick } from '../utils/audio';

interface DrawingPadProps {
  onSave: (base64Image: string | undefined) => void;
  initialDrawing?: string;
}

const PALETTE_COLORS = [
  { name: 'Charcoal', hex: '#1e293b' },
  { name: 'Crimson', hex: '#ef4444' },
  { name: 'Ocean', hex: '#0ea5e9' },
  { name: 'Forest', hex: '#22c55e' },
  { name: 'Cyber', hex: '#ec4899' },
  { name: 'Golden', hex: '#f59e0b' },
  { name: 'Lavender', hex: '#8b5cf6' },
];

export default function DrawingPad({ onSave, initialDrawing }: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1e293b');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  
  // Undo/Redo stacks
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use absolute high-DPI scaling for crisp vector-like canvas drawings
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Fill with white background so markers are crisp
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);

    // Load initial drawing if available
    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, rect.width, rect.height);
        saveHistoryState();
      };
      img.src = initialDrawing;
    } else {
      saveHistoryState();
    }
  }, []);

  // Update stroke style and width when color/eraser/brushSize changes
  useEffect(() => {
    if (!contextRef.current) return;
    contextRef.current.strokeStyle = isEraser ? '#ffffff' : color;
    contextRef.current.lineWidth = brushSize;
  }, [color, brushSize, isEraser]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Resize down to a highly optimized capsule size (e.g., 320x200) to save localStorage
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320;
    tempCanvas.height = 200;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, 320, 200);
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.7); // Low-cost JPEG format
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(dataUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      onSave(dataUrl);
    }
  };

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    let clientX, clientY;
    if ('touches' in nativeEvent) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    // Prevent screen scrolling when sketching on mobile
    if ('touches' in nativeEvent) {
      nativeEvent.preventDefault();
    }

    let clientX, clientY;
    if ('touches' in nativeEvent) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current?.closePath();
    setIsDrawing(false);
    saveHistoryState();
  };

  const clearCanvas = () => {
    playClick(400, 0.05);
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
    
    // Reset state
    const newHistory = history.slice(0, historyIndex + 1);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 320;
    tempCanvas.height = 200;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, 320, 200);
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.7);
      newHistory.push(dataUrl);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      onSave(undefined);
    }
  };

  const handleUndo = () => {
    if (historyIndex <= 0 || !contextRef.current || !canvasRef.current) return;
    playClick(600, 0.02);
    
    const prevIndex = historyIndex - 1;
    const prevState = history[prevIndex];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const img = new Image();
    img.onload = () => {
      contextRef.current?.clearRect(0, 0, rect.width, rect.height);
      contextRef.current?.drawImage(img, 0, 0, rect.width, rect.height);
      setHistoryIndex(prevIndex);
      onSave(prevState);
    };
    img.src = prevState;
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1 || !contextRef.current || !canvasRef.current) return;
    playClick(700, 0.02);
    
    const nextIndex = historyIndex + 1;
    const nextState = history[nextIndex];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const img = new Image();
    img.onload = () => {
      contextRef.current?.clearRect(0, 0, rect.width, rect.height);
      contextRef.current?.drawImage(img, 0, 0, rect.width, rect.height);
      setHistoryIndex(nextIndex);
      onSave(nextState);
    };
    img.src = nextState;
  };

  return (
    <div id="drawing-pad-container" className="flex flex-col bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-[#17171C] p-2 rounded-lg border border-white/5 shadow-md">
        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="tool-brush"
            onClick={() => { playClick(); setIsEraser(false); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${!isEraser ? 'bg-brand-orange text-white' : 'hover:bg-white/5 text-zinc-400'}`}
            title="Brush"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="tool-eraser"
            onClick={() => { playClick(); setIsEraser(true); }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${isEraser ? 'bg-brand-orange text-white' : 'hover:bg-white/5 text-zinc-400'}`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-white/10 mx-1"></span>
          
          <button
            type="button"
            id="tool-undo"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 disabled:opacity-20 transition-all cursor-pointer"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="tool-redo"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 disabled:opacity-20 transition-all cursor-pointer"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="tool-clear"
            onClick={clearCanvas}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-all ml-1 cursor-pointer"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Brush size */}
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-[10px] font-sans font-black uppercase tracking-widest text-zinc-500 mr-1">Size:</span>
          {[2, 4, 8, 14].map((size) => (
            <button
              key={size}
              type="button"
              id={`brush-size-${size}`}
              onClick={() => { playClick(450 + size * 10, 0.01); setBrushSize(size); }}
              className={`p-1 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                brushSize === size ? 'border-brand-orange bg-brand-orange/10' : 'border-transparent hover:bg-white/5'
              }`}
            >
              <Circle 
                style={{ width: `${Math.max(6, size * 0.7)}px`, height: `${Math.max(6, size * 0.7)}px`, fill: isEraser ? '#71717a' : color }} 
                className={`${isEraser ? 'text-zinc-500' : 'text-current'} stroke-0`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Frame */}
      <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-md bg-white aspect-[8/5] flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full touch-none"
        />
        {historyIndex <= 0 && !initialDrawing && (
          <div className="absolute pointer-events-none select-none text-center p-4">
            <p className="font-serif text-sm italic text-zinc-400 font-medium">Draw a sketch, doodle, or digital keepsake...</p>
            <p className="text-[9px] font-sans uppercase tracking-[0.15em] text-zinc-500 mt-1">interactive canvas pad</p>
          </div>
        )}
      </div>

      {/* Color Palette (disabled when using eraser) */}
      <div className="flex items-center gap-2 mt-3 select-none">
        <span className="text-[10px] font-sans font-black uppercase tracking-widest text-zinc-500">Ink:</span>
        <div className="flex items-center gap-2">
          {PALETTE_COLORS.map((palette) => (
            <button
              key={palette.hex}
              type="button"
              id={`color-preset-${palette.name.toLowerCase()}`}
              disabled={isEraser}
              onClick={() => {
                playClick(500, 0.015);
                setColor(palette.hex);
                setIsEraser(false);
              }}
              style={{ backgroundColor: palette.hex }}
              className={`w-5 h-5 rounded-full border border-white/10 shadow-sm transition-all relative cursor-pointer ${
                color === palette.hex && !isEraser 
                  ? 'ring-2 ring-offset-2 ring-brand-orange scale-110 ring-offset-[#17171C]' 
                  : 'hover:scale-105 disabled:opacity-20'
              }`}
              title={palette.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
