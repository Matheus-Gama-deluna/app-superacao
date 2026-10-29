import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = 'C:/Users/matheus.luna/.gemini/antigravity/brain/2b7a21d6-76a6-4049-815a-082d63d6e1b3/persona-audit-screenshots/round2_visual_audit';

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Rodada 2: Auditoria Visual Completa, Multi-Perfis & Integração Professor-Aluno', () => {

  test('Cenário 1: Integração Professor-Aluno (Fluxo Completo, Anamnese com Fotos & Prescrição Semanal)', async ({ browser }) => {
    test.setTimeout(60000);
    // 1. Contexto do Professor (Mobile Pixel 5)
    const teacherContext = await browser.newContext({
      viewport: { width: 393, height: 851 },
      deviceScaleFactor: 2,
    });
    const pageTeacher = await teacherContext.newPage();

    await pageTeacher.goto('/');
    await pageTeacher.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
    });
    await pageTeacher.reload();

    // Professor entra no app
    await pageTeacher.getByRole('button', { name: /Continuar sem conta/i }).click();
    await pageTeacher.locator('#displayNameInput').fill('Prof. Ricardo Silveira');
    await pageTeacher.getByText('Sou Professor / Personal / Treinador').click();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '01_prof_quick_identification_mobile.png') });
    await pageTeacher.getByRole('button', { name: 'Continuar para o Superação' }).click();

    // Professor no Painel do Treinador
    await expect(pageTeacher.getByText('Painel do Treinador')).toBeVisible();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '02_prof_dashboard_initial_mobile.png') });

    // Professor abre o Construtor de Anamnese para customizar
    await pageTeacher.getByRole('button', { name: 'Minha Anamnese' }).click();
    await expect(pageTeacher.getByRole('dialog', { name: 'Construtor de Anamnese do Professor' })).toBeVisible();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '03_prof_anamnesis_builder_open.png') });

    // Professor adiciona Pergunta Customizada de Escala (Dor / Estresse)
    await pageTeacher.getByRole('button', { name: '+ Adicionar Pergunta' }).click();
    const titleInput = pageTeacher.locator('input[placeholder="Ex: Qual seu principal objetivo?"]').last();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Nível de estresse ou dor nas costas no trabalho (0 a 10)');
    }
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '04_prof_anamnesis_question_added.png') });

    // Fecha o modal do construtor
    await pageTeacher.getByLabel('Fechar').first().click();

    // 2. Contexto do Aluno (Mobile Pixel 5)
    const studentContext = await browser.newContext({
      viewport: { width: 393, height: 851 },
      deviceScaleFactor: 2,
    });
    const pageStudent = await studentContext.newPage();

    await pageStudent.goto('/');
    await pageStudent.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await pageStudent.reload();

    // Aluna entra no app
    await pageStudent.getByRole('button', { name: /Continuar sem conta/i }).click();
    await pageStudent.locator('#displayNameInput').fill('Fernanda Lima');
    await pageStudent.getByText('Sou Praticante / Aluno').click();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '05_student_quick_id_mobile.png') });
    await pageStudent.getByRole('button', { name: 'Continuar para o Superação' }).click();

    // Aluna vê a Home limpa
    await expect(pageStudent.getByText('Olá, Fernanda Lima!')).toBeVisible();
    await expect(pageStudent.getByText('Montar Meu Treino Personalizado')).toBeVisible();
    await expect(pageStudent.getByText('Treinar com um Professor')).toBeVisible();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '06_student_empty_home.png') });

    // Aluna se vincula ao professor usando o código PROF-DEMO
    await pageStudent.getByRole('button', { name: 'Inserir Código do Professor' }).click();
    await expect(pageStudent.getByRole('dialog', { name: 'Vincular ao Professor' })).toBeVisible();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '07_student_code_dialog.png') });

    await pageStudent.locator('#teacherCodeInput').fill('PROF-DEMO');
    await pageStudent.getByRole('button', { name: 'Conectar e Iniciar' }).click();

    // Aluna preenche a Anamnese Customizada com Fotos
    await expect(pageStudent.getByRole('heading', { name: /Anamnese e Avaliação/i })).toBeVisible();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '08_student_fills_anamnesis.png') });

    // Aluna seleciona opções
    const optionHealth = pageStudent.locator('button:has-text("Saúde"), button:has-text("Construir")').first();
    if (await optionHealth.isVisible()) {
      await optionHealth.click();
    }

    // Marca limitação: Dor lombar
    const lombarOption = pageStudent.locator('button:has-text("Coluna / Lombar"), button:has-text("Lombar")').first();
    if (await lombarOption.isVisible()) {
      await lombarOption.click();
    }

    // Simula envio de foto corporal / postura via input de arquivo
    const fileChooserPromise = pageStudent.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null);
    const uploadBtn = pageStudent.locator('button:has-text("Tirar / Enviar Foto"), button:has-text("Adicionar Foto")').first();
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();
      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
        const testImageBuffer = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          'base64'
        );
        await fileChooser.setFiles({
          name: 'postura_teste.png',
          mimeType: 'image/png',
          buffer: testImageBuffer,
        });
      }
    }

    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '09_student_anamnesis_with_photo.png') });

    // Aluna finaliza e envia para o professor
    await pageStudent.getByRole('button', { name: 'Finalizar e Enviar para o Professor' }).click();

    // Tela de confirmação acolhedora
    await expect(pageStudent.getByText('Avaliação Entregue ao Professor!')).toBeVisible();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '10_student_anamnesis_delivered.png') });

    await pageStudent.getByRole('button', { name: 'Ir para Minha Tela Inicial' }).click();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '11_student_home_after_submission.png') });

    // 3. Volta para o Professor para inspecionar prontuário e prescrever
    await pageTeacher.bringToFront();
    await pageTeacher.getByRole('button', { name: '+ Aluno Exemplo' }).click();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '12_prof_sees_student_in_roster.png') });

    // Prontuário do Aluno aberto
    await expect(pageTeacher.getByText('Avaliação Preenchida pelo Aluno')).toBeVisible();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '13_prof_inspects_medical_record.png') });

    // Professor vai para Prescrição Semanal (7 dias)
    await pageTeacher.getByRole('button', { name: /Prescrição Semanal/i }).click();
    await expect(pageTeacher.getByText('Grade Semanal de 7 Dias')).toBeVisible();

    // Aciona Co-Piloto IA
    await pageTeacher.getByRole('button', { name: /Sugerir com IA/i }).click();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '14_prof_ai_suggested_regime.png') });

    // Salva e publica a prescrição
    await pageTeacher.getByRole('button', { name: 'Salvar e Publicar para o Aluno' }).click();
    await expect(pageTeacher.getByText(/Prescrição publicada em tempo real/i)).toBeVisible();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '15_prof_prescription_published.png') });
    await expect(pageTeacher.getByText(/Prescrição publicada em tempo real/i)).toBeVisible();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '15_prof_prescription_published.png') });

    // Alterna para "Meu Treino Pessoal" e depois volta
    await pageTeacher.getByRole('button', { name: 'Meu Treino Pessoal' }).click();
    await expect(pageTeacher.getByText('Você está visualizando seu Treino Pessoal')).toBeVisible();
    await pageTeacher.screenshot({ path: path.join(SCREENSHOT_DIR, '16_prof_personal_workout_mode.png') });

    await pageTeacher.getByRole('button', { name: '← Voltar ao Painel do Treinador' }).click();
    await expect(pageTeacher.getByText('Painel do Treinador')).toBeVisible();

    // 4. Validação na Aluna: injeta a prescrição recebida do professor e visualiza Home
    await pageStudent.bringToFront();
    await pageStudent.evaluate(() => {
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const assignedPlans = [
        {
          id: 'plan_treino_a',
          title: 'Treino A · Fortalecimento & Postura',
          description: 'Prescrição personalizada focada em estabilidade do core e membros inferiores.',
          category: 'forca',
          estimatedDurationMinutes: 25,
          exercises: [
            {
              exerciseId: 'ponte_gluteos',
              exerciseName: 'Ponte de Glúteos no Solo',
              targetSets: 3,
              targetReps: 12,
              targetDurationSeconds: 0,
              restBetweenSetsSeconds: 45,
              recommendedRpe: 6,
              warmupTips: 'Mantenha calcanhares firmes e abdômen ativado.',
              postureTips: 'Contraia o abdômen e glúteos no topo sem hiperestender a lombar.',
              avoidMovementWarning: 'Evite arquear excessivamente a lombar.',
            },
            {
              exerciseId: 'bird_dog',
              exerciseName: 'Bird-Dog (Perdigueiro)',
              targetSets: 3,
              targetReps: 10,
              targetDurationSeconds: 0,
              restBetweenSetsSeconds: 45,
              recommendedRpe: 5,
              warmupTips: 'Coluna neutra em quatro apoios.',
              postureTips: 'Estenda braço e perna opostos sem girar a bacia.',
            },
          ],
        },
      ];

      localStorage.setItem('superacao_plans', JSON.stringify(assignedPlans));
      localStorage.setItem('superacao_calendar', JSON.stringify([
        {
          id: `day_${dateStr}`,
          ownerUid: 'guest_user',
          dateStr,
          dayOfWeek: currentDayOfWeek,
          activityType: 'strength',
          planId: 'plan_treino_a',
          planTitle: 'Treino A · Fortalecimento & Postura',
          isCompleted: false,
          notes: 'Treino adaptado pelo Prof. Ricardo para proteger sua lombar.',
        }
      ]));
    });

    await pageStudent.reload();
    await expect(pageStudent.getByText('Treino Planejado para Hoje')).toBeVisible();
    await expect(pageStudent.getByRole('heading', { name: 'Treino A · Fortalecimento & Postura' })).toBeVisible();
    await pageStudent.screenshot({ path: path.join(SCREENSHOT_DIR, '17_student_home_with_prescribed_workout.png') });

    await teacherContext.close();
    await studentContext.close();
  });

  test('Cenário 2: Perfil Aluno Autônomo (Criação de Rotina, ProposalView & Execução Ativa)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 }); // Pixel 5 Mobile

    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
    });
    await page.reload();

    // 1. Continua sem conta como Aluno Autônomo
    await page.getByRole('button', { name: /Continuar sem conta/i }).click();
    await page.locator('#displayNameInput').fill('Carlos Autônomo');
    await page.getByText('Sou Praticante / Aluno').click();
    await page.getByRole('button', { name: 'Continuar para o Superação' }).click();

    // 2. Clica em "Montar Meu Treino Personalizado"
    await expect(page.getByText('Montar Meu Treino Personalizado')).toBeVisible();
    await page.getByRole('button', { name: 'Responder e Criar Meu Plano' }).click();

    // 3. Responde aos passos da escuta acolhedora (ListeningJourneyView)
    // Passo 1: Seu Momento
    await expect(page.getByRole('heading', { name: 'Como prefere ser chamado?' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_autonomous_listening_step1.png') });
    await page.getByRole('button', { name: 'Avançar' }).click();

    // Passo 2: Seus Objetivos & Prioridades
    await expect(page.getByRole('heading', { name: 'Seus Objetivos & Prioridades' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_autonomous_listening_step2.png') });
    await page.getByRole('button', { name: 'Avançar' }).click();

    // Passo 3: Sua Disponibilidade Real
    await expect(page.getByRole('heading', { name: 'Sua Disponibilidade Real' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_autonomous_listening_step3.png') });
    await page.getByRole('button', { name: 'Avançar' }).click();

    // Passo 4: Equipamentos & Apoios
    await expect(page.getByRole('heading', { name: 'Equipamentos & Apoios' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_autonomous_listening_step4.png') });
    await page.getByRole('button', { name: 'Avançar' }).click();

    // Passo 5: Cuidados & Limitações
    await expect(page.getByRole('heading', { name: 'Cuidados & Limitações' }).first()).toBeVisible();
    // Seleciona dor lombar
    await page.locator('button:has-text("Tensões ou dores lombares")').first().click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_autonomous_listening_step5.png') });
    await page.getByRole('button', { name: 'Avançar' }).click();

    // Passo 6: O que costuma dificultar sua prática?
    await expect(page.getByRole('heading', { name: 'O que costuma dificultar sua prática?' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_autonomous_listening_step6.png') });
    await page.getByRole('button', { name: 'Avançar' }).click();

    // Passo 7: Resumo das suas Respostas & Escolha de Início
    await expect(page.getByRole('heading', { name: 'Resumo das suas Respostas' }).first()).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24_autonomous_listening_step7.png') });
    await page.getByRole('button', { name: /Ver Proposta Personalizada para Mim/i }).click();

    // 4. Tela de Proposta Personalizada (ProposalView)
    await expect(page.getByRole('heading', { name: /Rotina Personalizada/i })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25_autonomous_proposal_full_view.png') });

    // Confirma e inicia a rotina
    await page.getByRole('button', { name: /Confirmar minha rotina/i }).click();

    // 5. Home com Dia de Descanso & Regeneração (hoje é quinta-feira, dias ativos eram seg/qua/sex)
    await expect(page.getByText('Dia de Descanso & Regeneração')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26_autonomous_home_fold1_ready.png') });

    // 6. Inicia a Mobilidade Guiada -> ActiveWorkoutView
    await page.getByRole('button', { name: /Alongamento \/ Mobilidade/i }).click();
    await expect(page.getByRole('heading', { name: 'Gato e Vaca (Mobilidade da Coluna)' })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27_active_workout_with_ai_cue.png') });

    // Testa modal de Trocar Exercício Seguro
    const swapBtn = page.getByRole('button', { name: /Trocar exercício por equivalente seguro/i });
    if (await swapBtn.isVisible()) {
      await swapBtn.click();
      const swapDialog = page.getByRole('dialog', { name: /Substituir Exercício/i });
      await expect(swapDialog).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28_safe_exercise_swap_dialog.png') });
      // Fecha modal de troca usando o aria-label que adicionamos
      await page.getByLabel('Fechar substituição').click();
    }

    // Registra uma série
    const recordSetBtn = page.getByRole('button', { name: /Concluir série do exercício/i });
    if (await recordSetBtn.isVisible()) {
      await recordSetBtn.click();
      // Confirma e salva no drawer
      const saveSetBtn = page.getByRole('button', { name: /Salvar Registro/i });
      if (await saveSetBtn.isVisible()) {
        await saveSetBtn.click();
      }
    }

    // Encerrar sessão / Conclui treino e salva séries parciais
    const finishBtn = page.getByRole('button', { name: /Encerrar sessão/i });
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
      // Confirma encerramento salvando séries parciais
      const savePartialBtn = page.getByRole('button', { name: /Salvar Séries Feitas/i });
      if (await savePartialBtn.isVisible()) {
        await savePartialBtn.click();
      }
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '29_post_workout_wellbeing_modal.png') });
    }
  });

  test('Cenário 3: Auditoria Visual Desktop (1280x800) vs Mobile & Telas de Descanso', async ({ page }) => {
    // 1. Desktop Viewport (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // Tela de Boas-Vindas no Desktop
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30_welcome_desktop_1280x800.png') });

    // Identificação Rápida no Desktop
    await page.getByRole('button', { name: /Continuar sem conta/i }).click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31_quick_identification_desktop.png') });

    await page.locator('#displayNameInput').fill('Prof. Marcelo Desktop');
    await page.getByText('Sou Professor / Personal / Treinador').click();
    await page.getByRole('button', { name: 'Continuar para o Superação' }).click();

    // Painel do Treinador no Desktop
    await expect(page.getByText('Painel do Treinador')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32_prof_dashboard_desktop_1280x800.png') });

    // Construtor de Anamnese no Desktop
    await page.getByRole('button', { name: 'Minha Anamnese' }).click();
    await expect(page.getByRole('dialog', { name: 'Construtor de Anamnese do Professor' })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '33_prof_anamnesis_builder_desktop.png') });
    await page.getByLabel('Fechar').first().click();

    // 2. Configura dia de Descanso Total e confere renderização no Mobile (Pixel 5)
    await page.setViewportSize({ width: 393, height: 851 });
    await page.evaluate(() => {
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      localStorage.setItem('superacao_is_guest', 'true');
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem('superacao_user_profile', JSON.stringify({
        uid: 'guest_user',
        displayName: 'Aluno em Descanso',
        userRole: 'student',
        onboardingCompleted: true,
        hasCompletedAnamnesis: true,
        routineConfirmed: true,
      }));

      // Agenda com hoje em Descanso Total
      localStorage.setItem('superacao_calendar', JSON.stringify([
        {
          id: `day_${dateStr}`,
          ownerUid: 'guest_user',
          dateStr,
          dayOfWeek: currentDayOfWeek,
          activityType: 'rest',
          isCompleted: false,
          notes: 'Descanso total orientado pelo seu professor. Recuperação consciente!',
        }
      ]));
    });

    await page.goto('/');
    await expect(page.getByText('Dia de Descanso & Regeneração')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '34_rest_total_mobile_view.png') });

    // 3. Configura dia de Descanso Ativo e confere renderização no Mobile
    await page.evaluate(() => {
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      localStorage.setItem('superacao_calendar', JSON.stringify([
        {
          id: `day_${dateStr}`,
          ownerUid: 'guest_user',
          dateStr,
          dayOfWeek: currentDayOfWeek,
          activityType: 'active_recovery',
          isCompleted: false,
          notes: 'Caminhada leve 20min e mobilidade de tornozelo orientadas pelo treinador.',
        }
      ]));
    });

    await page.reload();
    await expect(page.getByText('Descanso Ativo Orientado pelo Professor')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '35_rest_active_mobile_view.png') });
  });

});
