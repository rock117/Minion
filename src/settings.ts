import { create } from "zustand";
import type { Locale } from "./i18n";

export type Theme = "dark" | "light" | "system";

const KEY_THEME = "minion.theme";
const KEY_LOCALE = "minion.locale";
const KEY_FOLDER_COUNTS = "minion.folderCounts";

function loadTheme(): Theme {
  const v = localStorage.getItem(KEY_THEME);
  return v === "dark" || v === "light" || v === "system" ? v : "dark";
}

function loadLocale(): Locale {
  const v = localStorage.getItem(KEY_LOCALE);
  if (v === "zh" || v === "en") return v;
  // 默认跟随系统语言
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return theme;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = resolveTheme(theme);
}

function loadFolderCounts(): boolean {
  const v = localStorage.getItem(KEY_FOLDER_COUNTS);
  return v === null ? true : v === "1";
}

interface SettingsState {
  theme: Theme;
  locale: Locale;
  showFolderCounts: boolean;
  setTheme: (t: Theme) => void;
  setLocale: (l: Locale) => void;
  setShowFolderCounts: (v: boolean) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  theme: loadTheme(),
  locale: loadLocale(),
  showFolderCounts: loadFolderCounts(),
  setTheme: (theme) => {
    localStorage.setItem(KEY_THEME, theme);
    applyTheme(theme);
    set({ theme });
  },
  setLocale: (locale) => {
    localStorage.setItem(KEY_LOCALE, locale);
    set({ locale });
  },
  setShowFolderCounts: (v) => {
    localStorage.setItem(KEY_FOLDER_COUNTS, v ? "1" : "0");
    set({ showFolderCounts: v });
  },
}));

// 启动时应用主题，并监听系统主题变化
if (typeof window !== "undefined") {
  applyTheme(useSettings.getState().theme);
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", () => {
      if (useSettings.getState().theme === "system") applyTheme("system");
    });
  }
}
