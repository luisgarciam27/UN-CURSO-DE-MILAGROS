import React, { useState, useEffect, useCallback } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ReaderHeader } from './components/ReaderHeader';
import { ReaderFooter } from './components/ReaderFooter';
import { ChapterDrawer } from './components/ChapterDrawer';
import { SearchModal } from './components/SearchModal';
import { EBookReader } from './components/EBookReader';
import { FacsimileViewer } from './components/FacsimileViewer';
import { TypographySettingsModal } from './components/TypographySettingsModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { AddNoteModal } from './components/AddNoteModal';
import { PersonalNotesModal } from './components/PersonalNotesModal';
import {
  Bookmark,
  SavedQuote,
  PersonalNote,
  ReaderDisplayMode,
  BookTheme,
  BookFontFamily,
  BookLineHeight,
  BookReadingWidth,
  BookPageData,
} from './types';
import { STORAGE_KEYS, TOTAL_PAGES, getChapterForPage } from './constants';
import bookContentData from './data/bookContent.json';

export default function App() {
  const pages = bookContentData as BookPageData[];

  // View state: 'welcome' cover or active 'reader'
  const [view, setView] = useState<'welcome' | 'reader'>('welcome');

  const [savedLastPage] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.LAST_PAGE);
      return val ? parseInt(val, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.LAST_PAGE);
      const parsed = val ? parseInt(val, 10) : 1;
      return parsed >= 1 && parsed <= TOTAL_PAGES ? parsed : 1;
    } catch {
      return 1;
    }
  });

  // Reading Mode: 'ebook' (default responsive text book) vs 'facsimile' (original PDF)
  const [displayMode, setDisplayMode] = useState<ReaderDisplayMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISPLAY_MODE) as ReaderDisplayMode;
      return saved === 'facsimile' ? 'facsimile' : 'ebook';
    } catch {
      return 'ebook';
    }
  });

  // Reading Theme: 'sepia' (comfort paper), 'cream', 'dark', 'midnight'
  const [theme, setTheme] = useState<BookTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME) as BookTheme;
      if (['sepia', 'cream', 'dark', 'midnight'].includes(saved)) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'sepia';
    } catch {
      return 'sepia';
    }
  });

  // Typography Settings
  const [fontFamily, setFontFamily] = useState<BookFontFamily>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_FAMILY) as BookFontFamily;
      return ['literata', 'merriweather', 'atkinson', 'lora', 'sans'].includes(saved) ? saved : 'literata';
    } catch {
      return 'literata';
    }
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      const parsed = saved ? parseInt(saved, 10) : 20;
      return parsed >= 13 && parsed <= 34 ? parsed : 20;
    } catch {
      return 20;
    }
  });

  const [lineHeight, setLineHeight] = useState<BookLineHeight>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LINE_HEIGHT) as BookLineHeight;
      return ['compact', 'normal', 'relaxed'].includes(saved) ? saved : 'normal';
    } catch {
      return 'normal';
    }
  });

  const [readingWidth, setReadingWidth] = useState<BookReadingWidth>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READING_WIDTH) as BookReadingWidth;
      return ['narrow', 'normal', 'wide'].includes(saved) ? saved : 'normal';
    } catch {
      return 'normal';
    }
  });

  // Bookmarks & Saved Quotes
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.QUOTES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(personalNotes));
    } catch {}
  }, [personalNotes]);

  const [activeNoteRequest, setActiveNoteRequest] = useState<{ text: string; page: number } | null>(null);
  const [isPersonalNotesModalOpen, setIsPersonalNotesModalOpen] = useState<boolean>(false);

  const handleSavePersonalNote = (noteText: string, selectedText: string, page: number) => {
    const ch = getChapterForPage(page);
    const newNote: PersonalNote = {
      id: Math.random().toString(36).substring(2, 9),
      page,
      chapterNumber: ch.number,
      chapterTitle: ch.title,
      selectedText,
      noteText,
      createdAt: Date.now(),
    };
    setPersonalNotes((prev) => [newNote, ...prev]);
    setActiveNoteRequest(null);
  };

  const handleDeletePersonalNote = (id: string) => {
    setPersonalNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllPersonalNotes = () => {
    setPersonalNotes([]);
  };

  // UI state
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isTypographyOpen, setIsTypographyOpen] = useState<boolean>(false);
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [activeSpeechParagraph, setActiveSpeechParagraph] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isDrawerDocked, setIsDrawerDocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DRAWER_PINNED) === 'true';
    } catch {
      return false;
    }
  });
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Background PDF doc for Facsimile mode
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Sync dark class to html document
  useEffect(() => {
    if (theme === 'dark' || theme === 'midnight') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE, String(currentPage));
    } catch {}
  }, [currentPage]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISPLAY_MODE, displayMode);
    } catch {}
  }, [displayMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FONT_FAMILY, fontFamily);
      localStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(fontSize));
      localStorage.setItem(STORAGE_KEYS.LINE_HEIGHT, lineHeight);
      localStorage.setItem(STORAGE_KEYS.READING_WIDTH, readingWidth);
    } catch {}
  }, [fontFamily, fontSize, lineHeight, readingWidth]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(savedQuotes));
    } catch {}
  }, [savedQuotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAWER_PINNED, String(isDrawerDocked));
    } catch {}
  }, [isDrawerDocked]);

  // Desktop screen query for docking
  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 1100px)');
    const handleScreenChange = () => {
      if (!desktopMq.matches && isDrawerDocked) {
        setIsDrawerDocked(false);
      }
    };
    desktopMq.addEventListener('change', handleScreenChange);
    return () => desktopMq.removeEventListener('change', handleScreenChange);
  }, [isDrawerDocked]);

  // Lazy load PDF file when needed for facsimile mode
  useEffect(() => {
    if (displayMode === 'facsimile' && !pdfDoc) {
      const loadPdf = async () => {
        let attempts = 0;
        while (!window.pdfjsLib && attempts < 25) {
          await new Promise((r) => setTimeout(r, 100));
          attempts++;
        }
        if (window.pdfjsLib) {
          try {
            const loadingTask = window.pdfjsLib.getDocument({
              url: 'UCDM_Texto.pdf',
              cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
              cMapPacked: true,
            });
            const doc = await loadingTask.promise;
            setPdfDoc(doc);
          } catch (e) {
            console.warn("Could not load facsimile PDF, e-reader active", e);
          }
        }
      };
      loadPdf();
    }
  }, [displayMode, pdfDoc]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          setCurrentPage((p) => Math.max(1, p - 1));
          break;
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1));
          break;
        case 'f':
        case 'F':
          setIsControlsVisible((v) => !v);
          break;
        case 'm':
        case 'M':
          setIsDrawerOpen((o) => !o);
          break;
        case 'Escape':
          if (isSearchOpen) setIsSearchOpen(false);
          else if (isTypographyOpen) setIsTypographyOpen(false);
          else if (isDrawerOpen && !isDrawerDocked) setIsDrawerOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isTypographyOpen, isDrawerOpen, isDrawerDocked]);

  // Page Navigation Handlers
  const handlePrevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(1, p - 1));
    setActiveSpeechParagraph(null);
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1));
    setActiveSpeechParagraph(null);
  }, []);

  const handleSeekPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(TOTAL_PAGES, page)));
    setActiveSpeechParagraph(null);
  }, []);

  // Bookmark toggling
  const isCurrentBookmarked = bookmarks.some((b) => b.page === currentPage);
  const handleToggleBookmark = useCallback(() => {
    const ch = getChapterForPage(currentPage);
    if (isCurrentBookmarked) {
      setBookmarks((prev) => prev.filter((b) => b.page !== currentPage));
    } else {
      const pageData = pages[currentPage - 1];
      const preview = pageData?.lines?.[0] || ch.title;
      const newBookmark: Bookmark = {
        page: currentPage,
        chapterNumber: ch.number,
        chapterTitle: ch.title,
        createdAt: Date.now(),
        previewSnippet: preview,
      };
      setBookmarks((prev) => [newBookmark, ...prev]);
    }
  }, [currentPage, isCurrentBookmarked, pages]);

  // Save inspiring quote
  const handleSaveQuote = useCallback((text: string) => {
    const ch = getChapterForPage(currentPage);
    const id = `quote-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setSavedQuotes((prev) => {
      if (prev.some((q) => q.page === currentPage && q.text === text)) {
        // Toggle off if already saved
        return prev.filter((q) => !(q.page === currentPage && q.text === text));
      }
      return [
        {
          id,
          page: currentPage,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          text,
          createdAt: Date.now(),
        },
        ...prev,
      ];
    });
  }, [currentPage]);

  const handleDeleteQuote = useCallback((id: string) => {
    setSavedQuotes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const handleClearAllQuotes = useCallback(() => {
    if (window.confirm("¿Deseas vaciar todas tus citas guardadas?")) {
      setSavedQuotes([]);
    }
  }, []);

  // Fullscreen toggle
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  // Quick theme toggle from welcome screen
  const handleToggleThemeQuick = useCallback(() => {
    setTheme((t) => (t === 'sepia' || t === 'cream' ? 'dark' : 'sepia'));
  }, []);

  // Current page object from book JSON
  const currentPageData: BookPageData = pages[currentPage - 1] || {
    pageNumber: currentPage,
    runningHeader: `Capítulo ${getChapterForPage(currentPage).number}`,
    lines: [
      "La santidad de la mente es una con su Creador, y en esa unión ningún conflicto puede subsistir.",
      "Cada paso de la jornada hacia la paz es una lección de confianza y desprendimiento del pasado."
    ],
    rawText: "La santidad de la mente es una con su Creador...",
  };

  const currentChapter = getChapterForPage(currentPage);

  // Welcome Screen
  if (view === 'welcome') {
    return (
      <WelcomeScreen
        lastPage={savedLastPage}
        theme={theme}
        onToggleTheme={handleToggleThemeQuick}
        onContinue={() => {
          setCurrentPage(savedLastPage);
          setView('reader');
        }}
        onStartBeginning={() => {
          setCurrentPage(1);
          setView('reader');
        }}
        onOpenIndex={() => {
          setView('reader');
          setIsDrawerOpen(true);
        }}
      />
    );
  }

  return (
    <div
      id="ucdm-reader-app"
      className="relative w-screen h-screen overflow-hidden flex bg-[#f5ede0] dark:bg-[#181b22] text-[#3d2f20] dark:text-[#e4e0d6] transition-colors duration-300 select-none"
    >
      {/* Top Header Bar */}
      <ReaderHeader
        visible={isControlsVisible}
        currentPage={currentPage}
        chapterNumber={currentChapter.number}
        chapterTitle={currentChapter.title}
        displayMode={displayMode}
        theme={theme}
        isBookmarked={isCurrentBookmarked}
        isAudioActive={isAudioActive}
        onToggleBookmark={handleToggleBookmark}
        onToggleDrawer={() => setIsDrawerOpen((o) => !o)}
        onToggleDisplayMode={() =>
          setDisplayMode((m) => (m === 'ebook' ? 'facsimile' : 'ebook'))
        }
        onOpenTypography={() => setIsTypographyOpen(true)}
        onToggleAudio={() => setIsAudioActive((a) => !a)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onGoHome={() => setView('welcome')}
        onSeekPage={handleSeekPage}
      />

      {/* Main Reading Frame with Desktop Docking Support */}
      <div className="flex-1 flex h-full w-full relative overflow-hidden">
        {/* Docked Sidebar (Desktop > 1100px) */}
        {isDrawerDocked && (
          <div className="hidden lg:block w-[380px] xl:w-[400px] h-full flex-shrink-0 z-20">
            <ChapterDrawer
              isOpen={true}
              isDocked={true}
              currentPage={currentPage}
              bookmarks={bookmarks}
              savedQuotes={savedQuotes}
              personalNotes={personalNotes}
              onClose={() => setIsDrawerDocked(false)}
              onSelectPage={handleSeekPage}
              onDeleteBookmark={(p) => setBookmarks((b) => b.filter((item) => item.page !== p))}
              onClearAllBookmarks={() => setBookmarks([])}
              onDeleteQuote={handleDeleteQuote}
              onClearAllQuotes={handleClearAllQuotes}
              onDeletePersonalNote={handleDeletePersonalNote}
              onClearAllPersonalNotes={handleClearAllPersonalNotes}
              onToggleDocked={() => setIsDrawerDocked((d) => !d)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onGoHome={() => setView('welcome')}
            />
          </div>
        )}

        {/* Modal Drawer (Mobile, Tablet, and Desktop when unpinned) */}
        {(!isDrawerDocked || !window.matchMedia('(min-width: 1100px)').matches) && (
          <ChapterDrawer
            isOpen={isDrawerOpen}
            isDocked={false}
            currentPage={currentPage}
            bookmarks={bookmarks}
            savedQuotes={savedQuotes}
            personalNotes={personalNotes}
            onClose={() => setIsDrawerOpen(false)}
            onSelectPage={handleSeekPage}
            onDeleteBookmark={(p) => setBookmarks((b) => b.filter((item) => item.page !== p))}
            onClearAllBookmarks={() => setBookmarks([])}
            onDeleteQuote={handleDeleteQuote}
            onClearAllQuotes={handleClearAllQuotes}
            onDeletePersonalNote={handleDeletePersonalNote}
            onClearAllPersonalNotes={handleClearAllPersonalNotes}
            onToggleDocked={() => {
              setIsDrawerDocked(true);
              setIsDrawerOpen(false);
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
            onGoHome={() => setView('welcome')}
          />
        )}

        {/* Primary Reading Engine: EBookReader (Default Reflowable) OR FacsimileViewer (PDF) */}
        {displayMode === 'ebook' ? (
          <EBookReader
            pageData={currentPageData}
            currentPage={currentPage}
            theme={theme}
            fontFamily={fontFamily}
            fontSize={fontSize}
            lineHeight={lineHeight}
            readingWidth={readingWidth}
            isControlsVisible={isControlsVisible}
            isBookmarked={isCurrentBookmarked}
            activeSpeechParagraph={activeSpeechParagraph}
            savedQuotes={savedQuotes}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onToggleControls={() => setIsControlsVisible((v) => !v)}
            onToggleBookmark={handleToggleBookmark}
            onSaveQuote={handleSaveQuote}
            onAddNoteRequest={(text, page) => setActiveNoteRequest({ text, page })}
            onPlayFromParagraph={(idx) => {
              setIsAudioActive(true);
              setActiveSpeechParagraph(idx);
            }}
          />
        ) : (
          <FacsimileViewer
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            theme={theme}
            isControlsVisible={isControlsVisible}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onToggleControls={() => setIsControlsVisible((v) => !v)}
          />
        )}
      </div>

      {/* Bottom Scrubber & Toolbar */}
      <ReaderFooter
        visible={isControlsVisible}
        currentPage={currentPage}
        theme={theme}
        isFullscreen={isFullscreen}
        isBookmarked={isCurrentBookmarked}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onSeekPage={handleSeekPage}
        onOpenTypography={() => setIsTypographyOpen(true)}
        onToggleBookmark={handleToggleBookmark}
        onToggleFullscreen={handleToggleFullscreen}
        onGoHome={() => setView('welcome')}
      />

      {/* Floating Audio Narrator Player */}
      {isAudioActive && (
        <AudioPlayerBar
          pageData={currentPageData}
          currentPage={currentPage}
          theme={theme}
          activeParagraphIndex={activeSpeechParagraph}
          onActiveParagraphChange={setActiveSpeechParagraph}
          onClose={() => {
            setIsAudioActive(false);
            setActiveSpeechParagraph(null);
          }}
        />
      )}

      {/* Typography & Themes Modal ('Aa') */}
      <TypographySettingsModal
        isOpen={isTypographyOpen}
        theme={theme}
        fontFamily={fontFamily}
        fontSize={fontSize}
        lineHeight={lineHeight}
        readingWidth={readingWidth}
        displayMode={displayMode}
        onSwitchToEbook={() => setDisplayMode('ebook')}
        onClose={() => setIsTypographyOpen(false)}
        onChangeTheme={setTheme}
        onChangeFontFamily={setFontFamily}
        onChangeFontSize={setFontSize}
        onChangeLineHeight={setLineHeight}
        onChangeReadingWidth={setReadingWidth}
      />

      {/* Instant Search Modal (Zero Lag across all 297 pages) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPage={handleSeekPage}
      />

      {activeNoteRequest && (
        <AddNoteModal
          isOpen={true}
          selectedText={activeNoteRequest.text}
          page={activeNoteRequest.page}
          chapterNumber={getChapterForPage(activeNoteRequest.page).number}
          chapterTitle={getChapterForPage(activeNoteRequest.page).title}
          theme={theme}
          onClose={() => setActiveNoteRequest(null)}
          onSaveNote={handleSavePersonalNote}
        />
      )}

      <PersonalNotesModal
        isOpen={isPersonalNotesModalOpen}
        notes={personalNotes}
        theme={theme}
        onClose={() => setIsPersonalNotesModalOpen(false)}
        onDeleteNote={handleDeletePersonalNote}
        onJumpToPage={(p) => {
          handleSeekPage(p);
          setIsPersonalNotesModalOpen(false);
        }}
      />
    </div>
  );
}
