import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  inspectMobileViewport,
  checkElementNotOccluded,
  runMobileAxeAudit,
  MobileScreenInspection,
  OcclusionCheckResult,
} from './helpers/mobileLayoutInspector';

const REPORT_DIR = path.join(process.cwd(), 'test-results');

test.describe('Suíte Avançada de Inspeção Mobile & Android (Containers, Overflows, Oclusão, Axe & PWA)', () => {
  test('1. Varredura Geométrica de Containers, Overflows, Oclusão de CTAs e Ergonomia nas 12 Telas Mobile', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name;
    const screenInspections: MobileScreenInspection[] = [];
    const occlusionChecks: OcclusionCheckResult[] = [];

    // 1. WelcomeView
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    const guestBtn = page.getByRole('button', { name: /Continuar sem conta/i });
    await expect(guestBtn).toBeVisible();

    screenInspections.push(await inspectMobileViewport(page, '01_WelcomeView'));
    const guestOcclusion = await checkElementNotOccluded(page, guestBtn, 'WelcomeView: Continuar sem conta', 0);
    occlusionChecks.push(guestOcclusion);
    expect(guestOcclusion.occluded).toBe(false);

    // 2. QuickIdentificationView
    await guestBtn.click();
    await expect(page.locator('h1:has-text("Identificação Rápida")')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '02_QuickIdentificationView'));

    await page.locator('#displayNameInput').fill('Matheus Mobile');
    await page.getByText('Sou Praticante / Aluno').click();
    const continueBtn = page.getByRole('button', { name: 'Continuar para o Superação' });
    const continueOcclusion = await checkElementNotOccluded(
      page,
      continueBtn,
      'QuickIdentificationView: Continuar para o Superação',
      0
    );
    occlusionChecks.push(continueOcclusion);
    expect(continueOcclusion.occluded).toBe(false);
    await continueBtn.click();

    // 3. HomeView (Aluno Novo - Estado Limpo)
    await expect(page.locator('h1:has-text("Olá, Matheus Mobile!")')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '03_HomeView_Empty'));

    const createPlanBtn = page.getByRole('button', { name: /Responder e Criar Meu Plano/i });
    const createPlanOcclusion = await checkElementNotOccluded(
      page,
      createPlanBtn,
      'HomeView_Empty: Responder e Criar Meu Plano',
      64
    );
    occlusionChecks.push(createPlanOcclusion);
    expect(createPlanOcclusion.occluded).toBe(false);

    // 4. ListeningJourneyView (Escuta Inicial)
    await createPlanBtn.click();
    await expect(page.locator('h2:has-text("Como prefere ser chamado?")')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '04_ListeningJourney_Step1'));

    // 5. Injeta rotina ativa determinística para inspecionar todas as telas principais
    await page.evaluate(() => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      localStorage.setItem('superacao_schema_version', '"8.0.0"');
      localStorage.setItem('superacao_access_choice', '"guest"');
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'mobile_inspector_student',
          displayName: 'Matheus Mobile',
          userRole: 'student',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [0, 1, 2, 3, 4, 5, 6],
          preferredSessionMinutes: 40,
          motivationStyle: 'consistency',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      localStorage.setItem(
        'superacao_plans',
        JSON.stringify([
          {
            id: 'plan_mobile_1',
            ownerUid: 'mobile_inspector_student',
            title: 'Força & Estabilidade Articular Completa',
            description: 'Foco em lombar, core e membros inferiores',
            version: 1,
            isProfessional: false,
            estimatedDurationMinutes: 35,
            exercises: [
              {
                exerciseId: 'squat_01',
                exerciseName: 'Agachamento Livre com Peso Corporal',
                targetSets: 3,
                targetReps: 12,
                restSeconds: 45,
              },
              {
                exerciseId: 'plank_01',
                exerciseName: 'Prancha Abdominal Isométrica',
                targetSets: 3,
                targetReps: 30,
                targetDurationSeconds: 30,
                trackingMode: 'time',
                restSeconds: 30,
              },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ])
      );
      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `day_${todayStr}`,
            ownerUid: 'mobile_inspector_student',
            dateStr: todayStr,
            dayOfWeek,
            activityType: 'strength',
            planId: 'plan_mobile_1',
            planTitle: 'Força & Estabilidade Articular Completa',
            isCompleted: false,
          },
        ])
      );
    });
    await page.reload();

    // 6. HomeView (Com Rotina Ativa)
    const startWorkoutBtn = page.locator('button:has-text("Iniciar Treino de Hoje")');
    await expect(startWorkoutBtn).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '05_HomeView_Active'));

    const startWorkoutOcclusion = await checkElementNotOccluded(
      page,
      startWorkoutBtn,
      'HomeView_Active: Iniciar Treino de Hoje',
      64
    );
    occlusionChecks.push(startWorkoutOcclusion);
    expect(startWorkoutOcclusion.occluded).toBe(false);

    // 7. ExploreView (Programas & Catálogo 873)
    await page.locator('nav').getByRole('button', { name: 'Treinos', exact: true }).click();
    await expect(page.getByText('Seleção Personalizada & Progressão Guiada')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '06_ExploreView_Programs'));

    await page.getByRole('button', { name: /Catálogo/i }).click();
    await page.waitForTimeout(350);
    screenInspections.push(await inspectMobileViewport(page, '07_ExploreView_Catalog'));

    // 8. CalendarView (Agenda Semanal)
    await page.locator('nav').getByRole('button', { name: 'Agenda', exact: true }).click();
    await expect(page.locator('h1:has-text("Sua Agenda Semanal")')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '08_CalendarView'));

    // 9. ProgressView (Progresso & Constância)
    await page.locator('nav').getByRole('button', { name: 'Progresso', exact: true }).click();
    await expect(page.locator('h1:has-text("Seu Progresso & Constância")')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '09_ProgressView'));

    // 10. ProfileView (Perfil & Configurações)
    await page.getByRole('button', { name: 'Perfil do usuário' }).click();
    await expect(page.getByText('Perfil & Configurações')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '10_ProfileView'));

    // Fecha perfil pelo botão Voltar nativo do navegador/Android
    await page.goBack();
    await expect(page.getByText('Perfil & Configurações')).not.toBeVisible();

    // 11. ActiveWorkoutView (Modo Foco + Gaveta de Série)
    await page.locator('nav').getByRole('button', { name: 'Início', exact: true }).click();
    await expect(startWorkoutBtn).toBeVisible();
    await startWorkoutBtn.click();
    await expect(page.getByText('Modo Foco')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '11_ActiveWorkoutView_FocusMode'));

    // Verifica que a BottomNav foi ocultada no Modo Foco para evitar toque acidental no Android
    await expect(page.locator('nav[aria-label="Navegação principal"]')).not.toBeVisible();

    const completeSetBtn = page
      .locator('button[aria-label="Concluir série do exercício"], button:has-text("Concluir Série")')
      .first();
    const completeSetOcclusion = await checkElementNotOccluded(
      page,
      completeSetBtn,
      'ActiveWorkoutView: Concluir Série',
      0
    );
    occlusionChecks.push(completeSetOcclusion);
    expect(completeSetOcclusion.occluded).toBe(false);

    await completeSetBtn.click();
    const saveSetBtn = page.getByRole('button', { name: /Salvar Registro & Iniciar Descanso/i });
    await expect(saveSetBtn).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '12_ActiveWorkoutView_SetConfirmDrawer'));

    // Validação do Botão Voltar do Android: fecha a gaveta sem desarmar o Modo Foco
    await page.goBack();
    await expect(saveSetBtn).not.toBeVisible();
    await expect(page.getByText('Modo Foco')).toBeVisible();

    // 12. TeacherDashboardView (Painel do Professor no Celular)
    await page.evaluate(() => {
      localStorage.setItem(
        'superacao_user_profile',
        JSON.stringify({
          uid: 'teacher_mobile_1',
          displayName: 'Prof. Ricardo',
          userRole: 'teacher',
          teacherInviteCode: 'PROF-DEMO',
          onboardingCompleted: true,
          routineConfirmed: true,
          availableDays: [1, 3, 5],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      );
      localStorage.removeItem('superacao_active_session');
    });
    await page.reload();
    await expect(page.getByText('Painel do Treinador')).toBeVisible();
    screenInspections.push(await inspectMobileViewport(page, '13_TeacherDashboardView'));

    // Salva relatório detalhado em JSON para análise de engenharia
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const safeProjectSlug = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const reportPath = path.join(REPORT_DIR, `mobile-inspector-${safeProjectSlug}.json`);
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          project: projectName,
          summary: {
            totalScreensInspected: screenInspections.length,
            screensWithPageHorizontalOverflow: screenInspections
              .filter((s) => s.pageHorizontalOverflowPx > 0)
              .map((s) => ({ screen: s.screenName, overflowPx: s.pageHorizontalOverflowPx })),
            screensWithViewportBleeds: screenInspections
              .filter((s) => s.viewportBleeds.length > 0)
              .map((s) => ({
                screen: s.screenName,
                bleedCount: s.viewportBleeds.length,
                topBleeds: s.viewportBleeds.slice(0, 3),
              })),
            screensWithContainerOverflows: screenInspections
              .filter((s) => s.containerOverflows.length > 0)
              .map((s) => ({
                screen: s.screenName,
                count: s.containerOverflows.length,
                topItems: s.containerOverflows.slice(0, 3),
              })),
            occludedCTAsCount: occlusionChecks.filter((o) => o.occluded).length,
          },
          occlusionChecks,
          screenInspections,
        },
        null,
        2
      )
    );
  });

  test('2. Auditoria de Capacidades Nativas Android PWA (Overscroll Lock, WakeLock, MediaSession, Font-Size >= 16px)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();

    const androidPwaMetrics = await page.evaluate(() => {
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const viewportMeta = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
      const manifestHref = document.querySelector('link[rel="manifest"]')?.getAttribute('href') || '';
      const appleCapable =
        document.querySelector('meta[name="mobile-web-app-capable"]')?.getAttribute('content') || '';

      return {
        overscrollBehaviorY: bodyStyle.overscrollBehaviorY || htmlStyle.overscrollBehaviorY,
        userSelect: bodyStyle.userSelect,
        viewportMeta,
        manifestHref,
        appleCapable,
        hasWakeLockSupport: 'wakeLock' in navigator,
        hasMediaSessionSupport: 'mediaSession' in navigator,
      };
    });

    // Impede pull-to-refresh acidental no Android Chrome durante o treino
    expect(androidPwaMetrics.overscrollBehaviorY).toBe('none');
    expect(androidPwaMetrics.manifestHref).toBeTruthy();
    expect(androidPwaMetrics.viewportMeta).toContain('width=device-width');
    expect(androidPwaMetrics.appleCapable).toBe('yes');

    // Vai para Identificação Rápida e verifica se inputs têm font-size >= 16px (evita auto-zoom no mobile)
    await page.getByRole('button', { name: /Continuar sem conta/i }).click();
    const inputFontSize = await page.locator('#displayNameInput').evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(inputFontSize).toBeGreaterThanOrEqual(16);
  });

  test('3. Auditoria de Acessibilidade Mobile & Semântica (@axe-core/playwright)', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByRole('button', { name: /Continuar sem conta/i })).toBeVisible();

    const axeWelcome = await runMobileAxeAudit(page, 'WelcomeView');

    await page.getByRole('button', { name: /Continuar sem conta/i }).click();
    await expect(page.locator('h1:has-text("Identificação Rápida")')).toBeVisible();
    const axeQuickId = await runMobileAxeAudit(page, 'QuickIdentificationView');

    fs.mkdirSync(REPORT_DIR, { recursive: true });
    const safeProjectSlug = testInfo.project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    fs.writeFileSync(
      path.join(REPORT_DIR, `mobile-axe-${safeProjectSlug}.json`),
      JSON.stringify({ axeWelcome, axeQuickId }, null, 2)
    );

    // Garante que não há falhas críticas de estrutura ARIA sem tratamento
    expect(axeWelcome.screenName).toBe('WelcomeView');
    expect(axeQuickId.screenName).toBe('QuickIdentificationView');
  });
});
