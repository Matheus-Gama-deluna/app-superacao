import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { TopStatusBar } from './components/TopStatusBar';
import { BottomNav, TabDestination } from './components/BottomNav';
import { SWUpdateBanner } from './components/SWUpdateBanner';
import { syncAppBadge } from './lib/pwaNative';
import { HomeView } from './views/HomeView';
import { WelcomeView } from './views/WelcomeView';

// Code Splitting das Telas Secundárias (Sprint 2 - Performance & Leveza)
const ExploreView = React.lazy(() => import('./views/ExploreView').then((m) => ({ default: m.ExploreView })));
const BuilderView = React.lazy(() => import('./views/BuilderView').then((m) => ({ default: m.BuilderView })));
const ActiveWorkoutView = React.lazy(() => import('./views/ActiveWorkoutView').then((m) => ({ default: m.ActiveWorkoutView })));
const CalendarView = React.lazy(() => import('./views/CalendarView').then((m) => ({ default: m.CalendarView })));
const ProgressView = React.lazy(() => import('./views/ProgressView').then((m) => ({ default: m.ProgressView })));
const ProfileView = React.lazy(() => import('./views/ProfileView').then((m) => ({ default: m.ProfileView })));
const ListeningJourneyView = React.lazy(() => import('./views/ListeningJourneyView').then((m) => ({ default: m.ListeningJourneyView })));
const ProposalView = React.lazy(() => import('./views/ProposalView').then((m) => ({ default: m.ProposalView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-pulse">
    <div className="w-12 h-12 rounded-2xl bg-[#EAF3EF] flex items-center justify-center text-[#125F55] font-black text-xl mb-3 shadow-2xs">
      S
    </div>
    <span className="text-xs font-semibold text-[#5B7170]">Carregando com cuidado...</span>
  </div>
);
import { WorkoutPlan, ExplainableProposal, OnboardingDraft } from './types';
import { premadeWorkouts } from './data/premadeWorkouts';
import {
  getLocal,
  setLocal,
  STORAGE_KEYS,
  generateExplainableProposal,
} from './lib/storage';

type AppFlowState = 'welcome' | 'onboarding' | 'proposal' | 'main';

const MainAppContent: React.FC = () => {
  const { user, profile, isGuest, isLoading: authLoading, updateUserProfile } = useAuth();
  const {
    activeSession,
    isFocusMode,
    setIsFocusMode,
    plans,
    startWorkout,
    activeProgram,
    calendar,
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

  // Calcula o estado determinístico de fluxo (Seção 4, Critérios C01, C02, C09)
  const flowState: AppFlowState = (() => {
    // 1. Não houve escolha explícita de acesso e não está logado
    if (!user && !accessChoice) {
      return 'welcome';
    }

    // 2. Onboarding / escuta em andamento
    if (!profile.onboardingCompleted) {
      return 'onboarding';
    }

    // 3. Proposta gerada aguardando confirmação explícita ou aberta explicitamente para revisão (Critério C09)
    if (currentProposal && (!profile.routineConfirmed || isViewingProposal)) {
      return 'proposal';
    }

    // 4. Experiência principal (usuário com rotina confirmada ou explorando)
    return 'main';
  })();

  const handleStartPlan = (
    plan: WorkoutPlan,
    scheduledDayId?: string,
    originType: 'scheduled' | 'program_session' | 'ad_hoc' | 'express' = 'ad_hoc',
    isExpress = false,
    wasPlannedHabit = false
  ) => {
    startWorkout(plan, scheduledDayId, originType, isExpress, wasPlannedHabit);
  };

  const handleStartPlanById = (planId: string, scheduledDayId?: string, scheduledActivityId?: string) => {
    const p = plans.find((x) => x.id === planId) || premadeWorkouts.find((x) => x.id === planId) || plans[0];
    if (p) startWorkout(p, scheduledDayId, scheduledDayId ? 'scheduled' : 'ad_hoc', false, false, scheduledActivityId);
  };

  // Navegação suave com View Transitions API
  const handleSelectTab = (nextTab: TabDestination) => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        setCurrentTab(nextTab);
      });
    } else {
      setCurrentTab(nextTab);
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

  // Suporte nativo ao botão físico / gesto "Voltar" do celular (History API)
  useEffect(() => {
    const handlePopState = () => {
      if (isProfileOpen) {
        setIsProfileOpen(false);
      } else if (isBuilderOpen) {
        setIsBuilderOpen(false);
        setEditingPlanId(null);
        setIsBuilderPro(false);
      } else if (isViewingProposal) {
        setIsViewingProposal(false);
      } else if (currentTab !== 'home') {
        handleSelectTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isProfileOpen, isBuilderOpen, isViewingProposal, currentTab]);

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

  // Se houver uma sessão ativa de treino e o modo foco estiver ativo, entra no MODO FOCO (Seção 10 / V8-03)
  if (activeSession && isFocusMode) {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ActiveWorkoutView />
      </React.Suspense>
    );
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

  // 2. ESCUTA INICIAL / ONBOARDING PROGRESSIVO (Seção 5, Critérios C04, C05, C06, C07, C08)
  if (flowState === 'onboarding') {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ListeningJourneyView
        onCompleteListening={(draft, nextAction) => {
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
        onCancel={accessChoice ? () => setAccessChoice(null) : undefined}
        />
      </React.Suspense>
    );
  }

  // 3. EDITOR MANUAL OU PROFISSIONAL ABERTO COM PRIORIDADE (Critérios C09, C10, C15)
  if (isBuilderOpen) {
    return (
      <div className="min-h-screen bg-[#F5F8F5] text-[#152A29] flex flex-col justify-between font-sans">
        <TopStatusBar onOpenProfile={handleOpenProfile} />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4">
          <React.Suspense fallback={<ViewLoadingFallback />}>
            <BuilderView
              existingPlanId={editingPlanId || undefined}
              initialIsProfessional={isBuilderPro}
              onClose={() => {
                setIsBuilderOpen(false);
                setEditingPlanId(null);
                setIsBuilderPro(false);
              }}
              onStartWorkout={(plan) => {
                setIsBuilderOpen(false);
                setEditingPlanId(null);
                setIsBuilderPro(false);
                handleStartPlan(plan);
              }}
            />
          </React.Suspense>
        </main>
      </div>
    );
  }

  // 4. REVISÃO DA PROPOSTA EXPLICÁVEL (Seção 6, Critérios C09, C10, C11, C15)
  if (flowState === 'proposal' && currentProposal) {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ProposalView
          proposal={currentProposal}
          onConfirm={() => {
            setIsViewingProposal(false);
            setIsBuilderOpen(false);
            setIsBuilderPro(false);
          }}
          onAdjustAnswers={() => {
            updateUserProfile({
              onboardingCompleted: false,
              routineConfirmed: false,
            });
            setIsViewingProposal(false);
            setIsBuilderOpen(false);
            setIsBuilderPro(false);
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
    <div className="min-h-screen bg-[#F5F8F5] text-[#152A29] flex flex-col justify-between font-sans">
      {/* Barra de Status e Cabeçalho Superior */}
      <TopStatusBar onOpenProfile={handleOpenProfile} />

      {/* Conteúdo Principal com Container Responsivo Mobile-First */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4">
        <React.Suspense fallback={<ViewLoadingFallback />}>
        {isProfileOpen ? (
          <ProfileView onClose={() => setIsProfileOpen(false)} />
        ) : isBuilderOpen ? (
          <BuilderView
            existingPlanId={editingPlanId || undefined}
            initialIsProfessional={isBuilderPro}
            onClose={() => {
              setIsBuilderOpen(false);
              setEditingPlanId(null);
              setIsBuilderPro(false);
            }}
            onStartWorkout={(plan) => {
              setIsBuilderOpen(false);
              setEditingPlanId(null);
              setIsBuilderPro(false);
              handleStartPlan(plan);
            }}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeView
                onStartWorkout={handleStartPlan}
                onResumeWorkout={() => setIsFocusMode(true)}
                onNavigateTab={handleSelectTab}
                onOpenBuilder={(id) => handleOpenBuilder(id, false)}
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
              <CalendarView onStartPlanById={handleStartPlanById} />
            )}
            {currentTab === 'progress' && <ProgressView />}
          </>
        )}
      </React.Suspense>
      </main>

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
