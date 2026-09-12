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

  return (
    <div
      id="facsimile-viewer-viewport"
      ref={containerRef}
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

      {/* Canvas Paper Representation */}
      <div className="relative my-auto flex flex-col items-center justify-center max-w-full">
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
