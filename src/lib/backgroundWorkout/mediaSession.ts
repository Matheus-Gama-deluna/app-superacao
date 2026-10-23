/**
 * Integração com a Media Session API.
 * Exibe o exercício atual, tempo de descanso e controles na tela de bloqueio
 * e no fone de ouvido bluetooth do usuário enquanto ele treina.
 */

interface MediaSessionCallbacks {
  onSkipRest?: () => void;
  onNextSet?: () => void;
  onTogglePause?: () => void;
}

class MediaSessionManager {
  private silentAudio: HTMLAudioElement | null = null;
  private isPlayingSilentAudio: boolean = false;

  private initSilentAudio() {
    if (typeof window === 'undefined' || this.silentAudio) return;
    try {
      // Pequeno áudio WAV silencioso em base64 (1 segundo de silêncio puro)
      // Mantém o canal de media session ativo na tela de bloqueio do celular
      const silentWavBase64 =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      this.silentAudio = new Audio(silentWavBase64);
      this.silentAudio.loop = true;
      this.silentAudio.volume = 0.01; // Quase inaudível para não interromper outros sons
    } catch {
      // Ignora erro
    }
  }

  public updateSession(
    exerciseName: string,
    setInfo: string,
    planTitle: string,
    callbacks: MediaSessionCallbacks = {}
  ) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      this.initSilentAudio();

      // Ativa o áudio silencioso na primeira interação para que o SO registre a mídia
      if (this.silentAudio && !this.isPlayingSilentAudio) {
        this.silentAudio.play().then(() => {
          this.isPlayingSilentAudio = true;
        }).catch(() => {});
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: exerciseName,
        artist: setInfo,
        album: `Superação • ${planTitle}`,
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      // Controles de fone bluetooth e lockscreen
      if (callbacks.onNextSet || callbacks.onSkipRest) {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (callbacks.onSkipRest) callbacks.onSkipRest();
          else if (callbacks.onNextSet) callbacks.onNextSet();
        });
      }

      if (callbacks.onTogglePause) {
        navigator.mediaSession.setActionHandler('play', () => {
          callbacks.onTogglePause?.();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          callbacks.onTogglePause?.();
        });
      }
    } catch {
      // Ignora falhas de API não suportadas
    }
  }

  public clearSession() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      if (this.silentAudio && this.isPlayingSilentAudio) {
        this.silentAudio.pause();
        this.isPlayingSilentAudio = false;
      }
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
    } catch {
      // Ignora
    }
  }
}

export const mediaSessionManager = new MediaSessionManager();
