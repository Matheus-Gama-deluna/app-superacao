// Sintetizador de áudio Web Audio API (zero dependências externas, 100% offline)
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  private scheduledNodes: OscillatorNode[] = [];

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.cancelScheduledRest();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Agendamento com precisão de hardware de áudio (AudioContext clock)
  // Permite que os bips toquem mesmo com tela apagada ou aba em segundo plano
  public scheduleRestCountdown(seconds: number) {
    if (this.isMuted || seconds <= 0) return;
    this.cancelScheduledRest();

    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const startTime = ctx.currentTime;

      // Agenda ticks nos últimos 3 segundos
      const tickOffsets = [seconds - 3, seconds - 2, seconds - 1];
      tickOffsets.forEach((offset) => {
        if (offset >= 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const fireTime = startTime + offset;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, fireTime); // D5
          gain.gain.setValueAtTime(0.12, fireTime);
          gain.gain.exponentialRampToValueAtTime(0.001, fireTime + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(fireTime);
          osc.stop(fireTime + 0.09);
          this.scheduledNodes.push(osc);
        }
      });

      // Agenda acorde de conclusão no tempo final
      const finishTime = startTime + seconds;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = finishTime + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.26);
        this.scheduledNodes.push(osc);
      });
    } catch {
      // Ignora erro
    }
  }

  public cancelScheduledRest() {
    this.scheduledNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch {
        // Já finalizado
      }
    });
    this.scheduledNodes = [];
  }

  // Toque suave para contagem regressiva de descanso (últimos 3 segundos)
  public playCountdownTick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Ignora erro de áudio silenciado pelo browser
    }
  }

  // Toque de descanso finalizado (pronto para a próxima série)
  public playRestFinished() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.26);
      });
    } catch {
      // Ignora erro
    }
  }

  // Confirmação de série concluída
  public playSetCompleted() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    } catch {
      // Ignora erro
    }
  }

  // Toque especial para NOVO RECORDE PESSOAL (PR)
  public playPRAchieved() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // Ignora erro
    }
  }
}

export const soundManager = new SoundManager();

// Vibração háptica com detecção segura
export function triggerHaptic(pattern: number | number[] = 60, enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignora restrição de plataforma
  }
}
