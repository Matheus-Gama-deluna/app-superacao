import { test, expect } from '@playwright/test';

test.describe('E2E: Personal Agent IA (DeepInfra v2) & Painel do Administrador', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const mockProfile = {
        uid: 'user_matheus_test',
        displayName: 'Matheus Teste',
        email: 'gamamatheus65@gmail.com',
        userRole: 'student',
        onboardingCompleted: true,
        routineConfirmed: true,
        availableDays: [1, 3, 5],
        sessionDurationMinutes: 20,
        primaryGoal: 'Construir o hábito',
        secondaryGoals: [],
        experienceLevel: 'iniciante',
        equipments: ['peso_corporal'],
        reportedLimitations: [],
        avoidedMovements: [],
        isTrustedDevice: true,
        isAdmin: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('superacao_user_profile', JSON.stringify(mockProfile));
      localStorage.setItem('superacao_access_choice', '"guest"');
    });
  });

  test('1. Mobile Pixel 5: FAB do Personal IA visível e abre Drawer sem sobrepor BottomNav', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Verifica FAB do Personal IA
    const fabButton = page.getByRole('button', { name: /Conversar com Personal IA/i });
    await expect(fabButton).toBeVisible();

    // 2. Abre o Drawer do Personal IA
    await fabButton.click();

    // 3. Valida Header do Drawer
    await expect(page.locator('text=GLM-5.3 ACSM')).toBeVisible();
    await expect(page.locator('text=Personal IA')).toBeVisible();

    // 4. Clica na sugestão rápida "Dor no joelho"
    const kneeChip = page.getByRole('button', { name: 'Dor no joelho' });
    await expect(kneeChip).toBeVisible();
    await kneeChip.click();

    // 5. Envia mensagem ao Personal
    const sendButton = page.getByTitle('Enviar mensagem ao Personal');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // 6. Resposta empática biomecânica e proposta de troca
    await expect(page.locator('text=Elevação Pélvica').first()).toBeVisible({
      timeout: 8000,
    });

    // 7. Alterna para a aba de Memória M2
    const memoryTabBtn = page.getByRole('button', { name: /Memória/i });
    await memoryTabBtn.click();
    await expect(page.locator('text=O que seu Personal lembra sobre você')).toBeVisible();
    await expect(page.locator('text=Semana do Mesociclo')).toBeVisible();

    // 8. Fecha o Drawer
    const closeBtn = page.locator('button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(fabButton).toBeVisible();
  });

  test('2. Painel do Administrador (DeepInfra v2): navegação entre as 6 abas', async ({
    page,
  }) => {
    // Acessa via parâmetro admin=1
    await page.goto('/?admin=1');

    // Valida Header do Painel de Controle
    await expect(page.locator('h1:has-text("Painel do Administrador")')).toBeVisible();
    await expect(page.locator('text=DeepInfra v2')).toBeVisible();

    // 1. Aba Visão Geral (Overview)
    await expect(page.locator('text=Custo Estimado Hoje')).toBeVisible();
    await expect(page.locator('text=Chamadas Totais')).toBeVisible();
    await expect(page.locator('text=Red Flags Bloqueadas')).toBeVisible();

    // 2. Aba Modelos & Playground
    await page.getByRole('button', { name: /Modelos & Playground/i }).click();
    await expect(page.getByRole('heading', { name: /Master Personal \(Prescrição & Adaptação\)/i })).toBeVisible();
    await expect(page.locator('input[value="zai-org/GLM-5.3"]')).toBeVisible();
    await expect(page.locator('text=Playground & Teste de Conexão R$ 0,00')).toBeVisible();

    // Dispara teste de conexão no playground
    const testBtn = page.getByRole('button', { name: /Disparar Teste de Conexão/i });
    await testBtn.click();
    await expect(page.getByText('Conexão Bem-Sucedida', { exact: true })).toBeVisible({ timeout: 5000 });

    // 3. Aba Guardrails
    await page.getByRole('button', { name: /Guardrails & Travas/i }).click();
    await expect(page.locator('text=Kill Switch de Emergência')).toBeVisible();
    await expect(page.locator('text=Hard Stop Diário (USD)')).toBeVisible();

    // 4. Aba Skills Studio
    await page.getByRole('button', { name: /Skills Studio/i }).click();
    await expect(page.locator('text=ACSM 2026 Volume & Frequência')).toBeVisible();
    await expect(page.locator('text=Proteção Femoropatelar & Joelho')).toBeVisible();

    // 5. Aba Usuários & Cotas
    await page.getByRole('button', { name: /Usuários & Cotas/i }).click();
    await expect(page.locator('text=Gestão de Cotas & Privacidade LGPD')).toBeVisible();
    await expect(page.locator('text=Resetar Cota').first()).toBeVisible();

    // 6. Aba Catálogo & Auditoria
    await page.getByRole('button', { name: /Catálogo & Auditoria/i }).click();
    await expect(page.locator('text=Trilha de Auditoria (Audit Logs)')).toBeVisible();

    // 7. Retorno ao App
    const backBtn = page.getByTitle('Voltar ao SuperAção');
    await backBtn.click();
    await expect(page.locator('h1:has-text("Painel do Administrador")')).not.toBeVisible();
  });
});
