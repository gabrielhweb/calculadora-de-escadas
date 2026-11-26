// Dias úteis: segunda a sexta, sem feriados nacionais (inclui Sexta-feira Santa, que muda todo ano).
// Usado no Controle de Contratos: "Pago em" + prazo do contrato (dias úteis) = data limite de entrega.

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "2026-11-26" -> Date local (meia-noite), ou null se inválida */
export const parseISODate = (iso?: string | null): Date | null => {
    if (!iso || typeof iso !== 'string') return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
};

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher)
const easterSunday = (year: number): Date => {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
};

const holidayCache: Record<number, Set<string>> = {};

/** Feriados nacionais do ano, em "AAAA-MM-DD" */
export const brazilHolidays = (year: number): Set<string> => {
    if (holidayCache[year]) return holidayCache[year];
    const fixed = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
    const set = new Set(fixed.map(md => `${year}-${md}`));
    const goodFriday = easterSunday(year);
    goodFriday.setDate(goodFriday.getDate() - 2);
    set.add(toISO(goodFriday));
    holidayCache[year] = set;
    return set;
};

export const isBusinessDay = (d: Date): boolean => {
    const wd = d.getDay();
    if (wd === 0 || wd === 6) return false;
    return !brazilHolidays(d.getFullYear()).has(toISO(d));
};

/** Data de pagamento + N dias úteis (o dia do pagamento não conta). Retorna "AAAA-MM-DD". */
export const addBusinessDays = (startISO: string, days: number): string | null => {
    const start = parseISODate(startISO);
    if (!start || !(days > 0)) return null;
    const d = new Date(start);
    let left = Math.round(days);
    while (left > 0) {
        d.setDate(d.getDate() + 1);
        if (isBusinessDay(d)) left--;
    }
    return toISO(d);
};

/**
 * Dias úteis de hoje até a data limite (sem contar hoje, contando a data limite).
 * Positivo = faltam; 0 = vence hoje; negativo = dias úteis de atraso.
 */
export const businessDaysUntil = (targetISO: string, today: Date = new Date()): number | null => {
    const target = parseISODate(targetISO);
    if (!target) return null;
    const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (target.getTime() === t0.getTime()) return 0;
    const forward = target > t0;
    const d = new Date(forward ? t0 : target);
    const end = forward ? target : t0;
    let count = 0;
    while (d < end) {
        d.setDate(d.getDate() + 1);
        if (isBusinessDay(d)) count++;
    }
    return forward ? count : -count;
};

export const formatBR = (iso?: string | null): string => {
    const d = parseISODate(iso);
    return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '';
};
