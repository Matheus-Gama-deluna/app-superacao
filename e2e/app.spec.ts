import { test, expect } from '@playwright/test';

test.describe('Superação - Validação End-to-End Headless (Em Segundo Plano)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('1. Tela de Boas-Vindas exibe versão dinâmica e permite acesso convidado', async ({ page }) => {
    await page.goto('/');
    
    // Valida título da aplicação e boas-vindas
    await expect(page.locator('h1')).toContainText('Superação');
    
    // Valida rodapé com versão dinâmica (V8-09)
    await expect(page.locator('footer')).toContainText('Versão 8.0.0');

    // Clica em "Continuar sem conta"
    const guestBtn = page.getByRole('button', { name: /Continuar sem conta/i });
    await expect(guestBtn).toBeVisible();
    await guestBtn.click();

    // Deve avançar para a Escuta Inicial (Onboarding)
    await expect(page.locator('h2')).toContainText('Como prefere ser chamado?');
  });

  test('2. Jornada de Escuta: Seleção limpa (V8-07) e resumo com "Não informado" (V8-08)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Continuar sem conta/i }).click();

    // Passo 1: Nome e Momento
    const nameInput = page.locator('#display_name_input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Marcos');
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 2: Objetivos (V8-07: Começa limpo)
    await expect(page.locator('h2')).toContainText('Seus Objetivos & Prioridades');
    // Adiciona um objetivo clicando no botão "+ Construir o hábito..."
    const addGoalBtn = page.locator('button:has-text("+ Construir o hábito")').first();
    await expect(addGoalBtn).toBeVisible();
    await addGoalBtn.click();
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 3: Disponibilidade (V8-07: Começa limpo)
    await expect(page.locator('h2')).toContainText('Sua Disponibilidade Real');
    const dayButtons = page.locator('.grid.grid-cols-7 button');
    await dayButtons.nth(1).click(); // Segunda
    await dayButtons.nth(4).click(); // Quinta
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 4: Equipamentos
    await expect(page.locator('h2')).toContainText('Equipamentos & Apoios');
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 5: Cuidados e Anamnese (deixa vazio para validar V8-08)
    await expect(page.locator('h2')).toContainText('Cuidados & Limitações');
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 6: Obstáculos (deixa vazio para validar V8-08)
    await expect(page.locator('h2')).toContainText('O que costuma dificultar sua prática?');
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 7: Resumo das Respostas (V8-08)
    await expect(page.locator('h2')).toContainText('Resumo das suas Respostas');
    // Verifica que cuidados e obstáculos mostram explicitamente "Não informado"
    await expect(page.getByText('Cuidados / Restrições: Não informado')).toBeVisible();
    await expect(page.getByText('Não informado', { exact: true })).toBeVisible();

    // Clica para ver proposta personalizada
    await page.getByRole('button', { name: /Ver Proposta Personalizada/i }).click();
    await expect(page.getByText('Por que esta rotina foi pensada para você?')).toBeVisible();
    await expect(page.getByText(/Proposta de Rotina/i).first()).toBeVisible();
  });

  test('3. HomeView: Botão de Pausa e Retomada de Treino (Fix V8-03)', async ({ page }) => {
    // Configura o usuário com perfil, agenda e rotina confirmada no localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Carlos',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [dayOfWeek],
          sessionDurationMinutes: 20,
          equipments: ['peso_corporal'],
        })
      );

      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `guest_day_${todayStr}`,
            ownerUid: 'guest_user',
            dateStr: todayStr,
            dayOfWeek: dayOfWeek,
            activityType: 'strength',
            planId: 'template_forca_corpo_todo_casa',
            planTitle: 'Corpo Inteiro Essencial (Sem Equipamentos)',
            isCompleted: false,
          },
        ])
      );
    });
    await page.reload();

    // Valida Header de Acolhimento na Home
    await expect(page.getByText('Olá, Carlos!')).toBeVisible();

    // Clica no botão de Iniciar Treino de Hoje
    const startBtn = page.getByRole('button', { name: /Iniciar Treino de Hoje/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Agora estamos no MODO FOCO (ActiveWorkoutView)
    await expect(page.getByText(/Modo Foco/i)).toBeVisible();

    // Clica no botão de PAUSAR (ícone Pause no header superior)
    const pauseBtn = page.getByTitle('Pausar treino e voltar ao início');
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // Validação estrita do BUG V8-03:
    // O aplicativo DEVE sair do modo foco e voltar para a Home!
    await expect(page.getByText('Olá, Carlos!')).toBeVisible();

    // O banner de "Treino em Andamento (Pausado)" deve estar visível
    const pausedBanner = page.getByText(/Treino em Andamento \(Pausado\)/i);
    await expect(pausedBanner).toBeVisible();

    // Clica em "Retomar Treino"
    const resumeBtn = page.getByRole('button', { name: /Retomar Treino/i }).first();
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();

    // Deve retornar para o MODO FOCO com sucesso!
    await expect(page.getByText(/Modo Foco/i)).toBeVisible();
  });

  test('4. Estratégias de Motivação: Check-in de Sensação e Conclusão', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Renata',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [dayOfWeek],
          sessionDurationMinutes: 15,
          equipments: ['peso_corporal'],
        })
      );

      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `guest_day_${todayStr}`,
            ownerUid: 'guest_user',
            dateStr: todayStr,
            dayOfWeek: dayOfWeek,
            activityType: 'strength',
            planId: 'template_forca_corpo_todo_casa',
            planTitle: 'Corpo Inteiro Essencial (Sem Equipamentos)',
            isCompleted: false,
          },
        ])
      );
    });
    await page.reload();

    // Inicia treino
    const startBtn = page.getByRole('button', { name: /Iniciar Treino de Hoje/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Estratégia D: Check-in inicial de sensação (1 toque)
    const moodDisposto = page.getByRole('button', { name: /Disposto/i });
    if (await moodDisposto.isVisible()) {
      await moodDisposto.click();
    }

    // Modal de confirmação da primeira série
    await page.getByRole('button', { name: /Concluir Série/i }).click();
    await page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i }).click();

    // Encerrar sessão ativa para simular conclusão parcial
    const closeBtn = page.getByTitle('Encerrar sessão');
    await closeBtn.click();
    await page.getByRole('button', { name: /Salvar Séries Feitas & Concluir como Parcial/i }).click();

    // Retorna para a Home com progresso computado
    await expect(page.getByText('Olá, Renata!')).toBeVisible();
  });
});
