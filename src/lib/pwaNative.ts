/**
 * pwaNative.ts — Camada de Recursos Nativos e Capacidades PWA para o Superação
 *
 * Provê acesso direto às APIs do sistema operacional do celular:
 * 1. Screen Wake Lock API (Manter a tela acesa durante o treino)
 * 2. Media Session API (Controles na tela de bloqueio e smartwatch)
 * 3. Web Speech Synthesis API (Guia de voz offline em pt-BR)
 * 4. Notificações Nativas do Service Worker (Alerta de fim de descanso em 2º plano)
 * 5. Persistent Storage API (Blindagem dos dados locais contra limpeza do sistema)
 * 6. App Badging API (Contador discreto no ícone do aplicativo)
 * 7. Web Share API (Compartilhamento nativo de vitórias)
 * 8. Detecção de Modo Standalone & iOS
 */

// ---------------------------------------------------------------------------
// 1. Screen Wake Lock API
// ---------------------------------------------------------------------------
let wakeLockSentinel: any = null;
let isWakeLockRequested = false;

export async function requestWorkoutWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return false;
  try {
    isWakeLockRequested = true;
    if (!wakeLockSentinel || wakeLockSentinel.released) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        // Se a tela foi liberada mas o treino ainda está ativo, pode renovar quando a visibilidade voltar
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function releaseWorkoutWakeLock(): Promise<void> {
  isWakeLockRequested = false;
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Ignora erro
    }
    wakeLockSentinel = null;
  }
}

export function isWakeLockActive(): boolean {
  return Boolean(wakeLockSentinel && !wakeLockSentinel.released);
}

// Reativa Wake Lock automaticamente quando o usuário volta para o app
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isWakeLockRequested) {
      requestWorkoutWakeLock();
    }
  });
}

// ---------------------------------------------------------------------------
// 2. Media Session API (Tela de Bloqueio & Smartwatch)
// ---------------------------------------------------------------------------
export interface MediaSessionWorkoutInfo {
  title: string;       // Ex: "Série 2/3 · Agachamento"
  subtitle: string;    // Ex: "Treino Corpo Inteiro · 12 repetições"
  artworkUrl?: string; // Imagem do exercício
  onNextAction?: () => void; // Avançar série ou pular descanso
  isResting?: boolean;
}

export function updateWorkoutMediaSession(info: MediaSessionWorkoutInfo): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    const artwork = info.artworkUrl
      ? [{ src: info.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
      : [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }];

    const metadataPayload = {
      title: info.title,
      artist: info.subtitle,
      album: 'Superação Treino',
      artwork,
    };

    navigator.mediaSession.metadata =
      typeof MediaMetadata !== 'undefined'
        ? new MediaMetadata(metadataPayload)
        : (metadataPayload as any);

    // Mapeia botões de mídia do sistema / fone de ouvido
    if (info.onNextAction) {
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        info.onNextAction?.();
      });
      navigator.mediaSession.setActionHandler('play', () => {
        info.onNextAction?.();
      });
    }
  } catch {
    // Ignora restrição de plataforma
  }
}

export function clearWorkoutMediaSession(): void {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('nexttrack', null);
    navigator.mediaSession.setActionHandler('play', null);
  } catch {
    // Ignora
  }
}

// ---------------------------------------------------------------------------
// 3. Guia de Voz Offline (Web Speech Synthesis pt-BR)
// ---------------------------------------------------------------------------
let ptVoiceCache: SpeechSynthesisVoice | null = null;

function getPtVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  if (ptVoiceCache) return ptVoiceCache;
  const voices = window.speechSynthesis.getVoices();
  ptVoiceCache =
    voices.find((v) => v.lang === 'pt-BR') ||
    voices.find((v) => v.lang.startsWith('pt')) ||
    null;
  return ptVoiceCache;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    ptVoiceCache = null;
    getPtVoice();
  };
}

export function speakWorkoutCue(text: string, enabled: boolean = true): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Cancela falas anteriores pendentes
    const Utterance =
      typeof SpeechSynthesisUtterance !== 'undefined'
        ? SpeechSynthesisUtterance
        : (class {
            lang = 'pt-BR';
            rate = 1.05;
            pitch = 1.0;
            voice: any = null;
            constructor(public text: string) {}
          } as any);

    const utterance = new Utterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    const voice = getPtVoice();
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Falha silenciosa
  }
}

// ---------------------------------------------------------------------------
// 4. Notificações Nativas do Service Worker (Descanso em Segundo Plano)
// ---------------------------------------------------------------------------
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  try {
    if (Notification.permission === 'granted') return 'granted';
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function sendRestFinishedNotification(exerciseName: string): Promise<void> {
  if (typeof window === 'undefined') return;
  // Só dispara notificação se a aba estiver oculta (evita redundância enquanto o usuário olha a tela)
  if (document.visibilityState === 'visible') return;

  try {
    if ('Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification('Descanso finalizado! ✨', {
          body: `Hora da próxima série de ${exerciseName}. Bora continuar no seu ritmo!`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'rest-finished',
          renotify: true,
          vibrate: [200, 100, 200],
        } as any);
      }
    }
  } catch {
    // Falha silenciosa
  }
}

// ---------------------------------------------------------------------------
// 5. Persistent Storage API (Blindagem de Armazenamento Local)
// ---------------------------------------------------------------------------
export interface StorageEstimateResult {
  quotaMb: number;
  usageMb: number;
  percentUsed: number;
  isPersisted: boolean;
}

export async function ensurePersistentStorage(): Promise<{ isPersisted: boolean }> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return { isPersisted: false };
  }
  try {
    const isAlready = await navigator.storage.persisted();
    if (isAlready) return { isPersisted: true };
    const granted = await navigator.storage.persist();
    return { isPersisted: granted };
  } catch {
    return { isPersisted: false };
  }
}

export async function getStorageEstimate(): Promise<StorageEstimateResult> {
  const fallback: StorageEstimateResult = { quotaMb: 0, usageMb: 0, percentUsed: 0, isPersisted: false };
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return fallback;
  }
  try {
    const [estimate, isPersisted] = await Promise.all([
      navigator.storage.estimate(),
      navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false),
    ]);
    const quotaMb = Math.round((estimate.quota || 0) / (1024 * 1024));
    const usageMb = Number(((estimate.usage || 0) / (1024 * 1024)).toFixed(1));
    const percentUsed = quotaMb > 0 ? Number(((usageMb / quotaMb) * 100).toFixed(1)) : 0;

    return { quotaMb, usageMb, percentUsed, isPersisted };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// 6. App Badging API (Contador Discreto no Ícone do App)
// ---------------------------------------------------------------------------
export async function syncAppBadge(hasPendingWorkoutToday: boolean): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (hasPendingWorkoutToday) {
      if ('setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(1);
      }
    } else {
      if ('clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch {
    // Ignora restrição de plataforma
  }
}

// ---------------------------------------------------------------------------
// 7. Web Share API (Compartilhamento Nativo de Conquistas)
// ---------------------------------------------------------------------------
export async function shareWorkoutVictory(data: {
  title: string;
  text: string;
  url?: string;
}): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof window === 'undefined') return 'failed';

  const fullText = `${data.text}\n\nTreino feito no Superação: ${data.url || window.location.origin}`;

  if ('share' in navigator && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url || window.location.origin,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') return 'shared'; // Usuário cancelou a gaveta
    }
  }

  // Fallback: copia para a área de transferência
  try {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(fullText);
      return 'copied';
    }
  } catch {
    // Ignora
  }

  return 'failed';
}

// ---------------------------------------------------------------------------
// 8. Detecção de Modo Standalone & Dispositivo iOS
// ---------------------------------------------------------------------------
export function isAppInstalledStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const isMatchMediaStandalone = window.matchMedia ? window.matchMedia('(display-mode: standalone)').matches : false;
  const isNavStandalone = (window.navigator as any)?.standalone === true;
  const isReferrerAndroidApp = typeof document !== 'undefined' && document.referrer.includes('android-app://');
  return Boolean(isMatchMediaStandalone || isNavStandalone || isReferrerAndroidApp);
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = ((window.navigator?.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')) || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}
