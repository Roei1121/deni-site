import type { MoveType, StatLine } from "./types";

const TZ = "Asia/Jerusalem";

export function ilDate(iso: string) {
  return new Intl.DateTimeFormat("he-IL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
}
export function ilTime(iso: string) {
  return new Intl.DateTimeFormat("he-IL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export function ilShort(iso: string) {
  return new Intl.DateTimeFormat("he-IL", { timeZone: TZ, day: "numeric", month: "numeric" }).format(new Date(iso));
}
/** "הלילה ב-04:00" / "מחר ב-20:30" / date */
export function whenLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const day = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(x);
  const tomorrow = new Date(now.getTime() + 864e5);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(d));
  if (day(d) === day(now)) return `${hour >= 18 ? "הערב" : "היום"} ב-${ilTime(iso)}`;
  if (day(d) === day(tomorrow)) return `${hour < 9 ? "הלילה" : "מחר"} ב-${ilTime(iso)}`;
  return `${ilDate(iso)} ב-${ilTime(iso)}`;
}
export function pct(made: number, att: number) {
  return att ? `${Math.round((made / att) * 100)}%` : "—";
}
export function shareLine(s: StatLine) {
  return `${s.pts} נק׳, ${s.reb} ריב׳, ${s.ast} אס׳`;
}
export const MOVE_LABELS: Record<MoveType, string> = {
  dunk: "הטבעות", three: "שלשות", assist: "אסיסטים", block: "חסימות", steal: "חטיפות",
  defense: "הגנה", clutch: "רגעי הכרעה", full_recap: "תקציר מלא", interview: "ראיונות", other: "עוד",
};
export const TEAM_HE: Record<string, string> = {
  "Portland Trail Blazers": "פורטלנד", "Denver Nuggets": "דנבר", "Golden State Warriors": "גולדן סטייט",
  "Los Angeles Lakers": "הלייקרס", "Boston Celtics": "בוסטון", "Oklahoma City Thunder": "אוקלהומה סיטי",
  "Washington Wizards": "וושינגטון", "Phoenix Suns": "פיניקס", "Utah Jazz": "יוטה", "Sacramento Kings": "סקרמנטו",
};
export const teamHe = (en: string) => TEAM_HE[en] ?? en;
