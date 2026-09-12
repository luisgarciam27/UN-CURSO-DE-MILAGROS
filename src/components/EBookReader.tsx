import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark as BookmarkIcon,
  Volume2,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  StickyNote
} from 'lucide-react';
import { BookTheme, BookFontFamily, BookLineHeight, BookReadingWidth, BookPageData, SavedQuote } from '../types';
import { THEME_CONFIG, TOTAL_PAGES, getChapterForPage } from '../constants';

interface EBookReaderProps {
  pageData: BookPageData;
  currentPage: number;
  theme: BookTheme;
  fontFamily: BookFontFamily;
  fontSize: number;
  lineHeight: BookLineHeight;
  readingWidth: BookReadingWidth;
  isControlsVisible: boolean;
  isBookmarked: boolean;
  activeSpeechParagraph: number | null;
  savedQuotes: SavedQuote[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleControls: () => void;
  onToggleBookmark: () => void;
  onSaveQuote: (text: string) => void;
  onAddNoteRequest: (text: string, page: number) => void;
  onPlayFromParagraph?: (index: number) => void;
}

export const EBookReader: React.FC<EBookReaderProps> = ({
  pageData,
  currentPage,
  theme,
  fontFamily,
  fontSize,
  lineHeight,
  readingWidth,
  isControlsVisible,
  isBookmarked,
  activeSpeechParagraph,
  savedQuotes,
  onPrevPage,
  onNextPage,
  onToggleControls,
  onToggleBookmark,
  onSaveQuote,
  onPlayFromParagraph,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef(false);
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<{ text: string; rect: DOMRect } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionInfo(null);
        return;
      }
      const text = sel.toString().trim();
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
          setSelectionInfo({ text, rect });
        } else {
          setSelectionInfo(null);
        }
      } catch {
        setSelectionInfo(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Track page turn direction for 3D flip animation
  const prevPageRef = useRef(currentPage);
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    if (currentPage > prevPageRef.current) {
      setTurnDirection('next');
    } else if (currentPage < prevPageRef.current) {
      setTurnDirection('prev');
    }
    prevPageRef.current = currentPage;
  }, [currentPage]);

  const themeStyle = THEME_CONFIG[theme];

  // Font family class mapping
  const fontClass = {
    literata: 'font-literata',
    newsreader: 'font-newsreader',
    atkinson: 'font-atkinson',
    merriweather: 'font-merriweather',
    lora: 'font-lora',
    sans: 'font-sans-ui',
    cormorant: 'font-literata',
  }[fontFamily] || 'font-literata';

  // Line height class mapping
  const lineHeightStyle = {
    compact: 1.55,
    normal: 1.8,
    relaxed: 2.1,
  }[lineHeight];

  // Max width container for comfortable reading column (65-75 characters)
  const maxWidthStyle = {
    narrow: 'max-w-[620px]',
    normal: 'max-w-[740px]',
    wide: 'max-w-[880px]',
  }[readingWidth];

  // Scroll to top when page changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' as any });
    }
  }, [currentPage]);

  // Touch handlers for swipe and 3-zone tap
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    hasMovedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (deltaX > 8 || deltaY > 8) {
      hasMovedRef.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Horizontal swipe gesture
    if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 65 && deltaTime < 450) {
      if (deltaX < 0) {
        onNextPage();
      } else {
        onPrevPage();
      }
      touchStartRef.current = null;
      return;
    }

    // Tap without drag
    if (!hasMovedRef.current && Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      handleZoneClick(touch.clientX);
    }
    touchStartRef.current = null;
  };

  const handleZoneClick = (clientX: number) => {
    const width = window.innerWidth;
    const leftBound = width * 0.25;
    const rightBound = width * 0.75;

    if (clientX < leftBound) {
      onPrevPage();
    } else if (clientX > rightBound) {
      onNextPage();
    } else {
      onToggleControls();
    }
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - (touchStartRef.current?.time || 0) < 350) return;
    if ((e.target as HTMLElement).closest('button, .interactive-quote-action, .interactive-page-curl')) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    handleZoneClick(e.clientX);
  };

  const handleCopyQuote = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedQuote(text);
    setTimeout(() => setCopiedQuote(null), 2000);
  };

  // Helper to format sentence superscripts (², ³, ⁴, ⁵, etc.)
  const renderTextWithSuperscripts = (text: string) => {
    const parts = text.split(/([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g);
    return parts.map((part, i) => {
      if (/^[¹²³⁴⁵⁶⁷⁸⁹⁰]+$/.test(part)) {
        return (
          <sup
            key={i}
            className={`text-[0.7em] font-sans-ui font-bold ${themeStyle.accent} mx-0.5 select-none leading-none`}
          >
            {part}
          </sup>
        );
      }
      return part;
    });
  };

  const chapterInfo = getChapterForPage(currentPage);
  const isCover = currentPage === 1;
  const isTableOfContents = currentPage === 2 || currentPage === 3;

  return (
    <div
      id="ebook-reader-viewport"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleMouseClick}
      className={`relative flex-1 w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start ${themeStyle.bg} ${themeStyle.text} transition-colors duration-300 select-text perspective-1000`}
      style={{
        paddingTop: isControlsVisible ? '4.25rem' : '1.5rem',
        paddingBottom: isControlsVisible ? '4.5rem' : '2.25rem',
      }}
    >
      {/* Floating Desktop Turn-Page Side Buttons */}
      <div className="hidden lg:flex fixed top-1/2 -translate-y-1/2 left-4 z-20 pointer-events-none">
        <button
          id="btn-ebook-desktop-prev"
          onClick={(e) => {
            e.stopPropagation();
            onPrevPage();
          }}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
          className={`pointer-events-auto w-11 h-11 rounded-full ${themeStyle.surface} ${themeStyle.text} ${themeStyle.border} border shadow-xl flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-all cursor-pointer group`}
          title="Página anterior (← Flecha Izquierda)"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="hidden lg:flex fixed top-1/2 -translate-y-1/2 right-4 z-20 pointer-events-none">
        <button
          id="btn-ebook-desktop-next"
          onClick={(e) => {
            e.stopPropagation();
            onNextPage();
          }}
          disabled={currentPage >= TOTAL_PAGES}
          aria-label="Página siguiente"
          className={`pointer-events-auto w-11 h-11 rounded-full ${themeStyle.surface} ${themeStyle.text} ${themeStyle.border} border shadow-xl flex items-center justify-center disabled:opacity-0 disabled:pointer-events-none hover:scale-110 active:scale-95 transition-all cursor-pointer group`}
          title="Página siguiente (→ Flecha Derecha)"
        >
          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform text-[#8c6b2d] dark:text-[#d4af37]" />
        </button>
      </div>

      {/* Main Page Article with Animated 3D Book Page Flip */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={`page-${currentPage}`}
          id={`ebook-page-${currentPage}`}
          initial={{
            opacity: 0.15,
            rotateY: turnDirection === 'next' ? -8 : 8,
            transformOrigin: turnDirection === 'next' ? 'left center' : 'right center',
            x: turnDirection === 'next' ? 22 : -22,
            scale: 0.99,
          }}
          animate={{
            opacity: 1,
            rotateY: 0,
            x: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0.1,
            rotateY: turnDirection === 'next' ? 8 : -8,
            transformOrigin: turnDirection === 'next' ? 'right center' : 'left center',
            x: turnDirection === 'next' ? -22 : 22,
            scale: 0.99,
          }}
          transition={{
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={`w-full ${maxWidthStyle} px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-start relative shadow-xs`}
        >
          {/* Editorial Top Running Header for regular pages */}
          {!isCover && (
            <header className={`w-full pb-3.5 mb-6 border-b ${themeStyle.border} flex items-center justify-between text-xs tracking-wider uppercase font-sans-ui ${themeStyle.textSecondary}`}>
              <span className={`truncate pr-4 font-semibold ${themeStyle.accent}`}>
                {pageData.runningHeader || `Capítulo ${chapterInfo.number}: ${chapterInfo.title}`}
              </span>
              <span className="tabular-nums font-bold flex-shrink-0">
                Pág. {currentPage}
              </span>
            </header>
          )}

          {/* Cover Page Special Editorial Presentation */}
          {isCover ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
              <div className={`w-16 h-0.5 ${themeStyle.accentBg} mb-8 opacity-80`} />
              <h1
                className="font-display font-bold tracking-widest uppercase mb-4 leading-tight"
                style={{ fontSize: `${Math.max(28, Math.round(fontSize * 1.9))}px` }}
              >
                Un Curso de Milagros
              </h1>
              <p
                className={`font-serif-book tracking-wider ${themeStyle.accent} uppercase font-semibold mb-10`}
                style={{ fontSize: `${Math.max(16, Math.round(fontSize * 1.15))}px` }}
              >
                1. Texto
              </p>
              <div className="my-8 py-6 border-y border-[#8c6b2d]/30 max-w-md px-4">
                <p
                  className="font-serif-book italic font-medium"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeightStyle,
                  }}
                >
                  «Nada real puede ser amenazado. Nada irreal existe. En esto radica la paz de Dios.»
                </p>
              </div>
              <p
                className={`font-sans-ui ${themeStyle.textSecondary} font-medium tracking-wide mt-4`}
                style={{ fontSize: `${Math.max(13, Math.round(fontSize * 0.75))}px` }}
              >
                Fundación para la Paz Interior
              </p>
              <p
                className={`font-sans-ui ${themeStyle.textSecondary} opacity-80 mt-2`}
                style={{ fontSize: `${Math.max(11, Math.round(fontSize * 0.65))}px` }}
              >
                Traducido por Rosa M. G. De Wynn y Fernando Gómez
              </p>
              <div className={`w-16 h-0.5 ${themeStyle.accentBg} mt-12 opacity-80`} />
            </div>
          ) : (
            /* Regular Page Content formatted as real book typography */
            <div
              className={`${fontClass} space-y-5 text-left tracking-[0.012em] ${themeStyle.text}`}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeightStyle,
              }}
            >
              {pageData.lines.map((line, idx) => {
                const trimmed = line.trim();
                const isChapterTitle = /^Cap[íi]tulo\s+\d+/i.test(trimmed);
                const isChapterSub = idx === 1 && /^Cap[íi]tulo\s+\d+/i.test(pageData.lines[0]?.trim() || '');

                // Canonical Section Headers: Roman numeral and title (e.g., "I. El significado de los milagros", "V. El sueño feliz")
                const sectionHeaderMatch = trimmed.match(/^([IVXLCDM]+(?:-[A-Z])?)\.\s+(.+)$/i);
                const isIntroHeader = /^Introducci[óo]n$/i.test(trimmed);

                const isVerseOrQuote = trimmed.startsWith('«') || trimmed.includes('«Puesto que mi voluntad');
                const isSpeaking = activeSpeechParagraph === idx;
                const isSaved = savedQuotes.some((q) => q.page === currentPage && q.text === line);

                // Check for numbered paragraph (e.g. "1. Los milagros ocurren naturalmente...", "15. El perdón...")
                const numberedParagraphMatch = trimmed.match(/^(\d+)\.\s+(.*)$/s);

                // 1. Chapter Title
                if (isChapterTitle) {
                  return (
                    <div key={idx} className="text-center pt-5 pb-3">
                      <span className={`text-xs sm:text-sm font-sans-ui uppercase tracking-widest ${themeStyle.accent} font-bold block mb-1`}>
                        — Un Curso de Milagros —
                      </span>
                      <h2
                        className={`font-display font-bold tracking-wide uppercase ${themeStyle.text}`}
                        style={{ fontSize: `${Math.max(22, Math.round(fontSize * 1.5))}px`, lineHeight: 1.25 }}
                      >
                        {line}
                      </h2>
                    </div>
                  );
                }

                // 2. Chapter Subtitle
                if (isChapterSub) {
                  return (
                    <h3
                      key={idx}
                      className={`text-center font-display tracking-wider uppercase mb-7 ${themeStyle.accent}`}
                      style={{ fontSize: `${Math.max(17, Math.round(fontSize * 1.15))}px`, lineHeight: 1.35 }}
                    >
                      {line}
                    </h3>
                  );
                }

                // 3. Section Header (Partes I, II, III, IV, etc.)
                if (sectionHeaderMatch) {
                  const romanPart = sectionHeaderMatch[1];
                  const sectionTitle = sectionHeaderMatch[2];
                  return (
                    <div
                      key={idx}
                      className={`pt-6 pb-3 mb-5 border-b ${themeStyle.border}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-sm bg-black/10 dark:bg-white/10 ${themeStyle.accent} text-xs font-sans-ui font-bold uppercase tracking-wider`}>
                          Parte {romanPart}
                        </span>
                        <span className={`text-[11px] font-sans-ui ${themeStyle.textSecondary} uppercase tracking-widest font-semibold`}>
                          Sección
                        </span>
                      </div>
                      <h4
                        className={`font-serif-book font-bold tracking-normal leading-snug ${themeStyle.text}`}
                        style={{ fontSize: `${Math.max(19, Math.round(fontSize * 1.25))}px` }}
                      >
                        {sectionTitle}
                      </h4>
                    </div>
                  );
                }

                // 4. Standalone Introduction Header
                if (isIntroHeader) {
                  return (
                    <div
                      key={idx}
                      className={`pt-5 pb-2 mb-4 border-b ${themeStyle.border} text-center`}
                    >
                      <span className={`text-xs font-sans-ui uppercase tracking-widest ${themeStyle.accent} font-bold block mb-1`}>
                        Texto
                      </span>
                      <h4
                        className={`font-display font-bold uppercase tracking-wider ${themeStyle.text}`}
                        style={{ fontSize: `${Math.max(22, Math.round(fontSize * 1.4))}px` }}
                      >
                        {line}
                      </h4>
                    </div>
                  );
                }

                // 5. Standout Quote or Verse
                if (isVerseOrQuote) {
                  return (
                    <div
                      key={idx}
                      className={`relative my-6 px-4 sm:px-6 py-4 rounded-xl border-l-4 border-[#8c6b2d] dark:border-[#d4af37] ${themeStyle.surface} transition-all duration-200 group ${
                        isSpeaking ? 'ring-2 ring-[#8c6b2d] ring-offset-2' : ''
                      }`}
                    >
                      <p
                        className="italic font-medium"
                        style={{
                          fontSize: `${Math.round(fontSize * 1.05)}px`,
                          lineHeight: lineHeightStyle,
                        }}
                      >
                        {renderTextWithSuperscripts(line)}
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-3 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {onPlayFromParagraph && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayFromParagraph(idx);
                            }}
                            className="interactive-quote-action text-xs px-2.5 py-1 rounded-md bg-[#8c6b2d]/15 hover:bg-[#8c6b2d]/25 text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui flex items-center gap-1 cursor-pointer"
                            title="Escuchar esta oración"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Escuchar</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleCopyQuote(line, e)}
                          className="interactive-quote-action text-xs px-2.5 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 font-sans-ui flex items-center gap-1 cursor-pointer"
                          title="Copiar cita"
                        >
                          {copiedQuote === line ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveQuote(line);
                          }}
                          className={`interactive-quote-action text-xs px-2.5 py-1 rounded-md font-sans-ui flex items-center gap-1 cursor-pointer ${
                            isSaved
                              ? 'bg-[#8c6b2d] text-white'
                              : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
                          }`}
                          title="Guardar en Mis Citas"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Guardada' : 'Subrayar'}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNoteRequest(line, currentPage);
                          }}
                          className="interactive-quote-action text-xs px-2.5 py-1 rounded-md bg-[#8c6b2d]/15 hover:bg-[#8c6b2d]/25 text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui flex items-center gap-1 cursor-pointer"
                          title="Añadir nota personal"
                        >
                          <StickyNote className="w-3.5 h-3.5" />
                          <span>Nota</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // 6. Numbered Paragraph (e.g., "1. ...", "2. ...")
                if (numberedParagraphMatch) {
                  const parNumber = numberedParagraphMatch[1];
                  const parContent = numberedParagraphMatch[2];

                  return (
                    <p
                      key={idx}
                      className={`relative transition-all duration-200 rounded-lg p-1.5 -mx-1.5 group ${
                        isSpeaking ? `${themeStyle.highlightBg} ring-1 ring-[#8c6b2d]/40` : ''
                      }`}
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeightStyle,
                      }}
                    >
                      <span className={`inline-flex items-center justify-center font-sans-ui font-bold text-xs px-1.5 py-0.5 rounded-sm bg-black/10 dark:bg-white/10 ${themeStyle.accent} mr-2 select-none align-baseline`}>
                        {parNumber}.
                      </span>
                      {renderTextWithSuperscripts(parContent)}
                      <span className="inline-flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveQuote(line);
                          }}
                          className={`interactive-quote-action inline-flex items-center text-[10px] font-sans-ui ${themeStyle.accent} hover:underline cursor-pointer`}
                          title="Guardar párrafo favorito"
                        >
                          ★ Guardar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNoteRequest(line, currentPage);
                          }}
                          className={`interactive-quote-action inline-flex items-center text-[10px] font-sans-ui ${themeStyle.accent} hover:underline cursor-pointer`}
                          title="Añadir nota personal"
                        >
                          📝 Nota
                        </button>
                      </span>
                    </p>
                  );
                }

                // 7. Standard reflective paragraph
                return (
                  <p
                    key={idx}
                    className={`relative transition-all duration-200 rounded-lg p-1.5 -mx-1.5 group ${
                      isSpeaking ? `${themeStyle.highlightBg} ring-1 ring-[#8c6b2d]/40` : ''
                    }`}
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: lineHeightStyle,
                    }}
                  >
                    {renderTextWithSuperscripts(line)}
                    <span className="inline-flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveQuote(line);
                        }}
                        className={`interactive-quote-action inline-flex items-center text-[10px] font-sans-ui ${themeStyle.accent} hover:underline cursor-pointer`}
                        title="Guardar cita favorita"
                      >
                        ★ Guardar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNoteRequest(line, currentPage);
                        }}
                        className={`interactive-quote-action inline-flex items-center text-[10px] font-sans-ui ${themeStyle.accent} hover:underline cursor-pointer`}
                        title="Añadir nota personal"
                      >
                        📝 Nota
                      </button>
                    </span>
                  </p>
                );
              })}
            </div>
          )}

          {/* Subtle editorial page folio at bottom of the page */}
          {!isCover && (
            <footer className="mt-8 pt-4 pb-2 flex items-center justify-center text-xs font-sans-ui opacity-45 select-none">
              <span className="tabular-nums tracking-widest">— {currentPage} —</span>
            </footer>
          )}
        </motion.article>
      </AnimatePresence>

      {/* Floating Selection Toolbar */}
      {selectionInfo && (
        <div
          className="fixed z-50 flex items-center gap-1.5 p-1.5 rounded-xl shadow-xl bg-[#22272e] text-[#f0ece3] border border-[#3b4252] text-xs font-sans-ui animate-fade-in"
          style={{
            top: `${Math.max(10, selectionInfo.rect.top - 50)}px`,
            left: `${Math.min(window.innerWidth - 240, Math.max(10, selectionInfo.rect.left + selectionInfo.rect.width / 2 - 120))}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onAddNoteRequest(selectionInfo.text, currentPage);
              window.getSelection()?.removeAllRanges();
              setSelectionInfo(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#8c6b2d] hover:bg-[#775a24] text-white font-semibold cursor-pointer transition-colors"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Nota</span>
          </button>
          <button
            onClick={() => {
              onSaveQuote(selectionInfo.text);
              window.getSelection()?.removeAllRanges();
              setSelectionInfo(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Subrayar</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectionInfo.text);
              window.getSelection()?.removeAllRanges();
              setSelectionInfo(null);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar</span>
          </button>
        </div>
      )}
    </div>
  );
};
