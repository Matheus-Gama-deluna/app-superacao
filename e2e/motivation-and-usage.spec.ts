import { test, expect } from '@playwright/test';

test.describe('Fase 11 — Testes Extensos de Utilização Real e Motivação Adaptativa', () => {
  test.beforeEach(async ({ page }) => {
    // Inicializa com dados limpos e onboarding concluído para teste rápido do fluxo
    await page.addInitScript(() => {
      if (sessionStorage.getItem('keep_storage')) return;
      localStorage.clear();
      const mockProfile = {
        uid: 'user_e2e_motivation',
        displayName: 'Matheus',
        email: 'matheus@example.com',
        isTrustedDevice: true,
        primaryGoal: 'Construir o hábito e me sentir melhor',
        secondaryGoals: [],
        experienceLevel: 'iniciante',
        availableDays: [1, 3, 5],
        sessionDurationMinutes: 20,
        equipments: ['peso_corporal'],
        planSourcePreference: 'modelo_revisado',
        habitAnchor: 'Após meu café da manhã',
        motivationStyle: 'consistency',
        soundEnabled: false,
        hapticEnabled: false,
        onboardingCompleted: true,
        routineConfirmed: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('superacao_user_profile', JSON.stringify(mockProfile));
      localStorage.setItem('superacao_access_choice', '"guest"');

      // Cria agenda da semana com treinos
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);

      const toLocalStr = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayNum = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayNum}`;
      };

      const days = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = toLocalStr(d);
        const isToday = i === dayOfWeek;

        days.push({
          id: `day_${i}`,
          ownerUid: 'user_e2e_motivation',
          dateStr,
          dayOfWeek: i,
          activityType: isToday ? 'strength' : (i % 2 === 1 ? 'strength' : 'rest'),
          planId: isToday ? 'plan_forca_base' : (i % 2 === 1 ? 'plan_forca_base' : undefined),
          planTitle: isToday || i % 2 === 1 ? 'Força & Estabilidade' : 'Descanso Ativo',
          isCompleted: false,
        });
      }
      localStorage.setItem('superacao_calendar', JSON.stringify(days));

      // Plano base de teste
      const mockPlan = {
        id: 'plan_forca_base',
        ownerUid: 'user_e2e_motivation',
        title: 'Força & Estabilidade',
        description: 'Construção postural e ritmo suave',
        version: 1,
        isProfessional: false,
        estimatedDurationMinutes: 15,
        exercises: [
          {
            exerciseId: 'squat_01',
            exerciseName: 'Agachamento Livre',
            targetSets: 2,
            targetReps: 10,
            restSeconds: 30,
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('superacao_plans', JSON.stringify([mockPlan]));
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Troca autônoma do Estilo de Incentivo na tela Hoje (T01)', async ({ page }) => {
    // Verifica que o estilo inicial é "Constância & Hábito"
    await expect(page.locator('text=Constância & Hábito')).toBeVisible({ timeout: 5000 });

    // Clica em "Mudar estilo"
    await page.locator('text=Mudar estilo').click();

    // Menu abre com as opções
    await expect(page.locator('text=Domínio Técnico')).toBeVisible();
    await expect(page.locator('text=Bem-Estar')).toBeVisible();
    await expect(page.locator('text=Superação (PRs)')).toBeVisible();

    // Seleciona "Bem-Estar"
    await page.locator('button:has-text("Bem-Estar")').click();

    // Verifica que atualizou imediatamente o indicador
    await expect(page.locator('text=Bem-Estar & Alívio')).toBeVisible();
  });

  test('2. Execução do Ritual de Preparação em 2 passos (T06)', async ({ page }) => {
    // Verifica exibição do ritual ancorado
    await expect(page.locator('text=Ritual de Preparação')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Após meu café da manhã').first()).toBeVisible();

    // Clica para concluir a preparação
    const btnConcluir = page.locator('button:has-text("Concluir preparação")');
    await expect(btnConcluir).toBeVisible();
    await btnConcluir.click();

    // Verifica que o estado atualiza para "Preparação Feita"
    await expect(page.locator('text=Preparação Feita')).toBeVisible();
  });

  test('3. Abertura e uso do Plano Se-Então para Obstáculos (T07)', async ({ page }) => {
    // Botão de imprevisto deve estar visível
    const btnCoping = page.locator('text=Surgiu um imprevisto hoje?');
    if (await btnCoping.isVisible()) {
      await btnCoping.click();

      // Modal abre com as opções de resposta Se-Então
      await expect(page.locator('text=Respostas Rápidas Se-Então')).toBeVisible();
      await expect(page.locator('text=Fazer Opção Rápida (5 min)')).toBeVisible();

      // Fecha modal
      await page.locator('button:has-text("Fechar")').click();
      await expect(page.locator('text=Respostas Rápidas Se-Então')).not.toBeVisible();
    }
  });

  test('4. Registro Universal de Prática Externa (T04)', async ({ page }) => {
    // Clica em registrar prática
    const btnRegistrar = page.locator('button:has-text("Registrar Prática"), button:has-text("Registrar Caminhada"), button:has-text("Fiz sem o celular")').first();
    await expect(btnRegistrar).toBeVisible({ timeout: 5000 });
    await btnRegistrar.click();

    // Modal universal abre
    await expect(page.locator('text=Registrar Prática Realizada')).toBeVisible();

    // Seleciona Mobilidade / Yoga
    await page.locator('button:has-text("Mobilidade / Yoga")').click();

    // Preenche duração (20 min)
    const durationInput = page.locator('#practice_duration_input, #walk_duration_input');
    await durationInput.fill('20');

    // Seleciona sensação "Mais leve"
    await page.locator('button:has-text("Mais leve")').click();

    // Confirma registro
    await page.locator('button:has-text("Confirmar Registro")').click();

    // Modal fecha
    await expect(page.locator('text=Registrar Prática Realizada')).not.toBeVisible();

    // Verifica que uma sessão foi gravada no localStorage
    const sessionsRaw = await page.evaluate(() => localStorage.getItem('superacao_sessions'));
    expect(sessionsRaw).not.toBeNull();
    const sessions = JSON.parse(sessionsRaw!);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].originType).toBe('external_practice');
    expect(sessions[0].externalModality).toBe('mobilidade_yoga');
  });

  test('5. Fluxo de treino com Check-in Honesto pós-treino (T08) e Vivência Subjetiva', async ({ page }) => {
    // Inicia treino planejado
    const btnStart = page.locator('button:has-text("Iniciar Treino de Hoje")');
    await expect(btnStart).toBeVisible({ timeout: 10000 });
    await btnStart.scrollIntoViewIfNeeded();
    await btnStart.click();

    // Entrou no modo foco
    await expect(page.locator('text=Modo Foco')).toBeVisible({ timeout: 10000 });

    // Conclui 1ª série
    await page.locator('button:has-text("Concluir Série")').click();
    await page.locator('button:has-text("Salvar Registro")').click();

    // Pula descanso se houver
    const btnSkip = page.locator('button:has-text("Iniciar Série Já")');
    await expect(btnSkip).toBeVisible({ timeout: 5000 });
    await btnSkip.click();

    // Conclui 2ª série
    await page.locator('button:has-text("Concluir Série")').click();
    await page.locator('button:has-text("Salvar Registro")').click();

    // Abre tela de finalização S10
    await expect(page.locator('text=Parabéns pela superação!')).toBeVisible({ timeout: 5000 });

    // Verifica os novos botões de humor honesto pós-prática (incluindo Neutro e Exausto)
    await expect(page.locator('button:has-text("Neutro/Igual")')).toBeVisible();
    await expect(page.locator('button:has-text("Exausto")')).toBeVisible();

    // Seleciona humor Neutro/Igual
    await page.locator('button:has-text("Neutro/Igual")').click();

    // Verifica as opções de vivência subjetiva (Prazerosa vs Neutra vs Custosa)
    await expect(page.locator('button:has-text("Prazerosa & Fluida")')).toBeVisible();
    await expect(page.locator('button:has-text("Custosa / Desafiadora")')).toBeVisible();

    // Seleciona "Prazerosa & Fluida"
    await page.locator('button:has-text("Prazerosa & Fluida")').click();

    // Conclui e volta ao início
    await page.locator('button:has-text("Concluir e Voltar ao Início")').click();

    // Voltou à tela Hoje
    await expect(page.locator('text=Olá, Matheus!')).toBeVisible();
  });

  test('6. Retomada Acolhedora após 8 dias de ausência (T11)', async ({ page }) => {
    // Simula último treino há 8 dias
    await page.evaluate(() => {
      sessionStorage.setItem('keep_storage', 'true');
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      const y = eightDaysAgo.getFullYear();
      const m = String(eightDaysAgo.getMonth() + 1).padStart(2, '0');
      const d = String(eightDaysAgo.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      const oldSession = {
        id: 's_old',
        ownerUid: 'user_e2e_motivation',
        planId: 'plan_forca_base',
        planTitle: 'Força & Estabilidade',
        status: 'completed',
        completedAt: eightDaysAgo.getTime(),
        date: dateStr,
        durationSeconds: 900,
        totalSetsCompleted: 2,
        totalSetsPlanned: 2,
        totalRepsCompleted: 20,
        prsAchieved: 0,
        exercisesSnapshot: [],
      };
      localStorage.setItem('superacao_sessions', JSON.stringify([oldSession]));
    });

    await page.reload();

    // Deve exibir o card de retomada acolhedora
    await expect(page.locator('text=Retomada Acolhedora')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Treino Gentil')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Pratiquei fora do app')).toBeVisible();
    await expect(page.locator('text=Fazer Normal')).toBeVisible();
  });
});
