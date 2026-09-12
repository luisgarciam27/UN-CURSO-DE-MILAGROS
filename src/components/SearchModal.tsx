import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, BookOpen, Compass, FileText, Hash } from 'lucide-react';
import { SearchResult, BookPageData } from '../types';
import { getChapterForPage, TOTAL_PAGES, CHAPTERS } from '../constants';
import { UCDM_SECTIONS, UcdmSection } from '../data/ucdmSections';
import bookContentData from '../data/bookContent.json';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchedSections, setMatchedSections] = useState<UcdmSection[]>([]);
  const [matchedChapters, setMatchedChapters] = useState<typeof CHAPTERS>([]);
  const [pageNumberMatch, setPageNumberMatch] = useState<number | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pages = bookContentData as BookPageData[];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const query = normalize(term);

    if (!query || query.length < 2) {
      setMatchedSections([]);
      setMatchedChapters([]);
      setPageNumberMatch(null);
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);

    // 1. Page number direct match
    const numMatch = query.match(/\b([1-9]\d{0,2})\b/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 1 && num <= TOTAL_PAGES) {
        setPageNumberMatch(num);
      } else {
        setPageNumberMatch(null);
      }
    } else {
      setPageNumberMatch(null);
    }

    // 2. Search Canonical Sections (e.g. "El sueño feliz", "Instante santo")
    const secMatches = UCDM_SECTIONS.filter((sec) => {
      const titleNorm = normalize(sec.title);
      const chapNorm = normalize(sec.chapterTitle);
      const keywordsNorm = sec.keywords ? sec.keywords.some((k) => normalize(k).includes(query)) : false;
      return titleNorm.includes(query) || chapNorm.includes(query) || keywordsNorm;
    });
    setMatchedSections(secMatches);

    // 3. Search Chapters
    const chapMatches = CHAPTERS.filter((chap) => {
      const titleNorm = normalize(chap.t);
      return (
        titleNorm.includes(query) ||
        `capitulo ${chap.n}`.includes(query) ||
        `cap ${chap.n}`.includes(query)
      );
    });
    setMatchedChapters(chapMatches);

    // 4. Search Text in pages
    const matches: SearchResult[] = [];
    const maxMatches = 40;

    for (const page of pages) {
      const pageText = page.rawText || page.lines.join(' ');
      const textNorm = normalize(pageText);
      const matchIndex = textNorm.indexOf(query);

      if (matchIndex !== -1) {
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(pageText.length, matchIndex + query.length + 80);
        let snippet = pageText.substring(start, end).replace(/\n+/g, ' ').trim();
        if (start > 0) snippet = '...' + snippet;
        if (end < pageText.length) snippet = snippet + '...';

        const ch = getChapterForPage(page.pageNumber);
        matches.push({
          page: page.pageNumber,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          snippet,
          matchIndex,
        });

        if (matches.length >= maxMatches) break;
      }
    }

    setResults(matches);
  };

  const handleClear = () => {
    setSearchTerm('');
    setMatchedSections([]);
    setMatchedChapters([]);
    setPageNumberMatch(null);
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (snippet: string, query: string) => {
    if (!query.trim()) return snippet;
    const parts = snippet.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-[#e8d2a6] dark:bg-[#d4af37]/40 text-current rounded-xs px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const totalResultsCount =
    (pageNumberMatch ? 1 : 0) +
    matchedSections.length +
    matchedChapters.length +
    results.length;

  if (!isOpen) return null;

  return (
    <div
      id="search-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-16 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="search-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#faf8f4] dark:bg-[#181b22] border border-[#e5dfd2] dark:border-[#2b313d] text-[#2c2925] dark:text-[#dfdbd1] shadow-2xl overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#e5dfd2] dark:border-[#2b313d] flex items-center gap-3 bg-white/60 dark:bg-[#15171e]/60">
          <Search className="w-5 h-5 text-[#8c6b2d] dark:text-[#d4af37] flex-shrink-0" />
          <input
            ref={inputRef}
            id="input-search-term"
            type="search"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar sección, capítulo, palabra (ej. El sueño feliz, perdón, instante santo)..."
            className="flex-1 bg-transparent border-none text-sm sm:text-base text-[#2c2925] dark:text-[#f0ece3] placeholder-neutral-400 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md text-neutral-400 hover:text-current transition-colors cursor-pointer"
              title="Borrar texto"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="btn-close-search"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-sans-ui text-neutral-500 hover:text-current hover:bg-black/5 dark:hover:bg-white/10 rounded-lg cursor-pointer"
          >
            Esc
          </button>
        </div>

        {/* Quick Topics Pills */}
        {!hasSearched && (
          <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2">
            <p className="text-[11px] font-sans-ui uppercase tracking-wider text-neutral-400 mb-2 font-medium">
              Conceptos clave para buscar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'El sueño feliz',
                'Instante santo',
                'Leyes del caos',
                'El perdón',
                'Paz de Dios',
                'Expiación',
                'Relación santa',
                'Capítulo 18',
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="px-3 py-1 text-xs font-sans-ui rounded-full bg-white dark:bg-[#222630] border border-black/10 dark:border-white/10 hover:border-[#8c6b2d] text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/5 dark:divide-white/5 p-3 space-y-2">
          {hasSearched && totalResultsCount === 0 && (
            <div className="py-16 text-center text-neutral-400 font-sans-ui">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-35" />
              <p className="text-sm font-medium">No se encontraron coincidencias para «{searchTerm}»</p>
              <p className="text-xs mt-1 text-neutral-500">
                Prueba con términos como *el sueño feliz*, *perdón*, *instante santo* o un número de página (1-{TOTAL_PAGES}).
              </p>
            </div>
          )}

          {/* Page Number Match */}
          {pageNumberMatch && (
            <button
              onClick={() => {
                onSelectPage(pageNumberMatch);
                onClose();
              }}
              className="w-full p-3 text-left rounded-xl bg-[#8c6b2d]/10 dark:bg-[#d4af37]/10 hover:bg-[#8c6b2d]/20 transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8c6b2d] text-white flex items-center justify-center font-bold text-xs">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#8c6b2d] dark:text-[#d4af37] font-sans-ui">
                    Saltar directamente a la Página {pageNumberMatch}
                  </div>
                  <div className="text-xs text-neutral-500 font-sans-ui">
                    {getChapterForPage(pageNumberMatch).title}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8c6b2d]" />
            </button>
          )}

          {/* Canonical Sections (e.g. "El sueño feliz") */}
          {matchedSections.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-xs font-sans-ui font-semibold uppercase tracking-wider text-[#8c6b2d] dark:text-[#d4af37] flex items-center gap-1.5 mb-1">
                <Compass className="w-4 h-4" />
                <span>Secciones de Capítulos ({matchedSections.length})</span>
              </div>
              <div className="space-y-1">
                {matchedSections.map((sec, idx) => (
                  <button
                    key={`modal-sec-${idx}`}
                    onClick={() => {
                      onSelectPage(sec.page);
                      onClose();
                    }}
                    className="w-full p-3 text-left rounded-xl bg-black/2 dark:bg-white/3 hover:bg-[#8c6b2d]/10 dark:hover:bg-[#d4af37]/10 transition-colors cursor-pointer flex items-center justify-between gap-3 group border border-black/5 dark:border-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#8c6b2d]/15 text-[#8c6b2d] dark:text-[#d4af37] text-[10px] font-sans-ui font-bold uppercase tracking-wider">
                          {sec.sectionCode ? `Sección ${sec.sectionCode}` : 'Capítulo'}
                        </span>
                        <span className="text-xs text-neutral-500 font-sans-ui truncate">
                          Capítulo {sec.chapterNumber}: {sec.chapterTitle}
                        </span>
                      </div>
                      <h4 className="font-serif-book font-bold text-base sm:text-lg text-[#1c1a17] dark:text-[#f3f0e8] group-hover:text-[#8c6b2d] dark:group-hover:text-[#d4af37] transition-colors">
                        {sec.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-sans-ui font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-200">
                        Pág. {sec.page}
                      </span>
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-[#8c6b2d] group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Chapters */}
          {matchedChapters.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-xs font-sans-ui font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Capítulos ({matchedChapters.length})</span>
              </div>
              <div className="space-y-1">
                {matchedChapters.map((ch) => (
                  <button
                    key={`modal-chap-${ch.n}`}
                    onClick={() => {
                      onSelectPage(ch.p);
                      onClose();
                    }}
                    className="w-full p-3 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-sans-ui uppercase tracking-wider text-neutral-400">
                        Capítulo {ch.n}
                      </div>
                      <div className="font-serif-book font-semibold text-base text-[#1c1a17] dark:text-[#f3f0e8] group-hover:text-[#8c6b2d] dark:group-hover:text-[#d4af37] transition-colors">
                        {ch.t}
                      </div>
                    </div>
                    <span className="text-xs font-sans-ui font-medium px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                      Pág. {ch.p}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Text in Pages */}
          {results.length > 0 && (
            <div className="pt-2">
              <div className="px-2 py-1 text-xs font-sans-ui font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4" />
                <span>En el texto de las páginas ({results.length})</span>
              </div>
              <div className="space-y-1">
                {results.map((r, index) => (
                  <button
                    key={`modal-res-${index}`}
                    onClick={() => {
                      onSelectPage(r.page);
                      onClose();
                    }}
                    className="w-full p-3 text-left rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer block group"
                  >
                    <div className="flex items-center justify-between text-xs font-sans-ui mb-1">
                      <span className="font-semibold text-[#8c6b2d] dark:text-[#d4af37]">
                        Página {r.page}
                      </span>
                      <span className="text-neutral-400 text-[11px] truncate max-w-[240px]">
                        Cap. {r.chapterNumber}: {r.chapterTitle}
                      </span>
                    </div>
                    <p className="font-serif-book text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {highlightMatch(r.snippet, searchTerm)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {hasSearched && totalResultsCount > 0 && (
          <div className="p-3 border-t border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2 text-xs font-sans-ui text-neutral-500 text-center">
            {totalResultsCount} {totalResultsCount === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'} en el libro
          </div>
        )}
      </div>
    </div>
  );
};
