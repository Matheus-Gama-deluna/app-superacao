import { test, expect } from '@playwright/test';

test.describe('Validação Ergonômica Mobile Viewport 390x844 (Fold 1)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test('Garante que o Card de Treino e o botão CTA estão visíveis no Fold 1 sem rolagem', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      const mockProfile = {
        uid: 'user_fold_test',
        displayName: 'Matheus',
        availableDays: [0, 1, 2, 3, 4, 5, 6],
        onboardingCompleted: true,
        routineConfirmed: true,
        motivationStyle: 'consistency',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      localStorage.setItem('superacao_user_profile', JSON.stringify(mockProfile));
      localStorage.setItem('superacao_access_choice', '"guest"');

      const today = new Date();
      const dayOfWeek = today.getDay();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      localStorage.setItem(
        'superacao_calendar',
        JSON.stringify([
          {
            id: `day_${todayStr}`,
            ownerUid: 'user_fold_test',
            dateStr: todayStr,
            dayOfWeek,
            activityType: 'strength',
            planId: 'plan_test_fold',
            planTitle: 'Força & Estabilidade',
            isCompleted: false,
          },
        ])
      );

      localStorage.setItem(
        'superacao_plans',
        JSON.stringify([
          {
            id: 'plan_test_fold',
            ownerUid: 'user_fold_test',
            title: 'Força & Estabilidade',
            description: 'Postura e estabilidade no seu ritmo',
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
          },
        ])
      );
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verifica saudação editorial com Fraunces
    const heading = page.locator('h1:has-text("Olá, Matheus!")');
    await expect(heading).toBeVisible();

    // 2. Verifica botão CTA primário
    const ctaButton = page.locator('button:has-text("Iniciar Treino de Hoje")');
    await expect(ctaButton).toBeVisible();

    // 3. Mede a posição vertical do botão CTA
    const box = await ctaButton.boundingBox();
    expect(box).not.toBeNull();
    // A tela tem 844px de altura. O botão deve estar bem acima da barra de navegação (Y < 720)
    // Sem necessidade de qualquer rolagem!
    expect(box!.y + box!.height).toBeLessThan(750);

    // 4. Verifica que o seletor rápido "Como você chega hoje?" também está visível no Fold 1
    const moodSelector = page.locator('text=Como você chega hoje?');
    await expect(moodSelector).toBeVisible();
    const moodBox = await moodSelector.boundingBox();
    expect(moodBox).not.toBeNull();
    expect(moodBox!.y).toBeLessThan(box!.y);
  });
});
