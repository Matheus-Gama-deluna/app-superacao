import React, { useState, useEffect } from 'react';
import {
  TeacherStudentLink,
  CustomAnamnesisTemplate,
  AnamnesisSubmission,
  TeacherDayPrescription,
  TeacherDayRegime,
  ActiveRestActivityType,
  WorkoutPlan,
} from '../types';
import {
  getTeacherLinks,
  saveTeacherStudentLink,
  broadcastLiveSync,
  subscribeToLiveSync,
} from '../lib/teacherStudentSync';
import {
  getSavedTeacherTemplate,
  getSavedSubmissionsForTeacher,
  generateTeacherInviteCode,
  saveAnamnesisSubmission,
} from '../lib/anamnesisEngine';
import {
  runClinicalHeuristicAnalysis,
  draftWeeklyPrescriptionForTeacher,
  evaluateTeacherRosterRadar,
  TeacherStudentRadarAlert,
} from '../lib/aiTeacherCopilot';
import { AnamnesisBuilderModal } from '../components/teacher/AnamnesisBuilderModal';
import { allTemplates } from '../data/catalog';

interface TeacherDashboardViewProps {
  teacherUid: string;
  teacherName?: string;
  onOpenPersonalWorkout: () => void;
  onOpenBuilderForStudent: (studentLimitations: string[], studentEquipments: string[], onSavePlan: (plan: WorkoutPlan) => void) => void;
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  teacherUid,
  teacherName = 'Professor(a)',
  onOpenPersonalWorkout,
  onOpenBuilderForStudent,
}) => {
  const [links, setLinks] = useState<TeacherStudentLink[]>(() => getTeacherLinks(teacherUid));
  const [submissions, setSubmissions] = useState<AnamnesisSubmission[]>(() =>
    getSavedSubmissionsForTeacher(teacherUid)
  );
  const [selectedStudentUid, setSelectedStudentUid] = useState<string | null>(null);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roster' | 'record' | 'prescription'>('roster');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Estado da prescrição do aluno selecionado
  const [currentPrescriptions, setCurrentPrescriptions] = useState<TeacherDayPrescription[]>([]);
  const [currentAssignedPlans, setCurrentAssignedPlans] = useState<WorkoutPlan[]>([]);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  const inviteCode = generateTeacherInviteCode(teacherUid);

  // Atualiza dados locais quando houver sincronização em tempo real
  useEffect(() => {
    const unsub = subscribeToLiveSync(teacherUid, (msg) => {
      setLinks(getTeacherLinks(teacherUid));
      setSubmissions(getSavedSubmissionsForTeacher(teacherUid));
      setNotification('Nova atualização sincronizada em tempo real!');
      setTimeout(() => setNotification(null), 4000);
    });
    return unsub;
  }, [teacherUid]);

  const selectedLink = links.find((l) => l.studentUid === selectedStudentUid) || null;
  const selectedSubmission = selectedLink?.lastSubmissionId
    ? submissions.find((s) => s.id === selectedLink.lastSubmissionId) || null
    : null;

  // Quando seleciona um aluno, carrega suas prescrições
  useEffect(() => {
    if (selectedLink) {
      if (selectedLink.weeklyPrescriptions && selectedLink.weeklyPrescriptions.length > 0) {
        setCurrentPrescriptions(selectedLink.weeklyPrescriptions);
      } else {
        // Inicializa 7 dias neutros
        setCurrentPrescriptions(
          [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            regime: 'unassigned',
          }))
        );
      }
      setCurrentAssignedPlans(
        selectedLink.assignedPlans && selectedLink.assignedPlans.length > 0
          ? selectedLink.assignedPlans
          : allTemplates.slice(0, 2)
      );
    }
  }, [selectedStudentUid]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Co-Piloto IA: gera rascunho de prescrição automático para o aluno selecionado
  const handleGenerateAiDraft = () => {
    if (!selectedLink) return;
    const sub = selectedSubmission || {
      id: 'sub_temp',
      studentUid: selectedLink.studentUid,
      studentName: selectedLink.studentName,
      teacherUid,
      templateId: 'template_default',
      answers: {
        q_primary_goal: 'habito',
        q_weekly_frequency: '3',
      },
      photos: [],
      submittedAt: Date.now(),
      status: 'pending_review' as const,
    };

    const analysis = runClinicalHeuristicAnalysis(sub);
    const draft = draftWeeklyPrescriptionForTeacher(selectedLink.studentName, analysis);

    setCurrentPrescriptions(draft.weeklyPrescriptions);
    setCurrentAssignedPlans(draft.assignedPlans);
    setNotification('⚡ Rascunho de 7 dias gerado com sucesso pelo Co-Piloto IA!');
    setTimeout(() => setNotification(null), 4000);
  };

  // Salva a prescrição e publica para o aluno em tempo real
  const handleSavePrescription = async () => {
    if (!selectedLink) return;

    const updatedLink: TeacherStudentLink = {
      ...selectedLink,
      status: 'active',
      weeklyPrescriptions: currentPrescriptions,
      assignedPlans: currentAssignedPlans,
      lastPrescribedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveTeacherStudentLink(updatedLink);
    setLinks(getTeacherLinks(teacherUid));
    setNotification(`✓ Prescrição publicada em tempo real para ${selectedLink.studentName}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Cria um aluno de demonstração para testes rápidos do professor
  const handleCreateDemoStudent = async () => {
    const demoStudentUid = `student_demo_${Date.now()}`;
    const demoSubId = `sub_demo_${Date.now()}`;

    const demoSubmission: AnamnesisSubmission = {
      id: demoSubId,
      studentUid: demoStudentUid,
      studentName: 'Mariana Silva (Exemplo)',
      teacherUid,
      templateId: `template_${teacherUid}`,
      answers: {
        q_primary_goal: 'habito',
        q_weekly_frequency: '3',
        q_joint_limitations: ['dor_lombar'],
        q_equipments_available: ['peso_corporal', 'elasticos'],
        q_daily_routine_and_health: 'Trabalho sentada 8 horas por dia. Sinto rigidez na coluna ao final da tarde.',
        q_stress_energy_level: 6,
      },
      photos: [],
      submittedAt: Date.now(),
      status: 'pending_review',
    };

    saveAnamnesisSubmission(demoSubmission);

    const demoLink: TeacherStudentLink = {
      id: `link_${teacherUid}_${demoStudentUid}`,
      teacherUid,
      teacherName,
      studentUid: demoStudentUid,
      studentName: 'Mariana Silva (Exemplo)',
      studentEmail: 'mariana.exemplo@superacao.app',
      status: 'pending',
      weeklyPrescriptions: [],
      assignedPlans: [],
      lastSubmissionId: demoSubId,
      updatedAt: Date.now(),
    };

    await saveTeacherStudentLink(demoLink);
    setLinks(getTeacherLinks(teacherUid));
    setSubmissions(getSavedSubmissionsForTeacher(teacherUid));
    setSelectedStudentUid(demoStudentUid);
    setActiveTab('record');
    setNotification('Aluno exemplo criado! Você já pode revisar a anamnese e prescrever.');
    setTimeout(() => setNotification(null), 4000);
  };

  const radarAlerts = evaluateTeacherRosterRadar(links, submissions);

  const filteredLinks = links.filter((l) => {
    if (filter === 'pending') return l.status === 'pending';
    if (filter === 'active') return l.status === 'active';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#19231E] flex flex-col justify-between font-sans">
      {/* Barra de Notificação Flutuante */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#125F55] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header do Professor */}
      <header className="bg-white border-b border-[#C9DBD3]/60 sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#125F55] text-white flex items-center justify-center font-black text-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#19231E] text-sm sm:text-base">
                  Painel do Treinador
                </span>
                <span className="text-[10px] bg-[#EAF3EF] text-[#125F55] font-bold px-2 py-0.5 rounded-full uppercase">
                  Professor
                </span>
              </div>
              <p className="text-[11px] text-[#5B7170]">
                {teacherName} • Gestão de Alunos & Prescrições
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPersonalWorkout}
              aria-label="Meu Treino Pessoal"
              className="py-1.5 px-3 rounded-full border border-[#C9DBD3] text-[#19231E] text-xs font-bold hover:bg-[#FAF8F5] transition-colors flex items-center gap-1"
              title="Alternar para sua rotina pessoal de treino"
            >
              <span>🏋️</span>
              <span className="hidden sm:inline">Meu Treino Pessoal</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBuilderModalOpen(true)}
              aria-label="Minha Anamnese"
              className="py-1.5 px-3 rounded-full bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43] shadow-xs transition-colors flex items-center gap-1"
            >
              <span>📋</span>
              <span className="hidden sm:inline">Minha Anamnese</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Banner com Código de Compartilhamento & Ações Rápidas */}
        <div className="bg-gradient-to-r from-[#125F55] to-[#1B7F73] text-white rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
                Convite para Alunos
              </span>
              <h1 className="text-xl sm:text-2xl font-black">
                Conecte seus alunos e acompanhe resultados
              </h1>
              <p className="text-xs text-white/80 max-w-lg leading-relaxed">
                Envie seu código para o aluno. Ao entrar, ele responderá sua anamnese customizada (com fotos) e você prescreve treinos e descansos que sincronizam na hora.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/20 flex flex-col items-center gap-2 shrink-0">
              <span className="text-[10px] text-white/80 uppercase font-bold tracking-wider">
                Código de Aluno
              </span>
              <span className="font-mono text-2xl font-black tracking-widest text-white">
                {inviteCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full py-1.5 px-3 rounded-xl bg-white text-[#125F55] text-xs font-extrabold hover:bg-[#FAF8F5] transition-all"
              >
                {copiedCode ? '✓ Copiado!' : 'Copiar Código'}
              </button>
            </div>
          </div>
        </div>

        {/* Radar de Alertas IA */}
        {radarAlerts.length > 0 && (
          <div className="bg-[#EAF3EF] border border-[#125F55]/20 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h2 className="text-sm font-extrabold text-[#125F55] uppercase tracking-wider">
                Radar da Carteira • Co-Piloto IA
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {radarAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-3 border border-[#C9DBD3]/60 shadow-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19231E]">
                      {alert.studentName}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        alert.priority === 'high'
                          ? 'bg-[#C84B31]/15 text-[#C84B31]'
                          : 'bg-[#125F55]/15 text-[#125F55]'
                      }`}
                    >
                      {alert.headline}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B7170] leading-relaxed">{alert.detail}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentUid(alert.studentUid);
                      setActiveTab('record');
                    }}
                    className="text-[11px] font-bold text-[#125F55] hover:underline pt-1 inline-block"
                  >
                    Ver Prontuário →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visualização de Aluno Selecionado ou Carteira Geral */}
        {selectedLink ? (
          <div className="space-y-4">
            {/* Barra de Navegação do Aluno */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-[#C9DBD3]/60">
              <button
                type="button"
                onClick={() => setSelectedStudentUid(null)}
                className="text-xs font-bold text-[#5B7170] hover:text-[#19231E] flex items-center gap-1"
              >
                <span>←</span> Voltar para Carteira
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#19231E]">
                  {selectedLink.studentName}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedLink.status === 'active'
                      ? 'bg-[#EAF3EF] text-[#125F55]'
                      : 'bg-[#C84B31]/10 text-[#C84B31]'
                  }`}
                >
                  {selectedLink.status === 'active' ? 'Ativo' : 'Aguardando Prescrição'}
                </span>
              </div>
            </div>

            {/* Alternador de Abas do Aluno: Prontuário vs Prescrição */}
            <div className="flex rounded-2xl bg-white p-1 border border-[#C9DBD3]/60">
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'record'
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'text-[#5B7170] hover:text-[#19231E]'
                }`}
              >
                📋 Prontuário & Fotos da Anamnese
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('prescription')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'prescription'
                    ? 'bg-[#125F55] text-white shadow-xs'
                    : 'text-[#5B7170] hover:text-[#19231E]'
                }`}
              >
                🗓️ Prescrição Semanal (Treino & Descansos)
              </button>
            </div>

            {/* Aba 1: Prontuário & Avaliação com Fotos */}
            {activeTab === 'record' && (
              <div className="space-y-4">
                {selectedSubmission ? (
                  <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/60 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#C9DBD3]/40 pb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-[#19231E]">
                          Avaliação Preenchida pelo Aluno
                        </h3>
                        <p className="text-xs text-[#5B7170]">
                          Enviada em {new Date(selectedSubmission.submittedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateAiDraft}
                        className="py-2 px-3.5 rounded-full bg-[#EAF3EF] text-[#125F55] text-xs font-bold hover:bg-[#125F55] hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <span>🤖</span> Gerar Prescrição com Co-Piloto IA
                      </button>
                    </div>

                    {/* Respostas da Anamnese */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#C9DBD3]/40 space-y-1">
                          <span className="font-bold text-[#5B7170] uppercase text-[10px]">
                            Objetivo Principal
                          </span>
                          <p className="font-bold text-[#19231E]">
                            {selectedSubmission.answers['q_primary_goal'] || 'Não especificado'}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#C9DBD3]/40 space-y-1">
                          <span className="font-bold text-[#5B7170] uppercase text-[10px]">
                            Frequência Desejada
                          </span>
                          <p className="font-bold text-[#19231E]">
                            {selectedSubmission.answers['q_weekly_frequency'] || '3'} dias por semana
                          </p>
                        </div>
                      </div>

                      {/* Limitações Articulares */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#C9DBD3]/40 space-y-1.5">
                        <span className="font-bold text-[#5B7170] uppercase text-[10px]">
                          Limitações & Dores Relatadas
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(selectedSubmission.answers['q_joint_limitations']) &&
                          selectedSubmission.answers['q_joint_limitations'].length > 0 ? (
                            selectedSubmission.answers['q_joint_limitations'].map((lim: string) => (
                              <span
                                key={lim}
                                className="bg-[#C84B31]/15 text-[#C84B31] font-bold text-xs px-2.5 py-1 rounded-full"
                              >
                                ⚠️ {lim.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#5B7170]">Nenhuma dor relatada</span>
                          )}
                        </div>
                      </div>

                      {/* Equipamentos em Posse */}
                      <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#C9DBD3]/40 space-y-1.5">
                        <span className="font-bold text-[#5B7170] uppercase text-[10px]">
                          Equipamentos e Espaço
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.isArray(selectedSubmission.answers['q_equipments_available']) ? (
                            selectedSubmission.answers['q_equipments_available'].map((eq: string) => (
                              <span
                                key={eq}
                                className="bg-[#EAF3EF] text-[#125F55] font-bold text-xs px-2.5 py-1 rounded-full"
                              >
                                ✓ {eq.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#5B7170]">Apenas peso corporal</span>
                          )}
                        </div>
                      </div>

                      {/* Relato Livre */}
                      {selectedSubmission.answers['q_daily_routine_and_health'] && (
                        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#C9DBD3]/40 space-y-1">
                          <span className="font-bold text-[#5B7170] uppercase text-[10px]">
                            Histórico e Rotina Diária
                          </span>
                          <p className="text-xs text-[#19231E] leading-relaxed">
                            {selectedSubmission.answers['q_daily_routine_and_health']}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Galeria de Fotos da Anamnese */}
                    <div className="space-y-2 pt-2 border-t border-[#C9DBD3]/40">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#19231E] flex items-center gap-1.5">
                          <span>📸</span> Fotos para Avaliação Postural & Corporal ({selectedSubmission.photos?.length || 0})
                        </h4>
                      </div>

                      {selectedSubmission.photos && selectedSubmission.photos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {selectedSubmission.photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="rounded-2xl border border-[#C9DBD3] bg-[#FAF8F5] p-2 space-y-1 cursor-pointer hover:border-[#125F55] transition-all"
                              onClick={() => setZoomPhotoUrl(photo.dataUrl)}
                            >
                              <img
                                src={photo.dataUrl}
                                alt={photo.category}
                                className="w-full h-32 object-cover rounded-xl"
                              />
                              <p className="text-[10px] font-bold text-[#19231E] truncate">
                                {photo.category === 'posture_front'
                                  ? 'Postura Frontal'
                                  : photo.category === 'posture_side'
                                  ? 'Postura Perfil'
                                  : photo.category === 'equipments'
                                  ? 'Equipamentos'
                                  : 'Geral'}
                              </p>
                              <span className="text-[9px] text-[#5B7170] block">Toque para ampliar</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#C9DBD3] text-center text-xs text-[#5B7170]">
                          O aluno não anexou fotos nesta anamnese.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 border border-[#C9DBD3]/60 text-center space-y-3">
                    <p className="text-xs text-[#5B7170]">
                      Ainda não há respostas de anamnese registradas para este aluno.
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateAiDraft}
                      className="py-2.5 px-5 rounded-full bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43]"
                    >
                      Criar Prescrição Padrão com Co-Piloto IA
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Aba 2: Prescrição Semanal de 7 Dias (Treino, Descanso Total e Descanso Ativo) */}
            {activeTab === 'prescription' && (
              <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3]/60 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9DBD3]/40 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#19231E]">
                      Grade Semanal de 7 Dias
                    </h3>
                    <p className="text-xs text-[#5B7170]">
                      Defina os dias de treino e personalize o descanso total ou ativo do aluno
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiDraft}
                      className="py-2 px-3 rounded-full bg-[#EAF3EF] text-[#125F55] text-xs font-bold hover:bg-[#125F55] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>⚡</span> Sugerir com IA
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenBuilderForStudent([], [], (newPlan) => {
                          setCurrentAssignedPlans((prev) => [...prev, newPlan]);
                          setNotification(`Plano "${newPlan.title}" adicionado à lista do aluno!`);
                          setTimeout(() => setNotification(null), 3000);
                        })
                      }
                      className="py-2 px-3 rounded-full border border-[#125F55] text-[#125F55] text-xs font-bold hover:bg-[#EAF3EF] transition-all"
                    >
                      + Criar Nova Ficha
                    </button>
                  </div>
                </div>

                {/* Lista dos 7 Dias da Semana */}
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const presc =
                      currentPrescriptions.find((p) => p.dayOfWeek === dayOfWeek) || {
                        dayOfWeek,
                        regime: 'unassigned' as TeacherDayRegime,
                      };

                    return (
                      <div
                        key={dayOfWeek}
                        className={`rounded-2xl p-3.5 border transition-all space-y-2.5 ${
                          presc.regime === 'workout'
                            ? 'bg-[#EAF3EF]/50 border-[#125F55]/40'
                            : presc.regime === 'rest_active'
                            ? 'bg-[#FAF8F5] border-[#125F55]/20'
                            : presc.regime === 'rest_total'
                            ? 'bg-[#FAF8F5] border-[#C9DBD3]'
                            : 'bg-white border-[#C9DBD3]/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-xs font-black text-[#19231E]">
                            {DAY_LABELS[dayOfWeek]}
                          </span>

                          {/* Seletor de Regime do Dia */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPrescriptions((prev) =>
                                  prev.map((p) =>
                                    p.dayOfWeek === dayOfWeek
                                      ? {
                                          ...p,
                                          regime: 'workout',
                                          planId: currentAssignedPlans[0]?.id,
                                          planTitle: currentAssignedPlans[0]?.title,
                                        }
                                      : p
                                  )
                                );
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                presc.regime === 'workout'
                                  ? 'bg-[#125F55] text-white'
                                  : 'bg-white text-[#5B7170] border border-[#C9DBD3]'
                              }`}
                            >
                              🏋️ Treino
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPrescriptions((prev) =>
                                  prev.map((p) =>
                                    p.dayOfWeek === dayOfWeek
                                      ? {
                                          ...p,
                                          regime: 'rest_total',
                                          teacherNotes:
                                            p.teacherNotes || 'Descanso total. Repouso consciente sem culpa!',
                                        }
                                      : p
                                  )
                                );
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                presc.regime === 'rest_total'
                                  ? 'bg-[#125F55] text-white'
                                  : 'bg-white text-[#5B7170] border border-[#C9DBD3]'
                              }`}
                            >
                              🛌 Descanso Total
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPrescriptions((prev) =>
                                  prev.map((p) =>
                                    p.dayOfWeek === dayOfWeek
                                      ? {
                                          ...p,
                                          regime: 'rest_active',
                                          activeRestActivity: 'caminhada_leve',
                                          activeRestCustomLabel: 'Caminhada leve (20 min) ou mobilidade suave',
                                          activeRestDurationMinutes: 20,
                                        }
                                      : p
                                  )
                                );
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                presc.regime === 'rest_active'
                                  ? 'bg-[#125F55] text-white'
                                  : 'bg-white text-[#5B7170] border border-[#C9DBD3]'
                              }`}
                            >
                              🚶 Descanso Ativo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPrescriptions((prev) =>
                                  prev.map((p) =>
                                    p.dayOfWeek === dayOfWeek
                                      ? { ...p, regime: 'unassigned' }
                                      : p
                                  )
                                );
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                presc.regime === 'unassigned'
                                  ? 'text-[#19231E] font-bold underline'
                                  : 'text-[#5B7170]'
                              }`}
                            >
                              Livre
                            </button>
                          </div>
                        </div>

                        {/* Detalhes do Dia */}
                        {presc.regime === 'workout' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#5B7170] mb-0.5">
                                Ficha de Treino
                              </label>
                              <select
                                value={presc.planId || currentAssignedPlans[0]?.id}
                                onChange={(e) => {
                                  const selectedPlan = currentAssignedPlans.find(
                                    (p) => p.id === e.target.value
                                  );
                                  setCurrentPrescriptions((prev) =>
                                    prev.map((p) =>
                                      p.dayOfWeek === dayOfWeek
                                        ? {
                                            ...p,
                                            planId: e.target.value,
                                            planTitle: selectedPlan?.title,
                                          }
                                        : p
                                    )
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-[#C9DBD3] text-xs font-bold text-[#19231E] bg-white"
                              >
                                {currentAssignedPlans.map((plan) => (
                                  <option key={plan.id} value={plan.id}>
                                    {plan.title} ({plan.exercises.length} ex)
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#5B7170] mb-0.5">
                                Orientação do Professor
                              </label>
                              <input
                                type="text"
                                value={presc.teacherNotes || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCurrentPrescriptions((prev) =>
                                    prev.map((p) =>
                                      p.dayOfWeek === dayOfWeek
                                        ? { ...p, teacherNotes: val }
                                        : p
                                    )
                                  );
                                }}
                                placeholder="Ex.: Mantenha cadência lenta nas descidas"
                                className="w-full px-2.5 py-1.5 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {presc.regime === 'rest_active' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#5B7170] mb-0.5">
                                Atividade de Recuperação
                              </label>
                              <select
                                value={presc.activeRestActivity || 'caminhada_leve'}
                                onChange={(e) => {
                                  const val = e.target.value as ActiveRestActivityType;
                                  setCurrentPrescriptions((prev) =>
                                    prev.map((p) =>
                                      p.dayOfWeek === dayOfWeek
                                        ? {
                                            ...p,
                                            activeRestActivity: val,
                                            activeRestCustomLabel:
                                              val === 'caminhada_leve'
                                                ? 'Caminhada leve (20-30 min)'
                                                : val === 'mobilidade_articular'
                                                ? 'Sessão de mobilidade e soltura articular'
                                                : 'Alongamento suave e respiração profunda',
                                          }
                                        : p
                                    )
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-[#C9DBD3] text-xs font-bold text-[#19231E] bg-white"
                              >
                                <option value="caminhada_leve">🚶 Caminhada Leve</option>
                                <option value="mobilidade_articular">🧘 Mobilidade Articular</option>
                                <option value="alongamento_suave">🤸 Alongamento Suave</option>
                                <option value="respiracao_relaxamento">🫁 Respiração & Relaxamento</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#5B7170] mb-0.5">
                                Recado / Meta Suave
                              </label>
                              <input
                                type="text"
                                value={presc.teacherNotes || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCurrentPrescriptions((prev) =>
                                    prev.map((p) =>
                                      p.dayOfWeek === dayOfWeek
                                        ? { ...p, teacherNotes: val }
                                        : p
                                    )
                                  );
                                }}
                                placeholder="Ex.: Sem pressa, foque em oxigenar a musculatura"
                                className="w-full px-2.5 py-1.5 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] bg-white"
                              />
                            </div>
                          </div>
                        )}

                        {presc.regime === 'rest_total' && (
                          <div className="pt-1">
                            <input
                              type="text"
                              value={presc.teacherNotes || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCurrentPrescriptions((prev) =>
                                  prev.map((p) =>
                                    p.dayOfWeek === dayOfWeek
                                      ? { ...p, teacherNotes: val }
                                      : p
                                  )
                                );
                              }}
                              placeholder="Recado carinhoso para descanso sem culpa..."
                              className="w-full px-2.5 py-1.5 rounded-xl border border-[#C9DBD3] text-xs text-[#19231E] bg-white"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-[#C9DBD3]/40 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#5B7170]">
                    Ao publicar, a agenda semanal e as fichas aparecerão na tela inicial do aluno imediatamente.
                  </p>
                  <button
                    type="button"
                    onClick={handleSavePrescription}
                    className="py-3 px-6 rounded-full bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43] shadow-md shadow-[#125F55]/20 shrink-0"
                  >
                    Salvar e Publicar para o Aluno
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Visão da Carteira de Alunos */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#19231E]">
                  Sua Carteira de Alunos ({links.length})
                </h2>
                <p className="text-xs text-[#5B7170]">
                  Alunos vinculados via seu código de professor
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateDemoStudent}
                  className="py-1.5 px-3 rounded-full border border-[#125F55] text-[#125F55] text-xs font-bold hover:bg-[#EAF3EF] transition-all"
                >
                  + Aluno Exemplo
                </button>
                <div className="flex rounded-xl bg-white border border-[#C9DBD3] p-0.5">
                  <button
                    type="button"
                    onClick={() => setFilter('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      filter === 'all' ? 'bg-[#125F55] text-white' : 'text-[#5B7170]'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('pending')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      filter === 'pending' ? 'bg-[#125F55] text-white' : 'text-[#5B7170]'
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter('active')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      filter === 'active' ? 'bg-[#125F55] text-white' : 'text-[#5B7170]'
                    }`}
                  >
                    Ativos
                  </button>
                </div>
              </div>
            </div>

            {filteredLinks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredLinks.map((link) => {
                  const sub = submissions.find((s) => s.id === link.lastSubmissionId);
                  const isPending = link.status === 'pending';

                  return (
                    <div
                      key={link.id}
                      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#C9DBD3]/60 shadow-xs space-y-3 hover:border-[#125F55]/50 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-[#19231E]">
                              {link.studentName}
                            </h3>
                            <p className="text-[11px] text-[#5B7170]">
                              {link.studentEmail || 'Aluno vinculado'}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                              isPending
                                ? 'bg-[#C84B31]/15 text-[#C84B31]'
                                : 'bg-[#EAF3EF] text-[#125F55]'
                            }`}
                          >
                            {isPending ? 'Anamnese Pendente' : 'Plano Ativo'}
                          </span>
                        </div>

                        {sub && (
                          <div className="text-xs text-[#5B7170] space-y-1 bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#C9DBD3]/40">
                            <p>
                              <strong>Objetivo:</strong>{' '}
                              {sub.answers['q_primary_goal'] || 'Saúde e Hábito'}
                            </p>
                            {sub.photos && sub.photos.length > 0 && (
                              <p className="text-[#125F55] font-bold flex items-center gap-1">
                                <span>📸</span> {sub.photos.length} foto(s) anexada(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-[#C9DBD3]/40">
                        <span className="text-[11px] text-[#5B7170]">
                          {link.assignedPlans?.length || 0} ficha(s) prescrita(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentUid(link.studentUid);
                            setActiveTab(isPending ? 'record' : 'prescription');
                          }}
                          className="py-1.5 px-3.5 rounded-full bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43] shadow-xs"
                        >
                          {isPending ? 'Avaliar & Prescrever →' : 'Ver Prontuário →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-dashed border-[#C9DBD3] text-center space-y-3">
                <span className="text-3xl">👥</span>
                <h3 className="font-extrabold text-sm text-[#19231E]">
                  Nenhum aluno nesta visualização
                </h3>
                <p className="text-xs text-[#5B7170] max-w-sm mx-auto">
                  Compartilhe seu código <strong className="text-[#125F55]">{inviteCode}</strong>{' '}
                  com seus alunos ou crie um aluno exemplo para testar as prescrições.
                </p>
                <button
                  type="button"
                  onClick={handleCreateDemoStudent}
                  className="py-2.5 px-5 rounded-full bg-[#125F55] text-white text-xs font-bold hover:bg-[#0E4B43]"
                >
                  Criar Aluno Exemplo
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Construtor de Anamnese */}
      <AnamnesisBuilderModal
        isOpen={isBuilderModalOpen}
        teacherUid={teacherUid}
        teacherName={teacherName}
        onClose={() => setIsBuilderModalOpen(false)}
      />

      {/* Modal de Zoom de Foto */}
      {zoomPhotoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div className="max-w-2xl max-h-[90vh] relative">
            <img
              src={zoomPhotoUrl}
              alt="Foto ampliada para análise"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
