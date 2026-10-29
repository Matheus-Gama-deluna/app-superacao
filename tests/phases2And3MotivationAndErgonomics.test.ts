import { describe, it, expect } from 'vitest';
import {
  generateTurnaroundMessage,
  formatWorkoutShareSummary,
  generateWeeklyProcessReview,
} from '../src/lib/motivationEngine';
import { WorkoutSession, CalendarDay } from '../src/types';

describe('Fases 2 e 3: Ergonomia, Acessibilidade e Aprofundamento Motivacional', () => {
  describe('T08 & T09 - Espelho de Bem-Estar e Virada de Humor', () => {
    it('1. Detecta e celebra virada positiva quando o praticante chega cansado e sai renovado', () => {
      const turnaround = generateTurnaroundMessage('cansado', 'renovado', 15);
      expect(turnaround.isPositiveShift).toBe(true);
      expect(turnaround.headline).toContain('A Transformação de Hoje');
      expect(turnaround.explanation).toContain('sem energia');
      expect(turnaround.explanation).toContain('com mais energia e renovado(a)');
      expect(turnaround.explanation).toContain('15 min');
    });

    it('2. Detecta virada positiva quando o praticante chega tenso e sai mais leve', () => {
      const turnaround = generateTurnaroundMessage('tenso', 'leve', 12);
      expect(turnaround.isPositiveShift).toBe(true);
      expect(turnaround.explanation).toContain('tenso(a)');
      expect(turnaround.explanation).toContain('mais leve e relaxado(a)');
    });

    it('3. Acolhe com respeito e cuidado quando o praticante relata esgotamento ou desconforto', () => {
      const turnaround = generateTurnaroundMessage('cansado', 'desconforto', 20);
      expect(turnaround.isPositiveShift).toBe(false);
      expect(turnaround.headline).toContain('Escuta e Respeito aos Sinais do Corpo');
      expect(turnaround.explanation).toContain('necessidade de repouso');
      expect(turnaround.explanation).toContain('Ritmo Suave');
    });

    it('4. Valida consistência de piloto automático em treino neutro', () => {
      const turnaround = generateTurnaroundMessage('normal', 'neutro', 14);
      expect(turnaround.isPositiveShift).toBe(true);
      expect(turnaround.headline).toContain('Vitória de Constância');
      expect(turnaround.explanation).toContain('ritmo neutro');
    });

    it('5. Valida canalização de energia quando chega disposto e conclui orgulhoso', () => {
      const turnaround = generateTurnaroundMessage('disposto', 'orgulhoso', 18);
      expect(turnaround.isPositiveShift).toBe(true);
      expect(turnaround.headline).toContain('Energia Honrada e Multiplicada');
    });
  });

  describe('T13 - Compartilhamento Social de Conquistas', () => {
    it('6. Formata resumo textual acolhedor com emoção, métricas reais e transformação', () => {
      const summary = formatWorkoutShareSummary({
        planTitle: 'Treino A - Corpo Inteiro (Ritmo Suave)',
        durationMinutes: 14,
        setsCompleted: 4,
        preMood: 'cansado',
        postMood: 'renovado',
        prsAchieved: 1,
        totalVolumeKg: 120,
      });

      expect(summary.title).toContain('Superação Concluída • Treino A - Corpo Inteiro (Ritmo Suave)');
      expect(summary.text).toContain('🏆 Superação Concluída!');
      expect(summary.text).toContain('⏱️ 14 min | 4 série(s) feitas');
      expect(summary.text).toContain('🏋️ 120 kg superados em volume');
      expect(summary.text).toContain('🔥 1 Recorde(s) Pessoal(is) superado(s)!');
      expect(summary.text).toContain("✨ Sensação: de 'cansado' para 'renovado'");
      expect(summary.text).toContain('🌿 Cada movimento conta no Superação.');
    });

    it('7. Formata resumo elegante mesmo sem dados opcionais', () => {
      const summary = formatWorkoutShareSummary({
        planTitle: 'Alongamento Matinal',
        durationMinutes: 8,
        setsCompleted: 2,
        postMood: 'leve',
      });

      expect(summary.text).toContain('Alongamento Matinal');
      expect(summary.text).toContain('⏱️ 8 min | 2 série(s) feitas');
      expect(summary.text).toContain("✨ Sensação: 'leve'");
      expect(summary.text).not.toContain('Recorde(s)');
      expect(summary.text).not.toContain('volume');
    });
  });

  describe('T17 - Revisão Semanal de Processo e Autonomia', () => {
    it('8. Sugere avançar quando os treinos foram cumpridos com esforço baixo (<= 2.5)', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const sessions: WorkoutSession[] = [
        {
          id: 's1',
          ownerUid: 'guest_user',
          planId: 'plan1',
          planTitle: 'Treino 1',
          status: 'completed',
          startedAt: today.getTime(),
          date: todayStr,
          durationSeconds: 900,
          currentExerciseIndex: 0,
          currentSetIndex: 1,
          totalSetsPlanned: 3,
          totalSetsCompleted: 3,
          totalRepsCompleted: 30,
          prsAchieved: 0,
          feedbackEffort: 2, // Suave
          exercisesSnapshot: [],
        },
        {
          id: 's2',
          ownerUid: 'guest_user',
          planId: 'plan2',
          planTitle: 'Treino 2',
          status: 'completed',
          startedAt: today.getTime(),
          date: todayStr,
          durationSeconds: 900,
          currentExerciseIndex: 0,
          currentSetIndex: 1,
          totalSetsPlanned: 3,
          totalSetsCompleted: 3,
          totalRepsCompleted: 30,
          prsAchieved: 0,
          feedbackEffort: 2, // Suave
          exercisesSnapshot: [],
        },
        {
          id: 's3',
          ownerUid: 'guest_user',
          planId: 'plan3',
          planTitle: 'Treino 3',
          status: 'completed',
          startedAt: today.getTime(),
          date: todayStr,
          durationSeconds: 900,
          currentExerciseIndex: 0,
          currentSetIndex: 1,
          totalSetsPlanned: 3,
          totalSetsCompleted: 3,
          totalRepsCompleted: 30,
          prsAchieved: 0,
          feedbackEffort: 2, // Suave
          exercisesSnapshot: [],
        },
      ];

      const calendar: CalendarDay[] = [];
      const review = generateWeeklyProcessReview(sessions, calendar, 3);

      expect(review.completedCount).toBe(3);
      expect(review.averageRpe).toBe(2);
      expect(review.suggestedAction).toBe('advance');
      expect(review.suggestedDaysTarget).toBe(4);
    });

    it('9. Sugere suavizar sem culpa quando a média de esforço foi alta ou praticou menos que o planejado', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const sessions: WorkoutSession[] = [
        {
          id: 's1',
          ownerUid: 'guest_user',
          planId: 'plan1',
          planTitle: 'Treino Intenso',
          status: 'completed',
          startedAt: today.getTime(),
          date: todayStr,
          durationSeconds: 1200,
          currentExerciseIndex: 0,
          currentSetIndex: 1,
          totalSetsPlanned: 4,
          totalSetsCompleted: 4,
          totalRepsCompleted: 40,
          prsAchieved: 0,
          feedbackEffort: 5, // Máximo
          exercisesSnapshot: [],
        },
      ];

      const calendar: CalendarDay[] = [];
      // Meta era 4 dias, praticou apenas 1 com esforço máximo 5
      const review = generateWeeklyProcessReview(sessions, calendar, 4);

      expect(review.completedCount).toBe(1);
      expect(review.suggestedAction).toBe('soften');
      expect(review.suggestedDaysTarget).toBe(3);
    });
  });
});
