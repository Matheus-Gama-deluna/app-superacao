import { describe, it, expect } from 'vitest';
import {
  MONDAY_FIRST_DAYS,
  getMondayFirstIndex,
  getCurrentWeekMondayStr,
  getWeekDatesMondayFirst,
} from '../src/lib/dateUtils';
import {
  computeIdealTrainingDays,
  buildSmartWeeklyCalendar,
  performSmartWeeklyRollover,
  rebalanceRemainingWeek,
} from '../src/lib/weeklyScheduler';
import {
  getCanonicalWeeklyGoal,
  markCalendarDayCompleted,
  generateTomorrowBridge,
} from '../src/lib/storage';
import { WorkoutPlan, CalendarDay, UserProfile, WorkoutSession } from '../src/types';

describe('Smart Weekly Scheduler & Persistence Suite', () => {
  const dummyPlanA: WorkoutPlan = {
    id: 'plan_a',
    title: 'Treino A - Superior & Core',
    description: 'Foco superior',
    difficulty: 'iniciante',
    estimatedDurationMinutes: 20,
    exercises: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const dummyPlanB: WorkoutPlan = {
    id: 'plan_b',
    title: 'Treino B - Membros Inferiores',
    description: 'Foco pernas e mobilidade',
    difficulty: 'iniciante',
    estimatedDurationMinutes: 20,
    exercises: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  describe('1. Padronização Canônica Segunda-a-Domingo', () => {
    it('MONDAY_FIRST_DAYS deve conter [1, 2, 3, 4, 5, 6, 0]', () => {
      expect(MONDAY_FIRST_DAYS).toEqual([1, 2, 3, 4, 5, 6, 0]);
    });

    it('getMondayFirstIndex deve mapear Segunda como 0 e Domingo como 6', () => {
      expect(getMondayFirstIndex(1)).toBe(0); // Segunda
      expect(getMondayFirstIndex(2)).toBe(1); // Terça
      expect(getMondayFirstIndex(3)).toBe(2); // Quarta
      expect(getMondayFirstIndex(4)).toBe(3); // Quinta
      expect(getMondayFirstIndex(5)).toBe(4); // Sexta
      expect(getMondayFirstIndex(6)).toBe(5); // Sábado
      expect(getMondayFirstIndex(0)).toBe(6); // Domingo
    });

    it('getCurrentWeekMondayStr deve retornar string no formato YYYY-MM-DD correspondente a uma Segunda-feira', () => {
      const mondayStr = getCurrentWeekMondayStr();
      expect(mondayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const [y, m, d] = mondayStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      expect(date.getDay()).toBe(1); // Deve ser Segunda-feira
    });

    it('getWeekDatesMondayFirst deve mapear os 7 dias da semana começando na Segunda', () => {
      const dates = getWeekDatesMondayFirst(new Date(2026, 4, 6)); // Quarta-feira 06/05/2026
      expect(Object.keys(dates).length).toBe(7);
      expect(dates[1]).toBeDefined(); // Segunda
      expect(dates[0]).toBeDefined(); // Domingo
    });
  });

  describe('2. computeIdealTrainingDays', () => {
    it('deve distribuir idealmente 1, 2, 3, 4 e 5 dias na semana', () => {
      expect(computeIdealTrainingDays(1)).toEqual([1]);
      expect(computeIdealTrainingDays(2)).toEqual([1, 4]); // Seg, Qui
      expect(computeIdealTrainingDays(3)).toEqual([1, 3, 5]); // Seg, Qua, Sex
      expect(computeIdealTrainingDays(4)).toEqual([1, 2, 4, 5]); // Seg, Ter, Qui, Sex
      expect(computeIdealTrainingDays(5)).toEqual([1, 2, 4, 5, 6]); // Seg, Ter, Qui, Sex, Sáb
    });

    it('deve limitar valores fora do intervalo 1-7', () => {
      expect(computeIdealTrainingDays(0)).toEqual([1]);
      expect(computeIdealTrainingDays(7)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    });
  });

  describe('3. buildSmartWeeklyCalendar', () => {
    it('deve gerar 7 dias de Segunda a Domingo com rotação contínua A/B', () => {
      const cal = buildSmartWeeklyCalendar({
        uid: 'user_test',
        plans: [dummyPlanA, dummyPlanB],
        targetDays: [1, 3, 5],
        nextPlanIndex: 0,
        preferredTime: 'manha',
      });

      expect(cal.length).toBe(7);

      // Segunda (1): Treino A
      const seg = cal.find((c) => c.dayOfWeek === 1);
      expect(seg?.activityType).toBe('strength');
      expect(seg?.planId).toBe('plan_a');

      // Terça (2): Descanso Planejado Pós-Treino
      const ter = cal.find((c) => c.dayOfWeek === 2);
      expect(ter?.activityType).toBe('rest');

      // Quarta (3): Treino B
      const qua = cal.find((c) => c.dayOfWeek === 3);
      expect(qua?.activityType).toBe('strength');
      expect(qua?.planId).toBe('plan_b');

      // Quinta (4): Descanso Planejado Pós-Treino
      const qui = cal.find((c) => c.dayOfWeek === 4);
      expect(qui?.activityType).toBe('rest');

      // Sexta (5): Treino A (alternância contínua)
      const sex = cal.find((c) => c.dayOfWeek === 5);
      expect(sex?.activityType).toBe('strength');
      expect(sex?.planId).toBe('plan_a');

      // Domingo (0): Descanso
      const dom = cal.find((c) => c.dayOfWeek === 0);
      expect(dom?.activityType).toBe('rest');
    });
  });

  describe('4. performSmartWeeklyRollover', () => {
    it('deve avançar semana e proteger Segunda com descanso se aluno treinou no Domingo', () => {
      // Cria calendário onde Domingo era dia de treino de força na semana anterior
      const prevSundayStr = '2026-05-10';
      const prevCalendar: CalendarDay[] = buildSmartWeeklyCalendar({
        uid: 'user_test',
        plans: [dummyPlanA, dummyPlanB],
        targetDays: [0, 2, 4],
        referenceDate: new Date(2026, 4, 4), // Segunda anterior
      });

      const sundayDay = prevCalendar.find((c) => c.dayOfWeek === 0);
      if (sundayDay) {
        sundayDay.isCompleted = true;
        sundayDay.activityType = 'strength';
        sundayDay.dateStr = prevSundayStr;
      }

      const mondayRef = new Date(2026, 4, 11); // Segunda-feira 11/05/2026
      const { needsRollover, updatedCalendar } = performSmartWeeklyRollover({
        calendar: prevCalendar,
        sessions: [
          {
            id: 'sess_sun',
            planId: 'plan_a',
            planTitle: 'Treino A',
            date: prevSundayStr,
            durationSeconds: 1200,
            status: 'completed',
            completedAt: new Date(2026, 4, 10, 18, 0).getTime(),
            totalSetsPlanned: 6,
            totalSetsCompleted: 6,
            isExpress: false,
            wasPlannedHabit: false,
          } as WorkoutSession,
        ],
        plans: [dummyPlanA, dummyPlanB],
        uid: 'user_test',
        referenceDate: mondayRef,
      });

      expect(needsRollover).toBe(true);

      // Segunda-feira (1) DEVE ser protegida com descanso planejado pós-treino (avoidMonday: true)
      const mondayDay = updatedCalendar.find((c) => c.dayOfWeek === 1);
      expect(mondayDay?.activityType).toBe('rest');
      expect(mondayDay?.notes).toContain('Pós-Treino');

      // O primeiro treino da semana foi deslocado para Terça-feira (2)
      const tuesdayDay = updatedCalendar.find((c) => c.dayOfWeek === 2);
      expect(tuesdayDay?.activityType).toBe('strength');
    });

    it('deve manter rotação A/B contínua entre semanas', () => {
      const prevCalendar = buildSmartWeeklyCalendar({
        uid: 'user_test',
        plans: [dummyPlanA, dummyPlanB],
        targetDays: [1, 3, 5],
        nextPlanIndex: 0,
        referenceDate: new Date(2026, 4, 4), // Seg anterior
      });

      // Último treino concluído na semana anterior foi o Treino A
      const lastSession: WorkoutSession = {
        id: 'sess_fri',
        planId: 'plan_a',
        planTitle: 'Treino A',
        date: '2026-05-08',
        durationSeconds: 1200,
        status: 'completed',
        completedAt: new Date(2026, 4, 8, 10, 0).getTime(),
        totalSetsPlanned: 6,
        totalSetsCompleted: 6,
        isExpress: false,
        wasPlannedHabit: false,
      } as WorkoutSession;

      const { needsRollover, updatedCalendar } = performSmartWeeklyRollover({
        calendar: prevCalendar,
        sessions: [lastSession],
        plans: [dummyPlanA, dummyPlanB],
        uid: 'user_test',
        referenceDate: new Date(2026, 4, 11),
      });

      expect(needsRollover).toBe(true);
      const nextMonday = updatedCalendar.find((c) => c.dayOfWeek === 1);
      expect(nextMonday?.planId).toBe('plan_b'); // Continuidade: iniciou em Treino B!
    });
  });

  describe('5. rebalanceRemainingWeek', () => {
    it('deve rebalancear dias restantes mantendo intervalos de descanso quando perde treino', () => {
      const currentCal = buildSmartWeeklyCalendar({
        uid: 'user_test',
        plans: [dummyPlanA, dummyPlanB],
        targetDays: [1, 3, 5], // Seg, Qua, Sex
      });

      // Simula que na Quarta-feira (3) era força mas o aluno não treinou (missed)
      // E hoje é Quinta-feira (4)
      const wed = currentCal.find((c) => c.dayOfWeek === 3);
      if (wed) {
        wed.activityType = 'strength';
        wed.isCompleted = false;
      }

      const { rebalanced, updatedCalendar } = rebalanceRemainingWeek({
        calendar: currentCal,
        todayDow: 4, // Quinta-feira
        plans: [dummyPlanA, dummyPlanB],
      });

      expect(rebalanced).toBe(true);
      // Quinta-feira (4) deve ser ativada para compensar a perda de quarta
      const thu = updatedCalendar.find((c) => c.dayOfWeek === 4);
      expect(thu?.activityType).toBe('strength');
    });
  });

  describe('6. getCanonicalWeeklyGoal', () => {
    it('deve retornar 0 quando usuário não possui rotina configurada', () => {
      const unconfiguredProfile: Partial<UserProfile> = {
        routineConfirmed: false,
        onboardingCompleted: false,
        availableDays: [],
      };
      const blankCalendar: CalendarDay[] = MONDAY_FIRST_DAYS.map((dow, idx) => ({
        id: `day_${idx}`,
        dayOfWeek: dow,
        activityType: 'unassigned',
        isCompleted: false,
      }));

      const goal = getCanonicalWeeklyGoal(unconfiguredProfile as UserProfile, blankCalendar);
      expect(goal.targetWeeklyGoal).toBe(0);
    });

    it('deve retornar meta canônica honesta quando há rotina confirmada', () => {
      const configuredProfile: Partial<UserProfile> = {
        routineConfirmed: true,
        availableDays: [1, 3, 5],
      };
      const activeCalendar: CalendarDay[] = [
        { id: '1', dayOfWeek: 1, activityType: 'strength', isCompleted: false },
        { id: '3', dayOfWeek: 3, activityType: 'strength', isCompleted: false },
        { id: '5', dayOfWeek: 5, activityType: 'strength', isCompleted: false },
      ];

      const goal = getCanonicalWeeklyGoal(configuredProfile as UserProfile, activeCalendar);
      expect(goal.targetWeeklyGoal).toBe(3);
    });
  });

  describe('7. markCalendarDayCompleted idempotente', () => {
    it('deve marcar apenas o dia alvo como concluído sem mutar outros dias', () => {
      const initialCalendar: CalendarDay[] = [
        { id: 'day_1', dayOfWeek: 1, activityType: 'strength', isCompleted: false },
        { id: 'day_2', dayOfWeek: 2, activityType: 'active_recovery', isCompleted: false },
      ];

      const updated = markCalendarDayCompleted(initialCalendar, 'day_1', true);
      expect(updated.find((c) => c.id === 'day_1')?.isCompleted).toBe(true);
      expect(updated.find((c) => c.id === 'day_2')?.isCompleted).toBe(false);

      // Idempotência
      const twice = markCalendarDayCompleted(updated, 'day_1', true);
      expect(twice.find((c) => c.id === 'day_1')?.isCompleted).toBe(true);
      expect(twice).toEqual(updated);
    });
  });

  describe('8. generateTomorrowBridge', () => {
    it('deve referenciar o dia seguinte corretamente na virada de Domingo (0) para Segunda (1)', () => {
      const sundayDate = new Date(2026, 4, 10, 18, 0); // Domingo
      const mondayDateStr = '2026-05-11';

      const calendar: CalendarDay[] = [
        {
          id: 'seg',
          dateStr: mondayDateStr,
          dayOfWeek: 1,
          activityType: 'strength',
          planId: dummyPlanA.id,
          planTitle: dummyPlanA.title,
          isCompleted: false,
        },
        {
          id: 'dom',
          dateStr: '2026-05-10',
          dayOfWeek: 0,
          activityType: 'rest',
          planTitle: 'Descanso',
          isCompleted: false,
        },
      ];

      const completedSession: WorkoutSession = {
        id: 'sess_1',
        planId: dummyPlanB.id,
        planTitle: dummyPlanB.title,
        durationSeconds: 1200,
        status: 'completed',
        completedAt: sundayDate.getTime(),
        totalSetsPlanned: 6,
        totalSetsCompleted: 6,
        isExpress: false,
        wasPlannedHabit: false,
      } as WorkoutSession;

      const bridge = generateTomorrowBridge(
        completedSession,
        calendar,
        [dummyPlanA, dummyPlanB],
        [],
        sundayDate
      );

      expect(bridge).toBeDefined();
      expect(bridge.tomorrowPlanTitle).toBe(dummyPlanA.title);
      expect(bridge.tomorrowActivityType).toBe('strength');
    });
  });
});
