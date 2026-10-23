import { describe, it, expect } from 'vitest';
import {
  generateSmartWorkoutRoutine,
  enrichExercise,
  isExerciseSafeForUser,
} from '../src/lib/workoutEngine';
import { allExercises } from '../src/data/catalog';
import { premadePrograms } from '../src/data/premadePrograms';
import { premadeWorkouts } from '../src/data/premadeWorkouts';

describe('Motor Canônico de Geração de Treinos v2 (workoutEngine)', () => {
  describe('1. Segurança Articular e Filtros de Limitação (Invariantes Clínicos)', () => {
    it('deve enriquecer exercícios com metadados estruturados de estresse articular e padrões funcionais', () => {
      const wallPushup = allExercises.find((e) => e.id === 'wall_pushup_controlled');
      expect(wallPushup).toBeDefined();
      if (wallPushup) {
        const enriched = enrichExercise(wallPushup);
        expect(enriched.functionalPattern).toBe('push_horizontal');
        expect(enriched.floorTransition).toBe(false);
      }

      const towelRow = allExercises.find((e) => e.id === 'door_towel_row');
      expect(towelRow).toBeDefined();
      if (towelRow) {
        const enriched = enrichExercise(towelRow);
        expect(enriched.functionalPattern).toBe('pull_horizontal');
        expect(enriched.floorTransition).toBe(false);
      }
    });

    it('usuário com dor no joelho nunca recebe movimentos de salto, impacto ou estresse patelar alto', () => {
      const proposal = generateSmartWorkoutRoutine(
        {
          uid: 'user_knee_pain',
          experienceLevel: 'iniciante',
          reportedLimitations: ['joelhos'],
          equipments: ['peso_corporal'],
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 20,
        }
      );

      expect(proposal.hasCompatibleExercises).toBe(true);
      const allAssigned = proposal.routines.flatMap((r) => r.exercises);

      for (const item of allAssigned) {
        const raw = allExercises.find((e) => e.id === item.exerciseId);
        expect(raw).toBeDefined();
        if (raw) {
          const enriched = enrichExercise(raw);
          expect(enriched.jointStress?.knee).toBeLessThanOrEqual(1);
          const name = (raw.name_pt || raw.name_en || '').toLowerCase();
          expect(name).not.toContain('jump');
          expect(name).not.toContain('salto');
          expect(name).not.toContain('burpee');
        }
      }
    });

    it('usuário com dor no punho nunca recebe flexão tradicional no solo que sobrecarregue punhos', () => {
      const proposal = generateSmartWorkoutRoutine(
        {
          uid: 'user_wrist_pain',
          experienceLevel: 'iniciante',
          reportedLimitations: ['punhos'],
          equipments: ['peso_corporal', 'parede'],
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 15,
        }
      );

      const allAssigned = proposal.routines.flatMap((r) => r.exercises);
      for (const item of allAssigned) {
        const raw = allExercises.find((e) => e.id === item.exerciseId);
        if (raw) {
          const enriched = enrichExercise(raw);
          expect(enriched.jointStress?.wrist).toBeLessThanOrEqual(1);
        }
      }
    });

    it('usuário que evita deitar no chão não recebe exercícios com floorTransition: true', () => {
      const proposal = generateSmartWorkoutRoutine(
        {
          uid: 'user_no_floor',
          experienceLevel: 'iniciante',
          avoidedMovements: ['exercicios_chao'],
          equipments: ['peso_corporal', 'cadeira', 'parede'],
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 15,
        }
      );

      const allAssigned = proposal.routines.flatMap((r) => r.exercises);
      for (const item of allAssigned) {
        const raw = allExercises.find((e) => e.id === item.exerciseId);
        if (raw) {
          const enriched = enrichExercise(raw);
          expect(enriched.floorTransition).toBe(false);
        }
      }
    });
  });

  describe('2. Coerência Funcional & Eliminação da Anomalia de Seleção', () => {
    it('usuário que busca Força recebe exercícios de base (agachar, empurrar, puxar, core) e NÃO 3 alongamentos', () => {
      const proposal = generateSmartWorkoutRoutine(
        {
          uid: 'user_strength',
          experienceLevel: 'iniciante',
          primaryGoal: 'Ganhar força e definição',
          equipments: ['peso_corporal'],
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 20,
        }
      );

      const routineA = proposal.routines[0];
      expect(routineA).toBeDefined();

      const exerciseNames = routineA.exercises.map((e) => e.exerciseName.toLowerCase());
      // Deve conter agachamento, flexão/empurrar, remada/puxada e prancha/core
      const hasSquat = exerciseNames.some((n) => n.includes('agachamento') || n.includes('sentar'));
      const hasPush = exerciseNames.some((n) => n.includes('flexão') || n.includes('inclinad'));
      const hasPull = exerciseNames.some((n) => n.includes('remada') || n.includes('puxada') || n.includes('w de bruços') || n.includes('y-t-w'));
      const hasCore = exerciseNames.some((n) => n.includes('prancha') || n.includes('perdigueiro') || n.includes('abdominal'));

      expect(hasSquat).toBe(true);
      expect(hasPush).toBe(true);
      expect(hasPull).toBe(true);
      expect(hasCore).toBe(true);
    });

    it('usuário apenas com peso corporal tem acesso a exercícios de puxar e costas especializados', () => {
      const proposal = generateSmartWorkoutRoutine(
        {
          uid: 'user_calisthenics_back',
          experienceLevel: 'intermediario',
          primaryGoal: 'Ganhar força e definição',
          equipments: ['peso_corporal'],
          availableDays: [1, 3, 5],
          sessionDurationMinutes: 20,
        }
      );

      const allIds = proposal.routines.flatMap((r) => r.exercises.map((e) => e.exerciseId));
      const pullIds = [
        'door_towel_row',
        'table_inverted_row',
        'floor_towel_lat_pulldown',
        'prone_w_extension',
        'standing_scapular_y_t_w',
      ];

      const hasBackExercise = allIds.some((id) => pullIds.includes(id));
      expect(hasBackExercise).toBe(true);
    });
  });

  describe('3. Determinismo e Reprodutibilidade', () => {
    it('mesma semente e perfil gera exatamente a mesma rotina', () => {
      const profile = {
        uid: 'deterministic_user_123',
        experienceLevel: 'iniciante' as const,
        primaryGoal: 'Construir o hábito e me sentir melhor',
        equipments: ['peso_corporal'],
        availableDays: [1, 3, 5],
        sessionDurationMinutes: 15,
      };

      const prop1 = generateSmartWorkoutRoutine(profile, undefined, { seed: 'fixed_seed' });
      const prop2 = generateSmartWorkoutRoutine(profile, undefined, { seed: 'fixed_seed' });

      expect(prop1.routines[0].exercises.map((e) => e.exerciseId)).toEqual(
        prop2.routines[0].exercises.map((e) => e.exerciseId)
      );
      expect(prop1.routines[0].estimatedDurationMinutes).toBe(
        prop2.routines[0].estimatedDurationMinutes
      );
    });
  });

  describe('4. Divisão A / B e Agenda Semanal', () => {
    it('gera Treino A e Treino B quando o usuário treina 3 ou mais dias na semana', () => {
      const proposal = generateSmartWorkoutRoutine({
        uid: 'user_3days',
        availableDays: [1, 3, 5], // Seg, Qua, Sex
        sessionDurationMinutes: 20,
      });

      expect(proposal.routines.length).toBe(2);
      expect(proposal.routines[0].title).toContain('Treino A');
      expect(proposal.routines[1].title).toContain('Treino B');

      // Agenda semanal deve alternar os IDs
      expect(proposal.weeklySchedule[1]).toBe(proposal.routines[0].id);
      expect(proposal.weeklySchedule[3]).toBe(proposal.routines[1].id);
      expect(proposal.weeklySchedule[5]).toBe(proposal.routines[0].id);
    });

    it('gera apenas Treino A focado quando o usuário treina 1 ou 2 dias', () => {
      const proposal = generateSmartWorkoutRoutine({
        uid: 'user_2days',
        availableDays: [2, 4],
        sessionDurationMinutes: 15,
      });

      expect(proposal.routines.length).toBe(1);
      expect(proposal.weeklySchedule[2]).toBe(proposal.routines[0].id);
      expect(proposal.weeklySchedule[4]).toBe(proposal.routines[0].id);
    });
  });

  describe('5. Catálogo Expandido de Programas e Treinos Curados', () => {
    it('possui pelo menos 17 programas estruturados curados disponíveis', () => {
      expect(premadePrograms.length).toBeGreaterThanOrEqual(17);
      const programIds = premadePrograms.map((p) => p.id);

      // Programas base
      expect(programIds).toContain('prog_anti_sedentarismo_cadeira');
      expect(programIds).toContain('prog_coluna_blindada_mcgill');
      expect(programIds).toContain('prog_calistenia_base');
      expect(programIds).toContain('prog_joelhos_protegidos');
      expect(programIds).toContain('prog_mini_band_total');

      // 7 novas famílias de metodologias consagradas
      expect(programIds).toContain('prog_calistenia_primer_6w');
      expect(programIds).toContain('prog_desk_worker_reset_4w');
      expect(programIds).toContain('prog_halteres_minimalista_8w');
      expect(programIds).toContain('prog_couch_to_move_6w');
      expect(programIds).toContain('prog_gluteos_pelve_6w');
      expect(programIds).toContain('prog_desaceleracao_noturna_4w');
      expect(programIds).toContain('prog_longevidade_attia_8w');
    });

    it('todos os programas curados possuem planos válidos referenciados em premadeWorkouts', () => {
      for (const prog of premadePrograms) {
        expect(prog.routines.length).toBeGreaterThan(0);
        for (const routine of prog.routines) {
          expect(routine.id).toBeDefined();
          expect(routine.exercises.length).toBeGreaterThan(0);
          expect(routine.estimatedDurationMinutes).toBeGreaterThan(0);

          // Integridade referencial estrita de cada exercício no catálogo
          for (const item of routine.exercises) {
            const ex = allExercises.find((e) => e.id === item.exerciseId);
            expect(ex, `Exercício ${item.exerciseId} na rotina ${routine.id} deve existir no catálogo`).toBeDefined();
          }
        }
      }
    });

    it('todas as novas 13 fichas de treinos consagradas existem em premadeWorkouts', () => {
      const workoutIds = premadeWorkouts.map((w) => w.id);
      const expectedIds = [
        'plan_calistenia_primer_a',
        'plan_calistenia_primer_b',
        'plan_desk_worker_a',
        'plan_desk_worker_b',
        'plan_halteres_minimalista_a',
        'plan_halteres_minimalista_b',
        'plan_c25k_corrida_rua',
        'plan_c25k_reforco_casa',
        'plan_gluteos_pelve_a',
        'plan_gluteos_pelve_b',
        'plan_desaceleracao_noturna',
        'plan_longevidade_attia_a',
        'plan_longevidade_attia_b',
      ];

      for (const id of expectedIds) {
        expect(workoutIds).toContain(id);
      }
    });

    it('exercícios com imagens associadas no catálogo possuem caminhos bem formatados', () => {
      const exercisesWithImages = allExercises.filter((e) => e.images && e.images.length > 0);
      expect(exercisesWithImages.length).toBeGreaterThan(850);

      for (const ex of exercisesWithImages) {
        expect(ex.images).toBeDefined();
        for (const img of ex.images!) {
          expect(img.startsWith('/exercises/')).toBe(true);
          expect(img.endsWith('.jpg') || img.endsWith('.png')).toBe(true);
        }
      }
    });
  });
});
