import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Brain,
  Sparkles,
  Check,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Trash2,
  Lock,
} from 'lucide-react';
import {
  ActiveScreenContext,
  AssistantActionProposal,
  CoreBiopsychosocialMemory,
  UserProfile,
  ProposalDiff,
} from '../types';
import { VoiceOrTextContextInput } from './VoiceOrTextContextInput';
import {
  sendMessageToPersonalAssistant,
  fetchStudentCoreMemory,
  dismissTemporaryClinicalFact,
} from '../lib/aiClient';

interface PersonalAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: ActiveScreenContext;
  userProfile?: UserProfile | null;
  onApplyProposalDiff?: (diff: ProposalDiff) => void;
  isTeacherManagedPlan?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  proposal?: AssistantActionProposal;
}

export const PersonalAgentDrawer: React.FC<PersonalAgentDrawerProps> = ({
  isOpen,
  onClose,
  activeContext,
  userProfile,
  onApplyProposalDiff,
  isTeacherManagedPlan = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'memory'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [coreMemory, setCoreMemory] = useState<CoreBiopsychosocialMemory | null>(null);
  const [confirmedDiffs, setConfirmedDiffs] = useState<Record<string, boolean>>({});

  // Carrega memória M2 e mensagem de boas-vindas ao abrir
  useEffect(() => {
    if (isOpen) {
      loadMemory();
      if (messages.length === 0) {
        initWelcomeMessage();
      }
    }
  }, [isOpen]);

  const loadMemory = async () => {
    try {
      const mem = await fetchStudentCoreMemory(userProfile?.uid);
      setCoreMemory(mem);
    } catch {
      // Falha silenciosa
    }
  };

  const initWelcomeMessage = () => {
    let contextHint = '';
    if (activeContext.currentExerciseName) {
      contextHint = `Estou acompanhando sua execução de "${activeContext.currentExerciseName}".`;
    } else if (activeContext.currentTab === 'home') {
      contextHint = 'Pronto para calibrar seu dia de treino ou tirar dúvidas de saúde.';
    }

    setMessages([
      {
        id: 'msg_init',
        role: 'assistant',
        text: `Olá! Sou seu Personal de IA. ${contextHint} Se sentir qualquer desconforto, precisar trocar um movimento ou querer suavizar a intensidade, pode falar ou digitar aqui. Como posso te apoiar?`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const proposal = await sendMessageToPersonalAssistant({
        message: text,
        activeContext,
        userProfile,
        conversationHistory: history,
      });

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        text: proposal.replyPt,
        timestamp: Date.now(),
        proposal,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Recarrega memória se novos fatos foram consolidados
      loadMemory();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: 'Tive uma oscilação na conexão, mas estou aqui. Por favor, repita ou tente selecionar uma das sugestões rápidas.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDiff = (msgId: string, diff: ProposalDiff) => {
    setConfirmedDiffs((prev) => ({ ...prev, [msgId]: true }));
    if (onApplyProposalDiff) {
      onApplyProposalDiff(diff);
    }
  };

  const handleDismissFact = async (factId: string) => {
    if (!userProfile?.uid) return;
    await dismissTemporaryClinicalFact(userProfile.uid, factId);
    await loadMemory();
  };

  if (!isOpen) return null;

  const quickChips = [
    { label: '🥋 Fiz Jiu-Jitsu/Luta', text: 'Hoje fiz um treino de artes marciais fora do app.' },
    { label: '🌿 Alongamento (8 min)', text: 'Monta um alongamento suave de 8 minutos para soltar o corpo hoje?' },
    { label: 'Dor no joelho', text: 'Senti um leve desconforto no joelho ao agachar.' },
    { label: 'Cansado hoje (-25%)', text: 'Estou muito cansado hoje, pode suavizar meu treino?' },
    { label: 'Trocar exercício', text: 'Gostaria de trocar o exercício atual por uma alternativa.' },
    { label: '⚡ Treino rápido (10 min)', text: 'Só tenho 10 minutos hoje, prepara um treino rápido?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh] min-h-[50vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1B4332] text-[#D8F3DC] flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">Personal IA</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#D8F3DC] text-[#1B4332]">
                  GLM-5.3 ACSM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {activeContext.currentExerciseName
                  ? `Focado em: ${activeContext.currentExerciseName}`
                  : 'Biomecânica & Adaptação Ativa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Memory Tab Toggle */}
            <button
              type="button"
              onClick={() => setActiveTab((prev) => (prev === 'chat' ? 'memory' : 'chat'))}
              title="Memória Biopsicossocial M2"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'memory'
                  ? 'bg-[#1B4332] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Memória</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Chat & Interação */}
        {activeTab === 'chat' && (
          <>
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#1B4332] text-white rounded-tr-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Proposal Diff Confirmation Card */}
                    {msg.proposal?.proposedDiff && (
                      <div className="mt-2.5 pt-2 border-t border-slate-300/40 text-xs text-slate-900 bg-white/90 rounded-xl p-2.5 shadow-2xs">
                        <div className="flex items-center gap-1 font-bold text-[#1B4332] mb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{msg.proposal.proposedDiff.titlePt}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mb-2">
                          {msg.proposal.proposedDiff.descriptionPt}
                        </p>

                        {/* Aviso de Treino Prescrito por Professor */}
                        {isTeacherManagedPlan && (
                          <div className="flex items-start gap-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800 mb-2">
                            <Lock className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                            <span>
                              Plano do professor: esta adaptação ajusta sua execução hoje mantendo a periodização dele segura.
                            </span>
                          </div>
                        )}

                        {confirmedDiffs[msg.id] ? (
                          <div className="flex items-center gap-1.5 text-[#2D6A4F] font-bold text-xs py-1">
                            <Check className="w-4 h-4" />
                            <span>Ação confirmada e aplicada com sucesso!</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleConfirmDiff(msg.id, msg.proposal!.proposedDiff!)}
                              className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#12372A] text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {msg.proposal.proposedDiff.actionType === 'generate_custom_workout'
                                ? '▶ Iniciar Este Treino Agora'
                                : msg.proposal.proposedDiff.actionType === 'log_external_practice'
                                ? '🥋 Confirmar Registro de Prática'
                                : 'Confirmar & Aplicar'}
                            </button>
                            <span className="text-[10px] text-slate-400">Requer confirmação</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                  <div className="w-4 h-4 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
                  <span>Personal IA analisando biomecânica...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <VoiceOrTextContextInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                quickChips={quickChips}
                placeholder="Fale ou digite sua dúvida ou desconforto..."
              />
            </div>
          </>
        )}

        {/* Tab 2: Memória Biopsicossocial M2 Transparente */}
        {activeTab === 'memory' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-[#D8F3DC]/40 border border-[#2D6A4F]/20 rounded-2xl p-3.5">
              <div className="flex items-center gap-2 text-[#1B4332] font-bold text-sm mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>O que seu Personal lembra sobre você</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Suas informações de saúde e conforto são armazenadas com transparência total. Você pode desativar qualquer cuidado quando não fizer mais sentido.
              </p>
            </div>

            {/* Fatos Clínicos Ativos */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Fatos Clínicos & Articulações Sensíveis
              </h4>
              {coreMemory?.clinicalFacts && coreMemory.clinicalFacts.length > 0 ? (
                <div className="space-y-2">
                  {coreMemory.clinicalFacts.map((fact) => {
                    const isExpired = fact.expiresAt && fact.expiresAt < Date.now();
                    return (
                      <div
                        key={fact.id}
                        className={`p-3 rounded-xl border flex items-start justify-between gap-2 text-xs ${
                          isExpired
                            ? 'bg-slate-50 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold">
                            <span>{fact.labelPt}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                fact.persistence === 'chronic'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {fact.persistence === 'chronic' ? 'Crônico' : 'Temporário'}
                            </span>
                            {isExpired && (
                              <span className="text-[10px] text-slate-400 italic">(Expirado)</span>
                            )}
                          </div>
                          {fact.protectiveCuePt && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              Orientação ativa: {fact.protectiveCuePt}
                            </p>
                          )}
                        </div>

                        {!isExpired && (
                          <button
                            type="button"
                            onClick={() => handleDismissFact(fact.id)}
                            title="Não sinto mais isso"
                            className="text-xs text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Já passou</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Nenhuma limitação ativa registrada no momento.
                </p>
              )}
            </div>

            {/* Preferências de Tom & Ciclo */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tom do Personal:</span>
                <span className="font-semibold text-slate-800">
                  {coreMemory?.routineInsights?.preferredCoachingTone || 'Acolhedor e Suave'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Duração Realista:</span>
                <span className="font-semibold text-slate-800">
                  {coreMemory?.routineInsights?.realisticDurationMinutes || 25} minutos
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Semana do Mesociclo:</span>
                <span className="font-semibold text-slate-800">
                  Semana {coreMemory?.mesocycleState?.cycleWeek || 1} de 4
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
