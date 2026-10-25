import { getLocalDateStr } from '../lib/dateUtils';
import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  WorkoutPlan,
  WorkoutSession,
  SetEvent,
  CalendarDay,
  PersonalRecord,
  SyncStatusState,
  ExercisePlanItem,
  ActivityType,
  ExplainableProposal,
  UserProfile,
  WorkoutProgram,
  PreWorkoutMood,
  PostWorkoutMood,
  AchievementCoinType,
  TimeOfDay,
  ScheduledDayActivity,
  ProgressionItemUpgrade,
  Exercise,
} from '../types';
import {
  persistActiveProgram,
  persistCalendarDays,
  persistUserProfile,
  persistPersonalRecords,
} from '../lib/persistence';
import { useAuth } from './AuthContext';
import {
  db,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  getInitialGuestData,
  setLocal,
  getLocal,
  generateBlankWeeklyCalendar,
  generateWeeklyCalendarFromProposal,
  checkAndRegisterPR,
  exportUserDataAsJSON,
  evaluateSessionEfficiency,
  STORAGE_KEYS,
} from '../lib/storage';
import { soundManager, triggerHaptic } from '../lib/audio';
import {
  wakeLockManager,
  mediaSessionManager,
  backgroundTimer,
  workoutNotifications,
} from '../lib/backgroundWorkout';
import { speakWorkoutCue, sendRestFinishedNotification } from '../lib/pwaNative';
import { allTemplates, getExerciseById } from '../data/catalog';
import { applyUpgradesToWorkoutPlan } from '../lib/workoutEngine';
import { premadePrograms } from '../data/premadePrograms';
import confetti from 'canvas-confetti';


interface WorkoutContextType {
  plans: WorkoutPlan[];
  sessions: WorkoutSession[];
  setEvents: SetEvent[];
  calendar: CalendarDay[];
  personalRecords: PersonalRecord[];
  activeSession: WorkoutSession | null;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  pauseAndReturnHome: () => void;
  resumeWorkout: () => void;
  syncStatus: SyncStatusState;
  
  // Programas de Longo Prazo & Hábitos
  programs: WorkoutProgram[];
  activeProgram: WorkoutProgram | null;
  activateProgram: (program: WorkoutProgram, customDays?: number[], options?: { mode?: 'replace' | 'merge'; timeOfDay?: TimeOfDay }) => Promise<void>;
  advanceProgramWeek: () => void;
  startEmergencyWorkout: () => void;
  addActivityToDay: (dayId: string, planId: string, timeOfDay?: TimeOfDay, options?: { programId?: string; programTitle?: string }) => Promise<void>;
  removeActivityFromDay: (dayId: string, activityId: string) => Promise<void>;
  toggleDayActivityCompleted: (dayId: string, activityId?: string) => Promise<void>;

  // Timer de descanso
  isResting: boolean;
  restSecondsRemaining: number;
  restDurationTotal: number;
  skipRest: () => void;
  addRestSeconds: (seconds: number) => void;

  // Ações de Planos
  savePlan: (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<string>;
  duplicatePlan: (planId: string) => Promise<string>;
  deletePlan: (planId: string) => Promise<void>;

  // Ações de Treino / Execução
  startWorkout: (
    plan: WorkoutPlan,
    scheduledDayId?: string,
    originType?: 'scheduled' | 'program_session' | 'ad_hoc' | 'express',
    isExpress?: boolean,
    wasPlannedHabit?: boolean,
    scheduledActivityId?: string
  ) => void;
  recordSet: (actualReps: number, actualDurationSeconds?: number, restSeconds?: number, actualWeightKg?: number) => Promise<{ isPR: boolean; isNewBaseline?: boolean; prText?: string }>;
  previousExercise: () => void;
  nextExercise: () => void;
  completeWorkout: (feedbackEffort?: number, notes?: string, postMood?: PostWorkoutMood) => Promise<void>;
  savePartialWorkout: (notes?: string) => Promise<void>;
  abandonWorkout: () => void;
  recordWalkSession: (durationMinutes: number, distanceKm?: number, notes?: string) => Promise<void>;
  recordCareSession: (durationMinutes: number, title: string, category?: 'mobility' | 'walk' | 'stretch', notes?: string) => Promise<void>;
  setSessionPreMood: (mood: PreWorkoutMood) => void;
  scheduleOptionalMobilityForTomorrow: (dateStr?: string, routineTitle?: string) => Promise<void>;

  // Ações de Calendário & Agenda
  updateCalendarDay: (dayId: string, activityType: ActivityType, planId?: string, planTitle?: string) => Promise<void>;
  toggleCalendarDayCompleted: (dayId: string) => Promise<void>;
  confirmLegacyRoutine: () => Promise<void>;
  confirmProposal: (proposal: ExplainableProposal) => Promise<void>;

  // Utilitários
  exportBackup: () => void;
  latestPRAnnouncement: string | null;
  clearPRAnnouncement: () => void;

  // Fase 4, 5 & 6: Adaptação Viva, Troca & Progressão
  swapExerciseInActiveSession: (targetIndex: number, newExercise: Exercise) => void;
  replaceExerciseInPlan: (planId: string, oldExerciseId: string, newExercise: Exercise) => Promise<void>;
  updateActiveExerciseTarget: (targetIndex: number, newTargetReps: number) => void;
  softenActiveSessionTargets: () => void;
  applyPlanProgression: (planId: string, approvedUpgrades: ProgressionItemUpgrade[]) => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isGuest, updateUserProfile } = useAuth();
  const uid = user ? user.uid : 'guest_user';

  // Programas de Longo Prazo
  const [programs] = useState<WorkoutProgram[]>(premadePrograms);
  const [activeProgram, setActiveProgram] = useState<WorkoutProgram | null>(() => {
    return getLocal<WorkoutProgram | null>('superacao_active_program', null);
  });


  // Estados principais
  const [plans, setPlans] = useState<WorkoutPlan[]>(() => {
    return isGuest ? getInitialGuestData().plans : allTemplates;
  });
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    return isGuest ? getInitialGuestData().sessions : [];
  });
  const [setEvents, setSetEvents] = useState<SetEvent[]>(() => {
    return isGuest ? getInitialGuestData().setEvents : [];
  });
  const [calendar, setCalendar] = useState<CalendarDay[]>(() => {
    return isGuest ? getInitialGuestData().calendar : generateBlankWeeklyCalendar(uid);
  });
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>(() => {
    return isGuest ? getInitialGuestData().prs : [];
  });

  // Sessão ativa em andamento
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => {
    return getLocal<WorkoutSession | null>('superacao_active_session', null);
  });

  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    const saved = getLocal<WorkoutSession | null>('superacao_active_session', null);
    return Boolean(saved);
  });

  const pauseAndReturnHome = () => {
    setIsFocusMode(false);
  };

  const resumeWorkout = () => {
    setIsFocusMode(true);
    workoutNotifications.requestPermission();
  };

  // Gerenciador de tela acesa (Wake Lock) e background audio/mídia durante a sessão ativa
  useEffect(() => {
    if (activeSession) {
      wakeLockManager.requestLock();
    } else {
      wakeLockManager.releaseLock();
      mediaSessionManager.clearSession();
      soundManager.cancelScheduledRest();
      backgroundTimer.stop();
    }
  }, [Boolean(activeSession)]);

  // Timer de descanso
  const [isResting, setIsResting] = useState<boolean>(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);
  const [restDurationTotal, setRestDurationTotal] = useState<number>(0);
  const restTargetTimestampRef = useRef<number | null>(null);

  // Status de Sincronização & Rede
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>({
    hasPendingWrites: false,
    fromCache: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isFirebaseReady: false,
  });

  const [latestPRAnnouncement, setLatestPRAnnouncement] = useState<string | null>(null);

  // Monitora conectividade de rede do navegador
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
      testConnection();
    };
    const handleOffline = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: false, fromCache: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Teste inicial de conexão
    testConnection().then((ready) => {
      setSyncStatus((prev) => ({ ...prev, isFirebaseReady: ready }));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sincronização reativa com Firestore (ou persistência local para guest)
  useEffect(() => {
    if (isGuest || !user) {
      // Modo Convidado: lê do storage local e grava alterações localmente
      const initial = getInitialGuestData();
      setPlans(initial.plans);
      setSessions(initial.sessions);
      setSetEvents(initial.setEvents);
      setCalendar(initial.calendar);
      setPersonalRecords(initial.prs);
      setSyncStatus((prev) => ({ ...prev, fromCache: true, hasPendingWrites: false }));
      return;
    }

    // Modo Autenticado Firestore
    const currentUid = user.uid;

    // 1. Planos do Usuário
    const plansRef = collection(db, 'users', currentUid, 'plans');
    const stopPlans = onSnapshot(
      plansRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        const { hasPendingWrites, fromCache } = snapshot.metadata;
        setSyncStatus((prev) => ({ ...prev, hasPendingWrites, fromCache }));
        if (!snapshot.empty) {
          const loadedPlans = snapshot.docs.map((d) => d.data() as WorkoutPlan);
          setPlans(loadedPlans);
          setLocal('superacao_plans', loadedPlans);
        } else {
          // Se vazio no primeiro login, inicializa com os templates
          allTemplates.forEach(async (tpl) => {
            const docRef = doc(db, 'users', currentUid, 'plans', tpl.id);
            await setDoc(docRef, { ...tpl, ownerUid: currentUid });
          });
          setPlans(allTemplates);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${currentUid}/plans`)
    );

    // 2. Sessões (Otimizadas com orderBy e limit 100 para economia de banda)
    const sessionsQuery = query(
      collection(db, 'users', currentUid, 'sessions'),
      orderBy('startedAt', 'desc'),
      limit(100)
    );
    const stopSessions = onSnapshot(
      sessionsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedSessions = snapshot.docs.map((d) => d.data() as WorkoutSession);
          setSessions(loadedSessions);
          setLocal('superacao_sessions', loadedSessions);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${currentUid}/sessions`)
    );

    // 3. Eventos de Séries (Otimizados com orderBy e limit 300)
    const setEventsQuery = query(
      collection(db, 'users', currentUid, 'setEvents'),
      orderBy('recordedAt', 'desc'),
      limit(300)
    );
    const stopSetEvents = onSnapshot(
      setEventsQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedEvents = snapshot.docs.map((d) => d.data() as SetEvent);
          setSetEvents(loadedEvents);
          setLocal('superacao_set_events', loadedEvents);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${currentUid}/setEvents`)
    );

    // 4. Calendário
    const calendarRef = collection(db, 'users', currentUid, 'calendar');
    const stopCalendar = onSnapshot(
      calendarRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedCal = snapshot.docs.map((d) => d.data() as CalendarDay);
          setCalendar(loadedCal);
          setLocal('superacao_calendar', loadedCal);
        } else {
          // Inicializa calendário semanal neutro
          const defaultCal = generateBlankWeeklyCalendar(currentUid);
          defaultCal.forEach(async (day: CalendarDay) => {
            const docRef = doc(db, 'users', currentUid, 'calendar', day.id);
            await setDoc(docRef, day);
          });
          setCalendar(defaultCal);
        }
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${currentUid}/calendar`)
    );

    // 5. Programa Ativo (Fase 6)
    const progDocRef = doc(db, 'users', currentUid, 'programs', 'active_program');
    const stopActiveProgram = onSnapshot(
      progDocRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.exists()) {
          const loadedProg = snapshot.data() as WorkoutProgram;
          setActiveProgram(loadedProg);
          setLocal('superacao_active_program', loadedProg);
        } else {
          // Se não existir no Firestore mas existe localmente, faz upload único de sincronização
          const localProg = getLocal<WorkoutProgram | null>('superacao_active_program', null);
          if (localProg) {
            void persistActiveProgram(currentUid, localProg);
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUid}/programs/active_program`)
    );

    // 6. Recordes Pessoais Consolidados (PRs)
    const recordsDocRef = doc(db, 'users', currentUid, 'stats', 'records');
    const stopRecords = onSnapshot(
      recordsDocRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.records) {
            const remotePrs = Object.values(data.records) as PersonalRecord[];
            if (remotePrs.length > 0) {
              setPersonalRecords(remotePrs);
              setLocal('superacao_personal_records', remotePrs);
            }
          }
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUid}/stats/records`)
    );

    return () => {
      stopPlans();
      stopSessions();
      stopSetEvents();
      stopCalendar();
      stopActiveProgram();
      stopRecords();
    };
  }, [user, isGuest]);

  // Reconstrói Recordes Pessoais (PRs) a partir dos eventos apenas se a lista estiver vazia
  useEffect(() => {
    if (personalRecords.length > 0 || setEvents.length === 0) return;

    // Processa eventos em ordem cronológica para recriar baselines e PRs fielmente com carga
    const sortedEvents = [...setEvents].sort((a, b) => a.recordedAt - b.recordedAt);
    let reconstructed: PersonalRecord[] = [];

    for (const ev of sortedEvents) {
      const res = checkAndRegisterPR(
        ev.exerciseId,
        ev.exerciseName,
        ev.actualReps,
        ev.actualDurationSeconds,
        reconstructed,
        ev.sessionId,
        ev.actualWeightKg
      );
      if (res.updatedPRs) {
        reconstructed = res.updatedPRs;
      }
    }

    if (reconstructed.length > 0) {
      setPersonalRecords(reconstructed);
      setLocal('superacao_personal_records', reconstructed);
    }
  }, [setEvents, personalRecords.length]);

  // Loop do timer de descanso (resistente a bloqueio de tela via Date.now())
  useEffect(() => {
    if (!isResting || !restTargetTimestampRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const target = restTargetTimestampRef.current || now;
      const remaining = Math.max(0, Math.ceil((target - now) / 1000));

      setRestSecondsRemaining(remaining);

      // Beeps discretos nos últimos 3 segundos
      if (remaining <= 3 && remaining > 0) {
        soundManager.playCountdownTick();
        triggerHaptic(40, profile.hapticEnabled);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        setIsResting(false);
        restTargetTimestampRef.current = null;
        soundManager.playRestFinished();
        backgroundTimer.stop();
        triggerHaptic([80, 50, 80], profile.hapticEnabled);

        // Notificação e Guia de Voz Offline ao terminar o descanso
        if (activeSession) {
          const currentItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex];
          const cue = currentItem?.exerciseName
            ? `Descanso finalizado! Próxima série de ${currentItem.exerciseName}.`
            : 'Descanso finalizado! Hora da próxima série.';
          speakWorkoutCue(cue, profile.voiceGuideEnabled ?? true);
          sendRestFinishedNotification(currentItem?.exerciseName || 'exercício');
          workoutNotifications.notifyRestFinished(
            currentItem?.exerciseName || 'Próximo exercício',
            activeSession.currentSetIndex
          );
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isResting, profile.hapticEnabled, activeSession]);

  // Funções de descanso com suporte a áudio no clock nativo e Media Session na lockscreen
  const startRestTimer = (seconds: number) => {
    if (seconds <= 0) return;
    setRestDurationTotal(seconds);
    setRestSecondsRemaining(seconds);
    restTargetTimestampRef.current = Date.now() + seconds * 1000;
    setIsResting(true);

    // 1. Agendamento com precisão de hardware de áudio (AudioContext clock)
    soundManager.scheduleRestCountdown(seconds);

    // 2. Timer de segundo plano imune ao throttling de abas mobile
    backgroundTimer.start(() => {
      const now = Date.now();
      const target = restTargetTimestampRef.current || now;
      const remaining = Math.max(0, Math.ceil((target - now) / 1000));
      setRestSecondsRemaining(remaining);
    });

    // 3. Atualiza controles na tela de bloqueio do celular (Media Session API)
    if (activeSession) {
      const currentItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex];
      const nextName = currentItem?.exerciseName || 'Próxima Série';
      mediaSessionManager.updateSession(
        `Descanso (${seconds}s)`,
        `A seguir: ${nextName}`,
        activeSession.planTitle,
        {
          onSkipRest: skipRest,
        }
      );
    }
  };

  const skipRest = () => {
    setIsResting(false);
    restTargetTimestampRef.current = null;
    setRestSecondsRemaining(0);
    soundManager.cancelScheduledRest();
    backgroundTimer.stop();
    triggerHaptic(40, profile.hapticEnabled);
  };

  const addRestSeconds = (extra: number) => {
    if (!restTargetTimestampRef.current) return;
    restTargetTimestampRef.current += extra * 1000;
    const now = Date.now();
    const newRemaining = Math.max(0, Math.ceil((restTargetTimestampRef.current - now) / 1000));
    setRestSecondsRemaining(newRemaining);
    setRestDurationTotal((prev) => prev + extra);
    soundManager.scheduleRestCountdown(newRemaining);
  };

  // ──────────────────────────────────────────────
  // AÇÕES DE PLANOS
  // ──────────────────────────────────────────────
  const savePlan = async (
    planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ): Promise<string> => {
    const id = existingId || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullPlan: WorkoutPlan = {
      ...planData,
      id,
      ownerUid: uid,
      createdAt: existingId ? (plans.find((p) => p.id === existingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now(),
      version: existingId ? ((plans.find((p) => p.id === existingId)?.version || 1) + 1) : 1,
    };

    const newPlans = existingId
      ? plans.map((p) => (p.id === existingId ? fullPlan : p))
      : [fullPlan, ...plans];

    setPlans(newPlans);
    setLocal('superacao_plans', newPlans);

    if (user && !isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'plans', id);
        await setDoc(docRef, fullPlan);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/plans/${id}`);
      }
    }

    return id;
  };

  const duplicatePlan = async (planId: string): Promise<string> => {
    const source = plans.find((p) => p.id === planId);
    if (!source) throw new Error('Plano não encontrado.');

    const duplicatedData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      ...source,
      title: `${source.title} (Cópia)`,
      version: 1,
      isTemplate: false,
    };

    return savePlan(duplicatedData);
  };

  const deletePlan = async (planId: string) => {
    const newPlans = plans.filter((p) => p.id !== planId);
    setPlans(newPlans);
    setLocal('superacao_plans', newPlans);

    if (user && !isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'plans', planId);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/plans/${planId}`);
      }
    }
  };

  // ──────────────────────────────────────────────
  // AÇÕES DE EXECUÇÃO DO TREINO
  // ──────────────────────────────────────────────
  const startWorkout = (
    plan: WorkoutPlan,
    scheduledDayId?: string,
    originType: 'scheduled' | 'program_session' | 'ad_hoc' | 'express' = 'ad_hoc',
    isExpress = false,
    wasPlannedHabit = false,
    scheduledActivityId?: string
  ) => {
    setIsFocusMode(true);
    const totalSets = plan.exercises.reduce((acc, curr) => acc + curr.targetSets, 0);
    const session: WorkoutSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerUid: uid,
      planId: plan.id,
      planTitle: plan.title,
      status: 'in_progress',
      startedAt: Date.now(),
      durationSeconds: 0,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      totalSetsPlanned: totalSets,
      totalSetsCompleted: 0,
      totalRepsCompleted: 0,
      prsAchieved: 0,
      newBaselinesCount: 0,
      exercisesSnapshot: plan.exercises,
      scheduledDayId,
      originType,
      isExpress,
      wasPlannedHabit,
      scheduledActivityId,
    };

    setActiveSession(session);
    setLocal('superacao_active_session', session);
    triggerHaptic(80, profile.hapticEnabled);
  };

  const swapExerciseInActiveSession = (targetIndex: number, newExercise: Exercise) => {
    if (!activeSession) return;
    const currentList = [...activeSession.exercisesSnapshot];
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    const oldItem = currentList[targetIndex];
    const isNewTime = newExercise.tracking === 'time' || newExercise.modality === 'mobilidade' || newExercise.modality === 'alongamento';
    const wasTime = oldItem.trackingMode === 'time' || (!oldItem.trackingMode && !!oldItem.targetDurationSeconds);

    let nextTrackingMode: 'reps' | 'time' = isNewTime ? 'time' : 'reps';
    let nextTargetDurationSeconds: number | undefined = oldItem.targetDurationSeconds;
    let nextTargetReps: number = oldItem.targetReps;

    if (isNewTime && !wasTime) {
      // Reps para tempo: 1 rep ~ 3s (mín 20s, máx 60s)
      nextTargetDurationSeconds = Math.min(60, Math.max(20, (oldItem.targetReps || 10) * 3));
      nextTargetReps = 0;
    } else if (!isNewTime && wasTime) {
      // Tempo para reps: 3s ~ 1 rep (mín 6, máx 15)
      nextTargetReps = Math.min(15, Math.max(6, Math.round((oldItem.targetDurationSeconds || 30) / 3)));
      nextTargetDurationSeconds = undefined;
    }

    currentList[targetIndex] = {
      ...oldItem,
      exerciseId: newExercise.id,
      exerciseName: newExercise.name_pt || newExercise.name_en || oldItem.exerciseName,
      trackingMode: nextTrackingMode,
      targetReps: nextTargetReps,
      targetDurationSeconds: nextTargetDurationSeconds,
    };

    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercisesSnapshot: currentList,
    };
    setActiveSession(updatedSession);
    setLocal('superacao_active_session', updatedSession);
    triggerHaptic(50, profile.hapticEnabled);
  };

  const replaceExerciseInPlan = async (
    planId: string,
    oldExerciseId: string,
    newExercise: Exercise
  ): Promise<void> => {
    const existingPlan = plans.find((p) => p.id === planId) ||
      premadePrograms.flatMap((pr) => pr.routines).find((r) => r.id === planId);
    if (!existingPlan) return;

    const isNewTime = newExercise.tracking === 'time' || newExercise.modality === 'mobilidade' || newExercise.modality === 'alongamento';

    const updatedExercises = existingPlan.exercises.map((item) => {
      if (item.exerciseId !== oldExerciseId) return item;
      const wasTime = item.trackingMode === 'time' || (!item.trackingMode && !!item.targetDurationSeconds);

      let nextTrackingMode: 'reps' | 'time' = isNewTime ? 'time' : 'reps';
      let nextTargetDurationSeconds: number | undefined = item.targetDurationSeconds;
      let nextTargetReps: number = item.targetReps;

      if (isNewTime && !wasTime) {
        nextTargetDurationSeconds = Math.min(60, Math.max(20, (item.targetReps || 10) * 3));
        nextTargetReps = 0;
      } else if (!isNewTime && wasTime) {
        nextTargetReps = Math.min(15, Math.max(6, Math.round((item.targetDurationSeconds || 30) / 3)));
        nextTargetDurationSeconds = undefined;
      }

      return {
        ...item,
        exerciseId: newExercise.id,
        exerciseName: newExercise.name_pt || newExercise.name_en || item.exerciseName,
        trackingMode: nextTrackingMode,
        targetReps: nextTargetReps,
        targetDurationSeconds: nextTargetDurationSeconds,
      };
    });

    const updatedPlan: WorkoutPlan = {
      ...existingPlan,
      exercises: updatedExercises,
      version: (existingPlan.version || 1) + 1,
      updatedAt: Date.now(),
    };

    await savePlan(updatedPlan, planId);

    // Sinergia com o Programa Ativo se a rotina fizer parte dele (Fase 5 & 6)
    if (activeProgram && activeProgram.routines.some((r) => r.id === planId)) {
      const updatedRoutines = activeProgram.routines.map((r) => (r.id === planId ? updatedPlan : r));
      const updatedProgram = {
        ...activeProgram,
        routines: updatedRoutines,
        updatedAt: Date.now(),
      };
      setActiveProgram(updatedProgram);
      setLocal('superacao_active_program', updatedProgram);
      if (user && !isGuest) {
        await persistActiveProgram(user.uid, updatedProgram);
      }
    }

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#D9F277', '#125F55', '#246747'],
    });
  };

  const softenActiveSessionTargets = () => {
    if (!activeSession) return;
    const softened = activeSession.exercisesSnapshot.map((ex) => {
      let nextReps = ex.targetReps;
      let nextSec = ex.targetDurationSeconds;
      if (nextReps && nextReps > 0) {
        nextReps = Math.max(4, Math.round(nextReps * 0.75));
      }
      if (nextSec && nextSec > 0) {
        nextSec = Math.max(15, Math.round(nextSec * 0.75));
      }
      return {
        ...ex,
        targetReps: nextReps,
        targetDurationSeconds: nextSec,
      };
    });

    const updated: WorkoutSession = {
      ...activeSession,
      exercisesSnapshot: softened,
    };
    setActiveSession(updated);
    setLocal('superacao_active_session', updated);
    triggerHaptic(50, profile.hapticEnabled);
  };

  const updateActiveExerciseTarget = (targetIndex: number, newTargetReps: number) => {
    if (!activeSession) return;
    const currentList = [...activeSession.exercisesSnapshot];
    if (targetIndex < 0 || targetIndex >= currentList.length) return;

    currentList[targetIndex] = {
      ...currentList[targetIndex],
      targetReps: newTargetReps,
    };

    const updatedSession: WorkoutSession = {
      ...activeSession,
      exercisesSnapshot: currentList,
    };
    setActiveSession(updatedSession);
    setLocal('superacao_active_session', updatedSession);
  };

  const applyPlanProgression = async (planId: string, approvedUpgrades: ProgressionItemUpgrade[]) => {
    const existingPlan = plans.find(p => p.id === planId);
    if (!existingPlan) return;

    const updatedPlan = applyUpgradesToWorkoutPlan(existingPlan, approvedUpgrades);
    await savePlan(updatedPlan, planId);

    // Sinergia com Programa Ativo (Fase 5 & 6)
    if (activeProgram && activeProgram.routines.some(r => r.id === planId)) {
      const updatedRoutines = activeProgram.routines.map(r => r.id === planId ? updatedPlan : r);
      const updatedProgram = {
        ...activeProgram,
        routines: updatedRoutines,
        updatedAt: Date.now(),
      };
      setActiveProgram(updatedProgram);
      setLocal('superacao_active_program', updatedProgram);
      if (user && !isGuest) {
        await persistActiveProgram(user.uid, updatedProgram);
      }
    }

    confetti({ particleCount: 45, spread: 70, origin: { y: 0.8 } });
  };

  const setSessionPreMood = (mood: PreWorkoutMood) => {
    if (!activeSession) return;
    const updated: WorkoutSession = {
      ...activeSession,
      preMood: mood,
    };
    setActiveSession(updated);
    setLocal('superacao_active_session', updated);
  };

  const recordSet = async (
    actualReps: number,
    actualDurationSeconds?: number,
    customRestSeconds?: number,
    actualWeightKg?: number
  ): Promise<{ isPR: boolean; isNewBaseline?: boolean; prText?: string }> => {
    if (!activeSession) return { isPR: false };

    const currentExItem = activeSession.exercisesSnapshot[activeSession.currentExerciseIndex];
    if (!currentExItem) return { isPR: false };

    // 1. Checa se superou Recorde Pessoal (PR) considerando carga e repetições
    const prCheck = checkAndRegisterPR(
      currentExItem.exerciseId,
      currentExItem.exerciseName,
      actualReps,
      actualDurationSeconds,
      personalRecords,
      activeSession.id,
      actualWeightKg
    );

    if (prCheck.isPR) {
      soundManager.playPRAchieved();
      triggerHaptic([100, 50, 100], profile.hapticEnabled);
      setLatestPRAnnouncement(`Superação em ${currentExItem.exerciseName}! ${prCheck.prText}`);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#D9F277', '#125F55', '#E07A5F', '#246747'],
      });
    } else {
      soundManager.playSetCompleted();
      triggerHaptic(60, profile.hapticEnabled);
    }

    // 2. Grava ou atualiza evento de série (evita duplicação ao navegar anterior/próximo)
    const existingIndex = setEvents.findIndex(
      (e) =>
        e.sessionId === activeSession.id &&
        e.exerciseId === currentExItem.exerciseId &&
        e.setIndex === activeSession.currentSetIndex
    );
    const isUpdate = existingIndex >= 0;
    const previousEvent = isUpdate ? setEvents[existingIndex] : null;

    const eventId = previousEvent ? previousEvent.id : `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const restSec = customRestSeconds !== undefined ? customRestSeconds : currentExItem.restSeconds;

    const setEvent: SetEvent = {
      id: eventId,
      ownerUid: uid,
      sessionId: activeSession.id,
      exerciseId: currentExItem.exerciseId,
      exerciseName: currentExItem.exerciseName,
      setIndex: activeSession.currentSetIndex,
      targetReps: currentExItem.targetReps,
      actualReps,
      actualWeightKg,
      targetDurationSeconds: currentExItem.targetDurationSeconds,
      actualDurationSeconds,
      restDurationSeconds: restSec,
      isPR: prCheck.isPR,
      prDetails: prCheck.prText,
      clientEventId: eventId,
      recordedAt: Date.now(),
    };

    // Atualiza estado local de eventos com deduplicação
    const updatedEvents = isUpdate
      ? setEvents.map((e, idx) => (idx === existingIndex ? setEvent : e))
      : [...setEvents, setEvent];
    setSetEvents(updatedEvents);
    setLocal('superacao_set_events', updatedEvents);

    // Se houve nova marca registrada (seja baseline de referência ou PR de evolução), persiste no storage
    if (prCheck.updatedPRs !== personalRecords) {
      setPersonalRecords(prCheck.updatedPRs);
      setLocal('superacao_personal_records', prCheck.updatedPRs);
      if (user && !isGuest) {
        void persistPersonalRecords(user.uid, prCheck.updatedPRs);
      }
    }

    // Persiste no Firestore com gravação otimista local
    if (user && !isGuest) {
      const docRef = doc(db, 'users', user.uid, 'setEvents', eventId);
      void setDoc(docRef, setEvent).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/setEvents/${eventId}`);
      });
    }

    // 3. Atualiza estado da sessão ativa e volume acumulado
    const isLastSetOfExercise = activeSession.currentSetIndex >= currentExItem.targetSets;
    const isLastExercise = activeSession.currentExerciseIndex >= activeSession.exercisesSnapshot.length - 1;

    let nextExIndex = activeSession.currentExerciseIndex;
    let nextSetIndex = activeSession.currentSetIndex + 1;

    if (isLastSetOfExercise) {
      if (!isLastExercise) {
        nextExIndex += 1;
        nextSetIndex = 1;
      }
    }

    const repsDiff = actualReps - (previousEvent?.actualReps || 0);
    const prevVol = (previousEvent?.actualReps || 0) * (previousEvent?.actualWeightKg || 0);
    const newVol = (actualReps || 0) * (actualWeightKg || 0);
    const volumeDiff = newVol - prevVol;

    const updatedSession: WorkoutSession = {
      ...activeSession,
      currentExerciseIndex: nextExIndex,
      currentSetIndex: nextSetIndex,
      totalSetsCompleted: isUpdate ? activeSession.totalSetsCompleted : activeSession.totalSetsCompleted + 1,
      totalRepsCompleted: activeSession.totalRepsCompleted + repsDiff,
      totalVolumeKg: (activeSession.totalVolumeKg || 0) + volumeDiff,
      prsAchieved: activeSession.prsAchieved + (prCheck.isPR && !previousEvent?.isPR ? 1 : 0),
      newBaselinesCount: (activeSession.newBaselinesCount || 0) + (prCheck.isNewBaseline && !previousEvent ? 1 : 0),
      durationSeconds: Math.floor((Date.now() - activeSession.startedAt) / 1000),
    };

    setActiveSession(updatedSession);
    setLocal('superacao_active_session', updatedSession);

    // 4. Dispara timer de descanso se ainda não for o fim do treino
    if (!(isLastSetOfExercise && isLastExercise)) {
      startRestTimer(restSec);
    }

    return prCheck;
  };

  const previousExercise = () => {
    if (!activeSession || activeSession.currentExerciseIndex <= 0) return;
    const targetIdx = activeSession.currentExerciseIndex - 1;
    const targetEx = activeSession.exercisesSnapshot[targetIdx];
    const completedForTarget = setEvents.filter(
      (e) => e.sessionId === activeSession.id && e.exerciseId === targetEx.exerciseId
    ).length;
    const nextSetIdx = Math.min(targetEx.targetSets, completedForTarget + 1);

    const updated: WorkoutSession = {
      ...activeSession,
      currentExerciseIndex: targetIdx,
      currentSetIndex: nextSetIdx,
    };
    setActiveSession(updated);
    setLocal('superacao_active_session', updated);
  };

  const nextExercise = () => {
    if (!activeSession || activeSession.currentExerciseIndex >= activeSession.exercisesSnapshot.length - 1) return;
    const targetIdx = activeSession.currentExerciseIndex + 1;
    const targetEx = activeSession.exercisesSnapshot[targetIdx];
    const completedForTarget = setEvents.filter(
      (e) => e.sessionId === activeSession.id && e.exerciseId === targetEx.exerciseId
    ).length;
    const nextSetIdx = Math.min(targetEx.targetSets, completedForTarget + 1);

    const updated: WorkoutSession = {
      ...activeSession,
      currentExerciseIndex: targetIdx,
      currentSetIndex: nextSetIdx,
    };
    setActiveSession(updated);
    setLocal('superacao_active_session', updated);
  };

  const completeWorkout = async (feedbackEffort?: number, notes?: string, postMood?: PostWorkoutMood) => {
    if (!activeSession) return;

    skipRest();

    // A13: Sessão encerrada sem nenhuma série confirmada não gera conclusão no histórico nem recorde
    if (activeSession.totalSetsCompleted === 0) {
      abandonWorkout();
      return;
    }

    const finalDuration = Math.max(60, Math.floor((Date.now() - activeSession.startedAt) / 1000));
    const finalEffort = feedbackEffort || 3;

    const tempCompleted: WorkoutSession = {
      ...activeSession,
      status: 'completed',
      completedAt: Date.now(),
      durationSeconds: finalDuration,
      feedbackEffort: finalEffort,
      notes: notes || '',
    };

    const efficiencyComp = evaluateSessionEfficiency(tempCompleted, sessions);

    // Calcula Moedas de Superação (Estratégia A)
    const coins: AchievementCoinType[] = [];
    if ((activeSession.prsAchieved || 0) > 0) coins.push('pr');
    if ((activeSession.newBaselinesCount || 0) > 0) coins.push('baseline');
    if (efficiencyComp?.improved) coins.push('efficiency_rpe');
    if (
      activeSession.planId.includes('mobilidade') ||
      activeSession.planTitle.toLowerCase().includes('mobilidade') ||
      activeSession.planTitle.toLowerCase().includes('alongamento') ||
      activeSession.planTitle.toLowerCase().includes('caminhada') ||
      activeSession.originType === 'active_recovery'
    ) {
      coins.push('care_vitality');
    }
    if (coins.length === 0) {
      coins.push('baseline');
    }

    const completedSession: WorkoutSession = {
      ...tempCompleted,
      postMood: postMood || activeSession.postMood,
      efficiencyComparison: efficiencyComp || undefined,
      achievementCoins: coins,
    };

    const newSessions = [completedSession, ...sessions];
    setSessions(newSessions);
    setLocal('superacao_sessions', newSessions);

    // Limpa sessão ativa
    setActiveSession(null);
    localStorage.removeItem('superacao_active_session');

    // Atualiza a agenda se vinculada a um dia ou ao dia atual
    if (completedSession.scheduledDayId) {
      const targetDay = calendar.find((c) => c.id === completedSession.scheduledDayId);
      if (targetDay) {
        if (completedSession.scheduledActivityId) {
          await toggleDayActivityCompleted(targetDay.id, completedSession.scheduledActivityId);
        } else {
          await updateCalendarDay(targetDay.id, 'strength', completedSession.planId, completedSession.planTitle);
          await toggleCalendarDayCompleted(targetDay.id);
        }
      }
    } else {
      const todayStr = getLocalDateStr();
      const todayCal = calendar.find((c) => c.dateStr === todayStr);
      if (todayCal && todayCal.activityType !== 'rest' && todayCal.activityType !== 'unassigned') {
        await updateCalendarDay(todayCal.id, todayCal.activityType, completedSession.planId, completedSession.planTitle);
        await toggleCalendarDayCompleted(todayCal.id);
      }
    }

    // Persiste no Firestore
    if (user && !isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'sessions', completedSession.id);
        await setDoc(docRef, completedSession);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${completedSession.id}`);
      }
    }

    // Confetti final de celebração
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#125F55', '#D9F277', '#246747'],
    });
  };

  // A14 / R02 / Seção 5: Sessão parcial confirmada é identificada como parcial e NÃO marca dias de descanso como concluídos
  const savePartialWorkout = async (notes?: string) => {
    if (!activeSession) return;
    skipRest();

    if (activeSession.totalSetsCompleted === 0) {
      abandonWorkout();
      return;
    }

    const finalDuration = Math.max(30, Math.floor((Date.now() - activeSession.startedAt) / 1000));
    const partialSession: WorkoutSession = {
      ...activeSession,
      status: 'parcial',
      completedAt: Date.now(),
      durationSeconds: finalDuration,
      notes: notes || 'Sessão finalizada parcialmente com séries concluídas.',
    };

    const newSessions = [partialSession, ...sessions];
    setSessions(newSessions);
    setLocal('superacao_sessions', newSessions);

    setActiveSession(null);
    localStorage.removeItem('superacao_active_session');

    // Regra Canônica de Integridade da Agenda:
    // Se o treino era de um dia agendado (scheduledDayId), anota a tentativa na observação, mas NUNCA marca isCompleted = true!
    // Se foi executado em um dia de descanso/avulso, o dia de descanso NÃO é alterado.
    if (partialSession.scheduledDayId) {
      const targetDay = calendar.find((c) => c.id === partialSession.scheduledDayId);
      if (targetDay && targetDay.activityType !== 'rest') {
        const updated = calendar.map((d) =>
          d.id === targetDay.id ? { ...d, notes: (d.notes ? `${d.notes} · ` : '') + 'Treino Parcial' } : d
        );
        setCalendar(updated);
        setLocal('superacao_calendar', updated);
        if (user && !isGuest) {
          void persistCalendarDays(user.uid, updated);
        }
      }
    }

    if (user && !isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'sessions', partialSession.id);
        void setDoc(docRef, partialSession);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${partialSession.id}`);
      }
    }
  };

  const abandonWorkout = () => {
    skipRest();
    setActiveSession(null);
    localStorage.removeItem('superacao_active_session');
    triggerHaptic(40, profile.hapticEnabled);
  };

  // A15: Registro de atividades livres (caminhada) sem GPS
  const recordWalkSession = async (durationMinutes: number, distanceKm?: number, notes?: string) => {
    const durationSec = Math.max(60, durationMinutes * 60);
    const title = distanceKm && distanceKm > 0 ? `Caminhada (${distanceKm} km)` : 'Caminhada Livre';

    const todayStr = getLocalDateStr();
    const todayCal = calendar.find((c) => c.dateStr === todayStr);
    const isTodayRest = todayCal?.activityType === 'rest';

    const walkSession: WorkoutSession = {
      id: `session_walk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerUid: uid,
      planId: 'walk_free',
      planTitle: title,
      status: 'completed',
      startedAt: Date.now() - durationSec * 1000,
      completedAt: Date.now(),
      durationSeconds: durationSec,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      totalSetsPlanned: 1,
      totalSetsCompleted: 1,
      totalRepsCompleted: 0,
      prsAchieved: 0,
      originType: isTodayRest ? 'active_recovery' : 'ad_hoc',
      achievementCoins: isTodayRest ? ['care_vitality'] : ['consistency_rhythm'],
      notes: notes || (distanceKm ? `${distanceKm} km percorridos sem necessidade de GPS.` : 'Caminhada confortável.'),
      exercisesSnapshot: [],
    };

    const newSessions = [walkSession, ...sessions];
    setSessions(newSessions);
    setLocal('superacao_sessions', newSessions);

    if (todayCal) {
      if (todayCal.activityType === 'rest') {
        const updated = calendar.map((d) =>
          d.id === todayCal.id
            ? {
                ...d,
                vitalityBonusCompleted: true,
                hasCareRoutine: true,
                careRoutineTitle: title,
                careMinutes: (d.careMinutes || 0) + durationMinutes,
                notes: (d.notes ? `${d.notes} · ` : '') + `${title} (${durationMinutes} min)`,
              }
            : d
        );
        setCalendar(updated);
        setLocal('superacao_calendar', updated);
        if (user && !isGuest) {
          void persistCalendarDays(user.uid, updated);
        }
      } else {
        await updateCalendarDay(todayCal.id, 'walk', 'walk_free', title);
        await toggleCalendarDayCompleted(todayCal.id);
      }
    }

    if (user && !isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'sessions', walkSession.id);
        void setDoc(docRef, walkSession);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${walkSession.id}`);
      }
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#125F55', '#D9F277', '#246747'],
    });
  };

  const recordCareSession = async (
    durationMinutes: number,
    title: string,
    category: 'mobility' | 'walk' | 'stretch' = 'mobility',
    notes?: string
  ) => {
    const durationSec = Math.max(60, durationMinutes * 60);
    const careSession: WorkoutSession = {
      id: `session_care_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerUid: uid,
      planId: `care_${category}`,
      planTitle: title,
      status: 'completed',
      startedAt: Date.now() - durationSec * 1000,
      completedAt: Date.now(),
      durationSeconds: durationSec,
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      totalSetsPlanned: 1,
      totalSetsCompleted: 1,
      totalRepsCompleted: 0,
      prsAchieved: 0,
      originType: 'active_recovery',
      achievementCoins: ['care_vitality'],
      notes: notes || `Sessão de cuidado e mobilidade (${durationMinutes} min).`,
      exercisesSnapshot: [],
    };

    const newSessions = [careSession, ...sessions];
    setSessions(newSessions);
    setLocal('superacao_sessions', newSessions);

    const todayStr = getLocalDateStr();
    const todayCal = calendar.find((c) => c.dateStr === todayStr);
    if (todayCal) {
      if (todayCal.activityType === 'rest') {
        const updated = calendar.map((d) =>
          d.id === todayCal.id
            ? {
                ...d,
                vitalityBonusCompleted: true,
                hasCareRoutine: true,
                careRoutineTitle: title,
                careMinutes: (d.careMinutes || 0) + durationMinutes,
                notes: (d.notes ? `${d.notes} · ` : '') + `${title} (${durationMinutes} min)`,
              }
            : d
        );
        setCalendar(updated);
        setLocal('superacao_calendar', updated);
        if (user && !isGuest) {
          void persistCalendarDays(user.uid, updated);
        }
      } else {
        await updateCalendarDay(todayCal.id, 'mobility', `care_${category}`, title);
        await toggleCalendarDayCompleted(todayCal.id);
      }
    }

    if (user && !isGuest) {
      try {
        const docRef = doc(db, 'users', user.uid, 'sessions', careSession.id);
        void setDoc(docRef, careSession);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/sessions/${careSession.id}`);
      }
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#D9F277', '#125F55', '#246747'],
    });
  };

  const scheduleOptionalMobilityForTomorrow = async (dateStr?: string, routineTitle?: string) => {
    let targetDate = dateStr;
    if (!targetDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = getLocalDateStr(tomorrow);
    }

    const updated = calendar.map((c) => {
      if (c.dateStr === targetDate) {
        if (c.activityType === 'rest') {
          return {
            ...c,
            hasCareRoutine: true,
            careRoutineTitle: routineTitle || 'Alongamento Suave (6 min)',
          };
        } else if (c.activityType === 'unassigned') {
          return {
            ...c,
            activityType: 'mobility' as ActivityType,
            planTitle: routineTitle || 'Alongamento Suave (6 min)',
            hasCareRoutine: true,
            careRoutineTitle: routineTitle || 'Alongamento Suave (6 min)',
          };
        }
      }
      return c;
    });

    setCalendar(updated);
    setLocal('superacao_calendar', updated);

    if (user && !isGuest) {
      const dayDoc = updated.find((c) => c.dateStr === targetDate);
      if (dayDoc) {
        try {
          const docRef = doc(db, 'users', user.uid, 'calendar', dayDoc.id);
          await setDoc(docRef, dayDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/calendar/${dayDoc.id}`);
        }
      }
    }
  };

  const confirmLegacyRoutine = async () => {
    await updateUserProfile({ needsReviewPrompt: false });
  };

  const confirmProposal = async (proposal: ExplainableProposal) => {
    // 1. Marca proposta como confirmada
    const confirmedProposal: ExplainableProposal = {
      ...proposal,
      isConfirmed: true,
    };
    setLocal(STORAGE_KEYS.PROPOSAL, confirmedProposal);

    // 2. Salva as rotinas da proposta nos planos pessoais sem duplicar
    let updatedPlans = [...plans];
    proposal.routines.forEach((routine) => {
      if (!updatedPlans.some((p) => p.id === routine.id)) {
        updatedPlans = [routine, ...updatedPlans];
      }
    });
    setPlans(updatedPlans);
    setLocal('superacao_plans', updatedPlans);

    // 3. Monta o WorkoutProgram ativo derivado estritamente da proposta
    const program: WorkoutProgram = {
      id: `program_${proposal.id}`,
      title: proposal.title,
      description: proposal.description,
      objective: 'habito',
      environment: proposal.environment === 'na academia' ? 'academia' : 'casa',
      durationWeeks: 4,
      currentWeek: 1,
      splitType: 'full_body',
      weeklyFrequency: proposal.targetDaysCount,
      phases: [
        {
          name: 'Fase 1: Construção do Hábito e Adaptação',
          weeks: [1, 2, 3, 4],
          description: proposal.description,
        },
      ],
      routines: proposal.routines,
      weeklySchedule: proposal.weeklySchedule,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCustom: true,
    };

    setActiveProgram(program);
    setLocal('superacao_active_program', program);

    // 4. Cria a agenda semanal com os dias de treino rigorosamente mapeados
    const newCalendar = generateWeeklyCalendarFromProposal(uid, confirmedProposal, profile.preferredTime);
    setCalendar(newCalendar);
    setLocal('superacao_calendar', newCalendar);

    // 5. Atualiza o perfil para registrar rotina confirmada (sincronizando estado React e Firestore)
    const updatedProfile: UserProfile = {
      ...profile,
      routineConfirmed: true,
      onboardingCompleted: true,
      availableDays: Object.keys(proposal.weeklySchedule).map(Number),
      sessionDurationMinutes: profile.sessionDurationMinutes || proposal.sessionDurationMinutes,
      equipments: proposal.equipmentsUsed,
      avoidedMovements: proposal.avoidedMovements,
      updatedAt: Date.now(),
    };
    await updateUserProfile(updatedProfile);

    // 6. Se logado com conta real, persiste rotinas, programa e calendário no Firestore
    if (user && !isGuest) {
      try {
        const progDocRef = doc(db, 'users', user.uid, 'programs', 'active_program');
        await setDoc(progDocRef, program);
        for (const r of proposal.routines) {
          const planDocRef = doc(db, 'users', user.uid, 'plans', r.id);
          await setDoc(planDocRef, r);
        }
        for (const c of newCalendar) {
          const calDocRef = doc(db, 'users', user.uid, 'calendar', c.id);
          await setDoc(calDocRef, c);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar proposta no Firestore:', err);
      }
    }
  };


  // ──────────────────────────────────────────────
  // AÇÕES DE CALENDÁRIO & AGENDA
  // ──────────────────────────────────────────────
  const updateCalendarDay = async (
    dayId: string,
    activityType: ActivityType,
    planId?: string,
    planTitle?: string
  ) => {
    const updated = calendar.map((c) =>
      c.id === dayId
        ? {
            ...c,
            activityType,
            planId: planId || c.planId,
            planTitle: planTitle || c.planTitle,
          }
        : c
    );

    setCalendar(updated);
    setLocal('superacao_calendar', updated);

    if (user && !isGuest) {
      const dayDoc = updated.find((c) => c.id === dayId);
      if (dayDoc) {
        try {
          const docRef = doc(db, 'users', user.uid, 'calendar', dayId);
          await setDoc(docRef, dayDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/calendar/${dayId}`);
        }
      }
    }
  };

  const toggleCalendarDayCompleted = async (dayId: string) => {
    const updated = calendar.map((c) =>
      c.id === dayId
        ? {
            ...c,
            isCompleted: !c.isCompleted,
            completedAt: !c.isCompleted ? Date.now() : undefined,
          }
        : c
    );

    setCalendar(updated);
    setLocal('superacao_calendar', updated);

    if (user && !isGuest) {
      const dayDoc = updated.find((c) => c.id === dayId);
      if (dayDoc) {
        try {
          const docRef = doc(db, 'users', user.uid, 'calendar', dayId);
          await setDoc(docRef, dayDoc);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/calendar/${dayId}`);
        }
      }
    }
  };

  const exportBackup = () => {
    exportUserDataAsJSON({
      profile,
      plans,
      sessions,
      setEvents,
      calendar,
      prs: personalRecords,
    });
  };

  const clearPRAnnouncement = () => setLatestPRAnnouncement(null);

  // ──────────────────────────────────────────────
  // AÇÕES DE PROGRAMAS DE LONGO PRAZO & HÁBITOS
  // ──────────────────────────────────────────────
  // Regra canônica (R01 / R04 / Seção 5): A ativação de programa não deve atropelar
  // silenciosamente os dias disponíveis do usuário nem inflar a meta semanal de 2 para 3 sem consentimento.
  const activateProgram = async (
    program: WorkoutProgram,
    customDays?: number[],
    options?: { mode?: 'replace' | 'merge'; timeOfDay?: TimeOfDay }
  ) => {
    setActiveProgram(program);
    setLocal('superacao_active_program', program);

    const availableDays = customDays && customDays.length > 0
      ? customDays
      : (profile.availableDays && profile.availableDays.length > 0 ? profile.availableDays : [1, 3, 5]);

    const mode = options?.mode || 'replace';
    const targetTimeOfDay = options?.timeOfDay || (program.objective === 'sono' ? 'noite' : 'manha');

    // Extrai rotinas do programa preservando a ordem dos treinos
    const scheduledRoutines = Object.entries(program.weeklySchedule)
      .filter(([_, id]) => Boolean(id))
      .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
      .map(([_, id]) => id as string);

    const uniqueRoutines = Array.from(new Set(scheduledRoutines.length > 0 ? scheduledRoutines : program.routines.map(r => r.id)));

    let routineIdx = 0;
    const updatedCal = calendar.map((cDay) => {
      const isTargetDay = availableDays.includes(cDay.dayOfWeek);

      if (isTargetDay && uniqueRoutines.length > 0) {
        const routineId = uniqueRoutines[routineIdx % uniqueRoutines.length];
        routineIdx++;
        const foundRoutine = program.routines.find((r) => r.id === routineId) || plans.find((p) => p.id === routineId);
        const planTitle = foundRoutine?.title || 'Treino do Programa';

        if (mode === 'merge') {
          // Se ja tem um treino primario agendado para o dia, adiciona como atividade complementar
          if (cDay.activityType === 'strength' && cDay.planId) {
            const newAct: ScheduledDayActivity = {
              id: 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
              planId: routineId,
              planTitle,
              timeOfDay: targetTimeOfDay,
              activityType: 'strength',
              isCompleted: false,
              programId: program.id,
              programTitle: program.title,
            };
            const existing = cDay.additionalActivities || [];
            return {
              ...cDay,
              additionalActivities: [...existing, newAct],
            };
          } else {
            return {
              ...cDay,
              activityType: 'strength' as ActivityType,
              planId: routineId,
              planTitle,
              timeOfDay: targetTimeOfDay,
              isCompleted: false,
            };
          }
        } else {
          // Modo replace: redefine
          return {
            ...cDay,
            activityType: 'strength' as ActivityType,
            planId: routineId,
            planTitle,
            timeOfDay: targetTimeOfDay,
            isCompleted: false,
            additionalActivities: [],
          };
        }
      } else {
        if (mode === 'merge') {
          // No modo merge, mantem intactos os outros dias da semana
          return cDay;
        } else {
          return {
            ...cDay,
            activityType: 'rest' as ActivityType,
            planId: undefined,
            planTitle: undefined,
            isCompleted: false,
            additionalActivities: [],
          };
        }
      }
    });

    setCalendar(updatedCal);
    setLocal('superacao_calendar', updatedCal);

    if (user && !isGuest) {
      try {
        const progDocRef = doc(db, 'users', user.uid, 'programs', 'active_program');
        await setDoc(progDocRef, program);
        await persistCalendarDays(user.uid, updatedCal);
      } catch (err) {
        console.warn('Erro ao salvar programa no Firestore:', err);
      }
    }
  };

  const addActivityToDay = async (
    dayId: string,
    planId: string,
    timeOfDay: TimeOfDay = 'manha',
    options?: { programId?: string; programTitle?: string }
  ) => {
    const plan = plans.find((p) => p.id === planId) || premadePrograms.flatMap(pr => pr.routines).find(r => r.id === planId);
    const planTitle = plan?.title || 'Treino Adicionado';

    const updated = calendar.map((c) => {
      if (c.id !== dayId) return c;

      if (!c.planId || c.activityType === 'rest' || c.activityType === 'unassigned') {
        return {
          ...c,
          activityType: 'strength' as ActivityType,
          planId,
          planTitle,
          timeOfDay,
          isCompleted: false,
        };
      }

      const newAct: ScheduledDayActivity = {
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        planId,
        planTitle,
        timeOfDay,
        activityType: 'strength',
        isCompleted: false,
        programId: options?.programId,
        programTitle: options?.programTitle,
      };

      return {
        ...c,
        additionalActivities: [...(c.additionalActivities || []), newAct],
      };
    });

    setCalendar(updated);
    setLocal('superacao_calendar', updated);
    if (user && !isGuest) {
      void persistCalendarDays(user.uid, updated);
    }
  };

  const removeActivityFromDay = async (dayId: string, activityId: string) => {
    const updated = calendar.map((c) => {
      if (c.id !== dayId) return c;
      const remaining = (c.additionalActivities || []).filter((a) => a.id !== activityId);
      return {
        ...c,
        additionalActivities: remaining,
      };
    });

    setCalendar(updated);
    setLocal('superacao_calendar', updated);
    if (user && !isGuest) {
      void persistCalendarDays(user.uid, updated);
    }
  };

  const toggleDayActivityCompleted = async (dayId: string, activityId?: string) => {
    if (!activityId) {
      return toggleCalendarDayCompleted(dayId);
    }

    const updated = calendar.map((c) => {
      if (c.id !== dayId) return c;
      const nextActivities = (c.additionalActivities || []).map((act) => {
        if (act.id !== activityId) return act;
        const nextCompleted = !act.isCompleted;
        return {
          ...act,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? Date.now() : undefined,
        };
      });
      return {
        ...c,
        additionalActivities: nextActivities,
      };
    });

    setCalendar(updated);
    setLocal('superacao_calendar', updated);
    if (user && !isGuest) {
      void persistCalendarDays(user.uid, updated);
    }
  };

  const advanceProgramWeek = () => {
    if (!activeProgram) return;
    const nextWeek = Math.min(activeProgram.durationWeeks, activeProgram.currentWeek + 1);
    const updated = { ...activeProgram, currentWeek: nextWeek, updatedAt: Date.now() };
    setActiveProgram(updated);
    setLocal('superacao_active_program', updated);
    if (user && !isGuest) {
      void persistActiveProgram(user.uid, updated);
    }
  };

  const startEmergencyWorkout = () => {
    const rescueId = activeProgram?.emergencyPlanId || 'plan_emergencia_salvar_habito_5m';
    const foundPlan = plans.find((p) => p.id === rescueId) || allTemplates.find((t) => t.id === rescueId) || plans[0];
    if (foundPlan) {
      startWorkout(foundPlan);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        plans,
        sessions,
        setEvents,
        calendar,
        personalRecords,
        activeSession,
        isFocusMode,
        setIsFocusMode,
        pauseAndReturnHome,
        resumeWorkout,
        syncStatus,
        programs,
        activeProgram,
        activateProgram,
        advanceProgramWeek,
        startEmergencyWorkout,
        addActivityToDay,
        removeActivityFromDay,
        toggleDayActivityCompleted,
        isResting,
        restSecondsRemaining,
        restDurationTotal,
        skipRest,
        addRestSeconds,
        savePlan,
        duplicatePlan,
        deletePlan,
        startWorkout,
        recordSet,
        previousExercise,
        nextExercise,
        completeWorkout,
        savePartialWorkout,
        abandonWorkout,
        recordWalkSession,
        recordCareSession,
        setSessionPreMood,
        scheduleOptionalMobilityForTomorrow,
        updateCalendarDay,
        toggleCalendarDayCompleted,
        confirmLegacyRoutine,
        confirmProposal,
        exportBackup,
        latestPRAnnouncement,
        clearPRAnnouncement,
        swapExerciseInActiveSession,
        replaceExerciseInPlan,
        updateActiveExerciseTarget,
        softenActiveSessionTargets,
        applyPlanProgression,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkout deve ser utilizado dentro de WorkoutProvider');
  }
  return ctx;
}
