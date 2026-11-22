export type CurrencyCode = "GBP" | "EUR" | "USD" | "CAD" | "AUD" | "BRL" | "JPY" | "CNY" | "INR" | "ZAR" | "NGN" | "GHS" | "MXN" | "ARS";
export type GameSettings = {
  currency: CurrencyCode;
  dateFormat: "UK" | "US" | "ISO";
  timeFormat: "24-hour" | "12-hour";
  units: "Metric" | "Imperial";
  difficulty: "Relaxed" | "Standard" | "Challenging";
  autosave: boolean;
};

export const GAME_SETTINGS_KEY = "the-club-settings-v1";
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  currency: "GBP",
  dateFormat: "UK",
  timeFormat: "24-hour",
  units: "Metric",
  difficulty: "Standard",
  autosave: true,
};

export const CURRENCIES: { code: CurrencyCode; label: string; rate: number; locale: string }[] = [
  { code: "GBP", label: "Pounds sterling (£)", rate: 1, locale: "en-GB" },
  { code: "EUR", label: "Euro (€)", rate: 1.17, locale: "de-DE" },
  { code: "USD", label: "US dollar ($)", rate: 1.27, locale: "en-US" },
  { code: "CAD", label: "Canadian dollar (CA$)", rate: 1.75, locale: "en-CA" },
  { code: "AUD", label: "Australian dollar (A$)", rate: 1.94, locale: "en-AU" },
  { code: "BRL", label: "Brazilian real (R$)", rate: 7.05, locale: "pt-BR" },
  { code: "JPY", label: "Japanese yen (¥)", rate: 193, locale: "ja-JP" },
  { code: "CNY", label: "Chinese yuan (CN¥)", rate: 9.12, locale: "zh-CN" },
  { code: "INR", label: "Indian rupee (₹)", rate: 106, locale: "en-IN" },
  { code: "ZAR", label: "South African rand (R)", rate: 22.8, locale: "en-ZA" },
  { code: "NGN", label: "Nigerian naira (₦)", rate: 1_760, locale: "en-NG" },
  { code: "GHS", label: "Ghanaian cedi (GH₵)", rate: 16.2, locale: "en-GH" },
  { code: "MXN", label: "Mexican peso (MX$)", rate: 22.1, locale: "es-MX" },
  { code: "ARS", label: "Argentine peso (AR$)", rate: 1_560, locale: "es-AR" },
];

export function readGameSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_GAME_SETTINGS;
  try {
    const saved = window.localStorage.getItem(GAME_SETTINGS_KEY);
    if (!saved) return DEFAULT_GAME_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<GameSettings>;
    const currency = CURRENCIES.some((item) => item.code === parsed.currency) ? parsed.currency! : DEFAULT_GAME_SETTINGS.currency;
    const dateFormat = parsed.dateFormat === "US" || parsed.dateFormat === "ISO" ? parsed.dateFormat : "UK";
    const timeFormat = parsed.timeFormat === "12-hour" ? "12-hour" : "24-hour";
    const units = parsed.units === "Imperial" ? "Imperial" : "Metric";
    const difficulty = parsed.difficulty === "Relaxed" || parsed.difficulty === "Challenging" ? parsed.difficulty : "Standard";
    return { currency, dateFormat, timeFormat, units, difficulty, autosave: parsed.autosave !== false };
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

export function formatGameCurrency(amount: number, compact = false, currency = readGameSettings().currency) {
  const setting = CURRENCIES.find((item) => item.code === currency) ?? CURRENCIES[0];
  const converted = amount * setting.rate;
  const absolute = Math.abs(converted);
  const divisor = compact && absolute >= 1_000_000 ? 1_000_000 : compact && absolute >= 100_000 ? 1_000 : 1;
  const suffix = divisor === 1_000_000 ? "m" : divisor === 1_000 ? "k" : "";
  const formatter = new Intl.NumberFormat(setting.locale, {
    style: "currency",
    currency: setting.code,
    maximumFractionDigits: divisor > 1 ? 1 : 0,
    minimumFractionDigits: 0,
  });
  return `${formatter.format(converted / divisor)}${suffix}`;
}

export function formatGameDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const format = readGameSettings().dateFormat;
  if (format === "ISO") return date.toISOString().slice(0, 10);
  return date.toLocaleDateString(format === "US" ? "en-US" : "en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

export function formatGameTime(hour: number, minute = 0) {
  const { timeFormat } = readGameSettings();
  const date = new Date(Date.UTC(2026, 0, 1, hour, minute));
  return date.toLocaleTimeString(timeFormat === "12-hour" ? "en-US" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: timeFormat === "12-hour" });
}

export function formatGameDistance(metres: number) {
  if (readGameSettings().units === "Imperial") return `${Math.round(metres * 1.09361)} yd`;
  return `${metres} m`;
}
