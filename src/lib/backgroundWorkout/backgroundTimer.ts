/**
 * Timer de Segundo Plano baseado em Web Worker inline.
 * Impede que navegadores mobile (Chrome Android, Safari iOS) desacelerem o setInterval
 * para 1 tick por minuto quando a aba vai para segundo plano ou o celular bloqueia a tela.
 */

type TimerTickCallback = () => void;

class BackgroundTimerService {
  private worker: Worker | null = null;
  private onTickCallback: TimerTickCallback | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      // Código do Worker em Blob URL: roda em thread dedicada sem sofrer throttling
      const workerCode = `
        let timerId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timerId) clearInterval(timerId);
            timerId = setInterval(function() {
              self.postMessage('tick');
            }, 500);
          } else if (e.data === 'stop') {
            if (timerId) {
              clearInterval(timerId);
              timerId = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const blobUrl = URL.createObjectURL(blob);
      this.worker = new Worker(blobUrl);

      this.worker.onmessage = (e) => {
        if (e.data === 'tick' && this.onTickCallback) {
          this.onTickCallback();
        }
      };
    } catch {
      // Fallback gracioso se Workers em Blob não forem permitidos
      this.worker = null;
    }
  }

  public start(onTick: TimerTickCallback) {
    this.onTickCallback = onTick;
    if (this.worker) {
      this.worker.postMessage('start');
    }
  }

  public stop() {
    this.onTickCallback = null;
    if (this.worker) {
      this.worker.postMessage('stop');
    }
  }
}

export const backgroundTimer = new BackgroundTimerService();
