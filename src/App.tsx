import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { TopStatusBar } from './components/TopStatusBar';
import { BottomNav, TabDestination } from './components/BottomNav';
import { SWUpdateBanner } from './components/SWUpdateBanner';
import { syncAppBadge } from './lib/pwaNative';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { HomeView } from './views/HomeView';
import { WelcomeView } from './views/WelcomeView';

// Code Splitting Resiliente das Telas Secundárias (com auto-retry em novos deploys)
const ExploreView = lazyWithRetry(() => import('./views/ExploreView').then((m) => ({ default: m.ExploreView })));
const BuilderView = lazyWithRetry(() => import('./views/BuilderView').then((m) => ({ default: m.BuilderView })));
const ActiveWorkoutView = lazyWithRetry(() => import('./views/ActiveWorkoutView').then((m) => ({ default: m.ActiveWorkoutView })));
const CalendarView = lazyWithRetry(() => import('./views/CalendarView').then((m) => ({ default: m.CalendarView })));
const ProgressView = lazyWithRetry(() => import('./views/ProgressView').then((m) => ({ default: m.ProgressView })));
const ProfileView = lazyWithRetry(() => import('./views/ProfileView').then((m) => ({ default: m.ProfileView })));
const ListeningJourneyView = lazyWithRetry(() => import('./views/ListeningJourneyView').then((m) => ({ default: m.ListeningJourneyView })));
const ProposalView = lazyWithRetry(() => import('./views/ProposalView').then((m) => ({ default: m.ProposalView })));
const AdminDashboardView = lazyWithRetry(() => import('./views/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView })));
import { PersonalAgentFab } from './components/PersonalAgentFab';
import { PersonalAgentDrawer } from './components/PersonalAgentDrawer';
import { ActiveScreenContext } from './types';

const ViewLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-label="Preparando sua tela"
    className="flex-1 max-w-xl mx-auto w-full px-4 py-6 space-y-4 animate-pulse"
  >
    <div className="bg-white/80 rounded-3xl p-5 border border-[#C9DBD3]/50 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#EAF3EF] flex items-center justify-center text-[#125F55] font-black text-base">
          S
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-28 bg-[#EAF3EF] rounded-full" />
          <div className="h-4 w-48 bg-[#C9DBD3]/50 rounded-full" />
        </div>
      </div>
      <div className="h-16 w-full bg-[#F5F8F5] rounded-2xl" />
    </div>
    <span className="block text-center text-xs font-medium text-[#5B7170]">
      Carregando com cuidado...
    </span>
  </div>
);
import { WorkoutPlan, ExplainableProposal, OnboardingDraft, PreWorkoutMood, CustomAnamnesisTemplate, ProposalDiff } from './types';
import { premadeWorkouts } from './data/premadeWorkouts';
import { buildCustomWorkoutForPurpose } from './lib/aiCatalogBridge';
import { allExercises } from './data/catalog';
import { buildAiUserContext, normalizeExternalModality } from './lib/aiActions';
import {
  getLocal,
  setLocal,
  STORAGE_KEYS,
  generateExplainableProposal,
} from './lib/storage';
import { QuickIdentificationView } from './views/QuickIdentificationView';
import { TeacherDashboardView } from './views/TeacherDashboardView';
import { LinkTeacherModal } from './components/LinkTeacherModal';
import { CustomAnamnesisFlowView } from './views/CustomAnamnesisFlowView';
import { ShieldAlert } from 'lucide-react';
import { EmailAuthModal } from './components/EmailAuthModal';

type AppFlowState = 'welcome' | 'quick_id' | 'teacher_dashboard' | 'custom_anamnesis' | 'onboarding' | 'proposal' | 'main';

const MainAppContent: React.FC = () => {
  const { user, profile, isGuest, isAdmin, isLoading: authLoading, updateUserProfile, logout, pendingConflict, resolveConflict } = useAuth();
  const {
    activeSession,
    isFocusMode,
    setIsFocusMode,
    plans,
    startWorkout,
    activeProgram,
    calendar,
    sessions,
    advanceProgramWeek,
    savePlan,
    swapExerciseInActiveSession,
    softenActiveSessionTargets,
    updateActiveExerciseTarget,
    recordExternalPractice,
    setCalendar,
  } = useWorkout();

  // Controle de estado de jornada e fluxo (Seção 4)
  const [accessChoice, setAccessChoice] = useState<'guest' | 'login' | 'signup' | null>(() => {
    return getLocal<'guest' | 'login' | 'signup' | null>(STORAGE_KEYS.ACCESS_CHOICE, null);
  });

  const [isViewingProposal, setIsViewingProposal] = useState<boolean>(false);

  const [currentProposal, setCurrentProposal] = useState<ExplainableProposal | null>(() => {
    return getLocal<ExplainableProposal | null>(STORAGE_KEYS.PROPOSAL, null);
  });

  // Estados de navegação interna da aplicação
  const [currentTab, setCurrentTab] = useState<TabDestination>('home');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [isBuilderPro, setIsBuilderPro] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.search.includes('admin=1');
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const [isPersonalDrawerOpen, setIsPersonalDrawerOpen] = useState<boolean>(false);

  // Estados para Professor, Anamnese Personalizada e Identificação Rápida
  const [isTeacherPersonalMode, setIsTeacherPersonalMode] = useState<boolean>(false);
  const [showLinkTeacherModal, setShowLinkTeacherModal] = useState<boolean>(false);
  const [customAnamnesisTemplate, setCustomAnamnesisTemplate] = useState<CustomAnamnesisTemplate | null>(null);
  const [customAnamnesisTeacherUid, setCustomAnamnesisTeacherUid] = useState<string | null>(null);
  const [isListeningOpen, setIsListeningOpen] = useState<boolean>(false);
  const [builderStudentCallback, setBuilderStudentCallback] = useState<((plan: WorkoutPlan) => void) | null>(null);
  const [builderStudentLims, setBuilderStudentLims] = useState<string[]>([]);
  const [builderStudentEqs, setBuilderStudentEqs] = useState<string[]>([]);

  // Calcula o estado determinístico de fluxo (Seção 4, Critérios C01, C02, C09 + Sprint 1 a 4)
  const flowState: AppFlowState = (() => {
    // 1. Não houve escolha explícita de acesso e não está logado
    if (!user && !accessChoice) {
      return 'welcome';
    }

    // Papel efetivo considerando perfil legado (onboarding concluído mas sem userRole explícito)
    const effectiveRole = profile.userRole || (profile.onboardingCompleted ? 'student' : undefined);

    // 2. Identificação rápida pendente (usuário sem papel definido ou com perfil neutro inicial)
    if (!profile.userRole || (!profile.onboardingCompleted && (!profile.displayName?.trim() || profile.displayName === 'Praticante'))) {
      return 'quick_id';
    }

    // 3. Painel do Professor ativo (quando o usuário é professor e não está no modo treino pessoal)
    if (effectiveRole === 'teacher' && !isTeacherPersonalMode) {
      return 'teacher_dashboard';
    }

    // 4. Fluxo de Anamnese Customizada do Professor em andamento
    if (customAnamnesisTemplate && customAnamnesisTeacherUid) {
      return 'custom_anamnesis';
    }

    // 5. Escuta / Onboarding aberto explicitamente
    if (isListeningOpen) {
      return 'onboarding';
    }

    // 6. Proposta gerada aguardando confirmação explícita ou aberta explicitamente para revisão (Critério C09)
    if (currentProposal && (!profile.routineConfirmed || isViewingProposal)) {
      return 'proposal';
    }

    // 7. Experiência principal (usuário com rotina confirmada ou explorando)
    return 'main';
  })();

  const activeScreenContext: ActiveScreenContext = {
    currentTab: currentTab as any,
    activeView: isFocusMode ? 'active_workout' : currentTab,
    isFocusModeActive: isFocusMode,
    currentExerciseName: activeSession?.exercisesSnapshot?.[activeSession.currentExerciseIndex]?.exerciseName,
    currentExerciseId: activeSession?.exercisesSnapshot?.[activeSession.currentExerciseIndex]?.exerciseId,
    currentSetIndex: activeSession?.currentSetIndex,
    totalSets: activeSession?.exercisesSnapshot?.[activeSession.currentExerciseIndex]?.targetSets,
  };

  const handleStartPlan = (
    plan: WorkoutPlan,
    scheduledDayId?: string,
    originType: 'scheduled' | 'program_session' | 'ad_hoc' | 'express' = 'ad_hoc',
    isExpress = false,
    wasPlannedHabit = false,
    scheduledActivityId?: string,
    preMood?: PreWorkoutMood
  ) => {
    startWorkout(plan, scheduledDayId, originType, isExpress, wasPlannedHabit, scheduledActivityId, preMood);
  };

  /**
   * Executor Central de Mutações do Sistema pela IA (SystemActionDispatcher)
   * Permite que o Personal IA execute ações reais no treino, agenda, fichas e perfil.
   */
  const handleApplyAiProposalDiff = async (diff: ProposalDiff) => {
    try {
      // 1. Suavizar sessão ativa ou do dia
      if (diff.actionType === 'soften_session') {
        if (activeSession) {
          softenActiveSessionTargets();
        }
        return;
      }

      // 2. Trocar exercício no treino ativo (com fallback biomecânico seguro caso ID não seja exato)
      if (diff.actionType === 'swap_exercise') {
        if (activeSession) {
          let replacementEx = diff.replacementId
            ? allExercises.find((e) => e.id === diff.replacementId)
            : undefined;
          if (!replacementEx) {
            const currentExId =
              activeSession.exercisesSnapshot?.[activeSession.currentExerciseIndex]?.exerciseId;
            if (currentExId) {
              const { findSafeEquivalentExercises } = await import('./lib/workoutEngine');
              const safeAlts = findSafeEquivalentExercises(currentExId, profile, allExercises);
              replacementEx = safeAlts[0];
            }
          }
          if (replacementEx) {
            swapExerciseInActiveSession(activeSession.currentExerciseIndex, replacementEx);
          }
        }
        return;
      }

      // 3. Ajustar repetições ou carga
      if (diff.actionType === 'adjust_exercise_target') {
        if (activeSession && typeof diff.payload?.targetReps === 'number') {
          updateActiveExerciseTarget(activeSession.currentExerciseIndex, diff.payload.targetReps);
        }
        return;
      }

      // 4. Iniciar treino preparado sob medida pelo Personal IA
      if (diff.actionType === 'generate_custom_workout') {
        let planToStart = diff.workoutPlan;
        if (!planToStart) {
          const purpose = diff.payload?.purpose || 'mobilidade_alongamento';
          const duration = diff.payload?.durationMinutes || 15;
          planToStart = await buildCustomWorkoutForPurpose(profile, {
            purpose,
            durationMinutes: duration,
          });
        }
        if (planToStart) {
          await savePlan(planToStart);
          setIsPersonalDrawerOpen(false);
          startWorkout(planToStart, undefined, 'ad_hoc');
        }
        return;
      }

      // 5. Registrar prática externa ou arte marcial
      if (diff.actionType === 'log_external_practice') {
        const payload = diff.payload || {};
        await recordExternalPractice(
          normalizeExternalModality(payload.modality),
          payload.durationMinutes || 45,
          payload.effortScore || 4,
          payload.mood || 'renovado',
          payload.notes || diff.descriptionPt
        );
        setIsPersonalDrawerOpen(false);
        return;
      }

      // 5.1. Avançar fase ou semana do programa de longo prazo
      if (diff.actionType === 'advance_program_phase') {
        advanceProgramWeek();
        setIsPersonalDrawerOpen(false);
        return;
      }

      // 6. Atualizar perfil
      if (diff.actionType === 'update_profile') {
        if (diff.payload) {
          await updateUserProfile(diff.payload);
        }
        return;
      }

      // 7. Navegação
      if (diff.actionType === 'navigate' && diff.payload?.tab) {
        handleSelectTab(diff.payload.tab);
        setIsPersonalDrawerOpen(false);
        return;
      }
    } catch (err) {
      console.error('[App] Erro ao aplicar proposta da IA:', err);
    }
  };

  const handleStartPlanById = (planId: string, scheduledDayId?: string, scheduledActivityId?: string) => {
    const p = plans.find((x) => x.id === planId) || premadeWorkouts.find((x) => x.id === planId) || plans[0];
    if (p) startWorkout(p, scheduledDayId, scheduledDayId ? 'scheduled' : 'ad_hoc', false, false, scheduledActivityId);
  };

  // Navegação suave com View Transitions API e registro no History API do Android
  const handleSelectTab = (nextTab: TabDestination, shouldPushState = true) => {
    if (nextTab !== currentTab && shouldPushState && typeof window !== 'undefined') {
      window.history.pushState({ tab: nextTab }, '');
    }
    const update = () => {
      setCurrentTab(nextTab);
    };
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(update);
    } else {
      update();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleOpenProfile = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: 'profile' }, '');
    }
    setIsProfileOpen(true);
  };

  const handleOpenBuilder = (existingId?: string, isPro: boolean = false) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: 'builder' }, '');
    }
    setEditingPlanId(existingId || null);
    setIsBuilderPro(isPro);
    setIsBuilderOpen(true);
  };

  const handleOpenListening = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: 'listening' }, '');
    }
    setIsListeningOpen(true);
  };

  const handleOpenLinkTeacher = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ modal: 'link_teacher' }, '');
    }
    setShowLinkTeacherModal(true);
  };

  const handleOpenTeacherPersonal = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen: 'teacher_personal' }, '');
    }
    setIsTeacherPersonalMode(true);
  };

  // Auto-migra usuário legado para papel de aluno no storage sem provocar atualização de estado durante render
  useEffect(() => {
    if (profile.onboardingCompleted && !profile.userRole) {
      updateUserProfile({ userRole: 'student' });
    }
  }, [profile.onboardingCompleted, profile.userRole]);

  // Inicializa estado padrão de histórico para garantir navegação consistente no Android
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.history.state?.tab) {
      window.history.replaceState({ tab: 'home' }, '');
    }
  }, []);

  // Registra histórico ao entrar no Modo Foco para permitir que o botão 'Voltar' do Android minimize para a Home sem fechar o app
  useEffect(() => {
    if (activeSession && isFocusMode && typeof window !== 'undefined') {
      window.history.pushState({ screen: 'workout_focus' }, '');
    }
  }, [Boolean(activeSession && isFocusMode)]);

  // Sincroniza estado de logout: quando o usuário sai, fecha todas as visualizações ativas e limpa o fluxo para retornar à Tela Inicial
  useEffect(() => {
    if (!user && isGuest) {
      const stored = getLocal(STORAGE_KEYS.ACCESS_CHOICE, null);
      if (!stored && accessChoice !== null) {
        setAccessChoice(null);
        setIsProfileOpen(false);
        setIsBuilderOpen(false);
        setIsListeningOpen(false);
        setIsAdminDashboardOpen(false);
        setCurrentProposal(null);
        setCurrentTab('home');
      }
    }
  }, [user, isGuest, accessChoice]);

  // Suporte nativo ao botão físico / gesto "Voltar" do celular (History API)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (activeSession && isFocusMode) {
        if (e.state?.screen === 'workout_focus' || e.state?.modal === 'workout_overlay') {
          // Retornou de uma gaveta ou submodal interno do treino; preserva o Modo Foco
          return;
        }
        // Se explicitamente voltou para uma aba ou histórico anterior sem foco
        if (e.state?.tab === 'home' || !e.state) {
          setIsFocusMode(false);
        }
      } else if (isProfileOpen) {
        setIsProfileOpen(false);
      } else if (isBuilderOpen) {
        setIsBuilderOpen(false);
        setEditingPlanId(null);
        setIsBuilderPro(false);
        setBuilderStudentCallback(null);
      } else if (showLinkTeacherModal) {
        setShowLinkTeacherModal(false);
      } else if (customAnamnesisTemplate) {
        setCustomAnamnesisTemplate(null);
        setCustomAnamnesisTeacherUid(null);
      } else if (isTeacherPersonalMode) {
        setIsTeacherPersonalMode(false);
      } else if (isListeningOpen) {
        setIsListeningOpen(false);
      } else if (isViewingProposal) {
        setIsViewingProposal(false);
      } else if (e.state?.tab && e.state.tab !== currentTab) {
        handleSelectTab(e.state.tab, false);
      } else if (currentTab !== 'home') {
        handleSelectTab('home', false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    activeSession,
    isFocusMode,
    isProfileOpen,
    isBuilderOpen,
    showLinkTeacherModal,
    customAnamnesisTemplate,
    isTeacherPersonalMode,
    isListeningOpen,
    isViewingProposal,
    currentTab,
  ]);

  // Suporte a atalhos rápidos do ícone PWA (?shortcut=...) e remoção da splash screen inicial
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Remove splash screen instantânea PWA com fade-out
    const splash = document.getElementById('pwa-splash');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(() => {
        splash.remove();
      }, 350);
    }

    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get('shortcut');
    if (shortcut === 'progress') {
      handleSelectTab('progress');
    } else if (shortcut === 'express' || shortcut === 'today') {
      handleSelectTab('home');
    }
    if (shortcut) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Pré-carregamento proativo de views PWA em segundo plano (resiliência offline completa)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const preloadLazyViews = () => {
      import('./views/ExploreView').catch(() => {});
      import('./views/CalendarView').catch(() => {});
      import('./views/ProgressView').catch(() => {});
      import('./views/ActiveWorkoutView').catch(() => {});
      import('./views/ProfileView').catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadLazyViews, { timeout: 1500 });
    } else {
      setTimeout(preloadLazyViews, 600);
    }
  }, []);

  // Atualiza App Badge no ícone do aplicativo
  useEffect(() => {
    if (flowState === 'main' && calendar && calendar.length > 0) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const todaySchedule = calendar.find((c) => c.dayOfWeek === dayOfWeek);
      const isTodayDone = Boolean(todaySchedule?.isCompleted);
      const hasPendingToday = Boolean(todaySchedule && todaySchedule.activityType !== 'rest' && !isTodayDone);
      syncAppBadge(hasPendingToday);
    }
  }, [calendar, flowState]);

  // Centro de Controle do Administrador (DeepInfra v2)
  if (isAdminDashboardOpen) {
    // Blindagem de Segurança Frontend: Exige autenticação estrita como gamamatheus65@gmail.com ou isAdmin
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Acesso Restrito ao Administrador</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              O Painel do Administrador é restrito exclusivamente ao proprietário do sistema (<strong>gamamatheus65@gmail.com</strong>).
              Faça login com a conta autorizada para continuar.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsAdminAuthModalOpen(true)}
                className="w-full py-3 px-4 bg-[#1B4332] text-white rounded-xl text-xs font-bold hover:bg-[#12372A] transition-colors cursor-pointer shadow-xs"
              >
                Fazer Login como Administrador
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdminDashboardOpen(false);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState({}, '', window.location.pathname);
                  }
                }}
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Voltar ao SuperAção
              </button>
            </div>
          </div>
          <EmailAuthModal
            isOpen={isAdminAuthModalOpen}
            onClose={() => setIsAdminAuthModalOpen(false)}
            initialMode="login"
            onSuccess={() => setIsAdminAuthModalOpen(false)}
          />
        </div>
      );
    }

    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <AdminDashboardView
          onBackToApp={() => {
            setIsAdminDashboardOpen(false);
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          adminEmail={user?.email || 'gamamatheus65@gmail.com'}
        />
      </React.Suspense>
    );
  }

  // Se houver uma sessão ativa de treino e o modo foco estiver ativo, entra no MODO FOCO (Seção 10 / V8-03)
  if (activeSession && isFocusMode) {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ActiveWorkoutView onOpenPersonalAgent={() => setIsPersonalDrawerOpen(true)} />
        <PersonalAgentDrawer
          isOpen={isPersonalDrawerOpen}
          onClose={() => setIsPersonalDrawerOpen(false)}
          activeContext={activeScreenContext}
          userProfile={profile}
          isTeacherManagedPlan={Boolean(profile.linkedTeacherId || plans.find((p) => p.id === activeSession.planId)?.isProfessional)}
          sessionExercises={activeSession.exercisesSnapshot.map((ex) => ({
            id: ex.exerciseId,
            name_pt: ex.exerciseName,
            sets: ex.targetSets,
            reps: ex.targetReps,
          }))}
          programSummary={
            activeProgram
              ? {
                  title: activeProgram.title,
                  currentWeek: activeProgram.currentWeek,
                  totalWeeks: activeProgram.durationWeeks,
                  currentPhaseLabel:
                    activeProgram.phases?.find((ph) => ph.weeks.includes(activeProgram.currentWeek))?.name ||
                    activeProgram.phases?.[0]?.name,
                }
              : undefined
          }
          userContext={buildAiUserContext(profile, calendar, sessions)}
          onApplyProposalDiff={handleApplyAiProposalDiff}
        />
      </React.Suspense>
    );
  }

  // Hidratação segura: Enquanto autentica e busca o perfil no Firestore, evita renderização prematura de telas intermediárias
  if (authLoading && (user || accessChoice === 'login' || accessChoice === 'signup')) {
    return <ViewLoadingFallback />;
  }

  // 1. TELA DE BOAS-VINDAS (Seção 4, Critérios C01, C02)
  if (flowState === 'welcome') {
    return (
      <WelcomeView
        onSelectAccess={(choice) => {
          setAccessChoice(choice);
          setLocal(STORAGE_KEYS.ACCESS_CHOICE, choice);
        }}
      />
    );
  }

  // 2. IDENTIFICAÇÃO RÁPIDA (Nome + Papel Aluno vs Professor, sem registro prévio)
  if (flowState === 'quick_id') {
    return (
      <QuickIdentificationView
        initialName={profile.displayName && profile.displayName !== 'Praticante' ? profile.displayName : (user?.displayName || '')}
        onComplete={async (data) => {
          await updateUserProfile({
            displayName: data.displayName,
            userRole: data.userRole,
            routineConfirmed: profile.routineConfirmed ?? false,
          });
          if (data.userRole === 'teacher') {
            return;
          }
          if (data.initialChoice === 'listening') {
            setIsListeningOpen(true);
          } else if (data.initialChoice === 'link_teacher') {
            setShowLinkTeacherModal(true);
          } else {
            handleSelectTab('home');
          }
        }}
        onBack={() => {
          setAccessChoice(null);
          setLocal(STORAGE_KEYS.ACCESS_CHOICE, null);
          if (user) {
            void logout();
          }
        }}
      />
    );
  }

  // 3. EDITOR MANUAL OU PROFISSIONAL ABERTO COM PRIORIDADE
  if (isBuilderOpen) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between font-sans">
        <TopStatusBar
          onOpenProfile={handleOpenProfile}
          onOpenAdmin={() => setIsAdminDashboardOpen(true)}
        />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 pb-24">
          <React.Suspense fallback={<ViewLoadingFallback />}>
            <BuilderView
              existingPlanId={editingPlanId || undefined}
              initialIsProfessional={isBuilderPro}
              studentLimitations={builderStudentLims}
              studentEquipments={builderStudentEqs}
              onPlanSaved={(plan) => {
                if (builderStudentCallback) {
                  builderStudentCallback(plan);
                  setBuilderStudentCallback(null);
                }
              }}
              onClose={() => {
                setIsBuilderOpen(false);
                setEditingPlanId(null);
                setIsBuilderPro(false);
                setBuilderStudentCallback(null);
                setBuilderStudentLims([]);
                setBuilderStudentEqs([]);
              }}
              onStartWorkout={(plan) => {
                if (builderStudentCallback) {
                  builderStudentCallback(plan);
                  setBuilderStudentCallback(null);
                }
                setIsBuilderOpen(false);
                setEditingPlanId(null);
                setIsBuilderPro(false);
                setBuilderStudentLims([]);
                setBuilderStudentEqs([]);
                handleStartPlan(plan);
              }}
            />
          </React.Suspense>
        </main>
      </div>
    );
  }

  // 4. PERFIL DO USUÁRIO ABERTO COM PRIORIDADE
  if (isProfileOpen) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between font-sans">
        <TopStatusBar
          onOpenProfile={handleOpenProfile}
          onOpenAdmin={() => setIsAdminDashboardOpen(true)}
        />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4 pb-24">
          <React.Suspense fallback={<ViewLoadingFallback />}>
            <ProfileView
              onClose={() => setIsProfileOpen(false)}
              onOpenListening={handleOpenListening}
              onOpenLinkTeacher={handleOpenLinkTeacher}
              onOpenAdmin={() => {
                setIsProfileOpen(false);
                setIsAdminDashboardOpen(true);
              }}
            />
          </React.Suspense>
        </main>
      </div>
    );
  }

  // 5. PAINEL DO PROFESSOR / TREINADOR
  if (flowState === 'teacher_dashboard') {
    return (
      <TeacherDashboardView
        teacherUid={profile.uid}
        teacherName={profile.displayName}
        onOpenPersonalWorkout={handleOpenTeacherPersonal}
        onOpenProfile={handleOpenProfile}
        onOpenBuilderForStudent={(lims, eqs, onSavePlan) => {
          setBuilderStudentLims(lims || []);
          setBuilderStudentEqs(eqs || []);
          setBuilderStudentCallback(() => onSavePlan);
          handleOpenBuilder(undefined, true);
        }}
      />
    );
  }

  // 6. FLUXO DE ANAMNESE PERSONALIZADA COM FOTOS (Aluno respondendo ao professor)
  if (flowState === 'custom_anamnesis' && customAnamnesisTemplate && customAnamnesisTeacherUid) {
    return (
      <CustomAnamnesisFlowView
        template={customAnamnesisTemplate}
        teacherUid={customAnamnesisTeacherUid}
        onFinish={() => {
          setCustomAnamnesisTemplate(null);
          setCustomAnamnesisTeacherUid(null);
          handleSelectTab('home');
        }}
        onCancel={() => {
          setCustomAnamnesisTemplate(null);
          setCustomAnamnesisTeacherUid(null);
        }}
      />
    );
  }

  // 7. ESCUTA INICIAL / ONBOARDING PROGRESSIVO (Seção 5, Critérios C04, C05, C06, C07, C08)
  if (flowState === 'onboarding') {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ListeningJourneyView
        onCompleteListening={(draft, nextAction) => {
          setIsListeningOpen(false);
          if (nextAction === 'proposal') {
            const prop = generateExplainableProposal(profile, draft);
            setCurrentProposal(prop);
            setLocal(STORAGE_KEYS.PROPOSAL, prop);
            setIsViewingProposal(true);
          } else if (nextAction === 'builder_pro') {
            setIsViewingProposal(false);
            handleOpenBuilder(undefined, true);
          } else if (nextAction === 'builder_manual') {
            setIsViewingProposal(false);
            handleOpenBuilder(undefined, false);
          }
        }}
        onCancel={() => setIsListeningOpen(false)}
        />
      </React.Suspense>
    );
  }

  // 8. REVISÃO DA PROPOSTA EXPLICÁVEL (Seção 6, Critérios C09, C10, C11, C15)
  if (flowState === 'proposal' && currentProposal) {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ProposalView
          proposal={currentProposal}
          onConfirm={() => {
            setIsViewingProposal(false);
            setIsBuilderOpen(false);
            setIsBuilderPro(false);
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
          }}
          onAdjustAnswers={() => {
            updateUserProfile({
              onboardingCompleted: false,
              routineConfirmed: false,
            });
            setIsViewingProposal(false);
            setIsBuilderOpen(false);
            setIsBuilderPro(false);
            setIsListeningOpen(true);
          }}
          onClose={() => {
            setIsViewingProposal(false);
            setIsBuilderOpen(false);
            setIsBuilderPro(false);
            if (!profile.routineConfirmed) {
              updateUserProfile({ routineConfirmed: true });
            }
          }}
          onChooseOtherOption={(option) => {
            setIsViewingProposal(false);
            if (option === 'builder_pro') {
              handleOpenBuilder(undefined, true);
            } else {
              handleOpenBuilder(undefined, false);
            }
          }}
        />
      </React.Suspense>
    );
  }

  // 5. EXPERIÊNCIA PRINCIPAL (Seção 7, 8, 9, 10, 11)
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between font-sans">
      {/* Banner de Alternância do Professor para Modo Pessoal */}
      {profile.userRole === 'teacher' && isTeacherPersonalMode && (
        <div className="bg-[#125F55] text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-40">
          <span className="flex items-center gap-1.5">
            <span>🏋️</span>
            <span>Você está visualizando seu Treino Pessoal</span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.state?.screen === 'teacher_personal') {
                window.history.back();
              } else {
                setIsTeacherPersonalMode(false);
              }
            }}
            className="px-3 py-1 bg-white text-[#125F55] rounded-full hover:bg-[#FAF8F5] transition-colors"
          >
            ← Voltar ao Painel do Treinador
          </button>
        </div>
      )}

      {/* Barra de Status e Cabeçalho Superior */}
      <TopStatusBar
        onOpenProfile={handleOpenProfile}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
      />

      {/* Conteúdo Principal com Container Responsivo Mobile-First */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4">
        <React.Suspense fallback={<ViewLoadingFallback />}>
          {currentTab === 'home' && (
            <HomeView
              onStartWorkout={handleStartPlan}
              onResumeWorkout={() => setIsFocusMode(true)}
              onNavigateTab={handleSelectTab}
              onOpenBuilder={(id, isPro) => handleOpenBuilder(id, Boolean(isPro))}
              onOpenListening={handleOpenListening}
              onOpenLinkTeacher={handleOpenLinkTeacher}
              onReviewProposal={
                currentProposal
                  ? () => {
                      setIsViewingProposal(true);
                    }
                  : undefined
              }
            />
          )}
          {currentTab === 'workouts' && (
            <ExploreView
              onStartWorkout={handleStartPlan}
              onOpenBuilder={(id) => handleOpenBuilder(id, false)}
            />
          )}
          {currentTab === 'calendar' && (
            <CalendarView
              onStartPlanById={handleStartPlanById}
              onOpenListening={() => setIsListeningOpen(true)}
            />
          )}
          {currentTab === 'progress' && <ProgressView />}
        </React.Suspense>
      </main>

      {/* Modal para Aluno Conectar ao Professor */}
      <LinkTeacherModal
        isOpen={showLinkTeacherModal}
        onClose={() => setShowLinkTeacherModal(false)}
        onStartCustomAnamnesis={(tmpl, tUid) => {
          setShowLinkTeacherModal(false);
          setCustomAnamnesisTemplate(tmpl);
          setCustomAnamnesisTeacherUid(tUid);
        }}
        onLinkSuccess={(_link) => {
          setShowLinkTeacherModal(false);
          handleSelectTab('home');
        }}
      />

      {/* Modal Global de Resolução de Conflito de Conta */}
      {pendingConflict && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-[#C9DBD3] shadow-xl">
            <h3 className="text-base font-bold text-[#152A29]">
              Conflito de Dados Detectado
            </h3>
            <p className="text-xs text-[#5B7170] leading-relaxed">
              Sua conta Google já possui um histórico gravado, e você também realizou treinos neste dispositivo. Como deseja prosseguir?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => resolveConflict('merge_local')}
                className="w-full p-3.5 rounded-2xl bg-[#125F55] text-white font-bold text-xs hover:bg-[#0C5148] transition-all cursor-pointer min-h-[48px]"
              >
                Mesclar treinos deste aparelho com a conta
              </button>
              <button
                type="button"
                onClick={() => resolveConflict('keep_remote')}
                className="w-full p-3.5 rounded-2xl border border-[#C9DBD3] bg-white text-[#152A29] font-semibold text-xs hover:bg-slate-50 transition-all cursor-pointer min-h-[48px]"
              >
                Manter apenas os dados da conta na nuvem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button do Personal IA (GLM-5.3) */}
      {!isBuilderOpen && !isProfileOpen && !isAdminDashboardOpen && flowState === 'main' && (
        <PersonalAgentFab
          onClick={() => setIsPersonalDrawerOpen(true)}
          isOpen={isPersonalDrawerOpen}
          activeContextText={activeSession ? `Treino: ${activeSession.planTitle}` : undefined}
        />
      )}

      {/* Drawer / Bottom Sheet do Personal IA */}
      <PersonalAgentDrawer
        isOpen={isPersonalDrawerOpen}
        onClose={() => setIsPersonalDrawerOpen(false)}
        activeContext={activeScreenContext}
        userProfile={profile}
        isTeacherManagedPlan={Boolean(profile.linkedTeacherId || plans.find((p) => p.id === activeSession?.planId)?.isProfessional)}
        sessionExercises={activeSession?.exercisesSnapshot?.map((ex) => ({
          id: ex.exerciseId,
          name_pt: ex.exerciseName,
          sets: ex.targetSets,
          reps: ex.targetReps,
        }))}
        programSummary={
          activeProgram
            ? {
                title: activeProgram.title,
                currentWeek: activeProgram.currentWeek,
                totalWeeks: activeProgram.durationWeeks,
                currentPhaseLabel:
                  activeProgram.phases?.find((ph) => ph.weeks.includes(activeProgram.currentWeek))?.name ||
                  activeProgram.phases?.[0]?.name,
              }
            : undefined
        }
        userContext={buildAiUserContext(profile, calendar, sessions)}
        onApplyProposalDiff={handleApplyAiProposalDiff}
      />

      {/* Banner de Atualização Segura do Service Worker */}
      <SWUpdateBanner isWorkoutActive={Boolean(activeSession && isFocusMode)} />

      {/* Barra de Navegação Inferior (oculta em modais e modo foco) */}
      {!isBuilderOpen && !isProfileOpen && (
        <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <MainAppContent />
      </WorkoutProvider>
    </AuthProvider>
  );
}
