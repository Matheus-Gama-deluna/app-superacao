/**
 * Utilitários canônicos de manipulação de datas no fuso horário local do praticante.
 * Elimina o bug de borda de data UTC (onde ações após as 21:00 no Brasil UTC-3
 * eram registradas erroneamente no dia seguinte).
 */

/**
 * Retorna a representação YYYY-MM-DD no fuso horário local do aparelho.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna o índice do dia da semana (0 = Domingo, 6 = Sábado) no fuso local.
 */
export function getLocalDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

/**
 * Ordem canônica dos dias da semana de Segunda (1) a Domingo (0).
 */
export const MONDAY_FIRST_DAYS = [1, 2, 3, 4, 5, 6, 0] as const;
export const MONDAY_FIRST_LABELS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
export const MONDAY_FIRST_LABELS_FULL = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const;

export const DOW_LABELS_MAP: Record<number, { short: string; full: string }> = {
  1: { short: 'Seg', full: 'Segunda-feira' },
  2: { short: 'Ter', full: 'Terça-feira' },
  3: { short: 'Qua', full: 'Quarta-feira' },
  4: { short: 'Qui', full: 'Quinta-feira' },
  5: { short: 'Sex', full: 'Sexta-feira' },
  6: { short: 'Sáb', full: 'Sábado' },
  0: { short: 'Dom', full: 'Domingo' },
};

/**
 * Converte dayOfWeek padrão JS (0=Dom, 1=Seg..6=Sáb) para índice base Segunda-feira (0=Seg..6=Dom).
 */
export function getMondayFirstIndex(dayOfWeek: number): number {
  return (dayOfWeek + 6) % 7;
}

/**
 * Converte índice base Segunda-feira (0=Seg..6=Dom) de volta para dayOfWeek padrão JS (0=Dom, 1=Seg..6=Sáb).
 */
export function getDayOfWeekFromMondayIndex(mondayIndex: number): number {
  return (mondayIndex + 1) % 7;
}

/**
 * Retorna o objeto Date da Segunda-feira da semana de referência (às 00:00:00 local).
 */
export function getCurrentWeekMondayDate(refDate: Date = new Date()): Date {
  const d = new Date(refDate);
  const dow = d.getDay();
  const mondayOffset = (dow + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Retorna a string YYYY-MM-DD da Segunda-feira da semana de referência.
 */
export function getCurrentWeekMondayStr(refDate: Date = new Date()): string {
  return getLocalDateStr(getCurrentWeekMondayDate(refDate));
}

/**
 * Retorna um mapa contendo a string YYYY-MM-DD de cada dayOfWeek da semana de Segunda a Domingo.
 */
export function getWeekDatesMondayFirst(refDate: Date = new Date()): Record<number, string> {
  const monday = getCurrentWeekMondayDate(refDate);
  const result: Record<number, string> = {};
  MONDAY_FIRST_DAYS.forEach((dow, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    result[dow] = getLocalDateStr(current);
  });
  return result;
}

/**
 * Formata uma data para exibição amigável em pt-BR (ex: "23 de outubro").
 */
export function formatFriendlyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}
