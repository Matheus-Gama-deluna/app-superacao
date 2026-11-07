import { describe, it, expect } from 'vitest';
import { maskApiKey, getAdminApiKeyStatus } from '../config/agentModels.js';
import { handleAdminUpdateApiKey } from '../admin/adminCallable.js';

describe('Suite de Testes Unitários: Gestão Segura de API Key DeepInfra (v9.0)', () => {
  it('deve mascarar corretamente chaves de API ocultando o miolo sensível', () => {
    const rawKey = 'sk-deep-abcdef1234567890xyz';
    const masked = maskApiKey(rawKey);

    expect(masked).toBe('sk-dee...0xyz');
    expect(masked).not.toContain('abcdef');
    expect(masked.length).toBeLessThan(rawKey.length);
  });

  it('deve lidar com chaves curtas ou vazias com segurança', () => {
    expect(maskApiKey('')).toBe('');
    expect(maskApiKey('1234')).toBe('****');
  });

  it('deve indicar source secret_manager quando process.env.DEEPINFRA_API_KEY estiver presente', async () => {
    const originalEnv = process.env.DEEPINFRA_API_KEY;
    try {
      process.env.DEEPINFRA_API_KEY = 'sk-deep-testkey1234567890';
      const status = await getAdminApiKeyStatus();

      expect(status.isConfigured).toBe(true);
      expect(status.source).toBe('secret_manager');
      expect(status.maskedKey).toBe('sk-dee...7890');
    } finally {
      process.env.DEEPINFRA_API_KEY = originalEnv;
    }
  });

  it('deve bloquear tentativa de rotação de chave por usuário não autenticado', async () => {
    await expect(
      handleAdminUpdateApiKey(undefined, { apiKey: 'sk-deep-test123456' })
    ).rejects.toThrow(/UNAUTHENTICATED/);
  });

  it('deve bloquear tentativa de rotação de chave por usuário sem permissão de admin', async () => {
    const fakeUserContext = {
      uid: 'user_regular_123',
      token: { email: 'aluno@gmail.com', email_verified: true },
    };

    await expect(
      handleAdminUpdateApiKey(fakeUserContext, { apiKey: 'sk-deep-test123456' })
    ).rejects.toThrow(/PERMISSION_DENIED/);
  });

  it('deve rejeitar chave com formato inválido ou tamanho insuficiente', async () => {
    const adminContext = {
      uid: 'superadmin_123',
      token: { email: 'gamamatheus65@gmail.com', email_verified: true, admin: true },
    };

    await expect(
      handleAdminUpdateApiKey(adminContext, { apiKey: 'sk-123' })
    ).rejects.toThrow(/INVALID_ARGUMENT/);
  });
});
