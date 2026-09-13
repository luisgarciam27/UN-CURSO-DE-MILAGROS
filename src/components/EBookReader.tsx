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
  StickyNote,
  Highlighter,
  X,
  Palette,
  Trash2,
} from 'lucide-react';
import { BookTheme, BookFontFamily, BookLineHeight, BookReadingWidth, BookPageData, SavedQuote, PersonalNote } from '../types';
import { THEME_CONFIG, TOTAL_PAGES, getChapterForPage } from '../constants';

export type HighlightColor = 'gold' | 'emerald' | 'sky' | 'rose';
export type HighlighterTapMode = 'word' | 'sentence' | 'paragraph';

export interface SelectionState {
  text: string;
  rect: DOMRect | null;
  scope?: 'word' | 'sentence' | 'paragraph' | 'custom';
  fullParagraph?: string;
  paragraphIndex?: number;
  quoteId?: string;
  isExistingHighlight?: boolean;
}

export const HIGHLIGHT_PALETTE: { id: HighlightColor; name: string; bg: string; border: string; dot: string; text: string }[] = [
  { id: 'gold', name: 'Oro Sagrado', bg: 'bg-amber-100/90 dark:bg-amber-900/40', border: 'border-amber-500 dark:border-amber-400', dot: 'bg-amber-400', text: 'text-amber-950 dark:text-amber-100' },
  { id: 'emerald', name: 'Menta Paz', bg: 'bg-emerald-100/90 dark:bg-emerald-900/40', border: 'border-emerald-500 dark:border-emerald-400', dot: 'bg-emerald-400', text: 'text-emerald-950 dark:text-emerald-100' },
  { id: 'sky', name: 'Celeste Cielo', bg: 'bg-sky-100/90 dark:bg-sky-900/40', border: 'border-sky-500 dark:border-sky-400', dot: 'bg-sky-400', text: 'text-sky-950 dark:text-sky-100' },
  { id: 'rose', name: 'Rosa Amor', bg: 'bg-rose-100/90 dark:bg-rose-900/40', border: 'border-rose-500 dark:border-rose-400', dot: 'bg-pink-400', text: 'text-rose-950 dark:text-rose-100' },
];

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
  personalNotes?: PersonalNote[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleControls: () => void;
  onToggleBookmark: () => void;
  onSaveQuote: (text: string, color?: string) => void;
  onDeleteQuote?: (id: string) => void;
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
  personalNotes = [],
  onPrevPage,
  onNextPage,
  onToggleControls,
  onToggleBookmark,
  onSaveQuote,
  onDeleteQuote,
  onAddNoteRequest,
  onPlayFromParagraph,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef(false);
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null);
  const rawSelectedTextRef = useRef<string>('');

  // Floating Highlighter Mode and Tapped Paragraph state for mobile/desktop
  const [isHighlighterMode, setIsHighlighterMode] = useState<boolean>(false);
  const [highlighterTapMode, setHighlighterTapMode] = useState<HighlighterTapMode>('word');
  const [activeHighlightColor, setActiveHighlightColor] = useState<HighlightColor>('gold');

  const handleSpeakSelected = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDismissFloating = () => {
    setSelectionState(null);
    rawSelectedTextRef.current = '';
    try {
      window.getSelection()?.removeAllRanges();
    } catch {}
  };

  // Helper to extract word boundaries around coordinate (iOS / Chrome / Desktop)
  const getWordAtCoordinates = (x: number, y: number): string | null => {
    try {
      let range: Range | null = null;
      if (typeof document.caretRangeFromPoint === 'function') {
        range = document.caretRangeFromPoint(x, y);
      } else if (typeof (document as any).caretPositionFromPoint === 'function') {
        const pos = (document as any).caretPositionFromPoint(x, y);
        if (pos && pos.offsetNode) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const fullText = range.startContainer.textContent || '';
        const offset = range.startOffset;
        if (offset >= 0 && offset <= fullText.length) {
          let start = offset;
          while (start > 0 && /[\wáéíóúÁÉÍÓÚñÑüÜ]/.test(fullText[start - 1])) {
            start--;
          }
          let end = offset;
          while (end < fullText.length && /[\wáéíóúÁÉÍÓÚñÑüÜ]/.test(fullText[end])) {
            end++;
          }
          const word = fullText.slice(start, end).replace(/^[.,;:!?«»"'()\s]+|[.,;:!?«»"'()\s]+$/g, '');
          if (word.length > 0) return word;
        }
      }
    } catch {}
    return null;
  };

  const getSentenceFromText = (paragraph: string, target: string): string => {
    if (!paragraph) return target;
    const sentences = paragraph.split(/(?<=[.?!])\s+/);
    const found = sentences.find((s) => s.includes(target));
    return (found || target).trim();
  };

  const getSentenceAtCoordinates = (x: number, y: number, fallbackParagraph: string): string => {
    const word = getWordAtCoordinates(x, y);
    if (word && fallbackParagraph.includes(word)) {
      return getSentenceFromText(fallbackParagraph, word);
    }
    return fallbackParagraph;
  };

  const getSingleWordFromText = (text: string): string => {
    const words = text.trim().split(/\s+/);
    return words[0]?.replace(/^[«"'(]+|[»"')]+$/g, '') || text;
  };

  // Real-time tactile page drag state (Kindle / Apple Books physical feel)
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const gestureLockRef = useRef<'undecided' | 'scroll' | 'swipe'>('undecided');
  const hapticFiredRef = useRef<boolean>(false);

  useEffect(() => {
    const syncSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        return;
      }
      const text = sel.toString().trim();
      if (text.length === 0) return;
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
          const anchorNode = sel.anchorNode;
          const paragraphEl = (anchorNode?.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : (anchorNode as HTMLElement))?.closest('[data-paragraph-text]');
          const fullParagraph = paragraphEl?.getAttribute('data-paragraph-text') || '';
          rawSelectedTextRef.current = text;
          const wordsCount = text.split(/\s+/).filter(Boolean).length;
          setSelectionState({
            text,
            rect,
            scope: wordsCount === 1 ? 'word' : 'custom',
            fullParagraph,
            isExistingHighlight: savedQuotes.some((q) => q.page === currentPage && q.text === text),
          });
        }
      } catch {}
    };

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setSelectionState((prev) => (prev?.isExistingHighlight ? prev : null));
        return;
      }
      syncSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', syncSelection);
    document.addEventListener('touchend', syncSelection);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', syncSelection);
      document.removeEventListener('touchend', syncSelection);
    };
  }, [savedQuotes, currentPage]);

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

  // Touch handlers for fluid swipe (Kindle / Apple Books physical feel)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    hasMovedRef.current = false;
    gestureLockRef.current = 'undecided';
    hapticFiredRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (gestureLockRef.current === 'undecided') {
      if (absX > 6 || absY > 6) {
        hasMovedRef.current = true;
        if (absY > absX * 1.1) {
          // Dominant vertical reading scroll -> let native scroll handle it
          gestureLockRef.current = 'scroll';
          return;
        } else {
          // Dominant horizontal motion -> lock into page turn gesture
          gestureLockRef.current = 'swipe';
          setIsDragging(true);
        }
      }
    }

    if (gestureLockRef.current === 'swipe') {
      // Prevent browser page-bounce while turning page
      if (e.cancelable) {
        e.preventDefault();
      }

      // Physics: Apply rubber-band damping on first and last pages
      let damped = deltaX;
      if (currentPage <= 1 && deltaX > 0) {
        damped = Math.sign(deltaX) * Math.pow(Math.abs(deltaX), 0.72) * 0.45;
      } else if (currentPage >= TOTAL_PAGES && deltaX < 0) {
        damped = Math.sign(deltaX) * Math.pow(Math.abs(deltaX), 0.72) * 0.45;
      }

      setDragOffset(damped);

      // Subtle haptic buzz when page threshold is passed
      const isPastThreshold = Math.abs(damped) > 58;
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
    const deltaY = touch.clientY - touchStartRef.current.y;
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
          setTurnDirection('next');
          onNextPage();
        } else if (currentOffset > 0 && currentPage > 1) {
          setTurnDirection('prev');
          onPrevPage();
        }
      }
      touchStartRef.current = null;
      return;
    }

    // Single Tap without drag (3-zone tap)
    if (!hasMovedRef.current && Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
        touchStartRef.current = null;
        return;
      }
      if (isHighlighterMode || selectionState) {
        touchStartRef.current = null;
        return;
      }
      handleZoneClick(touch.clientX);
    }
    touchStartRef.current = null;
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
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

  const handleZoneClick = (clientX: number) => {
    const width = window.innerWidth;
    const leftBound = width * 0.25;
    const rightBound = width * 0.75;

    if (clientX < leftBound) {
      setTurnDirection('prev');
      onPrevPage();
    } else if (clientX > rightBound) {
      setTurnDirection('next');
      onNextPage();
    } else {
      onToggleControls();
    }
  };

  const handleMouseClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - (touchStartRef.current?.time || 0) < 350) return;
    if ((e.target as HTMLElement).closest('button, .interactive-quote-action, .interactive-page-curl, mark, [data-paragraph-text]')) return;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;
    if (selectionState || isHighlighterMode) return;

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

  const handleHighlightClick = (quote: SavedQuote, rect: DOMRect, fullParagraph?: string) => {
    rawSelectedTextRef.current = quote.text;
    setSelectionState({
      text: quote.text,
      rect,
      quoteId: quote.id,
      fullParagraph,
      isExistingHighlight: true,
    });
  };

  const handleParagraphClick = (
    e: React.MouseEvent<HTMLElement>,
    line: string,
    idx: number
  ) => {
    if ((e.target as HTMLElement).closest('button, mark, .interactive-quote-action')) return;

    if (isHighlighterMode) {
      if (highlighterTapMode === 'word') {
        const word = getWordAtCoordinates(e.clientX, e.clientY);
        if (word && word.length > 0) {
          onSaveQuote(word, activeHighlightColor);
          try { navigator.vibrate?.(25); } catch {}
          return;
        }
      } else if (highlighterTapMode === 'sentence') {
        const sentence = getSentenceAtCoordinates(e.clientX, e.clientY, line);
        if (sentence && sentence.length > 0) {
          onSaveQuote(sentence, activeHighlightColor);
          try { navigator.vibrate?.(25); } catch {}
          return;
        }
      }
      // 'paragraph' mode
      onSaveQuote(line, activeHighlightColor);
      try { navigator.vibrate?.(25); } catch {}
      return;
    }

    // Normal reading mode: check if text selection exists
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      return;
    }

    // Toggle paragraph selection
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    rawSelectedTextRef.current = line;
    setSelectionState((prev) =>
      prev?.fullParagraph === line && prev?.paragraphIndex === idx
        ? null
        : {
            text: line,
            rect: targetRect,
            scope: 'paragraph',
            fullParagraph: line,
            paragraphIndex: idx,
            isExistingHighlight: savedQuotes.some((q) => q.page === currentPage && q.text === line),
          }
    );
  };

  // Render text with both custom highlights (words/fragments/sentences) and numerical superscripts
  const renderHighlightedText = (
    text: string,
    quotesOnPage: SavedQuote[],
    onHighlightClick: (quote: SavedQuote, rect: DOMRect, fullParagraph?: string) => void
  ) => {
    if (!quotesOnPage || quotesOnPage.length === 0) {
      return renderTextWithSuperscripts(text);
    }

    // Filter quotes that appear in this specific paragraph
    const matchingQuotes = quotesOnPage.filter(
      (q) => q.text && q.text.trim().length > 0 && text.includes(q.text.trim())
    );

    if (matchingQuotes.length === 0) {
      return renderTextWithSuperscripts(text);
    }

    interface MatchInterval {
      start: number;
      end: number;
      quote: SavedQuote;
    }
    const intervals: MatchInterval[] = [];

    for (const q of matchingQuotes) {
      const qText = q.text.trim();
      let searchStart = 0;
      while (searchStart < text.length) {
        const idx = text.indexOf(qText, searchStart);
        if (idx === -1) break;
        const end = idx + qText.length;
        intervals.push({ start: idx, end, quote: q });
        searchStart = end;
      }
    }

    // Sort intervals by start ascending, then length descending
    intervals.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

    // Remove overlapping matches (keep the first / longest)
    const nonOverlapping: MatchInterval[] = [];
    let lastEnd = 0;
    for (const match of intervals) {
      if (match.start >= lastEnd) {
        nonOverlapping.push(match);
        lastEnd = match.end;
      }
    }

    if (nonOverlapping.length === 0) {
      return renderTextWithSuperscripts(text);
    }

    const elements: React.ReactNode[] = [];
    let currentPos = 0;

    nonOverlapping.forEach((match, i) => {
      if (match.start > currentPos) {
        const unhighlighted = text.slice(currentPos, match.start);
        elements.push(
          <React.Fragment key={`unhl-${currentPos}-${i}`}>
            {renderTextWithSuperscripts(unhighlighted)}
          </React.Fragment>
        );
      }

      const highlightedText = text.slice(match.start, match.end);
      const color = (match.quote.color as HighlightColor) || 'gold';
      const palette = HIGHLIGHT_PALETTE.find((p) => p.id === color) || HIGHLIGHT_PALETTE[0];

      elements.push(
        <mark
          key={`hl-${match.quote.id}-${match.start}`}
          data-highlight-id={match.quote.id}
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            onHighlightClick(match.quote, rect, text);
          }}
          className={`interactive-quote-action relative inline rounded-xs px-0.5 py-0.5 mx-0.5 cursor-pointer font-inherit transition-all duration-150 border-b-2 ${palette.bg} ${palette.text} ${palette.border} hover:opacity-85 shadow-2xs group/mark`}
          title={`Subrayado: «${match.quote.text}». Toca para cambiar color, nota o borrar.`}
        >
          {renderTextWithSuperscripts(highlightedText)}
        </mark>
      );

      currentPos = match.end;
    });

    if (currentPos < text.length) {
      elements.push(
        <React.Fragment key={`unhl-${currentPos}-end`}>
          {renderTextWithSuperscripts(text.slice(currentPos))}
        </React.Fragment>
      );
    }

    return elements;
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
            rotateY: isDragging ? Math.max(-10, Math.min(10, dragOffset * -0.032)) : 0,
            transformOrigin: isDragging
              ? (dragOffset < 0 ? 'right center' : 'left center')
              : (turnDirection === 'next' ? 'left center' : 'right center'),
            x: isDragging ? dragOffset : 0,
            scale: isDragging ? 0.995 : 1,
          }}
          exit={{
            opacity: 0.1,
            rotateY: turnDirection === 'next' ? 8 : -8,
            transformOrigin: turnDirection === 'next' ? 'right center' : 'left center',
            x: turnDirection === 'next' ? -22 : 22,
            scale: 0.99,
          }}
          transition={
            isDragging
              ? { duration: 0 }
              : {
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
          className={`w-full ${maxWidthStyle} px-4 sm:px-8 py-4 sm:py-6 flex flex-col justify-start relative shadow-xs transition-shadow duration-200 ${
            isDragging && Math.abs(dragOffset) > 15
              ? dragOffset < 0
                ? 'shadow-[12px_0_24px_-6px_rgba(0,0,0,0.22)]'
                : 'shadow-[-12px_0_24px_-6px_rgba(0,0,0,0.22)]'
              : ''
          }`}
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
                const savedQuote = savedQuotes.find((q) => q.page === currentPage && q.text === line);
                const isSaved = !!savedQuote;
                const quoteColor = (savedQuote?.color as HighlightColor) || 'gold';
                const quotePalette = HIGHLIGHT_PALETTE.find((p) => p.id === quoteColor) || HIGHLIGHT_PALETTE[0];

                const paragraphNotes = personalNotes.filter(
                  (n) => n.page === currentPage && (n.selectedText.includes(line.slice(0, 35)) || line.includes(n.selectedText.slice(0, 35)))
                );
                const isTapped = selectionState?.paragraphIndex === idx;

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
                      data-paragraph-text={line}
                      onClick={(e) => handleParagraphClick(e, line, idx)}
                      className={`relative my-6 px-4 sm:px-6 py-4 rounded-xl border-l-4 transition-all duration-200 group cursor-pointer ${
                        isSaved
                          ? `${quotePalette.bg} ${quotePalette.border} shadow-sm`
                          : `border-[#8c6b2d] dark:border-[#d4af37] ${themeStyle.surface}`
                      } ${
                        isSpeaking ? 'ring-2 ring-[#8c6b2d] ring-offset-2' : ''
                      } ${
                        isTapped ? 'ring-2 ring-amber-500 ring-offset-2' : ''
                      }`}
                    >
                      <p
                        className="italic font-medium"
                        style={{
                          fontSize: `${Math.round(fontSize * 1.05)}px`,
                          lineHeight: lineHeightStyle,
                        }}
                      >
                        {renderHighlightedText(line, savedQuotes.filter((q) => q.page === currentPage), handleHighlightClick)}
                      </p>

                      {/* Visual Highlight & Note Badges */}
                      {(isSaved || paragraphNotes.length > 0) && (
                        <div className="flex items-center gap-2 mt-2 select-none">
                          {isSaved && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveQuote(line);
                              }}
                              className={`interactive-quote-action inline-flex items-center gap-1 text-[11px] font-sans-ui font-semibold px-2 py-0.5 rounded-full ${quotePalette.bg} ${quotePalette.text} border ${quotePalette.border} hover:opacity-80 cursor-pointer`}
                              title="Subrayado activo. Pulsa para retirar."
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Subrayado</span>
                            </span>
                          )}
                          {paragraphNotes.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddNoteRequest(line, currentPage);
                              }}
                              className="interactive-quote-action inline-flex items-center gap-1 text-[11px] font-sans-ui font-semibold px-2.5 py-0.5 rounded-full bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] border border-[#8c6b2d]/40 hover:bg-[#8c6b2d]/30 cursor-pointer"
                              title="Ver o añadir notas sobre este pasaje"
                            >
                              <StickyNote className="w-3 h-3" />
                              <span>{paragraphNotes.length} {paragraphNotes.length === 1 ? 'Nota' : 'Notas'}</span>
                            </button>
                          )}
                        </div>
                      )}

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
                            onSaveQuote(line, activeHighlightColor);
                          }}
                          className={`interactive-quote-action text-xs px-2.5 py-1 rounded-md font-sans-ui flex items-center gap-1 cursor-pointer ${
                            isSaved
                              ? 'bg-[#8c6b2d] text-white'
                              : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15'
                          }`}
                          title="Guardar o subrayar en Mis Citas"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Subrayado' : 'Subrayar'}</span>
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
                    <div
                      key={idx}
                      data-paragraph-text={line}
                      onClick={(e) => handleParagraphClick(e, line, idx)}
                      className={`relative transition-all duration-200 rounded-lg p-2 -mx-2 group cursor-pointer ${
                        isSpeaking ? `${themeStyle.highlightBg} ring-1 ring-[#8c6b2d]/40` : ''
                      } ${
                        isSaved ? `${quotePalette.bg} border-l-4 ${quotePalette.border} pl-3 shadow-xs` : ''
                      } ${
                        isTapped ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''
                      }`}
                      style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeightStyle,
                      }}
                    >
                      <p>
                        <span className={`inline-flex items-center justify-center font-sans-ui font-bold text-xs px-1.5 py-0.5 rounded-sm bg-black/10 dark:bg-white/10 ${themeStyle.accent} mr-2 select-none align-baseline`}>
                          {parNumber}.
                        </span>
                        {renderHighlightedText(parContent, savedQuotes.filter((q) => q.page === currentPage), handleHighlightClick)}

                        {/* Badges for Subrayado & Notas */}
                        {(isSaved || paragraphNotes.length > 0) && (
                          <span className="inline-flex items-center gap-1.5 ml-2 align-baseline select-none">
                            {isSaved && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSaveQuote(line);
                                }}
                                className={`interactive-quote-action inline-flex items-center gap-1 text-[10px] font-sans-ui font-semibold px-2 py-0.5 rounded-full ${quotePalette.bg} ${quotePalette.text} border ${quotePalette.border} hover:opacity-80 cursor-pointer`}
                                title="Párrafo subrayado. Pulsa para retirar."
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Subrayado</span>
                              </span>
                            )}
                            {paragraphNotes.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddNoteRequest(line, currentPage);
                                }}
                                className="interactive-quote-action inline-flex items-center gap-1 text-[10px] font-sans-ui font-semibold px-2 py-0.5 rounded-full bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] border border-[#8c6b2d]/40 hover:bg-[#8c6b2d]/30 cursor-pointer"
                                title="Ver o editar nota personal"
                              >
                                <StickyNote className="w-2.5 h-2.5" />
                                <span>{paragraphNotes.length} {paragraphNotes.length === 1 ? 'Nota' : 'Notas'}</span>
                              </button>
                            )}
                          </span>
                        )}

                        <span className="inline-flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSaveQuote(line, activeHighlightColor);
                            }}
                            className={`interactive-quote-action inline-flex items-center text-[10px] font-sans-ui ${themeStyle.accent} hover:underline cursor-pointer`}
                            title="Subrayar párrafo"
                          >
                            ★ {isSaved ? 'Quitar' : 'Subrayar'}
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
                    </div>
                  );
                }

                // 7. Standard reflective paragraph
                return (
                  <div
                    key={idx}
                    data-paragraph-text={line}
                    onClick={(e) => handleParagraphClick(e, line, idx)}
                    className={`relative transition-all duration-200 rounded-lg p-2 -mx-2 group cursor-pointer ${
                      isSpeaking ? `${themeStyle.highlightBg} ring-1 ring-[#8c6b2d]/40` : ''
                    } ${
                      isSaved ? `${quotePalette.bg} border-l-4 ${quotePalette.border} pl-3 shadow-xs` : ''
                    } ${
                      isTapped ? 'ring-2 ring-amber-500 bg-amber-500/10' : ''
                    }`}
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: lineHeightStyle,
                    }}
                  >
                    <p>
                      {renderHighlightedText(line, savedQuotes.filter((q) => q.page === currentPage), handleHighlightClick)}

                      {/* Badges for Subrayado & Notas */}
                      {(isSaved || paragraphNotes.length > 0) && (
                        <span className="inline-flex items-center gap-1.5 ml-2 align-baseline select-none">
                          {isSaved && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveQuote(line);
                              }}
                              className={`interactive-quote-action inline-flex items-center gap-1 text-[10px] font-sans-ui font-semibold px-2 py-0.5 rounded-full ${quotePalette.bg} ${quotePalette.text} border ${quotePalette.border} hover:opacity-80 cursor-pointer`}
                              title="Párrafo subrayado. Pulsa para retirar."
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Subrayado</span>
                            </span>
                          )}
                          {paragraphNotes.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddNoteRequest(line, currentPage);
                              }}
                              className="interactive-quote-action inline-flex items-center gap-1 text-[10px] font-sans-ui font-semibold px-2 py-0.5 rounded-full bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] border border-[#8c6b2d]/40 hover:bg-[#8c6b2d]/30 cursor-pointer"
                              title="Ver o editar nota personal"
                            >
                              <StickyNote className="w-2.5 h-2.5" />
                              <span>{paragraphNotes.length} {paragraphNotes.length === 1 ? 'Nota' : 'Notas'}</span>
                            </button>
                          )}
                        </span>
                      )}

                      <span className="inline-flex ml-2 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveQuote(line, activeHighlightColor);
                          }}
                          className={`interactive-quote-action inline-flex items-center text-[10px] font-sans-ui ${themeStyle.accent} hover:underline cursor-pointer`}
                          title="Subrayar cita"
                        >
                          ★ {isSaved ? 'Quitar' : 'Subrayar'}
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
                  </div>
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

      {/* Floating Swipe Cue Badge (Kindle/Apple Books style tactile feedback) */}
      {isDragging && Math.abs(dragOffset) > 28 && (
        <div
          className={`fixed top-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-sans-ui font-semibold shadow-2xl backdrop-blur-md transition-all ${
            dragOffset < 0 ? 'right-4 sm:right-8' : 'left-4 sm:left-8'
          } ${
            Math.abs(dragOffset) > 58
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

      {/* Floating Highlighter Quick Tool Toggle Button */}
      <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40 flex flex-col items-end gap-2">
        <button
          id="floating-highlighter-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsHighlighterMode((v) => !v);
            setSelectionState(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl transition-all cursor-pointer select-none text-xs font-sans-ui font-semibold ${
            isHighlighterMode
              ? 'bg-[#8c6b2d] text-white ring-4 ring-[#8c6b2d]/30 scale-105'
              : 'bg-[#1e222b] dark:bg-[#161a22] text-amber-300 hover:text-white border border-[#3e4756] hover:bg-[#282f3c] hover:scale-105'
          }`}
          title={isHighlighterMode ? 'Desactivar modo subrayador' : 'Activar modo flotante de subrayado y notas (especial para móvil)'}
        >
          <Highlighter className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isHighlighterMode ? 'Modo Subrayador Activo' : 'Subrayar y Notas'}
          </span>
          <span className="sm:hidden">
            {isHighlighterMode ? 'Activo' : 'Subrayar'}
          </span>
        </button>
      </div>

      {/* Floating Mode Banner when Highlighter Mode is turned ON */}
      {isHighlighterMode && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[94vw] sm:w-auto max-w-xl p-2.5 sm:px-4 rounded-2xl bg-[#1c1917]/95 dark:bg-[#13161c]/95 text-white backdrop-blur-xl border border-[#d4af37]/60 shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs font-sans-ui animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Highlighter className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] sm:text-xs text-neutral-200">
              Modo rápido:{' '}
              <strong className="text-amber-300">
                {highlighterTapMode === 'word' ? 'Palabra suelta' : highlighterTapMode === 'sentence' ? 'Frase completa' : 'Párrafo entero'}
              </strong>
            </span>
          </div>

          {/* Granularity switch buttons: Palabra / Frase / Párrafo */}
          <div className="flex items-center gap-1 bg-black/40 dark:bg-white/10 p-0.5 rounded-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHighlighterTapMode('word');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                highlighterTapMode === 'word'
                  ? 'bg-[#8c6b2d] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Palabra
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHighlighterTapMode('sentence');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                highlighterTapMode === 'sentence'
                  ? 'bg-[#8c6b2d] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Frase
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setHighlighterTapMode('paragraph');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                highlighterTapMode === 'paragraph'
                  ? 'bg-[#8c6b2d] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Párrafo
            </button>
          </div>

          {/* Color palette picker + close */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {HIGHLIGHT_PALETTE.map((pal) => (
              <button
                key={pal.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHighlightColor(pal.id);
                }}
                className={`w-5 h-5 rounded-full ${pal.dot} cursor-pointer transition-transform ${
                  activeHighlightColor === pal.id ? 'scale-125 ring-2 ring-white shadow-xs' : 'opacity-60 hover:opacity-100'
                }`}
                title={`Color: ${pal.name}`}
              />
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsHighlighterMode(false);
              }}
              className="ml-1 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Cerrar modo subrayador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Floating Action Bar for Selected Text OR Tapped Paragraph / Highlight (Optimized for Mobile & Desktop) */}
      {selectionState && (
        (() => {
          const activeText = selectionState.text;
          const currentScope = selectionState.scope || (activeText.split(/\s+/).filter(Boolean).length === 1 ? 'word' : 'paragraph');
          const quoteAlreadySaved = savedQuotes.find((q) => q.page === currentPage && q.text.trim() === activeText.trim());
          const wordsCount = activeText.split(/\s+/).filter(Boolean).length;

          // Scope change helper (word <-> sentence <-> paragraph <-> custom fragment)
          const handleSwitchScope = (newScope: 'word' | 'sentence' | 'paragraph' | 'custom') => {
            const fullText = selectionState.fullParagraph || activeText;
            let targetText = activeText;

            if (newScope === 'word') {
              targetText = getSingleWordFromText(activeText) || activeText;
            } else if (newScope === 'sentence') {
              targetText = getSentenceFromText(fullText, activeText) || activeText;
            } else if (newScope === 'paragraph') {
              targetText = fullText;
            } else if (newScope === 'custom' && rawSelectedTextRef.current) {
              targetText = rawSelectedTextRef.current;
            }

            setSelectionState((prev) =>
              prev
                ? {
                    ...prev,
                    text: targetText,
                    scope: newScope,
                    isExistingHighlight: savedQuotes.some((q) => q.page === currentPage && q.text.trim() === targetText.trim()),
                  }
                : null
            );
          };

          return (
            <div
              className={`fixed z-50 rounded-2xl shadow-2xl bg-[#1c1917]/95 dark:bg-[#13161c]/95 text-[#f5f2eb] border border-[#d4af37]/45 backdrop-blur-xl animate-fade-in p-2.5 sm:p-3 w-[95vw] sm:w-auto sm:max-w-xl ${
                selectionState.rect
                  ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:translate-x-0'
                  : 'bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-1/2 -translate-x-1/2'
              }`}
              style={
                selectionState.rect && typeof window !== 'undefined' && window.innerWidth >= 640
                  ? {
                      top: `${
                        selectionState.rect.top < 115
                          ? Math.min(window.innerHeight - 150, selectionState.rect.bottom + 12)
                          : Math.max(65, selectionState.rect.top - 82)
                      }px`,
                      left: `${Math.max(16, Math.min(window.innerWidth - 460, selectionState.rect.left + selectionState.rect.width / 2 - 230))}px`,
                    }
                  : undefined
              }
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with scope switcher & preview text snippet */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                {/* Granularity Selector Pills: Palabra | Frase | Párrafo */}
                <div className="flex items-center gap-1 bg-black/40 dark:bg-white/10 p-0.5 rounded-xl select-none">
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => handleSwitchScope('word')}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans-ui font-semibold transition-all cursor-pointer ${
                      currentScope === 'word'
                        ? 'bg-[#8c6b2d] text-white shadow-xs scale-102'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Subrayar solo una palabra"
                  >
                    Palabra
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => handleSwitchScope('sentence')}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans-ui font-semibold transition-all cursor-pointer ${
                      currentScope === 'sentence'
                        ? 'bg-[#8c6b2d] text-white shadow-xs scale-102'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Subrayar la frase completa"
                  >
                    Frase
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => handleSwitchScope('paragraph')}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans-ui font-semibold transition-all cursor-pointer ${
                      currentScope === 'paragraph'
                        ? 'bg-[#8c6b2d] text-white shadow-xs scale-102'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Subrayar todo el párrafo"
                  >
                    Párrafo
                  </button>
                  {rawSelectedTextRef.current && rawSelectedTextRef.current !== activeText && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => handleSwitchScope('custom')}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans-ui font-semibold transition-all cursor-pointer ${
                        currentScope === 'custom'
                          ? 'bg-[#8c6b2d] text-white shadow-xs scale-102'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                      title="Volver a la selección personalizada"
                    >
                      Fragmento
                    </button>
                  )}
                </div>

                {/* Scope badge & preview */}
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <span className="text-[10px] uppercase font-sans-ui tracking-wider font-bold text-amber-400 shrink-0">
                    {wordsCount === 1 ? '1 palabra' : `${wordsCount} palabras`}
                  </span>
                  <span className="text-neutral-600 hidden sm:inline">•</span>
                  <p className="font-serif-book italic text-xs text-neutral-300 truncate hidden sm:block">
                    «{activeText.slice(0, 32)}...»
                  </p>
                </div>

                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={handleDismissFloating}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer ml-1"
                  title="Cerrar barra flotante"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                {/* 4 Highlight Color Pickers - 1-tap highlighting! */}
                <div className="flex items-center gap-1.5 bg-black/30 dark:bg-white/5 p-1 rounded-xl">
                  {HIGHLIGHT_PALETTE.map((pal) => (
                    <button
                      key={`pal-float-${pal.id}`}
                      type="button"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setActiveHighlightColor(pal.id);
                        onSaveQuote(activeText, pal.id);
                        try { navigator.vibrate?.(25); } catch {}
                        handleDismissFloating();
                      }}
                      className={`w-6 h-6 rounded-full ${pal.dot} cursor-pointer transition-all ${
                        activeHighlightColor === pal.id ? 'scale-115 ring-2 ring-white shadow-xs' : 'opacity-70 hover:opacity-100 hover:scale-110'
                      }`}
                      title={`Subrayar en ${pal.name}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                  {/* Subrayar / Quitar Button */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onSaveQuote(activeText, activeHighlightColor);
                      try { navigator.vibrate?.(25); } catch {}
                      handleDismissFloating();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold cursor-pointer text-xs transition-all ${
                      quoteAlreadySaved
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:bg-amber-500/35'
                        : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md'
                    }`}
                    title={quoteAlreadySaved ? 'Quitar subrayado' : 'Subrayar y guardar cita'}
                  >
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{quoteAlreadySaved ? 'Subrayado ✓' : 'Subrayar'}</span>
                  </button>

                  {/* Añadir Nota Button */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onAddNoteRequest(activeText, currentPage);
                      handleDismissFloating();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#8c6b2d] hover:bg-[#775a24] text-white font-semibold cursor-pointer text-xs shadow-md transition-all"
                    title="Añadir nota personal a este texto"
                  >
                    <StickyNote className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Nota</span>
                  </button>

                  {/* Copiar Button */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      navigator.clipboard.writeText(activeText);
                      setCopiedQuote(activeText);
                      setTimeout(() => setCopiedQuote(null), 1500);
                    }}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer text-xs transition-colors"
                    title="Copiar al portapapeles"
                  >
                    {copiedQuote === activeText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline">{copiedQuote === activeText ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  {/* Escuchar Button */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => {
                      handleSpeakSelected(activeText);
                    }}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer text-xs transition-colors"
                    title="Escuchar locución del pasaje"
                  >
                    <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Oír</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
