import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Superação - Auditoria Visual, Navegação Exaustiva e Verificação de Botões', () => {
  const screenshotsDir = path.resolve('test-results/audit-screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('Auditoria Completa de Ponta a Ponta: Telas, Modais, Botões e Ausência de Erros', async ({ page }, testInfo) => {
    test.setTimeout(90000);
    const projectPrefix = testInfo.project.name.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('Vite config')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // -------------------------------------------------------------
    // 1. TELA DE BOAS-VINDAS & MODAL DE AUTENTICAÇÃO
    // -------------------------------------------------------------
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Superação', exact: true })).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_01_welcome.png` });

    // Testa abertura do Modal de Login/Cadastro
    const authBtn = page.getByRole('button', { name: /Já tenho conta|Entrar com E-mail/i });
    if (await authBtn.isVisible()) {
      await authBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_02_auth_modal.png` });

      // Fecha o modal de autenticação
      const closeAuthBtn = page.locator('dialog button:has-text("✕")').or(page.getByRole('button', { name: /Fechar|Cancelar/i })).first();
      if (await closeAuthBtn.isVisible()) {
        await closeAuthBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Clica em "Continuar sem conta" para iniciar a Jornada de Escuta
    const startBtn = page.getByRole('button', { name: /Continuar sem conta|Começar Agora/i }).first();
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // -------------------------------------------------------------
    // 2. JORNADA DE ESCUTA (ONBOARDING EM 7 PASSOS)
    // -------------------------------------------------------------
    // Passo 1: Nome, Momento e Motivação
    await expect(page.locator('#display_name_input')).toBeVisible();
    await page.locator('#display_name_input').fill('Helena Tester');
    await page.getByRole('button', { name: /Retomando após uma pausa/i }).click();

    const reasonInput = page.locator('#exercise_reason_input');
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Voltar a ter ritmo e vitalidade sem cobrança');
    }
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_03_listening_step1.png` });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 2: Seus Objetivos & Prioridades
    await expect(page.locator('h2')).toContainText('Seus Objetivos & Prioridades');
    const addGoalBtn = page.locator('button:has-text("+ Construir o hábito")').first();
    if (await addGoalBtn.isVisible()) {
      await addGoalBtn.click();
    }
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_04_listening_step2.png` });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 3: Disponibilidade Real
    await expect(page.locator('h2')).toContainText('Sua Disponibilidade Real');
    const dayButtons = page.locator('.grid.grid-cols-7 button');
    if (await dayButtons.count() >= 7) {
      await dayButtons.nth(1).click(); // Segunda
      await dayButtons.nth(3).click(); // Quarta
      await dayButtons.nth(5).click(); // Sexta
    }
    // Seleciona 15 min
    const min15Btn = page.getByRole('button', { name: /15 minutos|15 min/i });
    if (await min15Btn.isVisible()) {
      await min15Btn.click();
    }
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_05_listening_step3_availability.png` });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 4: Equipamentos & Apoios
    await expect(page.locator('h2')).toContainText('Equipamentos & Apoios');
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_06_listening_step4_equipment.png` });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 5: Cuidados & Limitações
    await expect(page.locator('h2')).toContainText('Cuidados & Limitações');
    const limitBtn = page.getByRole('button', { name: /Evitar flexão de braço tradicional no solo/i });
    if (await limitBtn.isVisible()) {
      await limitBtn.click();
    }
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_07_listening_step5_limitations.png` });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 6: O que costuma dificultar sua prática?
    await expect(page.locator('h2')).toContainText('O que costuma dificultar sua prática?');
    const obstacleBtn = page.getByRole('button', { name: /Cansaço mental no fim do dia/i });
    if (await obstacleBtn.isVisible()) {
      await obstacleBtn.click();
    }
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_08_listening_step6_obstacles.png` });
    await page.getByRole('button', { name: /Avançar/i }).click();

    // Passo 7: Resumo das Respostas
    await expect(page.locator('h2')).toContainText('Resumo das suas Respostas');
    await expect(page.getByText('Helena Tester')).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_09_listening_step7_summary.png` });

    // Gera a proposta personalizada
    const viewProposalBtn = page.getByRole('button', { name: /Ver Proposta Personalizada/i });
    await expect(viewProposalBtn).toBeVisible();
    await viewProposalBtn.click();

    // -------------------------------------------------------------
    // 3. TELA DE PROPOSTA EXPLICÁVEL & MODAIS DE TROCA
    // -------------------------------------------------------------
    await expect(page.getByText(/Proposta de Rotina|Proposta Personalizada/i).first()).toBeVisible();
    await expect(page.getByText(/Seu Momento e Motivação Pessoal/i)).toBeVisible();
    // Valida calibração estrita <= 15 min
    await expect(page.getByText(/~\d+ min \(janela de 15 min\)/i)).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_10_proposal_view.png` });

    // Testa modal de "Trocar Exercício"
    const swapBtns = page.getByRole('button', { name: /Trocar/i });
    if (await swapBtns.count() > 0) {
      await swapBtns.first().click();
      await expect(page.getByText(/Substituição Segura/i)).toBeVisible();
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_11_swap_modal.png` });
      // Fecha o modal pelo botão fechar ou Esc
      const closeSwapBtn = page.locator('dialog button:has-text("✕")').or(page.getByRole('button', { name: /Fechar/i })).or(page.locator('button[aria-label="Fechar"]')).first();
      if (await closeSwapBtn.isVisible()) {
        await closeSwapBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Confirma a rotina e navega para a Home
    const confirmProposalBtn = page.getByRole('button', { name: /Confirmar minha rotina/i });
    await expect(confirmProposalBtn).toBeVisible();
    await confirmProposalBtn.click();

    // -------------------------------------------------------------
    // 4. HOMEVIEW (INÍCIO COM ACTIVITYPATH E FOCO DO DIA)
    // -------------------------------------------------------------
    await expect(page.getByRole('heading', { name: /Helena Tester/i })).toBeVisible();
    // Valida trilha semanal do ActivityPath
    await expect(page.getByRole('region', { name: /Caminho da sua semana/i })).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_12_home_view.png` });

    // -------------------------------------------------------------
    // 5. TREINO ATIVO (ACTIVEWORKOUTVIEW) & DESCANSAR HOJE SEM CULPA
    // -------------------------------------------------------------
    const startWorkoutBtn = page.getByRole('button', { name: /Iniciar Treino de Hoje/i });
    if (await startWorkoutBtn.isVisible()) {
      await startWorkoutBtn.click();

      // Modal de check-in pré-treino
      await expect(page.getByText(/Como você está chegando hoje\?/i)).toBeVisible();
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_13_pre_workout_mood_modal.png` });

      // Testa a ação de acolhimento "🤍 Descansar hoje sem culpa"
      const tiredBtn = page.getByRole('button', { name: /Cansado/i });
      if (await tiredBtn.isVisible()) {
        await tiredBtn.click();
        const restBtn = page.getByRole('button', { name: /Descansar hoje sem culpa/i });
        await expect(restBtn).toBeVisible();
        await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_14_rest_without_guilt_option.png` });
      }

      // Muda para humor pronto e inicia a sessão de fato
      const readyBtn = page.getByRole('button', { name: /Pronto pro treino/i });
      if (await readyBtn.isVisible()) {
        await readyBtn.click();
      }

      // Valida tela de execução com modo foco
      await expect(page.getByText(/Série 1 de/i)).toBeVisible();
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_15_active_workout_focus.png` });

      // Conclui uma série para testar timer de descanso
      const completeSetBtn = page.getByRole('button', { name: /Concluir Série|Iniciar Contagem/i });
      if (await completeSetBtn.isVisible()) {
        await completeSetBtn.click();
        // Confirma o sheet de execução
        const saveSetBtn = page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i });
        if (await saveSetBtn.isVisible()) {
          await saveSetBtn.click();
        }
        // Pula o timer de descanso
        const skipRestBtn = page.getByRole('button', { name: /Pular descanso/i });
        try {
          await skipRestBtn.waitFor({ state: 'visible', timeout: 3000 });
          await skipRestBtn.click();
        } catch {
          // Timer já concluído
        }
      }

      // Pausa e volta para a Home
      const pauseBtn = page.getByTitle('Pausar treino e voltar ao início').or(page.getByRole('button', { name: /Pausar/i })).first();
      await expect(pauseBtn).toBeVisible();
      await pauseBtn.click();

      // Valida retorno para a Home
      await expect(page.getByRole('heading', { name: /Helena Tester/i })).toBeVisible();
    }

    // -------------------------------------------------------------
    // 6. ABA EXPLORAR (PROGRAMAS, TREINOS E CATÁLOGO)
    // -------------------------------------------------------------
    const navExploreBtn = page.locator('nav').getByRole('button', { name: 'Treinos', exact: true });
    await navExploreBtn.click();

    // 6.1 Sub-aba Programas
    await expect(page.getByText(/Programas de Longo Prazo/i).first()).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_16_explore_programs.png` });

    // 6.2 Sub-aba Catálogo
    const catalogTabBtn = page.getByRole('button', { name: /Catálogo/i });
    await expect(catalogTabBtn).toBeVisible();
    await catalogTabBtn.click();

    // Testa filtro expansível por equipamento e músculo
    const filterToggleBtn = page.getByRole('button', { name: /Filtrar por equipamento ou músculo/i });
    await expect(filterToggleBtn).toBeVisible();
    await filterToggleBtn.click();
    await expect(page.getByText(/Equipamento Disponível:/i)).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_17_explore_catalog_filters.png` });
    await page.getByRole('button', { name: /Ocultar filtros de equipamento e músculo/i }).click();

    // Testa busca no catálogo
    const searchInput = page.getByPlaceholder(/Buscar em .* exercícios/i).or(page.locator('input[type="text"][placeholder*="Buscar"]')).first();
    await searchInput.fill('Agachamento');
    await expect(page.getByText(/Encontrados:/i)).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_18_explore_catalog_search.png` });

    // Testa abertura do modal de inspeção de exercício
    const exerciseCard = page.locator('div[role="button"]:has-text("Agachamento")').or(page.getByText('Agachamento Livre').first());
    if (await exerciseCard.isVisible()) {
      await exerciseCard.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_19_exercise_detail_modal.png` });
      // Fecha o modal de detalhes
      const closeDetailBtn = page.locator('button[aria-label="Fechar"]').or(page.getByRole('button', { name: /Fechar/i })).or(page.locator('button:has-text("✕")')).first();
      if (await closeDetailBtn.isVisible()) {
        await closeDetailBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // -------------------------------------------------------------
    // 7. ABA AGENDA (CALENDARVIEW)
    // -------------------------------------------------------------
    const navCalendarBtn = page.locator('nav').getByRole('button', { name: 'Agenda', exact: true });
    await navCalendarBtn.click();

    await expect(page.getByText('Sua Agenda Semanal')).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_20_calendar_view.png` });

    // -------------------------------------------------------------
    // 8. ABA PROGRESSO (PROGRESSVIEW & ACTIVITYPATH COMPLETO)
    // -------------------------------------------------------------
    const navProgressBtn = page.locator('nav').getByRole('button', { name: 'Progresso', exact: true });
    await navProgressBtn.click();

    // Valida ActivityPath variant="full"
    await expect(page.getByRole('region', { name: /Caminho Pessoal de Progresso/i })).toBeVisible();
    await expect(page.getByText(/Etapa Atual & Próximo Marco Alcançável/i)).toBeVisible();
    // Valida Trilhas Biomecânicas
    await expect(page.getByText(/Trilhas de Evolução Biomecânica/i)).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_21_progress_view.png` });

    // Testa alternância das conquistas (Ver todos / Mostrar resumo)
    const toggleBadgesBtn = page.getByRole('button', { name: /Ver todos|Mostrar resumo/i });
    if (await toggleBadgesBtn.isVisible()) {
      await toggleBadgesBtn.click();
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_22_progress_badges_expanded.png` });
    }

    // Testa alternância das trilhas biomecânicas (Ver todas / Menos)
    const toggleLaddersBtn = page.getByRole('button', { name: /Ver todas|Menos/i });
    if (await toggleLaddersBtn.isVisible()) {
      await toggleLaddersBtn.click();
      await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_23_progress_ladders_expanded.png` });
    }

    // -------------------------------------------------------------
    // 9. CONSTRUTOR DE TREINO (BUILDERVIEW)
    // -------------------------------------------------------------
    await page.locator('nav').getByRole('button', { name: 'Treinos', exact: true }).click();
    const manualPlanBtn = page.getByRole('button', { name: /Criar Ficha Manual/i }).first();
    await manualPlanBtn.scrollIntoViewIfNeeded();
    await manualPlanBtn.click();
    await expect(page.getByText('Novo Treino')).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_24_builder_view.png` });

    // Volta para Treinos
    const backFromBuilderBtn = page.getByRole('button', { name: /Voltar/i }).first();
    await expect(backFromBuilderBtn).toBeVisible();
    await backFromBuilderBtn.click();

    // -------------------------------------------------------------
    // 10. TELA DE PERFIL (PROFILEVIEW)
    // -------------------------------------------------------------
    await page.locator('nav').getByRole('button', { name: 'Início', exact: true }).click();
    const profileBtn = page.getByRole('button', { name: /Perfil do usuário/i }).or(page.getByTitle(/Abrir Perfil e Configurações/i)).first();
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();
    await expect(page.getByText('Perfil & Configurações')).toBeVisible();
    await page.screenshot({ path: `${screenshotsDir}/${projectPrefix}_25_profile_view.png` });

    // Volta para a Home
    const backProfileBtn = page.getByRole('button', { name: /Voltar/i }).first();
    await expect(backProfileBtn).toBeVisible();
    await backProfileBtn.click();

    // -------------------------------------------------------------
    // 11. AUDITORIA DE ERROS DO CONSOLE E RUNTIME
    // -------------------------------------------------------------
    expect(pageErrors, `Erros não tratados na página: ${JSON.stringify(pageErrors)}`).toEqual([]);
    expect(consoleErrors, `Erros no console do navegador: ${JSON.stringify(consoleErrors)}`).toEqual([]);
  });
});
