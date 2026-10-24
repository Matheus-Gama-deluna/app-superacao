import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  requestWorkoutWakeLock,
  releaseWorkoutWakeLock,
  isWakeLockActive,
  updateWorkoutMediaSession,
  clearWorkoutMediaSession,
  speakWorkoutCue,
  ensurePersistentStorage,
  getStorageEstimate,
  syncAppBadge,
  shareWorkoutVictory,
  isAppInstalledStandalone,
  isIOSDevice,
} from '../src/lib/pwaNative';

describe('Sprint 2: Camada de Recursos Nativos PWA (pwaNative.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Configura ambiente básico de window e navigator no Node
    vi.stubGlobal('window', {
      location: { origin: 'http://localhost:3000' },
      matchMedia: vi.fn(() => ({ matches: false })),
    });

    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 14)',
    });
  });

  it('1. Gerencia ciclo de vida do Screen Wake Lock com segurança', async () => {
    const mockSentinel = {
      released: false,
      release: vi.fn(async () => {
        mockSentinel.released = true;
      }),
      addEventListener: vi.fn(),
    };

    (navigator as any).wakeLock = {
      request: vi.fn(async () => mockSentinel),
    };

    const success = await requestWorkoutWakeLock();
    expect(success).toBe(true);
    expect(isWakeLockActive()).toBe(true);

    await releaseWorkoutWakeLock();
    expect(mockSentinel.release).toHaveBeenCalled();
  });

  it('2. Atualiza e limpa metadados na Media Session API', () => {
    const mockActionHandlers: Record<string, Function | null> = {};
    const mockMediaSession = {
      metadata: null as any,
      setActionHandler: vi.fn((action: string, handler: Function | null) => {
        mockActionHandlers[action] = handler;
      }),
    };

    (navigator as any).mediaSession = mockMediaSession;

    updateWorkoutMediaSession({
      title: 'Série 1/3 · Agachamento',
      subtitle: 'Corpo Inteiro · 12 reps',
      artworkUrl: '/exercises/squat.jpg',
      onNextAction: vi.fn(),
    });

    expect(mockMediaSession.metadata).not.toBeNull();
    expect(mockMediaSession.metadata.title).toBe('Série 1/3 · Agachamento');
    expect(mockMediaSession.setActionHandler).toHaveBeenCalledWith('nexttrack', expect.any(Function));

    clearWorkoutMediaSession();
    expect(mockMediaSession.metadata).toBeNull();
  });

  it('3. Guia de voz offline aciona SpeechSynthesis sem quebrar em navegadores sem suporte', () => {
    const mockSpeak = vi.fn();
    const mockCancel = vi.fn();

    (window as any).speechSynthesis = {
      speak: mockSpeak,
      cancel: mockCancel,
      getVoices: vi.fn(() => [{ lang: 'pt-BR', name: 'Voz Brasileira' }]),
    };

    speakWorkoutCue('Descanso finalizado', true);
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();

    // Se desativado, não deve falar
    mockSpeak.mockClear();
    speakWorkoutCue('Descanso finalizado', false);
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('4. Persistent Storage e estimativa de memória', async () => {
    (navigator as any).storage = {
      persisted: vi.fn(async () => false),
      persist: vi.fn(async () => true),
      estimate: vi.fn(async () => ({ quota: 1024 * 1024 * 500, usage: 1024 * 1024 * 50 })),
    };

    const persistResult = await ensurePersistentStorage();
    expect(persistResult.isPersisted).toBe(true);

    const estimate = await getStorageEstimate();
    expect(estimate.quotaMb).toBe(500);
    expect(estimate.usageMb).toBe(50);
    expect(estimate.percentUsed).toBe(10);
  });

  it('5. App Badging API atualiza contador no ícone', async () => {
    const mockSetBadge = vi.fn();
    const mockClearBadge = vi.fn();

    (navigator as any).setAppBadge = mockSetBadge;
    (navigator as any).clearAppBadge = mockClearBadge;

    await syncAppBadge(true);
    expect(mockSetBadge).toHaveBeenCalledWith(1);

    await syncAppBadge(false);
    expect(mockClearBadge).toHaveBeenCalled();
  });

  it('6. Web Share API compartilha conquista ou faz fallback para cópia de link', async () => {
    const mockShare = vi.fn(async () => {});
    (navigator as any).share = mockShare;

    const status = await shareWorkoutVictory({
      title: 'Treino Concluído!',
      text: 'Concluí meu treino no Superação com dedicação e constância!',
    });

    expect(status).toBe('shared');
    expect(mockShare).toHaveBeenCalled();
  });

  it('7. Detecção correta de iOS e modo standalone', () => {
    (window as any).matchMedia = vi.fn(() => ({ matches: true }));
    (window as any).navigator = { standalone: true };
    (navigator as any).userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';

    expect(isAppInstalledStandalone()).toBe(true);
    expect(isIOSDevice()).toBe(true);
  });
});
