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

  test('4. Estratégias de Motivação: Check-in de Sensação e Conclusão Parcial', async ({ page }) => {
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

  test('5. Estratégia C: Micro-Desafio do Dia exibido na Home e destacado no Modo Foco', async ({ page }) => {
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
          displayName: 'Juliana',
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

    // Valida o card do Micro-Desafio na Home (Estratégia C)
    const challengeIcon = page.locator('text=🎯').first();
    await expect(challengeIcon).toBeVisible();
    await expect(page.getByText(/Missão de Estreia|Desafio de Hoje/i).first()).toBeVisible();

    // Inicia o treino e valida que o micro-desafio ganha destaque dentro do exercício no Modo Foco
    await page.getByRole('button', { name: /Iniciar Treino de Hoje/i }).click();
    await expect(page.getByText(/Modo Foco/i)).toBeVisible();
    await expect(page.locator('text=🎯').first()).toBeVisible();
    await expect(page.getByText(/Missão de Estreia|Desafio de Hoje/i).first()).toBeVisible();
  });

  test('6. Estratégia E: Dia de Descanso oferece Cuidado Ativo e gera Elo de Vitalidade', async ({ page }) => {
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
          displayName: 'Felipe',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [(dayOfWeek + 1) % 7], // Hoje é descanso!
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
            activityType: 'rest',
            planTitle: 'Descanso Ativo',
            isCompleted: false,
          },
        ])
      );
    });
    await page.reload();

    // Valida Card de Descanso Planejado
    await expect(page.getByText(/Dia de Descanso & Regeneração/i)).toBeVisible();
    await expect(page.getByText(/O descanso é onde o corpo se regenera/i)).toBeVisible();

    // Clica em Caminhada Regenerativa Livre
    const walkBtn = page.getByRole('button', { name: /Caminhada Regenerativa Livre/i });
    await expect(walkBtn).toBeVisible();
    await walkBtn.click();

    // Modal de registro de caminhada abre
    await expect(page.getByText('Registrar Caminhada')).toBeVisible();
    const durationInput = page.locator('#walk_duration_input');
    await expect(durationInput).toBeVisible();
    await durationInput.fill('25');
    await page.getByRole('button', { name: /Confirmar Registro/i }).click();

    // Retorna para a Home e valida que o Elo de Vitalidade foi reconhecido
    await expect(page.getByText(/Elo Conquistado/i)).toBeVisible();

    // Navega até a aba Progresso
    await page.getByRole('button', { name: 'Progresso' }).click();

    // Valida o card de Cuidado & Regeneração com 25 minutos acumulados
    await expect(page.getByText(/Cuidado & Regeneração/i)).toBeVisible();
    await expect(page.getByText(/25 minutos acumulados/i)).toBeVisible();
    await expect(page.getByText(/1 elo de vitalidade/i)).toBeVisible();
  });

  test('7. Estratégias A e B: Moedas de Superação, Ponte para Amanhã e Agendamento em 1 clique', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const tomorrowDayOfWeek = (dayOfWeek + 1) % 7;
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomYear = tomorrow.getFullYear();
      const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const tomDay = String(tomorrow.getDate()).padStart(2, '0');
      const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Beatriz',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [dayOfWeek],
          sessionDurationMinutes: 15,
          equipments: ['peso_corporal'],
        })
      );

      // Treino personalizado de 1 única série de 5 repetições para completar o treino de ponta a ponta
      const singleSetPlan = {
        id: 'express_test_plan',
        title: 'Superação Rápida Teste',
        description: 'Plano rápido de teste',
        category: 'forca',
        difficulty: 'iniciante',
        estimatedDurationMinutes: 5,
        exercises: [
          {
            exerciseId: 'agachamento_livre',
            exerciseName: 'Agachamento Livre',
            targetSets: 1,
            targetReps: 5,
            targetDurationSeconds: 0,
            restDurationSeconds: 5,
          },
        ],
      };

      localStorage.setItem('superacao_plans', JSON.stringify([singleSetPlan]));
      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `guest_day_${todayStr}`,
            ownerUid: 'guest_user',
            dateStr: todayStr,
            dayOfWeek: dayOfWeek,
            activityType: 'strength',
            planId: 'express_test_plan',
            planTitle: 'Superação Rápida Teste',
            isCompleted: false,
          },
          {
            id: `guest_day_${tomorrowStr}`,
            ownerUid: 'guest_user',
            dateStr: tomorrowStr,
            dayOfWeek: tomorrowDayOfWeek,
            activityType: 'rest',
            planTitle: 'Descanso Ativo',
            isCompleted: false,
          },
        ])
      );
    });
    await page.reload();

    // Inicia treino
    await page.getByRole('button', { name: /Iniciar Treino de Hoje/i }).click();

    // Check-in inicial (Estratégia D)
    const moodTenso = page.getByRole('button', { name: /Tenso/i });
    if (await moodTenso.isVisible()) {
      await moodTenso.click();
    }

    // Conclui a única série
    await page.getByRole('button', { name: /Concluir Série/i }).click();
    await page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i }).click();

    // Pula o descanso sensorial se estiver descansando
    const skipBtn = page.getByRole('button', { name: /Iniciar Série Já/i });
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.click();
    }

    // Tela de Vitória de Sessão S10 deve abrir
    await expect(page.getByText('Parabéns pela superação!')).toBeVisible();

    // Valida Moedas de Superação (Estratégia A)
    await expect(page.getByText(/Vitórias Reconhecidas Desta Sessão/i)).toBeVisible();
    await expect(page.getByText(/Marca\(s\) Base estabelecida\(s\)|Vitória de Constância/i).first()).toBeVisible();

    // Valida Termômetro Pós-Prática (Estratégia D) e seleciona 'Mais leve'
    const postMoodBtn = page.getByRole('button', { name: /Mais leve/i });
    await expect(postMoodBtn).toBeVisible();
    await postMoodBtn.click();

    // Valida Ponte de Continuidade para Amanhã (Estratégia B)
    await expect(page.getByText(/Dia de Regeneração & Cuidado Leve/i)).toBeVisible();
    const bridgeScheduleBtn = page.getByRole('button', { name: /Separar 6 min de alongamento leve para amanhã/i });
    await expect(bridgeScheduleBtn).toBeVisible();
    await bridgeScheduleBtn.click();

    // Confirma que o agendamento em 1 clique respondeu imediatamente
    await expect(page.getByText(/Alongamento leve separado na sua agenda!/i)).toBeVisible();

    // Conclui e volta ao início
    await page.getByRole('button', { name: /Concluir e Voltar ao Início/i }).click();
    await expect(page.getByText('Olá, Beatriz!')).toBeVisible();
  });

  test('8. Estratégia D: Espelho de Bem-Estar na Home com memória de viradas anteriores', async ({ page }) => {
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
          displayName: 'Camila',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [dayOfWeek],
          sessionDurationMinutes: 20,
          equipments: ['peso_corporal'],
        })
      );

      // Simula uma sessão anterior onde a pessoa chegou 'cansado' e saiu 'renovado'
      localStorage.setItem(
        'superacao_sessions',
        JSON.stringify([
          {
            id: 'session_turnaround_1',
            ownerUid: 'guest_user',
            planId: 'template_forca_corpo_todo_casa',
            planTitle: 'Corpo Inteiro Essencial',
            status: 'completed',
            startedAt: Date.now() - 86400000,
            completedAt: Date.now() - 86400000 + 900000,
            durationSeconds: 900,
            currentExerciseIndex: 1,
            currentSetIndex: 2,
            totalSetsPlanned: 4,
            totalSetsCompleted: 4,
            totalRepsCompleted: 40,
            prsAchieved: 0,
            originType: 'scheduled',
            preMood: 'cansado',
            postMood: 'renovado',
            feedbackEffort: 3,
            achievementCoins: ['rpe_efficiency'],
            exercisesSnapshot: [],
          },
        ])
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

    // Valida o banner do Espelho de Bem-Estar & Sensação na Home
    await expect(page.getByText(/Espelho de Bem-Estar & Sensação/i)).toBeVisible();
    await expect(page.getByText(/Sem energia \/ Cansado/i)).toBeVisible();
    await expect(page.getByText(/Com mais energia/i)).toBeVisible();
  });

  test('9. Perfil do Praticante: Ajuste Inline de Disponibilidade e Movimentos Evitados', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Thiago',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 20,
          equipments: ['peso_corporal'],
          avoidedMovements: [],
        })
      );
    });
    await page.reload();

    // Abre Perfil pelo botão do cabeçalho
    const profileBtn = page.getByRole('button', { name: 'Perfil do usuário' });
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Valida título da seção
    await expect(page.getByText('Sua Rotina de Superação')).toBeVisible();

    // Clica para evitar impacto (saltos)
    const avoidImpactBtn = page.getByRole('button', { name: /Impacto e saltos/i });
    await expect(avoidImpactBtn).toBeVisible();
    await avoidImpactBtn.scrollIntoViewIfNeeded();
    await avoidImpactBtn.click();

    // Salva alterações
    const saveProfileBtn = page.getByRole('button', { name: /Salvar Alterações/i });
    await expect(saveProfileBtn).toBeVisible();
    await saveProfileBtn.scrollIntoViewIfNeeded();
    await saveProfileBtn.click();

    // Valida feedback de sucesso
    await expect(page.getByText('Preferências Salvas!')).toBeVisible();
  });
});
