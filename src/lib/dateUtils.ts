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
 * Formata uma data para exibição amigável em pt-BR (ex: "23 de outubro").
 */
export function formatFriendlyDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}
