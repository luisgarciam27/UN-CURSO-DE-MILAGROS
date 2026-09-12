export interface ChapterSection {
  code: string; // e.g. "I", "II", "III", "IV"
  title: string;
  page: number;
}

export interface Chapter {
  n: number;
  t: string;
  p: number;
  sections?: ChapterSection[];
}

export interface Bookmark {
  page: number;
  chapterNumber: number;
  chapterTitle: string;
  createdAt: number;
  label?: string;
  previewSnippet?: string;
}

export interface SavedQuote {
  id: string;
  page: number;
  chapterNumber: number;
  chapterTitle: string;
  text: string;
  createdAt: number;
  color?: string;
}

export interface SearchResult {
  page: number;
  chapterNumber: number;
  chapterTitle: string;
  snippet: string;
  matchIndex: number;
}

export type ReaderDisplayMode = 'ebook' | 'facsimile';

export type ThemeMode = 'day' | 'night';

export type BookTheme = 'sepia' | 'cream' | 'dark' | 'midnight';

export type BookFontFamily = 'literata' | 'newsreader' | 'atkinson' | 'merriweather' | 'lora' | 'sans' | 'cormorant';

export type BookLineHeight = 'compact' | 'normal' | 'relaxed';

export type BookReadingWidth = 'narrow' | 'normal' | 'wide';

export interface ReaderSettings {
  displayMode: ReaderDisplayMode;
  theme: BookTheme;
  fontFamily: BookFontFamily;
  fontSize: number; // 15 to 26 px
  lineHeight: BookLineHeight;
  readingWidth: BookReadingWidth;
  lastPage: number;
  drawerPinned: boolean;
}

export interface BookPageData {
  pageNumber: number;
  runningHeader: string;
  lines: string[];
  rawText: string;
}

export interface PersonalNote {
  id: string;
  page: number;
  chapterNumber: number;
  chapterTitle: string;
  selectedText: string;
  paragraphIndex?: number;
  noteText: string;
  createdAt: number;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

