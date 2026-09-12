import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { ThemeMode } from '../types';
import { TOTAL_PAGES } from '../constants';

interface BookViewerProps {
  pdfDoc: any;
  currentPage: number;
  zoom: number;
  theme: ThemeMode;
  isControlsVisible: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleControls: () => void;
}

export const BookViewer: React.FC<BookViewerProps> = ({
  pdfDoc,
  currentPage,
  zoom,
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
  const prevContainerDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(0.707); // A4 default

  // Touch gesture tracking for swipe and 3-zone tap
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Render current PDF page with race condition prevention and safe cancellation
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    // Increment render sequence ID to invalidate any prior in-flight renders
    const currentIteration = ++renderIterationRef.current;

    // Cancel and await any currently running render task to unlock the canvas
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
        await renderTaskRef.current.promise.catch(() => {});
      } catch {
        // Ignore cancel exceptions
      }
      renderTaskRef.current = null;
    }

    // If another render was initiated while awaiting previous cancel, exit
    if (currentIteration !== renderIterationRef.current) {
      return;
    }

    setIsLoadingPage(true);
    setRenderError(null);

    try {
      const page = await pdfDoc.getPage(currentPage);

      // Verify that this render is still the current one after getPage async gap
      if (currentIteration !== renderIterationRef.current) {
        return;
      }

      const originalViewport = page.getViewport({ scale: 1 });
      setPageAspectRatio(originalViewport.width / originalViewport.height);

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // Available container space
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Restrict max reading width on wide desktop (>1100px) so line length is comfortable
      const maxReadingWidth = Math.min(containerWidth - 32, 900);

      // Fit to width base scale:
      let baseScale = maxReadingWidth / originalViewport.width;

      // Ensure page also fits vertically reasonably well without excessive scrolling if user prefers
      if (originalViewport.height * baseScale > containerHeight * 1.35) {
        // Soft dampening for extremely tall viewports
        const fitHeightScale = (containerHeight - 40) / originalViewport.height;
        baseScale = Math.max(fitHeightScale * 0.95, baseScale * 0.92);
      }

      // Multiply by user zoom factor (0.6x - 2.4x)
      const targetScale = Math.max(0.4, baseScale * zoom);

      // Retina / HiDPI output scale
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

      // Ensure any concurrent task is cleanly cancelled and waited on before calling page.render
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
          await renderTaskRef.current.promise.catch(() => {});
        } catch {}
        renderTaskRef.current = null;
      }

      if (currentIteration !== renderIterationRef.current) {
        return;
      }

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
        // Expected cancellation when changing pages quickly or during re-renders
        return;
      }
      console.error("Error rendering PDF page:", err);
      if (currentIteration === renderIterationRef.current) {
        setRenderError("No se pudo renderizar la página. Intenta recargar o navegar a otra página.");
        setIsLoadingPage(false);
      }
    }
  }, [pdfDoc, currentPage, zoom]);

  // Trigger render when page or zoom changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      renderIterationRef.current += 1;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
    };
  }, []);

  // Handle Window Resize and Orientation Change with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimer: any = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!containerRef.current) return;
        const currentWidth = containerRef.current.clientWidth;
        const currentHeight = containerRef.current.clientHeight;
        // Avoid re-rendering if dimensions have barely changed
        if (
          Math.abs(currentWidth - prevContainerDimensionsRef.current.width) < 6 &&
          Math.abs(currentHeight - prevContainerDimensionsRef.current.height) < 6
        ) {
          return;
        }
        prevContainerDimensionsRef.current = { width: currentWidth, height: currentHeight };
        renderPage();
      }, 150);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [renderPage]);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        onPrevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        onNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevPage, onNextPage]);

  // Touch and Click handling: Swipe & Three-Zone Navigation
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    hasMovedRef.current = false;
  };

  const handleTouchMove = () => {
    hasMovedRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Detect Horizontal Swipe (swipe left -> next page; swipe right -> prev page)
    if (Math.abs(deltaX) > 48 && Math.abs(deltaY) < 70 && deltaTime < 450) {
      if (deltaX < 0) {
        onNextPage();
      } else {
        onPrevPage();
      }
      touchStartRef.current = null;
      return;
    }

    // Tap detected (little to no movement)
    if (!hasMovedRef.current || (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10)) {
      handleZoneClick(touch.clientX);
    }

    touchStartRef.current = null;
  };

  // Three-zone click resolution:
  // Left 33% = Previous page
  // Center 34% = Toggle immersive header/footer controls
  // Right 33% = Next page
  const handleZoneClick = (clientX: number) => {
    const windowWidth = window.innerWidth;
    const leftThreshold = windowWidth * 0.32;
    const rightThreshold = windowWidth * 0.68;

    if (clientX < leftThreshold) {
      onPrevPage();
    } else if (clientX > rightThreshold) {
      onNextPage();
    } else {
      onToggleControls();
    }
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Avoid double trigger if touch was just fired
    if (Date.now() - (touchStartRef.current?.time || 0) < 300) {
      return;
    }
    handleZoneClick(e.clientX);
  };

  return (
    <div
      id="book-viewer-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleMouseClick}
      className="relative flex-1 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start pt-14 sm:pt-16 pb-16 sm:pb-18 px-2 sm:px-4 cursor-default select-none"
    >
      {/* Desktop Floating Left / Right Navigation Arrows */}
      <div className="hidden md:flex absolute inset-y-0 left-0 w-16 items-center justify-start pl-2 z-20 pointer-events-none">
        <button
          id="btn-desktop-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrevPage();
          }}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className="pointer-events-auto w-11 h-11 rounded-full bg-[#fbf9f4]/85 dark:bg-[#161a22]/85 hover:bg-white dark:hover:bg-[#202632] text-[#4d473d] dark:text-[#cfc9be] border border-[#ded7c8] dark:border-[#2d3440] shadow-md flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer group"
          title="Página anterior (Flecha Izquierda)"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="hidden md:flex absolute inset-y-0 right-0 w-16 items-center justify-end pr-2 z-20 pointer-events-none">
        <button
          id="btn-desktop-next"
          onClick={(e) => {
            e.stopPropagation();
            onNextPage();
          }}
          disabled={currentPage >= TOTAL_PAGES}
          aria-label="Página siguiente"
          className="pointer-events-auto w-11 h-11 rounded-full bg-[#fbf9f4]/85 dark:bg-[#161a22]/85 hover:bg-white dark:hover:bg-[#202632] text-[#4d473d] dark:text-[#cfc9be] border border-[#ded7c8] dark:border-[#2d3440] shadow-md flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer group"
          title="Página siguiente (Flecha Derecha)"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Book Canvas Presentation Wrapper */}
      <div className="relative my-auto flex flex-col items-center max-w-full">
        {/* Soft Book Page Shadow and Border */}
        <div
          id="canvas-card"
          className="relative bg-[#ffffff] dark:bg-[#121417] rounded-sm sm:rounded-md shadow-xl sm:shadow-2xl border border-[#e4decb] dark:border-[#2a2f38] overflow-hidden transition-all duration-200"
          style={{
            maxWidth: '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            id="pdf-render-canvas"
            className={`block transition-all duration-200 ${
              theme === 'night' ? 'pdf-night-filter' : ''
            }`}
          />

          {/* Loading overlay spinner */}
          {isLoadingPage && (
            <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#8c6b2d] dark:text-[#d4af37]" />
              <span className="text-xs font-sans-ui text-[#443f36] dark:text-[#e0dbcf] font-medium bg-[#f5f1e7]/90 dark:bg-[#1a1e27]/90 px-3 py-1 rounded-full border border-[#ded7c8] dark:border-[#2d3440]">
                Cargando página {currentPage}...
              </span>
            </div>
          )}
        </div>

        {/* Error State if rendering fails */}
        {renderError && (
          <div className="p-4 mt-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 flex items-center gap-3 text-xs sm:text-sm font-sans-ui max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{renderError}</span>
          </div>
        )}
      </div>

      {/* Subtle Immersive Tap Feedback Cue (only visible briefly on initial load or touch) */}
      {!isControlsVisible && (
        <div className="fixed bottom-3 z-10 px-3 py-1 rounded-full bg-black/45 dark:bg-white/20 text-white dark:text-black text-[10px] font-sans-ui pointer-events-none backdrop-blur-xs animate-fade-out">
          Toca el centro para mostrar controles
        </div>
      )}
    </div>
  );
};
