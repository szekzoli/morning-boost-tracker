// Dátumkezelés helyi idő szerint, "YYYY-MM-DD" szövegekkel.
// (A toISOString() UTC-ben számol: éjfél után és a nyári időszámítás kezdetekor rossz napot adna.)

export const SESSION_DAYS = [1, 3, 6]; // hétfő, szerda, szombat

const pad = (n: number) => String(n).padStart(2, "0");

export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → helyi Date délben (így az óraátállítás sem tolja el a napot). */
export function fromYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function todayYmd(): string {
  return toYmd(new Date());
}

export function shiftDays(ymd: string, days: number): string {
  const d = fromYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

export function weekday(ymd: string): number {
  return fromYmd(ymd).getDay();
}

/** A következő edzésnap (a megadott nap után). */
export function nextSessionDay(ymd: string): string {
  let d = ymd;
  do d = shiftDays(d, 1);
  while (!SESSION_DAYS.includes(weekday(d)));
  return d;
}

/** Az előző edzésnap (a megadott nap előtt). */
export function prevSessionDay(ymd: string): string {
  let d = ymd;
  do d = shiftDays(d, -1);
  while (!SESSION_DAYS.includes(weekday(d)));
  return d;
}
