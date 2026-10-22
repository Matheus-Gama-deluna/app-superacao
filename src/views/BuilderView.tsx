import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { WorkoutPlan, ExercisePlanItem, Exercise } from '../types';
import { allExercises, searchExercises } from '../data/catalog';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Clock,
  Dumbbell,
  Search,
  X,
  UserCheck,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { SmartWorkoutGeneratorModal } from '../components/SmartWorkoutGeneratorModal';

interface BuilderViewProps {
  existingPlanId?: string;
  onClose: () => void;
  onStartWorkout?: (plan: WorkoutPlan) => void;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ existingPlanId, onClose, onStartWorkout }) => {
  const { plans, savePlan } = useWorkout();
  const existingPlan = plans.find((p) => p.id === existingPlanId);

  const [title, setTitle] = useState<string>(existingPlan?.title || 'Novo Treino');
  const [description, setDescription] = useState<string>(existingPlan?.description || '');
  const [category, setCategory] = useState<WorkoutPlan['category']>(existingPlan?.category || 'casa');
  const [isProfessional, setIsProfessional] = useState<boolean>(existingPlan?.isProfessional || false);
  const [authorName, setAuthorName] = useState<string>(existingPlan?.authorName || '');
  const [items, setItems] = useState<ExercisePlanItem[]>(existingPlan?.exercises || []);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('todos');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('todos');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);

  // Filtros unificados idênticos ao catálogo (A10)
  const equipmentOptions = [
    { id: 'todos', label: 'Todos Equipamentos' },
    { id: 'peso_corporal', label: 'Peso Corporal' },
    { id: 'mini_band', label: 'Mini Band' },
    { id: 'faixa_longa', label: 'Faixa Longa' },
    { id: 'tubos_elasticos', label: 'Tubos com Pegador' },
    { id: 'halteres', label: 'Halteres' },
    { id: 'barra', label: 'Barra' },
    { id: 'kettlebell', label: 'Kettlebell' },
    { id: 'maquina', label: 'Máquinas' },
    { id: 'cadeira', label: 'Cadeira / Apoio' },
  ];

  const muscleOptions = [
    { id: 'todos', label: 'Todos Músculos' },
    { id: 'Peitoral', label: 'Peitoral' },
    { id: 'Costas', label: 'Costas' },
    { id: 'Quadríceps', label: 'Quadríceps' },
    { id: 'Glúteos', label: 'Glúteos' },
    { id: 'Posterior', label: 'Posterior' },
    { id: 'Ombros', label: 'Ombros' },
    { id: 'Bíceps', label: 'Bíceps' },
    { id: 'Tríceps', label: 'Tríceps' },
    { id: 'Abdômen', label: 'Abdômen' },
    { id: 'Lombar', label: 'Lombar' },
  ];


  // Calcula duração estimada baseada nas séries e descanso
  const estimatedDuration = Math.max(
    5,
    Math.round(
      items.reduce((acc, it) => {
        const workSec = it.targetReps > 0 ? it.targetReps * 3.5 : (it.targetDurationSeconds || 30);
        return acc + it.targetSets * (workSec + it.restSeconds);
      }, 0) / 60
    )
  );

  const handleAddExercise = (ex: Exercise) => {
    const newItem: ExercisePlanItem = {
      exerciseId: ex.id,
      exerciseName: ex.name_pt,
      targetSets: 3,
      targetReps: ex.tracking === 'time' ? 0 : 10,
      targetDurationSeconds: ex.tracking === 'time' ? 30 : undefined,
      restSeconds: 60,
    };
    setItems([...items, newItem]);
    setShowAddModal(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const reordered = [...items];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    setItems(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const reordered = [...items];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    setItems(reordered);
  };

  const handleUpdateItem = (index: number, partial: Partial<ExercisePlanItem>) => {
    setItems(items.map((it, i) => (i === index ? { ...it, ...partial } : it)));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Por favor, informe um título para o treino.');
      return;
    }
    if (items.length === 0) {
      alert('Adicione pelo menos um exercício ao treino.');
      return;
    }

    setIsSaving(true);
    try {
      await savePlan(
        {
          ownerUid: '', // Atribuído no context
          title: title.trim(),
          description: description.trim(),
          version: 1,
          isProfessional,
          authorName: isProfessional ? authorName.trim() : undefined,
          isTemplate: false,
          category,
          estimatedDurationMinutes: estimatedDuration,
          exercises: items,
        },
        existingPlanId
      );
      onClose();
    } catch (err) {
      console.error('Erro ao salvar plano:', err);
      alert('Ocorreu um erro ao salvar o treino.');
    } finally {
      setIsSaving(false);
    }
  };

  // Exercícios para o modal seletor utilizando os mesmos filtros canônicos do catálogo (A10)
  const filteredAvailableExercises = searchExercises(
    exerciseSearch,
    selectedEquipment,
    selectedMuscle
  ).slice(0, 60);

  return (
    <div className="space-y-5 pb-28">
      {/* Top Bar do Montador */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5B7170] hover:text-[#152A29] p-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <span className="text-xs font-bold text-[#125F55] uppercase tracking-wider">
          {existingPlanId ? 'Editar Treino' : 'Novo Treino'}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-[#125F55] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#0C5148] shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Salvar</span>
        </button>
      </div>

      {/* Informações Básicas */}
      <section className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1">Nome do Treino</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Treino de Pernas & Glúteos em Casa"
            className="w-full h-11 px-3.5 rounded-xl border border-[#C9DBD3] text-sm text-[#152A29] focus:outline-none focus:border-[#125F55]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#152A29] mb-1">Descrição / Objetivo</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve anotação sobre o foco deste treino..."
            rows={2}
            className="w-full p-3 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29] focus:outline-none focus:border-[#125F55]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-[#5B7170] mb-1">Categoria Principal</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkoutPlan['category'])}
              className="w-full h-10 px-2.5 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29] bg-white"
            >
              <option value="casa">Casa (Sem aparelho)</option>
              <option value="mini_band">Mini Band</option>
              <option value="faixa_longa">Faixa Longa</option>
              <option value="mobilidade">Mobilidade & Alongamento</option>
              <option value="caminhada">Caminhada</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#5B7170] mb-1">Tempo Estimado</label>
            <div className="h-10 px-3 rounded-xl bg-[#F5F8F5] border border-[#C9DBD3] flex items-center gap-1.5 text-xs text-[#125F55] font-semibold tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              <span>{estimatedDuration} minutos</span>
            </div>
          </div>
        </div>

        {/* Opção: Treino prescrito por profissional */}
        <div className="pt-2 border-t border-[#C9DBD3]/40">
          <label className="flex items-center gap-2 text-xs font-medium text-[#152A29] cursor-pointer">
            <input
              type="checkbox"
              checked={isProfessional}
              onChange={(e) => setIsProfessional(e.target.checked)}
              className="rounded text-[#125F55] focus:ring-[#125F55] w-4 h-4"
            />
            <span>Este treino foi passado por um Personal Trainer ou Fisioterapeuta</span>
          </label>
          {isProfessional && (
            <div className="mt-2.5 pl-6">
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nome do profissional (ex: Fisioterapeuta Camila)"
                className="w-full h-9 px-3 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29]"
              />
            </div>
          )}
        </div>
      </section>

      {/* Lista de Exercícios Adicionados */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#152A29]">Exercícios ({items.length})</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#125F55] text-[#125F55] text-xs font-bold flex items-center gap-1 hover:bg-[#125F55]/5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Gerar c/ Assistente</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#EAF3EF] text-[#125F55] text-xs font-bold flex items-center gap-1 hover:bg-[#D9F277] hover:text-[#203826] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Movimento</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#C9DBD3] text-center space-y-3">
            <Dumbbell className="w-8 h-8 text-[#5B7170] mx-auto opacity-60" />
            <div>
              <p className="text-sm font-bold text-[#152A29]">Nenhum exercício neste treino</p>
              <p className="text-xs text-[#5B7170] mt-0.5">Monte do zero ou use o gerador com seus equipamentos disponíveis.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#125F55] to-[#1E7D70] text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D9F277]" />
                <span>Montar com Assistente Inteligente</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#EAF3EF] hover:bg-[#C9DBD3] text-[#125F55] text-xs font-bold rounded-xl cursor-pointer"
              >
                Escolher da Biblioteca (+876)
              </button>
            </div>
          </div>
        ) : (

          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#C9DBD3] p-4 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#EAF3EF] text-[#125F55] font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h5 className="text-sm font-bold text-[#152A29]">{item.exerciseName}</h5>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded text-[#5B7170] hover:text-[#152A29] disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === items.length - 1}
                      className="p-1 rounded text-[#5B7170] hover:text-[#152A29] disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 rounded text-[#B13D39] hover:bg-red-50 ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Parâmetros do Exercício (Séries, Reps/Tempo, Descanso) */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#C9DBD3]/40 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#5B7170] mb-0.5">Séries</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={item.targetSets}
                      onChange={(e) => handleUpdateItem(index, { targetSets: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full h-8 px-2 rounded-lg border border-[#C9DBD3] text-center font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#5B7170] mb-0.5">
                      {item.targetReps > 0 ? 'Repetições' : 'Segundos'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.targetReps > 0 ? item.targetReps : item.targetDurationSeconds || 30}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        if (item.targetReps > 0) {
                          handleUpdateItem(index, { targetReps: val });
                        } else {
                          handleUpdateItem(index, { targetDurationSeconds: val });
                        }
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-[#C9DBD3] text-center font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#5B7170] mb-0.5">Descanso (s)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={item.restSeconds}
                      onChange={(e) => handleUpdateItem(index, { restSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full h-8 px-2 rounded-lg border border-[#C9DBD3] text-center font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL SELETOR DE EXERCÍCIOS */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-white p-5 shadow-2xl border border-[#C9DBD3] text-[#152A29] relative animate-in fade-in duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#C9DBD3]">
              <h3 className="text-sm font-bold text-[#152A29]">Escolha um Exercício</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-[#5B7170]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative my-2.5">
              <Search className="w-3.5 h-3.5 text-[#5B7170] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, músculo, mini band..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#C9DBD3] text-xs text-[#152A29]"
              />
            </div>

            {/* Filtros em Linha: Equipamento & Músculo (A10) */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              <div>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-[#C9DBD3] text-[11px] font-medium text-[#152A29] bg-white cursor-pointer"
                >
                  {equipmentOptions.map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={selectedMuscle}
                  onChange={(e) => setSelectedMuscle(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-[#C9DBD3] text-[11px] font-medium text-[#152A29] bg-white cursor-pointer"
                >
                  {muscleOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-[10px] text-[#5B7170] mb-2 font-medium">
              {filteredAvailableExercises.length} exercícios disponíveis
            </p>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {filteredAvailableExercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  className="p-3 rounded-xl bg-[#F5F8F5] border border-[#C9DBD3] hover:border-[#125F55] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-bold text-[#152A29]">{ex.name_pt}</h5>
                    <p className="text-[10px] text-[#5B7170]">{ex.target_muscle} · {ex.equipment.join(', ')}</p>
                  </div>
                  <Plus className="w-4 h-4 text-[#125F55]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO GERADOR INTELIGENTE DE TREINO */}
      <SmartWorkoutGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onStartGeneratedWorkout={(plan) => {
          if (onStartWorkout) {
            onStartWorkout(plan);
          }
          onClose();
        }}
        onEditInBuilder={(plan) => {
          setTitle(plan.title);
          setDescription(plan.description);
          setCategory(plan.category);
          setItems(plan.exercises);
        }}
        onSaveToProfile={async (plan) => {
          await savePlan({
            ownerUid: '',
            title: plan.title,
            description: plan.description,
            version: 1,
            isProfessional: false,
            authorName: plan.authorName,
            isTemplate: false,
            category: plan.category,
            estimatedDurationMinutes: plan.estimatedDurationMinutes,
            exercises: plan.exercises,
          });
        }}
      />
    </div>
  );
};

