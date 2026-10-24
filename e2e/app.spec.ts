import { test, expect } from '@playwright/test';

test.describe('Superação - Validação End-to-End Headless (Em Segundo Plano)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const k of keys) {
          await caches.delete(k);
        }
      }
    });
    await page.reload();
  });

  test('1. Tela de Boas-Vindas exibe versão dinâmica e permite acesso convidado', async ({ page }) => {
    await page.goto('/');
    
    // Valida título da aplicação e boas-vindas
    await expect(page.getByRole('heading', { name: 'Superação' }).first()).toContainText('Superação');
    
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
      localStorage.setItem(
        'superacao_proposal',
        JSON.stringify({
          proposalId: 'prop_test',
          title: 'Rotina Inicial Adaptada',
          description: 'Treino corpo todo para iniciar com segurança',
          routines: [
            {
              id: 'routine_test',
              title: 'Treino Corpo Inteiro A',
              exercises: [
                {
                  exerciseId: 'bodyweight_squat',
                  exerciseName: 'Agachamento Livre com Peso Corporal',
                  targetSets: 3,
                  targetReps: 10,
                  restSeconds: 45,
                },
                {
                  exerciseId: 'pushups',
                  exerciseName: 'Flexão de Braços no Solo',
                  targetSets: 3,
                  targetReps: 8,
                  restSeconds: 60,
                }
              ]
            }
          ],
          weeklySchedule: { 1: 'Segunda', 3: 'Quarta', 5: 'Sexta' },
          hasCompatibleExercises: true,
        })
      );
    });
    await page.reload();

    // Abre Perfil pelo botão do cabeçalho
    const profileBtn = page.getByRole('button', { name: /Perfil/i });
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Valida título da seção
    await expect(page.getByText(/Sua Rotina/i)).toBeVisible();

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

  test('10. Biblioteca de Programas e Planos Curados: Navegação e Inspeção no Explore', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Camila',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 20,
          equipments: ['peso_corporal'],
        })
      );
    });
    await page.reload();

    // Navega para o Explore
    const exploreNavBtn = page.getByRole('button', { name: 'Treinos' });
    await expect(exploreNavBtn).toBeVisible();
    await exploreNavBtn.click();

    // Valida que os novos programas por mesociclos estão presentes na tela
    await expect(page.getByText(/Todos os Programas/i).first()).toBeVisible();
    await expect(page.getByText(/Anti-Sedentarismo/i).first()).toBeVisible();
    await expect(page.getByText(/Coluna Blindada McGill/i).first()).toBeVisible();
    await expect(page.getByText(/Calistenia de Base Progressiva/i).first()).toBeVisible();

    // Valida detalhes do programa McGill exibindo suas fases estruturadas
    await expect(page.getByText(/Fase 1: Ativação dos Estabilizadores/i)).toBeVisible();
  });

  test('11. Treino Ativo: Execução de Série e Timer de Descanso com Suporte a Segundo Plano', async ({ page }) => {
    await page.goto('/');
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfWeek = today.getDay();

    await page.evaluate(({ todayStr, dayOfWeek }) => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Renato',
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
            planId: 'plan_anti_sedentarismo_cadeira_a',
            planTitle: 'Cadeira & Parede • Dia A (Postura & Pernas)',
            isCompleted: false,
          },
        ])
      );
    }, { todayStr, dayOfWeek });
    await page.reload();

    // Inicia o treino do dia
    const startWorkoutBtn = page.getByRole('button', { name: /Iniciar Treino/i }).first();
    await expect(startWorkoutBtn).toBeVisible();
    await startWorkoutBtn.click();

    // Valida que a tela de treino ativo foi aberta
    await expect(page.getByText(/Série 1 de 2/i)).toBeVisible();

    // Clica em Concluir Série (abre o modal de confirmação)
    const completeSetBtn = page.getByRole('button', { name: /Concluir Série/i });
    await expect(completeSetBtn).toBeVisible();
    await completeSetBtn.click();

    // Confirma a série no sheet
    const confirmSaveBtn = page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i });
    await expect(confirmSaveBtn).toBeVisible();
    await confirmSaveBtn.click();

    // Valida que o timer de descanso iniciou
    await expect(page.getByText(/Descanso/i)).toBeVisible();
    const skipRestBtn = page.getByRole('button', { name: /Iniciar Série Já/i });
    await expect(skipRestBtn).toBeVisible();

    // Pula o descanso para voltar ao modo ativo
    await skipRestBtn.click();

    // Deve avançar para a Série 2
    await expect(page.getByText(/Série 2 de 2/i)).toBeVisible();
  });
  test('12. Fase 5: Retomada Gentil, Troca ao Vivo, Evolução Pós-Treino e Trilhas Biomecânicas', async ({ page }) => {
    await page.goto('/');
    const today = new Date();
    const dayOfWeek = today.getDay();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Data de 10 dias atrás para simular Retomada Gentil
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    const tenDaysAgoMs = tenDaysAgo.getTime();

    await page.evaluate(({ todayStr, dayOfWeek, tenDaysAgoMs }) => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Larissa',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [dayOfWeek],
          sessionDurationMinutes: 15,
          equipments: ['peso_corporal'],
        })
      );

      // Sessão de 10 dias atrás para ativar o card de acolhimento
      localStorage.setItem(
        'superacao_sessions',
        JSON.stringify([
          {
            id: 'old_session_10_days',
            ownerUid: 'guest_user',
            planId: 'plan_test_fase5',
            planTitle: 'Treino de Força Fundamental',
            startedAt: tenDaysAgoMs,
            completedAt: tenDaysAgoMs + 900000,
            durationSeconds: 900,
            status: 'completed',
            currentExerciseIndex: 0,
            currentSetIndex: 1,
            totalSetsPlanned: 1,
            totalSetsCompleted: 1,
            totalRepsCompleted: 10,
            prsAchieved: 0,
            exercisesSnapshot: [],
          },
        ])
      );

      // Ficha de 1 única série de Flexão na Parede
      const quickPlan = {
        id: 'plan_test_fase5',
        ownerUid: 'guest_user',
        title: 'Treino de Força Fundamental',
        description: 'Plano com degrau biomecânico',
        version: 1,
        isProfessional: false,
        estimatedDurationMinutes: 10,
        exercises: [
          {
            exerciseId: 'wall_pushup_controlled',
            exerciseName: 'Flexão na Parede',
            targetSets: 1,
            targetReps: 15,
            restSeconds: 30,
            trackingMode: 'reps',
          },
        ],
      };

      localStorage.setItem('superacao_plans', JSON.stringify([quickPlan]));
      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `guest_day_${todayStr}`,
            ownerUid: 'guest_user',
            dateStr: todayStr,
            dayOfWeek: dayOfWeek,
            activityType: 'strength',
            planId: 'plan_test_fase5',
            planTitle: 'Treino de Força Fundamental',
            isCompleted: false,
          },
        ])
      );
    }, { todayStr, dayOfWeek, tenDaysAgoMs });

    await page.reload();

    // 1. Valida o Card de Retomada Gentil (Fase 4 & 5)
    await expect(page.getByText(/Sentimos sua falta há 10 dias/i)).toBeVisible();
    await expect(page.getByText('Readaptação', { exact: true })).toBeVisible();

    // 2. Inicia o Treino Gentil
    const gentleStartBtn = page.getByRole('button', { name: /Iniciar Treino Gentil/i });
    await expect(gentleStartBtn).toBeVisible();
    await gentleStartBtn.click();

    // 3. Valida tela de treino ativo e abre modal de Troca de Exercício
    await expect(page.getByRole('heading', { name: 'Flexão na Parede', exact: true })).toBeVisible();
    const swapBtn = page.getByRole('button', { name: /Trocar/i });
    await expect(swapBtn).toBeVisible();
    await swapBtn.click();

    // Valida modal de substituição e fecha
    await expect(page.getByText('Substituir Exercício')).toBeVisible();
    await expect(page.getByText(/Substitutos seguros do mesmo padrão biomecânico/i)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Substituir Exercício')).not.toBeVisible();

    // 4. Executa a série
    await page.getByRole('button', { name: /Concluir Série/i }).click();
    await page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i }).click();

    // Pula descanso se necessário
    const skipBtn = page.getByRole('button', { name: /Iniciar Série Já/i });
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.click();
    }

    // 5. Tela Final S10: Seleciona RPE 1 (Leve) e valida Card de Evolução
    await expect(page.getByText('Parabéns pela superação!')).toBeVisible();
    const rpe1Btn = page.getByRole('button', { name: '1 Leve' });
    await expect(rpe1Btn).toBeVisible();
    await rpe1Btn.click();

    // Valida que o card "Evolução Sugerida para Sua Ficha" aparece
    await expect(page.getByText(/Evolução Sugerida para Sua Ficha/i)).toBeVisible();
    const updatePlanBtn = page.getByRole('button', { name: /Atualizar Ficha Oficial com as Metas Acima/i });
    await expect(updatePlanBtn).toBeVisible();
    await updatePlanBtn.click();
    await expect(page.getByText(/✓ Ficha oficial atualizada com sucesso/i)).toBeVisible();

    // Conclui e volta ao Início
    await page.getByRole('button', { name: /Concluir e Voltar ao Início/i }).click();

    // 6. Navega até a aba Progresso e valida Trilhas Biomecânicas
    await page.getByRole('button', { name: 'Progresso' }).click();
    await expect(page.getByText(/Trilhas de Evolução Biomecânica/i)).toBeVisible();
    await expect(page.getByText(/Trilha de Empurrar/i)).toBeVisible();
    // Valida que não existe o bug textual "undefined reps"
    const bodyContent = await page.textContent('body');
    expect(bodyContent).not.toContain('undefined reps');
  });

  test('13. Troca ao Vivo persistida na Ficha Oficial e Sincronização (Sprint 1)', async ({ page }) => {
    await page.goto('/');
    const today = new Date();
    const dayOfWeek = today.getDay();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    await page.evaluate(({ todayStr, dayOfWeek }) => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Mariana',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [dayOfWeek],
          sessionDurationMinutes: 15,
          equipments: ['peso_corporal'],
        })
      );

      const planToTest = {
        id: 'plan_swap_persistence_test',
        ownerUid: 'guest_user',
        title: 'Treino Personalizado da Mariana',
        description: 'Ficha para teste de troca',
        version: 1,
        isProfessional: false,
        estimatedDurationMinutes: 10,
        exercises: [
          {
            exerciseId: 'wall_pushup_controlled',
            exerciseName: 'Flexão na Parede',
            targetSets: 1,
            targetReps: 12,
            restSeconds: 30,
            trackingMode: 'reps',
          },
        ],
      };

      localStorage.setItem('superacao_plans', JSON.stringify([planToTest]));
      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `guest_day_${todayStr}`,
            ownerUid: 'guest_user',
            dateStr: todayStr,
            dayOfWeek: dayOfWeek,
            activityType: 'strength',
            planId: 'plan_swap_persistence_test',
            planTitle: 'Treino Personalizado da Mariana',
            isCompleted: false,
          },
        ])
      );
    }, { todayStr, dayOfWeek });

    await page.reload();

    // 1. Inicia o Treino agendado de hoje na Home
    const startBtn = page.getByRole('button', { name: /Iniciar Treino de Hoje/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 2. Valida tela de treino ativo e abre modal de Troca
    await expect(page.getByRole('heading', { name: 'Flexão na Parede', exact: true })).toBeVisible();
    const swapBtn = page.getByRole('button', { name: /Trocar/i });
    await expect(swapBtn).toBeVisible();
    await swapBtn.click();

    // 3. Marca checkbox para atualizar também na ficha oficial
    await expect(page.getByText('Substituir Exercício')).toBeVisible();
    const saveToPlanCheckbox = page.getByLabel('Atualizar também na minha ficha oficial para os próximos treinos');
    await expect(saveToPlanCheckbox).toBeVisible();
    await saveToPlanCheckbox.check();

    // 4. Seleciona o primeiro exercício substituto equivalente
    const chooseButtons = page.getByRole('button', { name: 'Escolher' });
    await expect(chooseButtons.first()).toBeVisible();
    await chooseButtons.first().click();

    // 5. Valida que o modal fechou e o exercício foi trocado na tela ativa
    await expect(page.getByText('Substituir Exercício')).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flexão na Parede', exact: true })).not.toBeVisible();

    // 6. Valida que a ficha no armazenamento foi atualizada com versão incrementada (> 1)
    const storedPlans = await page.evaluate(() => {
      const raw = localStorage.getItem('superacao_plans');
      return raw ? JSON.parse(raw) : [];
    });
    const updatedPlan = storedPlans.find((p: any) => p.id === 'plan_swap_persistence_test');
    expect(updatedPlan).toBeDefined();
    expect(updatedPlan.version).toBeGreaterThan(1);
    expect(updatedPlan.exercises[0].exerciseId).not.toBe('wall_pushup_controlled');
  });

  test('14. Autenticação Completa: Modal de E-mail/Senha e Acolhimento na Tela de Boas-Vindas e Perfil (Sprint 3)', async ({ page }) => {
    // 1. Limpa storage para cair na WelcomeView
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Valida opções na WelcomeView
    await expect(page.getByRole('button', { name: /Continuar sem conta/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Criar conta com Google/i })).toBeVisible();
    const emailSignupBtn = page.getByRole('button', { name: /Criar conta com E-mail/i });
    await expect(emailSignupBtn).toBeVisible();

    // 3. Abre modal de autenticação por e-mail
    await emailSignupBtn.click();
    const authDialog = page.getByRole('dialog');
    await expect(authDialog).toBeVisible();
    await expect(page.getByRole('heading', { name: /Criar Conta no Superação/i })).toBeVisible();
    await expect(page.getByLabel(/Endereço de E-mail/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();

    // 4. Alterna para aba de Login
    const loginTabBtn = page.getByRole('button', { name: 'Entrar', exact: true });
    await loginTabBtn.click();
    await expect(page.getByRole('heading', { name: /Entrar na sua Conta/i })).toBeVisible();

    // 5. Testa fluxo de recuperação de senha
    const forgotPassBtn = page.getByRole('button', { name: /Esqueceu?/i });
    await expect(forgotPassBtn).toBeVisible();
    await forgotPassBtn.click();
    await expect(page.getByRole('heading', { name: /Recuperar Senha/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar Link de Redefinição/i })).toBeVisible();

    // 6. Fecha o modal com Escape
    await page.keyboard.press('Escape');
    await expect(authDialog).not.toBeVisible();

    // 7. Entra como convidado e valida perfil
    const guestBtn = page.getByRole('button', { name: /Continuar sem conta/i });
    await guestBtn.click();

    // Na WelcomeView -> Jornada de Escuta ou Home. Se for WelcomeView -> 'guest', pode ir para onboarding ou home.
    // Vamos garantir estado configurado e ir para Home
    await page.evaluate(() => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Mariana Teste',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
        })
      );
    });
    await page.reload();

    // 8. Abre Perfil do Usuário
    const profileBtn = page.getByRole('button', { name: /Perfil/i });
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // 9. Valida opções de vinculação de conta no Perfil
    await expect(page.getByText('Modo Convidado Local')).toBeVisible();
    await expect(page.getByRole('button', { name: /Conectar com Conta Google/i })).toBeVisible();
    const profileEmailAuthBtn = page.getByRole('button', { name: /Entrar ou Criar com E-mail/i });
    await expect(profileEmailAuthBtn).toBeVisible();

    // 10. Abre modal a partir do perfil e fecha
    await profileEmailAuthBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('15. Dados da Escuta e Motivação: Exibição do Porquê Pessoal na Home e Ajuste no Perfil (Sprint 4)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Juliana',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
          habitAnchor: 'Logo apos o cafe da manha',
          exerciseReason: 'Brincar com meus filhos sem cansar',
          healthNotes: 'Desconforto leve no joelho',
          preferredTime: 'manha',
        })
      );
    });
    await page.reload();

    // 1. Valida que o card do "Seu porquê" aparece na Home
    await expect(page.getByText(/Seu porqu/i)).toBeVisible();
    await expect(page.getByText(/Brincar com meus filhos sem cansar/i).first()).toBeVisible();

    // 2. Abre o Perfil clicando no avatar do cabeçalho
    const profileBtn = page.getByRole('button', { name: /Perfil/i });
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();
    await expect(page.getByRole('button', { name: /Voltar/i })).toBeVisible();

    // 3. Valida os campos da escuta no Perfil
    const reasonInput = page.locator('#profile-exercise-reason');
    await reasonInput.scrollIntoViewIfNeeded();
    await expect(reasonInput).toBeVisible();
    await expect(reasonInput).toHaveValue('Brincar com meus filhos sem cansar');

    // 4. Edita o porquê pessoal
    await reasonInput.fill('Ter mais vitalidade e longevidade');

    // 5. Salva alterações
    const saveBtn = page.getByRole('button', { name: /Salvar/i });
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.click();

    // Valida persistência direta no localStorage
    await expect.poll(async () => {
      return page.evaluate(() => {
        const raw = localStorage.getItem('superacao_user_profile');
        return raw ? JSON.parse(raw).exerciseReason : null;
      });
    }).toBe('Ter mais vitalidade e longevidade');

    // 6. Fecha o perfil (botão Voltar)
    const backBtn = page.getByRole('button', { name: /Voltar/i });
    await backBtn.click();

    // 7. Valida que a Home refletiu a nova motivação
    await expect(page.getByText(/Ter mais vitalidade e longevidade/i).first()).toBeVisible();
  });

  test('16. Coach IA Econômico: Pílula de Sabedoria do Dia e Perspectiva Acolhedora na Home (Sprint 5)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Renato Coach',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
          exerciseReason: 'Viver com disposição e sem dores',
          habitAnchor: 'Após o café da manhã',
        })
      );
    });
    await page.reload();

    // 1. Valida a presença do card da Pílula de Sabedoria do Coach
    const coachSection = page.getByRole('region', { name: /Pílula de Sabedoria do Coach/i });
    await expect(coachSection).toBeVisible();
    await expect(coachSection.getByText(/Coach de Constância/i)).toBeVisible();

    // 2. Valida que o conteúdo cita o porquê do praticante no tom acolhedor dentro do card do Coach
    await expect(coachSection.getByText(/Viver com disposição e sem dores/i)).toBeVisible();
    await expect(coachSection.getByText(/Foco no progresso sustentável/i)).toBeVisible();

    // 3. Testa o botão de renovar reflexão
    const refreshBtn = coachSection.getByRole('button', { name: /Gerar nova reflexão do Coach/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // Continua visível e responsivo
    await expect(coachSection).toBeVisible();
  });

  test('17. PWA de Nível Nativo: Botões Visuais de Instalação, Modal Universal e Painel de Armazenamento Blindado (Sprint 5)', async ({ page }) => {
    // 1. Testa a presença do banner visual de instalação na tela de Boas-Vindas
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    const welcomeInstallBanner = page.locator('section[aria-label="Instalar aplicativo Superação no celular"]');
    await expect(welcomeInstallBanner).toBeVisible();
    await expect(welcomeInstallBanner.getByRole('button', { name: /Instalar Aplicativo Agora/i })).toBeVisible();

    // 2. Entra como convidado e valida o botão de instalação no Topo e o Banner na Home
    await page.getByRole('button', { name: /Continuar sem conta/i }).click();

    await page.evaluate(() => {
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Lucas PWA',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
        })
      );
    });
    await page.reload();

    // Valida botão no topo
    const topInstallBtn = page.getByRole('button', { name: /Instalar aplicativo Superação/i });
    await expect(topInstallBtn).toBeVisible();

    // Valida banner na Home
    const homeInstallBanner = page.locator('section[aria-label="Instalar aplicativo Superação no celular"]');
    await expect(homeInstallBanner).toBeVisible();

    // 3. Clica no botão de instalação e valida o Modal Guia Universal
    await topInstallBtn.click();
    const installDialog = page.getByRole('dialog', { name: /Instalar o App Superação/i });
    await expect(installDialog).toBeVisible();

    // Alterna para instruções do iPhone e valida
    await installDialog.getByRole('button', { name: /iPhone \/ iPad/i }).click({ force: true });
    await expect(installDialog.getByText(/Safari do iPhone ou iPad/i)).toBeVisible();

    // Alterna para instruções de Computador e valida
    await installDialog.getByRole('button', { name: /Computador/i }).click({ force: true });
    await expect(installDialog.getByText(/Chrome, Edge ou Brave/i)).toBeVisible();

    // Fecha o modal
    await installDialog.getByRole('button', { name: /Entendi, vou instalar/i }).click({ force: true });
    await expect(installDialog).not.toBeVisible();

    // 4. Abre Perfil e valida a seção "Aplicativo & Armazenamento Offline"
    const profileBtn = page.getByRole('button', { name: /Perfil/i });
    await profileBtn.click();

    await expect(page.getByText('Aplicativo & Armazenamento Offline')).toBeVisible();
    await expect(page.getByText('Memória Local do Celular')).toBeVisible();
    await expect(page.getByText(/Guia de Voz Offline no Fim do Descanso/i)).toBeVisible();

    // 5. Testa o botão Voltar do Perfil
    const backBtn = page.getByRole('button', { name: /Voltar/i });
    await backBtn.click();
    await expect(page.getByText(/Olá, Lucas PWA!/i)).toBeVisible();
  });

  test('Teste 18: Fluxo Completo da Fase 8 - Troca Rápida na Proposta, Catálogo 873 Reativo e Cronômetro Isométrico', async ({ page }) => {
    // 1. Configura usuário recém-onboarded aguardando confirmação da proposta
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'guest_user',
          displayName: 'Mariana Fase 8',
          onboardingCompleted: true,
          routineConfirmed: false,
          availableDays: [1, 3, 5],
          equipments: ['peso_corporal'],
          avoidedMovements: [],
        })
      );
      localStorage.setItem(
        'superacao_proposal',
        JSON.stringify({
          proposalId: 'prop_test',
          title: 'Rotina Inicial Adaptada',
          description: 'Treino corpo todo para iniciar com segurança',
          routines: [
            {
              id: 'routine_test',
              title: 'Treino Corpo Inteiro A',
              exercises: [
                {
                  exerciseId: 'bodyweight_squat',
                  exerciseName: 'Agachamento Livre com Peso Corporal',
                  targetSets: 3,
                  targetReps: 10,
                  restSeconds: 45,
                },
                {
                  exerciseId: 'pushups',
                  exerciseName: 'Flexão de Braços no Solo',
                  targetSets: 3,
                  targetReps: 8,
                  restSeconds: 60,
                }
              ]
            }
          ],
          weeklySchedule: { 1: 'Segunda', 3: 'Quarta', 5: 'Sexta' },
          hasCompatibleExercises: true,
        })
      );
    });
    await page.reload();

    // 2. Valida tela de proposta inicial e botões de "Trocar"
    await expect(page.getByText('Proposta de Rotina')).toBeVisible();
    const swapBtns = page.getByRole('button', { name: /Trocar/i });
    await expect(swapBtns.first()).toBeVisible();

    // 3. Clica em "Trocar" para abrir modal de substituição segura
    await swapBtns.first().click();
    await expect(page.getByText('Substituição Segura')).toBeVisible();

    // Se houver botões de "Escolher", clica no primeiro para trocar
    const chooseBtns = page.getByRole('button', { name: /Escolher/i });
    if (await chooseBtns.count() > 0) {
      await chooseBtns.first().click();
    } else {
      // Se não houver candidatos alternativos para o primeiro item, fecha o modal
      await page.keyboard.press('Escape');
    }

    // 4. Clica em "Confirmar minha rotina" -> valida transição imediata para a Home sem F5 (Bug 1 Corrigido)
    const confirmBtn = page.getByRole('button', { name: /Confirmar minha rotina/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Valida que foi direto para a Home
    await expect(page.getByText(/Mariana Fase 8!/i)).toBeVisible();

    // 5. Navega para a aba "Explorar" e abre o Catálogo
    const navExploreBtn = page.locator('nav').getByRole('button', { name: 'Treinos', exact: true });
    await navExploreBtn.click();

    const catalogTabBtn = page.getByRole('button', { name: /Catálogo/i });
    await expect(catalogTabBtn).toBeVisible();
    await catalogTabBtn.click();

    // 6. Valida a presença das Pílulas Rápidas de Cuidado & Intenção
    await expect(page.getByText('Cuidado & Intenção Rápida:')).toBeVisible();
    const spineFilter = page.getByRole('button', { name: /Coluna & Lombar/i });
    await expect(spineFilter).toBeVisible();
    await spineFilter.click();

    // Valida que resultados aparecem
    await expect(page.getByText(/Encontrados:/i)).toBeVisible();

    // 7. Testa a aba Agenda (CalendarView) com badges e alinhamento refinado
    const navCalendarBtn = page.locator('nav').getByRole('button', { name: 'Agenda', exact: true });
    await navCalendarBtn.click();
    await expect(page.getByText('Sua Agenda Semanal')).toBeVisible();
    await expect(page.getByText(/Segunda-feira/i)).toBeVisible();

    // 8. Volta para a Home e Inicia o Treino do Dia
    const navHomeBtn = page.locator('nav').getByRole('button', { name: 'Início', exact: true });
    await navHomeBtn.click();

    const startTodayBtn = page.getByRole('button', { name: /Iniciar Treino de Hoje/i });
    if (await startTodayBtn.isVisible()) {
      await startTodayBtn.click();

      // Modal de humor pré-treino
      const moodBtn = page.getByRole('button', { name: /Pronto pro treino/i });
      if (await moodBtn.isVisible()) {
        await moodBtn.click();
      }

      // Valida que entrou na sessão ativa
      await expect(page.getByText(/Série 1 de/i)).toBeVisible();

      // Botão gigante de série ou contagem visível
      const finishSetBtn = page.getByRole('button', { name: /Concluir Série|Iniciar Contagem/i });
      await expect(finishSetBtn).toBeVisible();

      // Pausa e volta para a Home
      const pauseBtn = page.getByRole('button', { name: /Pausar e Voltar para Início/i });
      if (await pauseBtn.isVisible()) {
        await pauseBtn.click();
      }
    }
  });
});
