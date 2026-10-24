import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { TopStatusBar } from './components/TopStatusBar';
import { BottomNav, TabDestination } from './components/BottomNav';
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
  const { user, profile, isGuest, isLoading: authLoading } = useAuth();
  const {
    activeSession,
    isFocusMode,
    setIsFocusMode,
    plans,
    startWorkout,
    activeProgram,
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

  const handleOpenBuilder = (existingId?: string, isPro: boolean = false) => {
    setEditingPlanId(existingId || null);
    setIsBuilderPro(isPro);
    setIsBuilderOpen(true);
  };

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
            handleOpenBuilder(undefined, true);
          } else if (nextAction === 'builder_manual') {
            handleOpenBuilder(undefined, false);
          }
        }}
        onCancel={accessChoice ? () => setAccessChoice(null) : undefined}
        />
      </React.Suspense>
    );
  }

  // 3. REVISÃO DA PROPOSTA EXPLICÁVEL (Seção 6, Critérios C09, C10, C11, C15)
  if (flowState === 'proposal' && currentProposal) {
    return (
      <React.Suspense fallback={<ViewLoadingFallback />}>
        <ProposalView
        proposal={currentProposal}
        onConfirm={() => {
          setIsViewingProposal(false);
        }}
        onAdjustAnswers={() => {
          // Retorna para a escuta inicial para ajustar respostas (Critério C05)
          setLocal(STORAGE_KEYS.USER_PROFILE, {
            ...profile,
            onboardingCompleted: false,
          });
          window.location.reload();
        }}
        onClose={() => {
          setIsViewingProposal(false);
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

  // 4. EXPERIÊNCIA PRINCIPAL (Seção 7, 8, 9, 10, 11)
  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#152A29] flex flex-col justify-between font-sans">
      {/* Barra de Status e Cabeçalho Superior */}
      <TopStatusBar onOpenProfile={() => setIsProfileOpen(true)} />

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
                onNavigateTab={setCurrentTab}
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

      {/* Barra de Navegação Inferior (oculta em modais e modo foco) */}
      {!isBuilderOpen && !isProfileOpen && (
        <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />
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
