import { lazy, ComponentType } from 'react';

/**
 * Carrega componentes dinamicamente com auto-recuperação contra chunk mismatches.
 * Se uma nova versão for publicada e o navegador tentar baixar um hash de arquivo antigo,
 * o utilitário captura o erro, limpa o status de recarga e força uma atualização limpa
 * da página sem deixar o usuário em tela branca.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = window.sessionStorage.getItem('superacao_chunk_retry');

    try {
      const component = await componentImport();
      // Se importou com sucesso, limpa a flag de retry
      window.sessionStorage.removeItem('superacao_chunk_retry');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        console.warn('Erro ao carregar chunk dinâmico. Atualizando versão em cache...', error);
        window.sessionStorage.setItem('superacao_chunk_retry', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
