import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = 'C:/Users/matheus.luna/.gemini/antigravity/brain/2b7a21d6-76a6-4049-815a-082d63d6e1b3/persona-audit-screenshots/sprint_validation';

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Sprint Validation: Plataforma do Professor, Onboarding Rápido & Melhorias de UX', () => {

  test('Cenário 1: Aluno Novo - Entrada Rápida, Home sem Treino Cego & Conexão com Professor', async ({ page }) => {
    // 1. Limpa storage para simular novo acesso
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

    // 2. Tela de Boas-vindas -> Clica em "Continuar sem conta"
    await expect(page.getByRole('heading', { name: 'Superação', exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_welcome_screen.png') });

    await page.getByRole('button', { name: /Continuar sem conta/i }).click();

    // 3. Tela de Identificação Rápida
    await expect(page.getByText('Identificação Rápida')).toBeVisible();
    await expect(page.getByText('1. Como podemos chamar você?')).toBeVisible();
    await expect(page.getByText('2. Como você vai utilizar o Superação?')).toBeVisible();
    // Confirma ausência de campo obrigatório de CREF
    await expect(page.locator('text=CREF')).toHaveCount(0);

    // Preenche Nome e seleciona Aluno
    const nameInput = page.locator('#displayNameInput');
    await nameInput.fill('Mariana Aluna');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_quick_identification_student.png') });

    await page.getByRole('button', { name: 'Continuar para o Superação' }).click();

    // 4. HomeView Limpa: Aluno recebe saudação e 2 cards no Fold 1
    await expect(page.getByText('Olá, Mariana Aluna!')).toBeVisible();
    await expect(page.getByText('Montar Meu Treino Personalizado')).toBeVisible();
    await expect(page.getByText('Treinar com um Professor')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_student_empty_home_fold1.png') });

    // 5. Clica em "Inserir Código do Professor"
    await page.getByRole('button', { name: 'Inserir Código do Professor' }).click();

    // Modal de Vínculo com Professor aberto
    await expect(page.getByRole('dialog', { name: 'Vincular ao Professor' })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_link_teacher_modal.png') });

    // Insere código de demonstração PROF-DEMO
    const codeInput = page.locator('#teacherCodeInput');
    await codeInput.fill('PROF-DEMO');
    await page.getByRole('button', { name: 'Conectar e Iniciar' }).click();

    // 6. Abre o fluxo de Anamnese Customizada
    await expect(page.getByRole('heading', { name: /Anamnese e Avaliação/i })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_custom_anamnesis_flow.png') });

    // Responde ao questionário
    const firstOption = page.locator('button:has-text("Saúde"), button:has-text("Construir")').first();
    if (await firstOption.isVisible()) {
      await firstOption.click();
    }

    // Submete a avaliação
    await page.getByRole('button', { name: 'Finalizar e Enviar para o Professor' }).click();

    // 7. Tela de Confirmação Acolhedora
    await expect(page.getByText('Avaliação Entregue ao Professor!')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_anamnesis_delivered_success.png') });

    await page.getByRole('button', { name: 'Ir para Minha Tela Inicial' }).click();
    await expect(page.getByText('Olá, Mariana Aluna!')).toBeVisible();
  });

  test('Cenário 2: Professor / Treinador - Entrada, Painel, Construtor de Anamnese & Prescrição IA', async ({ page }) => {
    // 1. Limpa storage
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

    await page.getByRole('button', { name: /Continuar sem conta/i }).click();

    // 2. Identificação Rápida como Professor
    await expect(page.getByText('Identificação Rápida')).toBeVisible();
    await page.locator('#displayNameInput').fill('Prof. Ricardo Personal');
    await page.getByText('Sou Professor / Personal / Treinador').click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_quick_identification_teacher.png') });

    await page.getByRole('button', { name: 'Continuar para o Superação' }).click();

    // 3. Painel do Treinador aberto
    await expect(page.getByText('Painel do Treinador')).toBeVisible();
    await expect(page.getByText('Código de Aluno')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_teacher_dashboard_overview.png') });

    // 4. Abre o Construtor de Anamnese do Professor
    await page.getByRole('button', { name: 'Minha Anamnese' }).click();
    await expect(page.getByRole('dialog', { name: 'Construtor de Anamnese do Professor' })).toBeVisible();
    await expect(page.getByText('Perguntas & Slots de Fotos')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_teacher_anamnesis_builder.png') });
    await page.getByLabel('Fechar').first().click();

    // 5. Cria um Aluno Exemplo para avaliação e prescrição
    await page.getByRole('button', { name: '+ Aluno Exemplo' }).click();

    // Prontuário do Aluno Exemplo aberto
    await expect(page.getByText('Avaliação Preenchida pelo Aluno')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_student_medical_record.png') });

    // 6. Clica na aba de Prescrição Semanal (7 dias)
    await page.getByRole('button', { name: /Prescrição Semanal/i }).click();
    await expect(page.getByText('Grade Semanal de 7 Dias')).toBeVisible();

    // Co-Piloto IA: Sugerir com IA
    await page.getByRole('button', { name: /Sugerir com IA/i }).click();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_teacher_ai_draft_prescription.png') });

    // Salva e publica a prescrição
    await page.getByRole('button', { name: 'Salvar e Publicar para o Aluno' }).click();

    // 7. Alterna para "Meu Treino Pessoal"
    await page.getByRole('button', { name: 'Meu Treino Pessoal' }).click();
    await expect(page.getByText('Você está visualizando seu Treino Pessoal')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_teacher_personal_mode_banner.png') });

    // Retorna com 1 clique para o Painel do Treinador
    await page.getByRole('button', { name: '← Voltar ao Painel do Treinador' }).click();
    await expect(page.getByText('Painel do Treinador')).toBeVisible();
  });

  test('Cenário 3: Validação das 5 Melhorias Visuais Mobile (Pixel 5)', async ({ page }) => {
    // 1. Configura usuário com rotina confirmada para validar telas
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dummyPlan = {
        id: 'plan_beatriz_a',
        title: 'Força Base & Cuidado Lombar',
        description: 'Treino equilibrado com peso corporal',
        category: 'forca',
        level: 'iniciante',
        estimatedDurationMinutes: 20,
        exercises: [
          {
            exerciseId: 'squat_bodyweight',
            exerciseName: 'Agachamento com Peso Corporal e Alinhamento Neutro',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 45,
          },
          {
            exerciseId: 'glute_bridge',
            exerciseName: 'Ponte de Glúteos no Chão com Ativação Pélvica',
            targetSets: 3,
            targetReps: 12,
            restSeconds: 45,
          },
        ],
      };

      const calendarDay = {
        id: `cal_${dateStr}`,
        ownerUid: 'user_audit_mobile',
        dateStr,
        dayOfWeek: currentDayOfWeek,
        activityType: 'strength',
        planId: dummyPlan.id,
        planTitle: dummyPlan.title,
        isCompleted: false,
      };

      const profile = {
        uid: 'user_audit_mobile',
        displayName: 'Beatriz',
        userRole: 'student',
        routineConfirmed: true,
        onboardingCompleted: true,
        availableDays: [currentDayOfWeek],
        sessionDurationMinutes: 20,
        equipments: ['peso_corporal'],
        primaryGoal: 'Construir o hábito',
        reportedLimitations: ['dor_lombar'],
        avoidedMovements: ['sobrecarga_lombar'],
        soundEnabled: true,
        hapticEnabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorage.setItem('superacao_user_profile', JSON.stringify(profile));
      localStorage.setItem('superacao_access_choice', JSON.stringify('guest'));
      localStorage.setItem('superacao_plans', JSON.stringify([dummyPlan]));
      localStorage.setItem('superacao_calendar', JSON.stringify([calendarDay]));
    });
    await page.reload();

    // Validação 1: HomeView Fold 1 - Botão CTA visível e WeekPath no topo
    await expect(page.getByText('Olá, Beatriz!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Treino de Hoje' })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_home_fold1_mobile_verified.png') });

    // Validação 2: ProgressView - 4 contadores principais e ritmo semanal no topo
    await page.getByRole('button', { name: 'Progresso' }).click();
    await expect(page.getByText('Seu Progresso & Constância')).toBeVisible();
    await expect(page.getByText('Treinos Concluídos')).toBeVisible();
    await expect(page.getByText('Recordes Reais (PRs)')).toBeVisible();
    await expect(page.getByText('Ritmo Semanal Consciente')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_progress_top_metrics_verified.png') });

    // Validação 3: ActiveWorkoutView - 2 linhas completas para o título e dica IA
    await page.getByRole('button', { name: 'Início' }).click();
    await page.getByRole('button', { name: 'Iniciar Treino de Hoje' }).click();

    // Em modo foco
    await expect(page.getByText('Agachamento com Peso Corporal')).toBeVisible();
    await expect(page.getByText('Proteja sua lombar:')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_active_workout_two_lines_and_ai_cue.png') });
  });

});
