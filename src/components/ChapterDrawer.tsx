import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  BookOpen,
  Bookmark,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Trash2,
  Pin,
  PinOff,
  Search,
  Sparkles,
  Copy,
  Check,
  Compass,
  FileText,
  Hash,
  Home,
  StickyNote
} from 'lucide-react';
import { CHAPTERS, TOTAL_PAGES, getChapterForPage } from '../constants';
import { Bookmark as BookmarkType, SavedQuote, PersonalNote, BookPageData } from '../types';
import { UCDM_SECTIONS } from '../data/ucdmSections';
import bookContentData from '../data/bookContent.json';

interface ChapterDrawerProps {
  isOpen: boolean;
  isDocked: boolean;
  currentPage: number;
  bookmarks: BookmarkType[];
  savedQuotes: SavedQuote[];
  personalNotes: PersonalNote[];
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onDeleteBookmark: (page: number) => void;
  onClearAllBookmarks: () => void;
  onDeleteQuote: (id: string) => void;
  onClearAllQuotes: () => void;
  onDeletePersonalNote: (id: string) => void;
  onClearAllPersonalNotes: () => void;
  onToggleDocked: () => void;
  onOpenSearch: () => void;
  onGoHome?: () => void;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  isOpen,
  isDocked,
  currentPage,
  bookmarks,
  savedQuotes,
  personalNotes,
  onClose,
  onSelectPage,
  onDeleteBookmark,
  onClearAllBookmarks,
  onDeleteQuote,
  onClearAllQuotes,
  onDeletePersonalNote,
  onClearAllPersonalNotes,
  onToggleDocked,
  onOpenSearch,
  onGoHome,
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'bookmarks' | 'quotes' | 'notes'>('chapters');
  const [searchInput, setSearchInput] = useState('');
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  const pages = bookContentData as BookPageData[];
  const currentChapter = getChapterForPage(currentPage);

  // Accordion state: map of chapter numbers to expanded boolean
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    if (currentChapter?.number) {
      initial[currentChapter.number] = true;
    }
    return initial;
  });

  // Keep current chapter expanded when page changes
  useEffect(() => {
    if (currentChapter?.number) {
      setExpandedChapters((prev) => ({ ...prev, [currentChapter.number]: true }));
    }
  }, [currentChapter?.number]);

  const toggleChapter = (chapterNum: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterNum]: !prev[chapterNum],
    }));
  };

  const expandAllChapters = () => {
    const all: Record<number, boolean> = {};
    CHAPTERS.forEach((c) => {
      all[c.n] = true;
    });
    setExpandedChapters(all);
  };

  const collapseAllChapters = () => {
    setExpandedChapters({});
  };

  // Helper for accent-insensitive search
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Multi-tier search results computation
  const searchResults = useMemo(() => {
    const q = normalize(searchInput);
    if (!q) return null;

    // 1. Check if user typed a page number directly (e.g. "45", "pag 45", "página 170")
    const pageNumberMatch = (() => {
      const match = q.match(/\b([1-9]\d{0,2})\b/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= TOTAL_PAGES) return num;
      }
      return null;
    })();

    // 2. Search Canonical UCDM Sections (like "El sueño feliz", "El instante santo", "Leyes del caos")
    const matchedSections = UCDM_SECTIONS.filter((sec) => {
      const titleNorm = normalize(sec.title);
      const chapNorm = normalize(sec.chapterTitle);
      const keywordsNorm = sec.keywords ? sec.keywords.some((k) => normalize(k).includes(q)) : false;
      return titleNorm.includes(q) || chapNorm.includes(q) || keywordsNorm;
    });

    // 3. Search Chapters
    const matchedChapters = CHAPTERS.filter((chap) => {
      const chapTitleNorm = normalize(chap.t);
      return (
        chapTitleNorm.includes(q) ||
        `capitulo ${chap.n}`.includes(q) ||
        `cap ${chap.n}`.includes(q)
      );
    });

    // 4. Search text snippets in all 297 pages
    const matchedPages: { page: number; chapterTitle: string; snippet: string }[] = [];
    if (q.length >= 2) {
      for (const p of pages) {
        const fullText = (p.rawText || p.lines.join(' '));
        const fullTextNorm = normalize(fullText);
        const idx = fullTextNorm.indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(fullText.length, idx + q.length + 70);
          let snippet = fullText.substring(start, end).replace(/\n+/g, ' ').trim();
          if (start > 0) snippet = '...' + snippet;
          if (end < fullText.length) snippet = snippet + '...';

          const ch = getChapterForPage(p.pageNumber);
          matchedPages.push({
            page: p.pageNumber,
            chapterTitle: `Cap. ${ch.number}: ${ch.title}`,
            snippet,
          });

          if (matchedPages.length >= 10) break;
        }
      }
    }

    return {
      pageNumberMatch,
      sections: matchedSections,
      chapters: matchedChapters,
      pages: matchedPages,
      totalCount:
        (pageNumberMatch ? 1 : 0) +
        matchedSections.length +
        matchedChapters.length +
        matchedPages.length,
    };
  }, [searchInput, pages]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchResults) return;

    if (searchResults.pageNumberMatch) {
      onSelectPage(searchResults.pageNumberMatch);
      if (!isDocked) onClose();
      return;
    }

    if (searchResults.sections.length > 0) {
      onSelectPage(searchResults.sections[0].page);
      if (!isDocked) onClose();
      return;
    }

    if (searchResults.chapters.length > 0) {
      onSelectPage(searchResults.chapters[0].p);
      if (!isDocked) onClose();
      return;
    }

    if (searchResults.pages.length > 0) {
      onSelectPage(searchResults.pages[0].page);
      if (!isDocked) onClose();
      return;
    }
  };

  const handleSelectPageAndClose = (page: number) => {
    onSelectPage(page);
    if (!isDocked) onClose();
  };

  const handleCopyQuote = (quote: SavedQuote) => {
    navigator.clipboard.writeText(`«${quote.text}» — UCDM (Cap. ${quote.chapterNumber}, Pág. ${quote.page})`);
    setCopiedQuoteId(quote.id);
    setTimeout(() => setCopiedQuoteId(null), 2000);
  };

  if (!isOpen && !isDocked) {
    return null;
  }

  return (
    <>
      {/* Dark Overlay for non-docked mode */}
      {!isDocked && isOpen && (
        <div
          id="drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Drawer / Sidebar Panel */}
      <aside
        id="chapter-drawer"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[85vw] sm:w-[380px] md:w-[400px] bg-[#fbf9f5] dark:bg-[#15181e] border-r border-[#e5dfd2] dark:border-[#272d38] text-[#2c2925] dark:text-[#dfdbd1] shadow-2xl transition-transform duration-300 ease-out safe-top safe-bottom ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-[#e5dfd2] dark:border-[#272d38] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#8c6b2d] dark:text-[#d4af37]" />
            <h2 className="font-display font-semibold text-sm sm:text-base tracking-wide text-[#1c1a17] dark:text-[#f3f0e8]">
              Un Curso de Milagros
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-drawer-dock-toggle"
              onClick={onToggleDocked}
              aria-label={isDocked ? "Desanclar panel lateral" : "Anclar panel lateral"}
              className="hidden lg:flex p-2 rounded-lg hover:bg-[#eee8dc] dark:hover:bg-[#202632] text-[#6b6456] dark:text-[#a59f93] transition-colors cursor-pointer"
              title={isDocked ? "Desanclar panel lateral" : "Mantener fijo en pantalla"}
            >
              {isDocked ? <PinOff className="w-4 h-4 text-[#8c6b2d] dark:text-[#d4af37]" /> : <Pin className="w-4 h-4" />}
            </button>

            <button
              id="btn-drawer-close"
              onClick={onClose}
              aria-label="Cerrar índice"
              className="p-2 rounded-lg hover:bg-[#eee8dc] dark:hover:bg-[#202632] text-[#6b6456] dark:text-[#a59f93] transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buscador Universal en Vivo: Secciones, Capítulos, Palabras o Páginas */}
        <div className="p-3 border-b border-[#e5dfd2] dark:border-[#272d38] bg-[#f5f1e7]/80 dark:bg-[#1a1e26]/80">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8c6b2d] dark:text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-drawer-search"
                type="text"
                placeholder="Buscar sección, capítulo o pág. (ej: El sueño feliz)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-[#ded7c8] dark:border-[#2d3440] bg-white dark:bg-[#1e232c] text-[#2c2925] dark:text-[#dfdbd1] placeholder-[#948d80] dark:placeholder-[#787163] focus:outline-hidden focus:ring-2 focus:ring-[#8c6b2d]/50"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-current cursor-pointer"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              id="btn-submit-drawer-search"
              type="submit"
              aria-label="Buscar o ir"
              className="px-3.5 py-2 rounded-xl bg-[#8c6b2d] hover:bg-[#785922] dark:bg-[#d4af37] dark:hover:bg-[#c29e2f] text-white dark:text-[#121418] text-xs sm:text-sm font-sans-ui font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs flex-shrink-0"
              title="Buscar o saltar"
            >
              <span>Buscar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick concept recommendation pills when search is empty */}
          {!searchInput && (
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-sans-ui text-neutral-500">
              <span className="text-[10px] uppercase tracking-wider text-neutral-400 flex-shrink-0">Ejemplos:</span>
              {[
                'El sueño feliz',
                'Instante santo',
                'Leyes del caos',
                'Perdón',
                'Capítulo 18',
              ].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchInput(term)}
                  className="flex-shrink-0 px-2 py-0.5 rounded-md bg-white dark:bg-[#20252f] border border-black/10 dark:border-white/10 hover:border-[#8c6b2d] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Display: If user is searching -> show live results. Else show tabs */}
        {searchResults ? (
          /* Live Search Results View */
          <div className="flex-1 overflow-y-auto divide-y divide-[#eee8dc] dark:divide-[#212630] p-2">
            <div className="px-2 py-2 text-xs font-sans-ui text-neutral-500 flex items-center justify-between">
              <span>
                {searchResults.totalCount}{' '}
                {searchResults.totalCount === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}
              </span>
              <button
                onClick={() => setSearchInput('')}
                className="text-[#8c6b2d] dark:text-[#d4af37] hover:underline cursor-pointer"
              >
                Volver al índice
              </button>
            </div>

            {searchResults.totalCount === 0 && (
              <div className="py-12 text-center text-neutral-400 font-sans-ui px-4">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-35" />
                <p className="text-sm font-medium">No se encontraron resultados para «{searchInput}»</p>
                <p className="text-xs mt-1 text-neutral-500">
                  Prueba con términos como *el sueño feliz*, *instante santo*, *el perdón*, *relación santa* o un número de página (1-{TOTAL_PAGES}).
                </p>
              </div>
            )}

            {/* Direct Page Jump Result */}
            {searchResults.pageNumberMatch && (
              <button
                onClick={() => handleSelectPageAndClose(searchResults.pageNumberMatch!)}
                className="w-full p-3 text-left rounded-xl bg-[#8c6b2d]/10 dark:bg-[#d4af37]/10 hover:bg-[#8c6b2d]/20 transition-colors cursor-pointer flex items-center justify-between gap-3 mb-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8c6b2d] text-white flex items-center justify-center font-bold text-xs">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui">
                      Saltar a la Página {searchResults.pageNumberMatch}
                    </div>
                    <div className="text-xs text-neutral-500 font-sans-ui">
                      {getChapterForPage(searchResults.pageNumberMatch).title}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8c6b2d]" />
              </button>
            )}

            {/* Matched Canonical UCDM Sections (e.g. "El sueño feliz") */}
            {searchResults.sections.length > 0 && (
              <div className="py-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-sans-ui font-semibold uppercase tracking-wider text-[#8c6b2d] dark:text-[#d4af37] flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Secciones de Capítulos ({searchResults.sections.length})</span>
                </div>
                {searchResults.sections.map((sec, idx) => (
                  <button
                    key={`sec-${sec.chapterNumber}-${sec.page}-${idx}`}
                    onClick={() => handleSelectPageAndClose(sec.page)}
                    className="w-full p-3 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#8c6b2d]/15 text-[#8c6b2d] dark:text-[#d4af37] text-[10px] font-sans-ui font-bold uppercase tracking-wider">
                          {sec.sectionCode ? `Sección ${sec.sectionCode}` : 'Capítulo'}
                        </span>
                        <span className="text-xs text-neutral-400 font-sans-ui truncate">
                          Capítulo {sec.chapterNumber}: {sec.chapterTitle}
                        </span>
                      </div>
                      <h4 className="font-serif-book font-semibold text-sm sm:text-base text-[#1c1a17] dark:text-[#f3f0e8] group-hover:text-[#8c6b2d] dark:group-hover:text-[#d4af37] transition-colors">
                        {sec.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                      <span className="text-xs font-sans-ui font-medium px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                        Pág. {sec.page}
                      </span>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#8c6b2d] group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Matched Chapters */}
            {searchResults.chapters.length > 0 && (
              <div className="py-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-sans-ui font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Capítulos ({searchResults.chapters.length})</span>
                </div>
                {searchResults.chapters.map((ch) => (
                  <button
                    key={`chap-${ch.n}`}
                    onClick={() => handleSelectPageAndClose(ch.p)}
                    className="w-full p-3 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-sans-ui uppercase tracking-wider text-neutral-400">
                        Capítulo {ch.n}
                      </div>
                      <h4 className="font-serif-book font-semibold text-sm sm:text-base text-[#1c1a17] dark:text-[#f3f0e8] group-hover:text-[#8c6b2d] dark:group-hover:text-[#d4af37] transition-colors">
                        {ch.t}
                      </h4>
                    </div>
                    <span className="text-xs font-sans-ui font-medium px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 flex-shrink-0 mt-1">
                      Pág. {ch.p}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Matched Text in Book Pages */}
            {searchResults.pages.length > 0 && (
              <div className="py-2 space-y-1">
                <div className="px-2 py-1 text-[11px] font-sans-ui font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>En el texto de las páginas ({searchResults.pages.length})</span>
                </div>
                {searchResults.pages.map((item, idx) => (
                  <button
                    key={`page-txt-${item.page}-${idx}`}
                    onClick={() => handleSelectPageAndClose(item.page)}
                    className="w-full p-2.5 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer block group"
                  >
                    <div className="flex items-center justify-between text-xs font-sans-ui mb-1">
                      <span className="font-semibold text-[#8c6b2d] dark:text-[#d4af37]">
                        Página {item.page}
                      </span>
                      <span className="text-neutral-400 text-[11px] truncate max-w-[200px]">
                        {item.chapterTitle}
                      </span>
                    </div>
                    <p className="font-serif-book text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-2">
                      {item.snippet}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard View with 3 Tabs: Capítulos | Marcadores | Mis Citas */
          <>
            <div className="flex border-b border-[#e5dfd2] dark:border-[#272d38] bg-[#f8f5ee] dark:bg-[#171a21] text-xs font-sans-ui font-medium">
              <button
                id="tab-chapters-btn"
                onClick={() => setActiveTab('chapters')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chapters'
                    ? 'border-[#8c6b2d] dark:border-[#d4af37] text-[#8c6b2d] dark:text-[#d4af37] bg-white/70 dark:bg-[#1a1e26] font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-current'
                }`}
              >
                Capítulos (31)
              </button>
              <button
                id="tab-bookmarks-btn"
                onClick={() => setActiveTab('bookmarks')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'bookmarks'
                    ? 'border-[#8c6b2d] dark:border-[#d4af37] text-[#8c6b2d] dark:text-[#d4af37] bg-white/70 dark:bg-[#1a1e26] font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-current'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Marcadores ({bookmarks.length})</span>
              </button>
              <button
                id="tab-quotes-btn"
                onClick={() => setActiveTab('quotes')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'quotes'
                    ? 'border-[#8c6b2d] dark:border-[#d4af37] text-[#8c6b2d] dark:text-[#d4af37] bg-white/70 dark:bg-[#1a1e26] font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-current'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Citas ({savedQuotes.length})</span>
              </button>
              <button
                id="tab-notes-btn"
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'notes'
                    ? 'border-[#8c6b2d] dark:border-[#d4af37] text-[#8c6b2d] dark:text-[#d4af37] bg-white/70 dark:bg-[#1a1e26] font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-current'
                }`}
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>Notas ({personalNotes.length})</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#eee8dc] dark:divide-[#212630]">
              {activeTab === 'chapters' && (
                /* Chapters List */
                <div className="py-2">
                  {onGoHome && (
                    <div className="px-4 pb-2 mb-2 border-b border-[#eee8dc] dark:border-[#212630]">
                      <button
                        onClick={() => {
                          onGoHome();
                          onClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#8c6b2d]/10 hover:bg-[#8c6b2d]/20 text-[#8c6b2d] dark:text-[#d4af37] text-xs font-sans-ui font-semibold cursor-pointer transition-colors"
                        title="Ir a la pantalla de Inicio / Bienvenida"
                      >
                        <Home className="w-4 h-4" />
                        <span>Ir a Pantalla de Inicio</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleSelectPageAndClose(1)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between group transition-colors cursor-pointer ${
                      currentPage === 1
                        ? 'bg-[#f0e8d5] dark:bg-[#27261a] text-[#8c6b2d] dark:text-[#d4af37]'
                        : 'hover:bg-[#f2ece0] dark:hover:bg-[#1c212b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-[#8c6b2d] dark:text-[#d4af37] flex-shrink-0" />
                      <div>
                        <div className="font-display text-[10px] tracking-wider uppercase opacity-75">Portada</div>
                        <div className="font-serif-book text-sm sm:text-base text-[#2c2925] dark:text-[#e4e1d9]">
                          Portada del Libro
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-sans-ui text-neutral-400">Pág. 1</span>
                  </button>

                  <button
                    onClick={() => handleSelectPageAndClose(2)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between group transition-colors cursor-pointer ${
                      currentPage === 2 || currentPage === 3
                        ? 'bg-[#f0e8d5] dark:bg-[#27261a] text-[#8c6b2d] dark:text-[#d4af37]'
                        : 'hover:bg-[#f2ece0] dark:hover:bg-[#1c212b]'
                    }`}
                  >
                    <div>
                      <div className="font-display text-[10px] tracking-wider uppercase opacity-75">Índice</div>
                      <div className="font-serif-book text-sm sm:text-base text-[#2c2925] dark:text-[#e4e1d9]">
                        Índice General de Capítulos
                      </div>
                    </div>
                    <span className="text-xs font-sans-ui text-neutral-400">Pág. 2</span>
                  </button>

                  <button
                    onClick={() => handleSelectPageAndClose(4)}
                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between group transition-colors cursor-pointer ${
                      currentPage === 4
                        ? 'bg-[#f0e8d5] dark:bg-[#27261a] text-[#8c6b2d] dark:text-[#d4af37]'
                        : 'hover:bg-[#f2ece0] dark:hover:bg-[#1c212b]'
                    }`}
                  >
                    <div>
                      <div className="font-display text-[10px] tracking-wider uppercase opacity-75">Texto</div>
                      <div className="font-serif-book text-sm sm:text-base text-[#2c2925] dark:text-[#e4e1d9]">
                        Introducción General
                      </div>
                    </div>
                    <span className="text-xs font-sans-ui text-neutral-400">Pág. 4</span>
                  </button>

                  <div className="my-2 border-t border-[#e5dfd2] dark:border-[#272d38]" />

                  {/* Chapters & Sections Sub-toolbar */}
                  <div className="px-4 py-2 flex items-center justify-between text-xs font-sans-ui bg-black/[0.02] dark:bg-white/[0.02] border-b border-[#e5dfd2]/60 dark:border-[#272d38]/60">
                    <span className="text-neutral-500 font-medium">
                      31 Capítulos • 245 Secciones (I, II, III...)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={expandAllChapters}
                        className="text-[11px] text-[#8c6b2d] dark:text-[#d4af37] hover:underline cursor-pointer"
                        title="Desplegar todas las partes y secciones"
                      >
                        Expandir todas
                      </button>
                      <span className="text-neutral-300 dark:text-neutral-700">|</span>
                      <button
                        onClick={collapseAllChapters}
                        className="text-[11px] text-neutral-500 hover:underline cursor-pointer"
                        title="Colapsar secciones"
                      >
                        Colapsar
                      </button>
                    </div>
                  </div>

                  {CHAPTERS.map((ch, chIdx) => {
                    const isCurrent = currentChapter.number === ch.n;
                    const isExpanded = !!expandedChapters[ch.n];
                    const nextChap = CHAPTERS[chIdx + 1];
                    const chapEndPage = nextChap ? nextChap.p - 1 : TOTAL_PAGES;
                    const hasSections = ch.sections && ch.sections.length > 0;

                    return (
                      <div
                        key={ch.n}
                        id={`drawer-chapter-${ch.n}`}
                        className={`border-b border-[#eee8dc]/70 dark:border-[#212630]/70 transition-colors ${
                          isCurrent ? 'bg-[#8c6b2d]/5 dark:bg-[#d4af37]/5' : ''
                        }`}
                      >
                        {/* Chapter Header Row */}
                        <div
                          className={`w-full px-4 py-3 flex items-start justify-between gap-2 group transition-colors ${
                            isCurrent
                              ? 'border-l-4 border-[#8c6b2d] dark:border-[#d4af37] bg-[#f0e8d5]/60 dark:bg-[#27261a]/60'
                              : 'hover:bg-[#f2ece0] dark:hover:bg-[#1c212b]'
                          }`}
                        >
                          <div
                            onClick={() => handleSelectPageAndClose(ch.p)}
                            className="flex-1 min-w-0 cursor-pointer"
                            title={`Ir al inicio del Capítulo ${ch.n} (Pág. ${ch.p})`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-sans-ui font-bold uppercase tracking-wider ${
                                  isCurrent
                                    ? 'text-[#8c6b2d] dark:text-[#d4af37]'
                                    : 'text-[#7e7667] dark:text-[#958e80]'
                                }`}
                              >
                                Capítulo {ch.n}
                              </span>
                              {isCurrent && (
                                <span className="inline-block px-1.5 py-0.2 rounded-xs text-[10px] font-sans-ui bg-[#8c6b2d] text-white">
                                  Leyendo
                                </span>
                              )}
                              {hasSections && (
                                <span className="text-[10px] font-sans-ui px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-neutral-500">
                                  {ch.sections!.length} {ch.sections!.length === 1 ? 'parte' : 'partes'}
                                </span>
                              )}
                            </div>
                            <div
                              className={`font-serif-book text-sm sm:text-base leading-snug mt-1 ${
                                isCurrent
                                  ? 'text-[#1c1a17] dark:text-[#f8f5ee] font-semibold'
                                  : 'text-[#2c2925] dark:text-[#dfdbd1] group-hover:text-[#8c6b2d]'
                              }`}
                            >
                              {ch.t}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                            <button
                              onClick={() => handleSelectPageAndClose(ch.p)}
                              className="text-xs font-sans-ui text-neutral-500 dark:text-neutral-400 hover:text-[#8c6b2d] tabular-nums px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title={`Saltar a Pág. ${ch.p}`}
                            >
                              Pág. {ch.p}
                            </button>

                            {hasSections && (
                              <button
                                type="button"
                                onClick={(e) => toggleChapter(ch.n, e)}
                                aria-label={isExpanded ? "Colapsar partes" : "Ver partes y secciones"}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isExpanded
                                    ? 'bg-[#8c6b2d]/15 text-[#8c6b2d] dark:text-[#d4af37]'
                                    : 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-400 hover:text-current'
                                }`}
                                title={isExpanded ? "Ocultar secciones" : "Ver secciones I, II, III..."}
                              >
                                <ChevronDown
                                  className={`w-4 h-4 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180 text-[#8c6b2d] dark:text-[#d4af37]' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Sections List (I, II, III, IV...) */}
                        {hasSections && isExpanded && (
                          <div className="bg-[#f7f3eb]/90 dark:bg-[#15181f]/90 border-t border-[#e8e2d4] dark:border-[#242a35] divide-y divide-[#ece6d9]/60 dark:divide-[#202530]/60 pl-3 sm:pl-4">
                            {ch.sections!.map((sec, sIdx) => {
                              const nextSec = ch.sections![sIdx + 1];
                              const secEndPage = nextSec ? nextSec.page - 1 : chapEndPage;
                              const isReadingThisSection =
                                currentPage >= sec.page && currentPage <= secEndPage;

                              return (
                                <button
                                  key={`${ch.n}-${sec.code}-${sIdx}`}
                                  id={`btn-sec-${ch.n}-${sec.code}`}
                                  onClick={() => handleSelectPageAndClose(sec.page)}
                                  className={`w-full py-2.5 pr-4 pl-2 text-left flex items-start justify-between gap-3 group transition-colors cursor-pointer ${
                                    isReadingThisSection
                                      ? 'bg-[#8c6b2d]/15 dark:bg-[#d4af37]/15 border-l-3 border-[#8c6b2d] dark:border-[#d4af37]'
                                      : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                                  }`}
                                  title={`Ir a la sección ${sec.code}: ${sec.title} (Página ${sec.page})`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <span
                                      className={`inline-flex items-center justify-center font-sans-ui text-[11px] font-bold px-1.5 py-0.5 rounded-sm min-w-6 text-center flex-shrink-0 mt-0.5 ${
                                        isReadingThisSection
                                          ? 'bg-[#8c6b2d] text-white'
                                          : 'bg-black/5 dark:bg-white/10 text-[#8c6b2d] dark:text-[#d4af37]'
                                      }`}
                                    >
                                      {sec.code}
                                    </span>
                                    <div className="min-w-0">
                                      <div
                                        className={`text-xs sm:text-sm font-serif-book leading-snug ${
                                          isReadingThisSection
                                            ? 'font-bold text-[#1c1a17] dark:text-[#f8f5ee]'
                                            : 'text-[#33302b] dark:text-[#dedad0] group-hover:text-[#8c6b2d]'
                                        }`}
                                      >
                                        {sec.title}
                                      </div>
                                      {isReadingThisSection && (
                                        <span className="text-[10px] font-sans-ui text-[#8c6b2d] dark:text-[#d4af37] font-semibold mt-0.5 block">
                                          ● Leyendo ahora (Pág. {currentPage})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                                    <span
                                      className={`text-xs font-sans-ui tabular-nums ${
                                        isReadingThisSection
                                          ? 'font-bold text-[#8c6b2d] dark:text-[#d4af37]'
                                          : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                                      }`}
                                    >
                                      Pág. {sec.page}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-[#8c6b2d] group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                /* Bookmarks List */
                <div className="py-2">
                  {bookmarks.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 font-sans-ui">
                      <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">Aún no tienes marcadores guardados</p>
                      <p className="text-xs mt-1">
                        Pulsa el icono de cinta en la barra de lectura para marcar cualquier página importante.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-500 font-sans-ui">
                        <span>{bookmarks.length} {bookmarks.length === 1 ? 'página marcada' : 'páginas marcadas'}</span>
                        <button
                          onClick={onClearAllBookmarks}
                          className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          Eliminar todos
                        </button>
                      </div>

                      {bookmarks.map((b) => (
                        <div
                          key={b.page}
                          className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-[#f2ece0] dark:hover:bg-[#1c212b] transition-colors group"
                        >
                          <button
                            onClick={() => handleSelectPageAndClose(b.page)}
                            className="flex-1 text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui">
                                Página {b.page}
                              </span>
                              <span className="text-xs text-neutral-400 font-sans-ui truncate">
                                Cap. {b.chapterNumber}: {b.chapterTitle}
                              </span>
                            </div>
                            {b.previewSnippet && (
                              <p className="font-serif-book text-xs sm:text-sm text-[#4d473d] dark:text-[#c4bfb3] mt-1 line-clamp-2">
                                «{b.previewSnippet}»
                              </p>
                            )}
                          </button>

                          <button
                            onClick={() => onDeleteBookmark(b.page)}
                            className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
                            title="Eliminar marcador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'quotes' && (
                /* Quotes List */
                <div className="py-2">
                  {savedQuotes.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 font-sans-ui">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#8c6b2d]" />
                      <p className="text-sm font-medium">Tu colección de citas está vacía</p>
                      <p className="text-xs mt-1 text-neutral-500">
                        Al leer, pasa el cursor sobre cualquier frase o pulsa «Subrayar» en los pasajes clave para guardarlos aquí.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-500 font-sans-ui">
                        <span>{savedQuotes.length} {savedQuotes.length === 1 ? 'cita guardada' : 'citas guardadas'}</span>
                        <button
                          onClick={onClearAllQuotes}
                          className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          Vaciar citas
                        </button>
                      </div>

                      {savedQuotes.map((q) => (
                        <div
                          key={q.id}
                          className="px-4 py-3 border-l-2 border-[#8c6b2d] bg-[#f8f4ec] dark:bg-[#1a1e27] m-2 rounded-r-xl shadow-xs"
                        >
                          <p className="font-serif-book italic text-xs sm:text-sm text-[#2c2925] dark:text-[#dfdbd1] leading-relaxed">
                            «{q.text}»
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                            <button
                              onClick={() => handleSelectPageAndClose(q.page)}
                              className="text-[11px] text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui hover:underline cursor-pointer"
                            >
                              Cap. {q.chapterNumber} • Pág. {q.page}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopyQuote(q)}
                                className="p-1 rounded-md text-neutral-400 hover:text-current hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                title="Copiar texto"
                              >
                                {copiedQuoteId === q.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => onDeleteQuote(q.id)}
                                className="p-1 rounded-md text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                title="Eliminar cita"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                /* Personal Notes List */
                <div className="py-2">
                  {personalNotes.length === 0 ? (
                    <div className="p-8 text-center text-neutral-400 font-sans-ui">
                      <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#8c6b2d]" />
                      <p className="text-sm font-medium">No tienes notas personales guardadas</p>
                      <p className="text-xs mt-1 text-neutral-500">
                        Selecciona cualquier texto o pulsa en «Nota» en los párrafos del libro para vincular tus reflexiones personales.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-500 font-sans-ui">
                        <span>{personalNotes.length} {personalNotes.length === 1 ? 'nota guardada' : 'notas guardadas'}</span>
                        <button
                          onClick={onClearAllPersonalNotes}
                          className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                        >
                          Vaciar notas
                        </button>
                      </div>

                      {personalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="px-4 py-3 border-l-2 border-[#8c6b2d] bg-[#f8f4ec] dark:bg-[#1a1e27] m-2 rounded-r-xl shadow-xs"
                        >
                          <div className="text-xs font-semibold text-[#8c6b2d] dark:text-[#d4af37] mb-1 font-sans-ui flex items-center justify-between">
                            <span>Reflexión / Nota</span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-serif-book text-xs sm:text-sm text-[#2c2925] dark:text-[#dfdbd1] font-medium leading-relaxed mb-2 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                            «{note.selectedText}»
                          </p>
                          <p className="font-sans-ui text-xs text-neutral-700 dark:text-neutral-300 italic whitespace-pre-wrap">
                            {note.noteText}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 dark:border-white/5">
                            <button
                              onClick={() => handleSelectPageAndClose(note.page)}
                              className="text-[11px] text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui hover:underline cursor-pointer"
                            >
                              Cap. {note.chapterNumber} • Pág. {note.page}
                            </button>
                            <button
                              onClick={() => onDeletePersonalNote(note.id)}
                              className="p-1 rounded-md text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                              title="Eliminar nota"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Drawer Bottom Bar: Page count & search shortcut */}
        <div className="p-3 border-t border-[#e5dfd2] dark:border-[#272d38] bg-[#f5f1e7] dark:bg-[#13161c] flex items-center justify-between text-xs font-sans-ui text-[#777063] dark:text-[#9b9487]">
          <span>
            {TOTAL_PAGES} páginas • 31 capítulos
          </span>
          <button
            onClick={() => {
              onOpenSearch();
              if (!isDocked) onClose();
            }}
            className="flex items-center gap-1.5 text-[#8c6b2d] dark:text-[#d4af37] font-medium hover:underline cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscador Completo</span>
          </button>
        </div>
      </aside>
    </>
  );
};
