import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { BookTheme } from '../types';
import { THEME_CONFIG, TOTAL_PAGES } from '../constants';

interface FacsimileViewerProps {
  pdfDoc: any;
  currentPage: number;
  theme: BookTheme;
  isControlsVisible: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleControls: () => void;
}

export const FacsimileViewer: React.FC<FacsimileViewerProps> = ({
  pdfDoc,
  currentPage,
  theme,
  isControlsVisible,
  onPrevPage,
  onNextPage,
  onToggleControls,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const renderIterationRef = useRef<number>(0);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Touch gesture state for tactile page turning
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const gestureLockRef = useRef<'undecided' | 'scroll' | 'swipe'>('undecided');
  const hapticFiredRef = useRef<boolean>(false);

  const themeStyle = THEME_CONFIG[theme];

  // Render current PDF page with safe containment and cancellation
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    const currentIteration = ++renderIterationRef.current;

    // Cancel and await previous render
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
        await renderTaskRef.current.promise.catch(() => {});
      } catch {}
      renderTaskRef.current = null;
    }

    if (currentIteration !== renderIterationRef.current) return;

    setIsLoadingPage(true);
    setRenderError(null);

    try {
      const page = await pdfDoc.getPage(currentPage);
      if (currentIteration !== renderIterationRef.current) return;

      const originalViewport = page.getViewport({ scale: 1 });
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // Available space inside container
      const containerWidth = Math.max(280, container.clientWidth - 24);
      const containerHeight = Math.max(350, container.clientHeight - 80);

      // Calculate scale so page FITS COMPLETELY without horizontal clipping
      const scaleWidth = containerWidth / originalViewport.width;
      const scaleHeight = containerHeight / originalViewport.height;
      // Base scale fits both dimensions safely
      const baseScale = Math.min(scaleWidth, scaleHeight * 1.15);

      const targetScale = Math.max(0.4, Math.min(2.5, baseScale * zoomLevel));
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: targetScale });

      const context = canvas.getContext('2d', { alpha: false });
      if (!context) return;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null;

      const renderContext = {
        canvasContext: context,
        viewport,
        transform,
      };

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          await renderTaskRef.current.promise.catch(() => {});
        } catch {}
        renderTaskRef.current = null;
      }

      if (currentIteration !== renderIterationRef.current) return;

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      try {
        await task.promise;
      } finally {
        if (renderTaskRef.current === task) {
          renderTaskRef.current = null;
        }
      }

      if (currentIteration === renderIterationRef.current) {
        setIsLoadingPage(false);
      }
    } catch (err: any) {
      if (
        err?.name === 'RenderingCancelledException' ||
        err?.message?.includes('Cannot use the same canvas') ||
        err?.message?.includes('cancelled')
      ) {
        return;
      }
      console.error("Error rendering facsimile page:", err);
      if (currentIteration === renderIterationRef.current) {
        setRenderError("No se pudo renderizar la página facsímil.");
        setIsLoadingPage(false);
      }
    }
  }, [pdfDoc, currentPage, zoomLevel]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  useEffect(() => {
    return () => {
      renderIterationRef.current += 1;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, []);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timer: any = null;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        renderPage();
      }, 150);
    });
    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [renderPage]);

  // Touch handlers for facsimile swipe gesture
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only enable swipe if zoom is at or near default (not zoomed in for panning)
    if (zoomLevel > 1.18) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    gestureLockRef.current = 'undecided';
    hapticFiredRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || zoomLevel > 1.18) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (gestureLockRef.current === 'undecided') {
      if (absX > 6 || absY > 6) {
        if (absY > absX * 1.1) {
          gestureLockRef.current = 'scroll';
          return;
        } else {
          gestureLockRef.current = 'swipe';
          setIsDragging(true);
        }
      }
    }

    if (gestureLockRef.current === 'swipe') {
      if (e.cancelable) {
        e.preventDefault();
      }

      let damped = deltaX;
      if (currentPage <= 1 && deltaX > 0) {
        damped = Math.sign(deltaX) * Math.pow(Math.abs(deltaX), 0.72) * 0.45;
      } else if (currentPage >= TOTAL_PAGES && deltaX < 0) {
        damped = Math.sign(deltaX) * Math.pow(Math.abs(deltaX), 0.72) * 0.45;
      }

      setDragOffset(damped);

      const isPastThreshold = Math.abs(damped) > 55;
      if (isPastThreshold && !hapticFiredRef.current) {
        hapticFiredRef.current = true;
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(8);
          } catch {}
        }
      } else if (!isPastThreshold && hapticFiredRef.current) {
        hapticFiredRef.current = false;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const wasSwiping = gestureLockRef.current === 'swipe';
    const currentOffset = dragOffset;

    setIsDragging(false);
    setDragOffset(0);
    gestureLockRef.current = 'undecided';

    if (wasSwiping) {
      const isFlick = deltaTime < 280 && Math.abs(currentOffset) > 32;
      const isDragPass = Math.abs(currentOffset) > 55;

      if (isFlick || isDragPass) {
        if (currentOffset < 0 && currentPage < TOTAL_PAGES) {
          onNextPage();
        } else if (currentOffset > 0 && currentPage > 1) {
          onPrevPage();
        }
      }
      touchStartRef.current = null;
      return;
    }

    // Quick tap to toggle controls
    if (Math.abs(deltaX) < 10) {
      if (!(e.target as HTMLElement).closest('button, .zoom-controls')) {
        onToggleControls();
      }
    }
    touchStartRef.current = null;
  };

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        onNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        onPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNextPage, onPrevPage]);

  return (
    <div
      id="facsimile-viewer-viewport"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, .zoom-controls')) return;
        onToggleControls();
      }}
      className={`relative flex-1 w-full h-full overflow-auto flex flex-col items-center justify-center p-3 sm:p-6 ${themeStyle.bg} select-none transition-colors duration-300`}
      style={{
        paddingTop: isControlsVisible ? '4.5rem' : '1.5rem',
        paddingBottom: isControlsVisible ? '5rem' : '2rem',
      }}
    >
      {/* Floating Swipe Cue Badge */}
      {isDragging && Math.abs(dragOffset) > 28 && (
        <div
          className={`fixed top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-sans-ui font-semibold shadow-2xl backdrop-blur-md transition-all ${
            dragOffset < 0 ? 'right-4 sm:right-8' : 'left-4 sm:left-8'
          } ${
            Math.abs(dragOffset) > 55
              ? 'bg-[#8c6b2d] text-white ring-2 ring-[#d4af37]/80 scale-105'
              : 'bg-black/75 dark:bg-white/90 text-white dark:text-neutral-900 ring-1 ring-white/20'
          }`}
        >
          {dragOffset > 0 ? (
            <>
              <ChevronLeft className="w-4 h-4 animate-pulse" />
              <span>{currentPage > 1 ? `Pág. ${currentPage - 1}` : 'Inicio del libro'}</span>
            </>
          ) : (
            <>
              <span>{currentPage < TOTAL_PAGES ? `Pág. ${currentPage + 1}` : 'Fin del texto'}</span>
              <ChevronRight className="w-4 h-4 animate-pulse" />
            </>
          )}
        </div>
      )}
      {/* Floating Zoom Controls */}
      <div className="absolute top-18 right-4 z-20 zoom-controls flex items-center gap-1.5 p-1 rounded-xl bg-black/60 text-white backdrop-blur-md shadow-lg text-xs font-sans-ui">
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          title="Alejar"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-1.5 tabular-nums text-[11px] font-medium min-w-10 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
          title="Acercar"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(1.0)}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer border-l border-white/20 ml-0.5"
          title="Restablecer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Left / Right Buttons */}
      <div className="hidden md:flex fixed top-1/2 -translate-y-1/2 left-4 z-20 pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevPage();
          }}
          disabled={currentPage <= 1}
          className={`pointer-events-auto w-10 h-10 rounded-full ${themeStyle.surface} ${themeStyle.text} border ${themeStyle.border} shadow-lg flex items-center justify-center disabled:opacity-0 cursor-pointer`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="hidden md:flex fixed top-1/2 -translate-y-1/2 right-4 z-20 pointer-events-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNextPage();
          }}
          disabled={currentPage >= TOTAL_PAGES}
          className={`pointer-events-auto w-10 h-10 rounded-full ${themeStyle.surface} ${themeStyle.text} border ${themeStyle.border} shadow-lg flex items-center justify-center disabled:opacity-0 cursor-pointer`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Paper Representation with Interactive Tactile Turn */}
      <div
        className="relative my-auto flex flex-col items-center justify-center max-w-full"
        style={{
          transform: isDragging ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.016}deg)` : 'none',
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        <div
          className={`relative rounded-md shadow-2xl overflow-hidden border ${themeStyle.border} bg-white dark:bg-[#121418] max-w-full`}
        >
          <canvas
            ref={canvasRef}
            id="facsimile-pdf-canvas"
            className={`block max-w-full h-auto transition-all ${
              theme === 'dark' || theme === 'midnight' ? 'pdf-night-filter' : ''
            }`}
          />

          {isLoadingPage && (
            <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-2xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#8c6b2d]" />
              <span className="text-xs font-sans-ui font-medium px-3 py-1 rounded-full bg-white/90 dark:bg-black/80 shadow">
                Cargando página {currentPage}...
              </span>
            </div>
          )}
        </div>

        {renderError && (
          <div className="mt-4 p-3 rounded-xl bg-red-100 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{renderError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
