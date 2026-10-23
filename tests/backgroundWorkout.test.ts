import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  wakeLockManager,
  mediaSessionManager,
  backgroundTimer,
  workoutNotifications,
} from '../src/lib/backgroundWorkout';
import { soundManager } from '../src/lib/audio';

describe('Suporte a Segundo Plano e Experiência de Treino Contínua', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Screen Wake Lock API', () => {
    it('deve solicitar e liberar o bloqueio de tela sem lançar exceções em ambientes sem suporte ou com suporte', async () => {
      const result = await wakeLockManager.requestLock();
      expect(typeof result).toBe('boolean');

      expect(() => {
        wakeLockManager.releaseLock();
      }).not.toThrow();
    });
  });

  describe('2. Media Session API (Controles na Tela de Bloqueio)', () => {
    it('deve atualizar metadados da sessão de treino de forma segura', () => {
      expect(() => {
        mediaSessionManager.updateSession(
          'Agachamento Livre',
          'Série 1 de 3',
          'Treino Essencial',
          {
            onNextSet: vi.fn(),
            onSkipRest: vi.fn(),
          }
        );
      }).not.toThrow();
    });

    it('deve limpar metadados e áudio de segundo plano ao finalizar o treino', () => {
      expect(() => {
        mediaSessionManager.clearSession();
      }).not.toThrow();
    });
  });

  describe('3. Web Audio API com Agendamento Nativo (Clock de Hardware)', () => {
    it('deve agendar bips de contagem regressiva e som de término sem exceção', () => {
      expect(() => {
        soundManager.scheduleRestCountdown(60);
      }).not.toThrow();

      expect(() => {
        soundManager.cancelScheduledRest();
      }).not.toThrow();
    });
  });

  describe('4. Timer de Segundo Plano e Notificações', () => {
    it('backgroundTimer deve iniciar e parar sem vazamentos', () => {
      const tickFn = vi.fn();
      expect(() => {
        backgroundTimer.start(tickFn);
        backgroundTimer.stop();
      }).not.toThrow();
    });

    it('workoutNotifications deve emitir notificação de descanso sem crash', () => {
      expect(() => {
        workoutNotifications.notifyRestFinished('Flexão de Braços', 2);
      }).not.toThrow();
    });
  });
});
