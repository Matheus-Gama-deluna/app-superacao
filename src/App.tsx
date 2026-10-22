import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider, useWorkout } from './context/WorkoutContext';
import { TopStatusBar } from './components/TopStatusBar';
import { BottomNav, TabDestination } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { BuilderView } from './views/BuilderView';
import { ActiveWorkoutView } from './views/ActiveWorkoutView';
import { CalendarView } from './views/CalendarView';
import { ProgressView } from './views/ProgressView';
import { ProfileView } from './views/ProfileView';
import { WelcomeView } from './views/WelcomeView';
import { ListeningJourneyView } from './views/ListeningJourneyView';
import { ProposalView } from './views/ProposalView';
import { WorkoutPlan, ExplainableProposal, OnboardingDraft } from './types';
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
    // 1. Usuário já possui perfil completo e rotina confirmada (ou está explorando livremente)
    if (profile.onboardingCompleted && (profile.routineConfirmed || activeProgram || plans.length > 0)) {
      return 'main';
    }

    // 2. Não houve escolha explícita de acesso e não está logado
    if (!user && !accessChoice) {
      return 'welcome';
    }

    // 3. Proposta gerada aguardando confirmação explícita (Critério C09)
    if (profile.onboardingCompleted && !profile.routineConfirmed && currentProposal) {
      return 'proposal';
    }

    // 4. Onboarding / escuta em andamento
    if (!profile.onboardingCompleted) {
      return 'onboarding';
    }

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

  const handleStartPlanById = (planId: string, scheduledDayId?: string) => {
    const p = plans.find((x) => x.id === planId) || plans[0];
    if (p) startWorkout(p, scheduledDayId, scheduledDayId ? 'scheduled' : 'ad_hoc');
  };

  const handleOpenBuilder = (existingId?: string, isPro: boolean = false) => {
    setEditingPlanId(existingId || null);
    setIsBuilderPro(isPro);
    setIsBuilderOpen(true);
  };

  // Se houver uma sessão ativa de treino, entra no MODO FOCO (Seção 10)
  if (activeSession) {
    return <ActiveWorkoutView />;
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
      <ListeningJourneyView
        onCompleteListening={(draft, nextAction) => {
          if (nextAction === 'proposal') {
            const prop = generateExplainableProposal(profile, draft);
            setCurrentProposal(prop);
            setLocal(STORAGE_KEYS.PROPOSAL, prop);
          } else if (nextAction === 'builder_pro') {
            handleOpenBuilder(undefined, true);
          } else if (nextAction === 'builder_manual') {
            handleOpenBuilder(undefined, false);
          }
        }}
        onCancel={accessChoice ? () => setAccessChoice(null) : undefined}
      />
    );
  }

  // 3. REVISÃO DA PROPOSTA EXPLICÁVEL (Seção 6, Critérios C09, C10, C11, C15)
  if (flowState === 'proposal' && currentProposal) {
    return (
      <ProposalView
        proposal={currentProposal}
        onConfirm={() => {
          // Rotina ativada com sucesso
        }}
        onAdjustAnswers={() => {
          // Retorna para a escuta inicial para ajustar respostas (Critério C05)
          setLocal(STORAGE_KEYS.USER_PROFILE, {
            ...profile,
            onboardingCompleted: false,
          });
          window.location.reload();
        }}
        onChooseOtherOption={(option) => {
          if (option === 'builder_pro') {
            handleOpenBuilder(undefined, true);
          } else {
            handleOpenBuilder(undefined, false);
          }
        }}
      />
    );
  }

  // 4. EXPERIÊNCIA PRINCIPAL (Seção 7, 8, 9, 10, 11)
  return (
    <div className="min-h-screen bg-[#F5F8F5] text-[#152A29] flex flex-col justify-between font-sans">
      {/* Barra de Status e Cabeçalho Superior */}
      <TopStatusBar onOpenProfile={() => setIsProfileOpen(true)} />

      {/* Conteúdo Principal com Container Responsivo Mobile-First */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-4">
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
                        // Permite rever a proposta a qualquer momento
                        setCurrentProposal({ ...currentProposal, isConfirmed: false });
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
