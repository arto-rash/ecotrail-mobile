import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocales } from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import az from "./az.json";
import en from "./en.json";
import { mobileDict, type MobileDict } from "./mobile";

export const locales = ["az", "en"] as const;
export type Locale = (typeof locales)[number];
export type Dict = typeof en;

const dictionaries: Record<Locale, Dict> = { az: az as Dict, en };
const STORAGE_KEY = "ecotrail_locale";

/** Fill {placeholders} in a dictionary string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

/** Picks the "one" form when count is 1, like the website does. */
export function plural(count: number, many: string, one: string): string {
  return count === 1 ? one : fill(many, { count });
}

function deviceLocale(): Locale {
  const code = getLocales()[0]?.languageCode;
  return code === "en" ? "en" : "az";
}

const storage = {
  async get(): Promise<string | null> {
    if (Platform.OS === "web") return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    return SecureStore.getItemAsync(STORAGE_KEY);
  },
  async set(value: string) {
    if (Platform.OS === "web") return globalThis.localStorage?.setItem(STORAGE_KEY, value);
    return SecureStore.setItemAsync(STORAGE_KEY, value);
  },
};

type Ctx = { locale: Locale; dict: Dict; m: MobileDict; setLocale: (l: Locale) => void; ready: boolean };
const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage
      .get()
      .then((saved) => {
        if (saved === "az" || saved === "en") setLocaleState(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storage.set(next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ locale, dict: dictionaries[locale], m: mobileDict[locale], setLocale, ready }),
    [locale, setLocale, ready],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used inside LocaleProvider");
  return ctx;
}
