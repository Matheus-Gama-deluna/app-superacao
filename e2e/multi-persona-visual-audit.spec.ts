import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = 'C:/Users/matheus.luna/.gemini/antigravity/brain/2b7a21d6-76a6-4049-815a-082d63d6e1b3/persona-audit-screenshots';

test.describe('Superação - Auditoria Visual Multi-Persona e Fluxos de Utilização', () => {
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

  test('Persona 1: Joana - Iniciante com Limitações Articulares, Cansaço, Ritmo Suave e Espelho de Bem-Estar', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_01_welcome.png'), fullPage: true });

    // Iniciar escuta como convidado
    await page.getByRole('button', { name: /Continuar sem conta/i }).click();

    // 1. Nome
    await page.locator('#display_name_input').fill('Joana');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_02_listening_name.png') });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // 2. Objetivos: Alívio de tensão e postura / Construir hábito
    const goalBtn = page.locator('button:has-text("Melhorar postura e aliviar tensões"), button:has-text("Construir o hábito")').first();
    if (await goalBtn.isVisible()) {
      await goalBtn.click();
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_03_listening_goals.png') });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // 3. Disponibilidade: garantir que o dia de hoje está explicitamente marcado
    const daysLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayDow = new Date().getDay();
    const todayLabel = daysLabels[todayDow];
    const todayDayBtn = page.locator(`button:has-text("${todayLabel}")`).first();
    if (await todayDayBtn.isVisible()) {
      const ariaLabel = await todayDayBtn.getAttribute('aria-label');
      if (ariaLabel && !ariaLabel.includes('selecionado')) {
        await todayDayBtn.click();
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_04_listening_availability.png') });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // 4. Equipamentos: Peso corporal
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_05_listening_equipment.png') });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // 5. Restrições e limitações: Dores lombares / sem impacto
    const avoidLombar = page.locator('button:has-text("Tensões ou dores lombares"), button:has-text("Sobrecarga lombar")').first();
    if (await avoidLombar.isVisible()) await avoidLombar.click();
    const avoidFlexao = page.locator('button:has-text("Flexão de braço tradicional"), button:has-text("Flexão de braço no chão")').first();
    if (await avoidFlexao.isVisible()) await avoidFlexao.click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_06_listening_limitations.png') });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // 6. Obstáculos: Dias imprevisíveis ou pouco tempo
    const obstacleOption = page.locator('button:has-text("Dias imprevisíveis"), button:has-text("Cansaço mental")').first();
    if (await obstacleOption.isVisible()) await obstacleOption.click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_07_listening_obstacles.png') });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // 7. Resumo e Escolha Transparente: Ver Proposta Personalizada
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_08_listening_summary.png'), fullPage: true });
    const proposalBtn = page.getByRole('button', { name: /Ver Proposta Personalizada/i });
    await expect(proposalBtn).toBeVisible({ timeout: 10000 });
    await proposalBtn.click();

    // Tela de Proposta Explicável
    await expect(page.locator('text=Confirmar minha rotina').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_09_proposal_view.png'), fullPage: true });

    // Aceita proposta e vai para Home
    await page.getByRole('button', { name: /Confirmar minha rotina/i }).click();

    // HomeView - Fold 1
    await expect(page.locator('text=Joana').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_10_home_view.png'), fullPage: true });

    // Joana seleciona estado "Cansado" no seletor de humor da Home
    const cansadoMoodBtn = page.locator('button:has-text("Cansado")').first();
    if (await cansadoMoodBtn.isVisible()) {
      await cansadoMoodBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_11_preworkout_mood_soften.png') });
    }

    // Clica no CTA "Suavizar e começar (-25%)" ou "Iniciar Treino"
    const startTodayWorkoutBtn = page.locator('button:has-text("Suavizar e começar (-25%)"), button:has-text("Iniciar Treino de Hoje")').first();
    if (await startTodayWorkoutBtn.isVisible()) {
      await startTodayWorkoutBtn.click();
    } else {
      // Se caiu em dia sem treino agendado, inicia alongamento de recuperação ou caminhada
      const mobilityBtn = page.locator('button:has-text("Alongamento / Mobilidade")').first();
      if (await mobilityBtn.isVisible()) await mobilityBtn.click();
    }

    // Treino Ativo no Ritmo Suave
    await page.waitForTimeout(600);
    await expect(page.locator('text=Modo Foco').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_12_active_workout_softened.png'), fullPage: true });

    // Joana conclui uma série
    const completeSetBtn = page.locator('button[aria-label="Concluir série do exercício"], button:has-text("Concluir Série")').first();
    if (await completeSetBtn.isVisible()) {
      await completeSetBtn.click();
      await page.waitForTimeout(300);

      // Drawer de confirmação
      const confirmDrawerSaveBtn = page.locator('button:has-text("Confirmar e Descansar"), button:has-text("Confirmar")').first();
      if (await confirmDrawerSaveBtn.isVisible()) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona1_13_set_confirm_drawer.png') });
        await confirmDrawerSaveBtn.click();
      }
    }
  });

  test('Persona 2: Carlos - Praticante Consistente, Gestão Semanal sem Culpa e Compartilhamento', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dow = today.getDay();

      const profile = {
        uid: 'guest_user',
        displayName: 'Carlos',
        onboardingCompleted: true,
        routineConfirmed: true,
        availableDays: [1, 3, 5],
        sessionDurationMinutes: 20,
        experienceLevel: 'pratica',
        equipments: ['peso_corporal', 'halteres'],
        limitations: [],
        motivationStyle: 'consistency',
        exerciseReason: 'Manter energia e saúde para brincar com meus filhos todos os dias',
        soundEnabled: false,
        hapticEnabled: true,
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now(),
      };

      const plans = [
        {
          id: 'plan_carlos_a',
          ownerUid: 'guest_user',
          title: 'Treino A - Força Natural',
          description: 'Treino equilibrado de força funcional',
          version: 1,
          isProfessional: false,
          estimatedDurationMinutes: 20,
          createdAt: Date.now() - 30 * 86400000,
          updatedAt: Date.now(),
          exercises: [
            {
              exerciseId: 'squat_bodyweight',
              exerciseName: 'Agachamento Livre',
              targetSets: 3,
              targetReps: 12,
              restSeconds: 45,
            },
            {
              exerciseId: 'pushup_incline',
              exerciseName: 'Flexão Inclinada',
              targetSets: 3,
              targetReps: 10,
              restSeconds: 45,
            },
          ],
        },
      ];

      const calendar = [
        { id: 'c1', ownerUid: 'guest_user', dateStr: '2026-10-26', dayOfWeek: 1, activityType: 'strength', isCompleted: true, planId: 'plan_carlos_a', planTitle: 'Treino A - Força Natural' },
        { id: 'c2', ownerUid: 'guest_user', dateStr: todayStr, dayOfWeek: dow, activityType: 'strength', isCompleted: false, planId: 'plan_carlos_a', planTitle: 'Treino A - Força Natural' },
        { id: 'c3', ownerUid: 'guest_user', dateStr: '2026-10-31', dayOfWeek: 6, activityType: 'strength', isCompleted: false, planId: 'plan_carlos_a', planTitle: 'Treino A - Força Natural' },
      ];

      const sessions = [
        {
          id: 'sess_1',
          ownerUid: 'guest_user',
          planId: 'plan_carlos_a',
          planTitle: 'Treino A - Força Natural',
          status: 'completed',
          startedAt: today.getTime() - 86400000 * 3,
          date: '2026-10-26',
          durationSeconds: 960,
          currentExerciseIndex: 0,
          currentSetIndex: 1,
          totalSetsPlanned: 6,
          totalSetsCompleted: 6,
          totalRepsCompleted: 66,
          prsAchieved: 1,
          feedbackEffort: 3,
          preMood: 'cansado',
          postMood: 'renovado',
          exercisesSnapshot: [],
        },
      ];

      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem('superacao_is_guest', JSON.stringify(true));
      localStorage.setItem('superacao_user_profile', JSON.stringify(profile));
      localStorage.setItem('superacao_plans', JSON.stringify(plans));
      localStorage.setItem('superacao_calendar', JSON.stringify(calendar));
      localStorage.setItem('superacao_sessions', JSON.stringify(sessions));
    });

    await page.reload();

    // 1. HomeView de Carlos com Trilha Semanal e Saudação
    await expect(page.locator('text=Carlos').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona2_01_home_consistent.png'), fullPage: true });

    // 2. Agenda (CalendarView)
    const agendaTab = page.locator('button:has-text("Agenda")').first();
    await agendaTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona2_02_calendar_view.png'), fullPage: true });

    // 3. Progresso (ProgressView) com Ritmo Semanal Consciente (T17)
    const progressTab = page.locator('button:has-text("Progresso")').first();
    await progressTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Ritmo Semanal Consciente')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona2_03_progress_rhythm_review.png'), fullPage: true });

    // 4. Carlos testa a ação de 1 toque: "Suavizar (-1 dia)" ou "Manter meta"
    const softenBtn = page.locator('button:has-text("Suavizar (-1 dia)")').first();
    if (await softenBtn.isVisible()) {
      await softenBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona2_04_progress_goal_calibrated.png') });
    }

    // 5. Carlos clica no botão "Compartilhar" conquistas
    const shareBtn = page.locator('button[aria-label="Compartilhar resumo de conquistas"], button:has-text("Compartilhar Conquistas"), button:has-text("Compartilhar")').first();
    if (await shareBtn.isVisible()) {
      await shareBtn.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona2_05_progress_share_clicked.png') });
    }
  });

  test('Persona 3: Beatriz - Dia de Imprevisto, Gestão de Obstáculos e Descanso Consciente sem Culpa', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dow = today.getDay();

      const profile = {
        uid: 'guest_user',
        displayName: 'Beatriz',
        onboardingCompleted: true,
        routineConfirmed: true,
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        sessionDurationMinutes: 15,
        experienceLevel: 'iniciante',
        equipments: ['peso_corporal'],
        limitations: [],
        motivationStyle: 'wellbeing',
        exerciseReason: 'Diminuir a ansiedade e ter um momento de pausa para mim',
        soundEnabled: false,
        hapticEnabled: true,
        createdAt: Date.now() - 10 * 86400000,
        updatedAt: Date.now(),
      };

      const plans = [
        {
          id: 'plan_beatriz',
          ownerUid: 'guest_user',
          title: 'Treino A - Despertar Leve',
          description: 'Movimentos suaves para começar o dia com calma',
          version: 1,
          isProfessional: false,
          estimatedDurationMinutes: 15,
          createdAt: Date.now() - 10 * 86400000,
          updatedAt: Date.now(),
          exercises: [
            {
              exerciseId: 'squat_chair',
              exerciseName: 'Sentar e Levantar da Cadeira',
              targetSets: 2,
              targetReps: 10,
              restSeconds: 30,
            },
          ],
        },
      ];

      const calendar = [
        {
          id: 'b1',
          ownerUid: 'guest_user',
          dateStr: todayStr,
          dayOfWeek: dow,
          activityType: 'strength',
          isCompleted: false,
          planId: 'plan_beatriz',
          planTitle: 'Treino A - Despertar Leve',
        },
      ];

      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem('superacao_is_guest', JSON.stringify(true));
      localStorage.setItem('superacao_user_profile', JSON.stringify(profile));
      localStorage.setItem('superacao_plans', JSON.stringify(plans));
      localStorage.setItem('superacao_calendar', JSON.stringify(calendar));
    });

    await page.reload();

    // HomeView de Beatriz
    await expect(page.locator('text=Beatriz').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona3_01_home_before_obstacle.png'), fullPage: true });

    // Clica na pílula "Surgiu um imprevisto hoje?"
    const obstacleBtn = page.locator('button[aria-label="Abrir plano de ação para imprevistos"]').first();
    await expect(obstacleBtn).toBeVisible({ timeout: 5000 });
    await obstacleBtn.click();
    await page.waitForTimeout(400);

    // Modal Se-Então aberto
    await expect(page.locator('text=Respostas Rápidas Se-Então').first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona3_02_coping_modal.png') });

    // Fecha o modal Se-Então
    await page.locator('button:has-text("Fechar")').click();
    await page.waitForTimeout(400);

    // Beatriz abre o diálogo "Antes de começar" para registrar descanso sem culpa
    const antesDeComecarBtn = page.locator('button:has-text("Antes de começar")').first();
    await expect(antesDeComecarBtn).toBeVisible({ timeout: 5000 });
    await antesDeComecarBtn.click();
    await page.waitForTimeout(400);

    // Seleciona sensação "Cansado" DENTRO do diálogo modal
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog.locator('button:has-text("Cansado")').first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona3_02b_preworkout_rest_option.png') });

    // Clica em "🤍 Descansar hoje sem culpa" dentro do diálogo
    const restWithoutGuiltBtn = dialog.locator('button:has-text("Descansar hoje sem culpa")').first();
    await expect(restWithoutGuiltBtn).toBeVisible({ timeout: 5000 });
    await restWithoutGuiltBtn.click();

    // HomeView atualizada com o estado de descanso e regeneração
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona3_03_home_after_rest_without_guilt.png'), fullPage: true });

    // Valida que o card acolhedor de descanso sem culpa é renderizado
    await expect(page.getByRole('heading', { name: 'O descanso é onde o corpo se regenera' })).toBeVisible({ timeout: 5000 });
  });

  test('Persona 4: Lucas - Desafio, Troca Inteligente de Exercício e Conclusão com Espelho de Bem-Estar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const profile = {
        uid: 'guest_user',
        displayName: 'Lucas',
        onboardingCompleted: true,
        routineConfirmed: true,
        availableDays: [1, 3, 5],
        sessionDurationMinutes: 20,
        experienceLevel: 'pratica',
        equipments: ['peso_corporal', 'halteres', 'kettlebell'],
        limitations: [],
        motivationStyle: 'performance',
        exerciseReason: 'Fortalecer meu corpo e alcançar minha melhor forma física',
        soundEnabled: false,
        hapticEnabled: true,
        createdAt: Date.now() - 60 * 86400000,
        updatedAt: Date.now(),
      };

      const activePlan = {
        id: 'plan_lucas_full',
        ownerUid: 'guest_user',
        title: 'Treino A - Força e Potência',
        description: 'Treino de desempenho',
        version: 1,
        isProfessional: false,
        estimatedDurationMinutes: 15,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        exercises: [
          {
            exerciseId: 'squat_bodyweight',
            exerciseName: 'Agachamento Livre',
            targetSets: 1,
            targetReps: 15,
            restSeconds: 30,
          },
          {
            exerciseId: 'plank_isometric',
            exerciseName: 'Prancha Frontal',
            targetSets: 1,
            targetReps: 0,
            targetDurationSeconds: 20,
            restSeconds: 30,
          },
        ],
      };

      const activeSession = {
        id: 'sess_lucas_active',
        ownerUid: 'guest_user',
        planId: activePlan.id,
        planTitle: activePlan.title,
        status: 'in_progress',
        startedAt: Date.now() - 600000, // 10 min atrás
        durationSeconds: 600,
        currentExerciseIndex: 0,
        currentSetIndex: 1,
        totalSetsPlanned: 2,
        totalSetsCompleted: 0,
        totalRepsCompleted: 0,
        prsAchieved: 1,
        preMood: 'cansado',
        exercisesSnapshot: activePlan.exercises,
      };

      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem('superacao_is_guest', JSON.stringify(true));
      localStorage.setItem('superacao_user_profile', JSON.stringify(profile));
      localStorage.setItem('superacao_plans', JSON.stringify([activePlan]));
      localStorage.setItem('superacao_active_session', JSON.stringify(activeSession));
    });

    await page.reload();

    // 1. Lucas entra diretamente no Modo Foco com o treino ativo restaurado
    await page.waitForTimeout(600);
    await expect(page.locator('text=Modo Foco').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona4_01_active_workout_ongoing.png'), fullPage: true });

    // 2. Lucas clica em "Trocar" exercício
    const swapBtn = page.locator('button[aria-label="Trocar exercício por equivalente seguro"], button:has-text("Trocar")').first();
    if (await swapBtn.isVisible()) {
      await swapBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona4_02_swap_modal.png') });

      // Fecha o modal de troca via Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 3. Lucas conclui a primeira série do agachamento
    const completeFirstSetBtn = page.locator('button[aria-label="Concluir série do exercício"], button:has-text("Concluir Série")').first();
    if (await completeFirstSetBtn.isVisible()) {
      await completeFirstSetBtn.click();
      await page.waitForTimeout(400);

      // Clica no botão exato do drawer
      const saveSetBtn = page.locator('button:has-text("Salvar Registro & Iniciar Descanso")').first();
      await expect(saveSetBtn).toBeVisible({ timeout: 5000 });
      await saveSetBtn.click();
      await page.waitForTimeout(400);

      // Pula o descanso para ir ao segundo exercício (Prancha Isométrica)
      const skipRestBtn = page.locator('button:has-text("Iniciar Série Já"), button:has-text("Pular descanso")').first();
      if (await skipRestBtn.isVisible()) {
        await skipRestBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // 4. Segundo exercício: Prancha Frontal (Isometria)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona4_03_isometric_exercise_view.png'), fullPage: true });

    // Inicia cronômetro isométrico ao vivo
    const startTimerBtn = page.locator('button:has-text("Iniciar Contagem")').first();
    if (await startTimerBtn.isVisible()) {
      await startTimerBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona4_04_isometric_timer_running.png') });

      // Conclui contagem antecipada / parar cronômetro
      const stopTimerBtn = page.locator('button:has-text("Concluir ("), button[title="Concluir tempo"]').first();
      if (await stopTimerBtn.isVisible()) {
        await stopTimerBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Salva série final no drawer para abrir a tela de vitória S10
    const saveFinalSetBtn = page.locator('button:has-text("Salvar Registro & Iniciar Descanso")').first();
    if (await saveFinalSetBtn.isVisible()) {
      await saveFinalSetBtn.click();
      await page.waitForTimeout(800);
    } else {
      const finishSetBtn = page.locator('button:has-text("Concluir Série")').first();
      if (await finishSetBtn.isVisible()) {
        await finishSetBtn.click();
        await page.waitForTimeout(400);
        const confBtn = page.locator('button:has-text("Salvar Registro & Iniciar Descanso")').first();
        if (await confBtn.isVisible()) await confBtn.click();
      }
    }

    await page.waitForTimeout(800);

    // 5. Tela de Vitória com o Espelho de Bem-Estar (A Transformação de Hoje)
    await expect(page.getByRole('heading', { name: 'Parabéns pela superação!' })).toBeVisible({ timeout: 10000 });
    
    // Lucas seleciona a sensação pós-treino "Com energia" (renovado)
    const renovadoBtn = page.locator('button:has-text("Com energia"), button:has-text("renovado"), button:has-text("Energizado")').first();
    if (await renovadoBtn.isVisible()) {
      await renovadoBtn.click();
      await page.waitForTimeout(400);
    }

    // Captura o Espelho de Bem-Estar (A Transformação de Hoje: De Cansado para Com Energia)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona4_05_victory_mirror_turnaround.png'), fullPage: true });

    // Clica no botão de Compartilhar Vitória
    const shareVictoryBtn = page.locator('button:has-text("Compartilhar Vitória")').first();
    if (await shareVictoryBtn.isVisible()) {
      await shareVictoryBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'persona4_06_victory_shared_feedback.png') });
    }
  });
});
