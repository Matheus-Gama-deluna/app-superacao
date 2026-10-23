/**
 * Gerenciador da Screen Wake Lock API.
 * Mantém a tela do celular acesa durante o treino para que o praticante não precise
 * tocar na tela suada a cada 30 segundos.
 */
class WakeLockManager {
  private sentinel: any = null;
  private isRequested: boolean = false;

  public async requestLock(): Promise<boolean> {
    this.isRequested = true;
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      if (!this.sentinel || this.sentinel.released) {
        this.sentinel = await (navigator as any).wakeLock.request('screen');
        this.sentinel.addEventListener('release', () => {
          // Se foi liberado pelo sistema (ex: bateria baixa ou troca de app),
          // o sentinela é limpo
          if (this.isRequested && document.visibilityState === 'visible') {
            // Tenta readquirir
            this.requestLock().catch(() => {});
          }
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  public releaseLock() {
    this.isRequested = false;
    if (this.sentinel && !this.sentinel.released) {
      try {
        this.sentinel.release();
      } catch {
        // Ignora erro
      }
      this.sentinel = null;
    }
  }

  public handleVisibilityChange() {
    if (this.isRequested && document.visibilityState === 'visible') {
      this.requestLock().catch(() => {});
    }
  }
}

export const wakeLockManager = new WakeLockManager();

// Listener global para recuperação automática do wake lock ao voltar para o app
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    wakeLockManager.handleVisibilityChange();
  });
}
