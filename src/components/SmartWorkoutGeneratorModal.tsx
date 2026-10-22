import React, { useState } from 'react';
import { Exercise, WorkoutPlan, ExercisePlanItem } from '../types';
import { allExercises } from '../data/catalog';
import { useAuth } from '../context/AuthContext';
import { isExerciseCompatibleWithUser } from '../lib/storage';
import { ExerciseIllustration } from './ExerciseIllustration';
import {
  Sparkles,
  X,
  Dumbbell,
  Clock,
  Target,
  Check,
  RefreshCw,
  Play,
  Save,
  Edit3,
  Calendar,
  Shuffle,
  ShieldCheck,
} from 'lucide-react';

interface SmartWorkoutGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGeneratedWorkout: (plan: WorkoutPlan) => void;
  onEditInBuilder: (plan: WorkoutPlan) => void;
  onSaveToProfile: (plan: WorkoutPlan) => Promise<void>;
  initialFocus?: 'habito' | 'postura' | 'vitalidade' | 'hipertrofia' | 'full_body' | 'upper' | 'lower';
}

export const SmartWorkoutGeneratorModal: React.FC<SmartWorkoutGeneratorModalProps> = ({
  isOpen,
  onClose,
  onStartGeneratedWorkout,
  onEditInBuilder,
  onSaveToProfile,
  initialFocus,
}) => {
  // Configurações do gerador
  const [generationMode, setGenerationMode] = useState<'today' | 'weekly_split'>('today');
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(['peso_corporal']);
  const [durationPreset, setDurationPreset] = useState<'express' | 'padrao' | 'completo'>('padrao');
  const [goal, setGoal] = useState<'habito' | 'postura' | 'vitalidade' | 'hipertrofia'>(
    initialFocus === 'postura'
      ? 'postura'
      : initialFocus === 'vitalidade'
      ? 'vitalidade'
      : initialFocus === 'hipertrofia'
      ? 'hipertrofia'
      : 'habito'
  );
  const [level, setLevel] = useState<'iniciante' | 'intermediario' | 'avancado'>('iniciante');

  // Treino gerado
  const [generatedPlan, setGeneratedPlan] = useState<WorkoutPlan | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const equipmentOptions = [
    { id: 'peso_corporal', label: 'Peso corporal', icon: '🏠' },
    { id: 'mini_band', label: 'Mini band circular', icon: '🟡' },
    { id: 'faixa_longa', label: 'Faixa elástica longa', icon: '🎗️' },
    { id: 'tubos_elasticos', label: 'Tubos elásticos com pegadores', icon: '➰' },
    { id: 'halteres', label: 'Halteres', icon: '🏋️' },
    { id: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
    { id: 'cadeira', label: 'Cadeira firme / apoio', icon: '🪑' },
    { id: 'parede', label: 'Espaço na parede', icon: '🧱' },
    { id: 'colchonete', label: 'Colchonete / tapete', icon: '🧘' },
  ];

  const durationOptions = [
    { id: 'express', label: 'Express (12-15 min)', desc: '3 a 4 movimentos essenciais, foco no hábito diário', count: 4, sets: 2 },
    { id: 'padrao', label: 'Padrão (25-30 min)', desc: '5 a 6 movimentos completos com volume equilibrado', count: 5, sets: 3 },
    { id: 'completo', label: 'Completo (40-45 min)', desc: '7 a 8 movimentos com compostos e isolados', count: 7, sets: 3 },
  ];

  const goalOptions = [
    {
      id: 'habito',
      label: 'Hábito & Saúde em Casa',
      desc: 'Movimentos suaves, sustentabilidade diária sem dores extremas nem aparelhos pesados',
    },
    {
      id: 'postura',
      label: 'Coluna Saudável & Postura',
      desc: 'Descompressão lombar, firmeza de glúteos e estabilidade torácica para quem trabalha sentado',
    },
    {
      id: 'vitalidade',
      label: 'Vitalidade & Disposição Funcional',
      desc: 'Condicionamento corporal geral, circulação e queima metabólica equilibrada',
    },
    {
      id: 'hipertrofia',
      label: 'Hipertrofia & Força Muscular',
      desc: 'Sobrecarga progressiva para desenvolvimento de massa magra e densidade muscular',
    },
  ];

  const toggleEquipment = (id: string) => {
    if (selectedEquipments.includes(id)) {
      if (selectedEquipments.length > 1) {
        setSelectedEquipments(selectedEquipments.filter((e) => e !== id));
      }
    } else {
      setSelectedEquipments([...selectedEquipments, id]);
    }
  };

  const handleGenerate = () => {
    // 1. Filtra candidatos garantindo que TODOS os equipamentos obrigatórios e apoios estejam presentes (C01, C02)
    const available = allExercises.filter((ex) => {
      const hasAllRequired = ex.equipment.every(
        (eq) => eq === 'nenhum' || eq === 'colchonete' || selectedEquipments.includes(eq)
      );
      if (!hasAllRequired) return false;
      if (ex.requires_supports && Array.isArray(ex.requires_supports)) {
        const hasSupports = ex.requires_supports.every((sup: string) => selectedEquipments.includes(sup));
        if (!hasSupports) return false;
      }
      return true;
    });

    if (available.length === 0) {
      alert('Nenhum exercício encontrado com os filtros selecionados. Marque mais opções de equipamentos.');
      return;
    }

    const currentDur = durationOptions.find((d) => d.id === durationPreset) || durationOptions[1];
    const targetCount = currentDur.count;
    const defaultSets = currentDur.sets;

    // 2. Filtra por objetivo prioritário com salvaguarda estrita para iniciantes em hábitos (C01)
    let candidates = available;
    if (goal === 'habito') {
      candidates = available.filter((e) => {
        const isAdvanced = e.difficulty_candidate === 'avancado';
        const textName = (e.name_pt || '').toLowerCase();
        const isHighImpact =
          e.movement_pattern === 'pliometria' ||
          textName.includes('salto') ||
          textName.includes('jump') ||
          textName.includes('polichinelo') ||
          textName.includes('burpee') ||
          textName.includes('pliométr');

        if (level === 'iniciante' && (isAdvanced || isHighImpact)) {
          return false;
        }

        return (
          e.difficulty_candidate === 'iniciante' ||
          e.modality === 'mobilidade' ||
          e.modality === 'alongamento' ||
          (e.equipment.includes('peso_corporal') && !isAdvanced && !isHighImpact)
        );
      });
    } else if (goal === 'postura') {
      candidates = available.filter((e) => {
        const t = (e.target_muscle || '').toLowerCase();
        const p = (e.primary_muscles || []).join(' ').toLowerCase();
        return (
          t.includes('coluna') ||
          t.includes('lombar') ||
          t.includes('abdômen') ||
          t.includes('glúteo') ||
          p.includes('lombar') ||
          p.includes('core') ||
          p.includes('glúteos') ||
          e.movement_pattern.includes('mobilidade') ||
          e.modality === 'alongamento'
        );
      });
    } else if (goal === 'vitalidade') {
      candidates = available.filter((e) => {
        return e.movement_pattern !== 'isolamento' && (e.modality === 'forca' || e.modality === 'cardio');
      });
    } else if (goal === 'hipertrofia') {
      candidates = available.filter((e) => {
        return e.modality === 'forca';
      });
    }

    if (candidates.length < targetCount) {
      candidates = [...candidates, ...available];
    }

    // Embaralha determinístico
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    const selectedList: Exercise[] = [];
    const usedIds = new Set<string>();

    for (const item of shuffled) {
      if (!usedIds.has(item.id)) {
        usedIds.add(item.id);
        selectedList.push(item);
      }
      if (selectedList.length >= targetCount) break;
    }

    // Configura descanso baseado no nível
    const rest = level === 'iniciante' ? 60 : level === 'intermediario' ? 50 : 40;
    const reps = level === 'iniciante' ? 10 : level === 'intermediario' ? 12 : 15;

    const planItems: ExercisePlanItem[] = selectedList.map((ex) => {
      const isTime = ex.tracking === 'time';
      return {
        exerciseId: ex.id,
        exerciseName: ex.name_pt,
        targetSets: defaultSets,
        targetReps: isTime ? 0 : reps,
        targetDurationSeconds: isTime ? 30 : undefined,
        restSeconds: rest,
      };
    });

    const goalNameMap: Record<string, string> = {
      habito: 'Hábito Ativo & Saúde',
      postura: 'Coluna Saudável & Postura',
      vitalidade: 'Vitalidade Funcional',
      hipertrofia: 'Hipertrofia & Força',
    };

    const newPlan: WorkoutPlan = {
      id: `smart_gen_${Date.now()}`,
      ownerUid: '',
      title: `${goalNameMap[goal]} • ${durationPreset === 'express' ? '15m' : durationPreset === 'padrao' ? '30m' : '45m'}`,
      description: `Treino inteligente adaptado para seus equipamentos (${selectedEquipments
        .map((eq) => equipmentOptions.find((o) => o.id === eq)?.label || eq)
        .join(', ')}).`,
      version: 1,
      isProfessional: true,
      authorName: 'Superação (Gerador Inteligente)',
      isTemplate: false,
      category: selectedEquipments.includes('peso_corporal') && selectedEquipments.length === 1 ? 'casa' : 'academia',
      estimatedDurationMinutes: durationPreset === 'express' ? 15 : durationPreset === 'padrao' ? 30 : 45,
      exercises: planItems,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setGeneratedPlan(newPlan);
    setSaveSuccess(false);
  };

  // Troca pontual de exercício por outro equivalente compatível
  const handleSwapExercise = (indexToSwap: number) => {
    if (!generatedPlan) return;
    const currentItem = generatedPlan.exercises[indexToSwap];
    const currentEx = allExercises.find((e) => e.id === currentItem.exerciseId);

    // Encontra substitutos compatíveis com os equipamentos
    const currentUsedIds = new Set(generatedPlan.exercises.map((e) => e.exerciseId));
    const substitutes = allExercises.filter((e) => {
      if (currentUsedIds.has(e.id)) return false;
      const matchesEquip = e.equipment.some((eq) => selectedEquipments.includes(eq));
      if (!matchesEquip) return false;
      if (currentEx?.target_muscle && e.target_muscle === currentEx.target_muscle) return true;
      if (currentEx?.movement_pattern && e.movement_pattern === currentEx.movement_pattern) return true;
      return true;
    });

    if (substitutes.length === 0) return;
    const randomPick = substitutes[Math.floor(Math.random() * substitutes.length)];

    const updatedExercises = [...generatedPlan.exercises];
    const isTime = randomPick.tracking === 'time';
    updatedExercises[indexToSwap] = {
      exerciseId: randomPick.id,
      exerciseName: randomPick.name_pt,
      targetSets: currentItem.targetSets,
      targetReps: isTime ? 0 : currentItem.targetReps || 10,
      targetDurationSeconds: isTime ? 30 : undefined,
      restSeconds: currentItem.restSeconds,
    };

    setGeneratedPlan({
      ...generatedPlan,
      exercises: updatedExercises,
    });
  };

  const handleSave = async () => {
    if (!generatedPlan) return;
    setIsSaving(true);
    try {
      await onSaveToProfile(generatedPlan);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar treino.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#152A29]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF7F2] w-full max-w-xl max-h-[92vh] sm:rounded-3xl rounded-t-3xl border border-[#C9DBD3] shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200 cursor-default"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#C9DBD3] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E07A5F]/10 text-[#E07A5F] flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#152A29]">
                Montador Inteligente de Treino
              </h2>
              <p className="text-xs text-[#5B7170]">
                Sugestão adaptada baseada em {allExercises.length} exercícios ilustrados do catálogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#E5ECE9] hover:bg-[#C9DBD3] text-[#5B7170] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {!generatedPlan ? (
            <>
              {/* Seletor de Modo: Treino de Hoje ou Divisão */}
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-[#C9DBD3]">
                <button
                  type="button"
                  onClick={() => setGenerationMode('today')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    generationMode === 'today'
                      ? 'bg-[#125F55] text-white shadow-xs'
                      : 'text-[#5B7170] hover:text-[#152A29]'
                  }`}
                >
                  Treino Personalizado para Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode('weekly_split')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    generationMode === 'weekly_split'
                      ? 'bg-[#125F55] text-white shadow-xs'
                      : 'text-[#5B7170] hover:text-[#152A29]'
                  }`}
                >
                  Divisão para a Semana
                </button>
              </div>

              {/* 1. Equipamentos disponíveis */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#125F55] mb-2">
                  1. Onde você treina e quais equipamentos tem agora?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {equipmentOptions.map((opt) => {
                    const isChecked = selectedEquipments.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleEquipment(opt.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#125F55]/8 border-[#125F55] text-[#125F55] shadow-xs'
                            : 'bg-white border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{opt.icon}</span>
                          <span className="text-xs font-bold text-[#152A29]">{opt.label}</span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center text-xs font-bold transition-all ${
                            isChecked
                              ? 'bg-[#125F55] border-[#125F55] text-white'
                              : 'border-[#C9DBD3] bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Objetivo de Treino e Saúde */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#125F55] mb-2">
                  2. Qual seu objetivo de transformação e bem-estar?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {goalOptions.map((opt) => {
                    const isSelected = goal === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGoal(opt.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#125F55]/8 border-[#125F55] shadow-xs'
                            : 'bg-white border-[#C9DBD3] hover:border-[#125F55]/40'
                        }`}
                      >
                        <p className="text-xs font-bold text-[#152A29]">{opt.label}</p>
                        <p className="text-[11px] text-[#5B7170] mt-0.5 leading-snug">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tempo disponível */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#125F55] mb-2">
                  3. Quanto tempo você deseja treinar por sessão?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {durationOptions.map((opt) => {
                    const isSelected = durationPreset === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDurationPreset(opt.id as any)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#125F55] border-[#125F55] text-white shadow-xs'
                            : 'bg-white border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]/40'
                        }`}
                      >
                        <p className={`text-xs font-black ${isSelected ? 'text-white' : 'text-[#152A29]'}`}>
                          {opt.label.split(' ')[0]}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#FAF7F2]/80' : 'text-[#5B7170]'}`}>
                          {opt.label.slice(opt.label.indexOf(' ') + 1)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Nível de Intensidade */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#125F55] mb-2">
                  4. Nível de Ritmo & Condicionamento
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'iniciante', label: '🌱 Iniciante (Mais descanso)' },
                    { id: 'intermediario', label: '⚡ Regular' },
                    { id: 'avancado', label: '🔥 Avançado' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLevel(l.id as any)}
                      className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        level === l.id
                          ? 'bg-[#E07A5F] border-[#E07A5F] text-white shadow-xs'
                          : 'bg-white border-[#C9DBD3] text-[#5B7170]'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Ação */}
              <button
                type="button"
                onClick={handleGenerate}
                className="w-full py-4 bg-[#125F55] hover:bg-[#0E4C44] text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 text-[#D9F277]" />
                Montar Treino Adaptado Agora
              </button>
            </>
          ) : (
            /* Treino Gerado com Sucesso */
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-[#C9DBD3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E07A5F] bg-[#E07A5F]/10 px-2.5 py-1 rounded-full">
                    Treino Prescrito
                  </span>
                  <span className="text-xs text-[#5B7170] flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#125F55]" />
                    ~{generatedPlan.estimatedDurationMinutes} min
                  </span>
                </div>
                <h3 className="text-base font-black text-[#152A29]">{generatedPlan.title}</h3>
                <p className="text-xs text-[#5B7170]">{generatedPlan.description}</p>
              </div>

              {/* Lista dos Exercícios com Fotos e Troca Fácil */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-black uppercase text-[#125F55]">
                    {generatedPlan.exercises.length} Movimentos na Sequência
                  </p>
                  <button
                    onClick={handleGenerate}
                    className="text-xs text-[#125F55] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Gerar Outra Variação
                  </button>
                </div>

                {generatedPlan.exercises.map((item, idx) => {
                  const ex = allExercises.find((e) => e.id === item.exerciseId);
                  return (
                    <div
                      key={item.exerciseId + idx}
                      className="bg-white p-3 rounded-2xl border border-[#C9DBD3] flex items-center gap-3 justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#C9DBD3]">
                          {ex ? (
                            <ExerciseIllustration
                              movementPattern={ex.movement_pattern}
                              modality={ex.modality}
                              images={ex.images}
                              exerciseName={ex.name_pt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#E5ECE9] flex items-center justify-center">
                              <Dumbbell className="w-5 h-5 text-[#5B7170]" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-[#152A29] truncate">{item.exerciseName}</p>
                          <p className="text-[11px] text-[#5B7170] truncate">
                            {ex?.target_muscle || 'Geral'} · {ex?.equipment?.join(', ') || 'Corpo'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-[#E5ECE9] text-[#152A29] px-2 py-0.5 rounded-md">
                              {item.targetSets} séries
                            </span>
                            <span className="text-[10px] font-bold bg-[#125F55]/10 text-[#125F55] px-2 py-0.5 rounded-md">
                              {item.targetReps > 0 ? `${item.targetReps} reps` : `${item.targetDurationSeconds}s`}
                            </span>
                            <span className="text-[10px] text-[#5B7170]">
                              {item.restSeconds}s descanso
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botão para trocar movimento */}
                      <button
                        type="button"
                        onClick={() => handleSwapExercise(idx)}
                        className="p-2 rounded-xl border border-[#C9DBD3] text-[#5B7170] hover:text-[#125F55] hover:bg-[#EAF3EF] transition-all cursor-pointer shrink-0"
                        title="Trocar por outro exercício similar"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Botões de Ação Final */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onStartGeneratedWorkout(generatedPlan);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-[#125F55] hover:bg-[#0E4C44] text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Iniciar Este Treino Agora
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="flex-1 py-3 bg-white hover:bg-[#FAF7F2] text-[#125F55] font-black text-xs rounded-xl border border-[#C9DBD3] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Salvo no Perfil!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Salvar na Minha Ficha</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onEditInBuilder(generatedPlan);
                      onClose();
                    }}
                    className="flex-1 py-3 bg-white hover:bg-[#FAF7F2] text-[#152A29] font-black text-xs rounded-xl border border-[#C9DBD3] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-[#5B7170]" />
                    <span>Ajustar no Editor</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
