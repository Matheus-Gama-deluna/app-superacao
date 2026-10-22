import React, { useState, useMemo, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Exercise, WorkoutPlan, WorkoutProgram } from '../types';
import { allExercises, searchExercises } from '../data/catalog';
import { ExerciseIllustration } from '../components/ExerciseIllustration';
import {
  Search,
  Plus,
  Play,
  Copy,
  Trash2,
  Clock,
  Dumbbell,
  Trophy,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  CheckCircle2,
  Heart,
  SlidersHorizontal,
} from 'lucide-react';
import { SmartWorkoutGeneratorModal } from '../components/SmartWorkoutGeneratorModal';

interface ExploreViewProps {
  onStartWorkout: (plan: WorkoutPlan) => void;
  onOpenBuilder: (existingPlanId?: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onStartWorkout,
  onOpenBuilder,
}) => {
  const { profile, updateUserProfile } = useAuth();
  const {
    plans,
    programs,
    activeProgram,
    activateProgram,
    savePlan,
    duplicatePlan,
    deletePlan,
    personalRecords,
  } = useWorkout();

  const [activeTab, setActiveTab] = useState<'programs' | 'plans' | 'exercises'>('programs');
  const [programFilter, setProgramFilter] = useState<'todos' | 'casa' | 'postura' | 'vitalidade' | 'academia'>('todos');
  const [planFilter, setPlanFilter] = useState<'todos' | 'classicas' | 'casa' | 'express' | 'mobilidade' | 'meus'>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('todos');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('todos');
  const [inspectingExercise, setInspectingExercise] = useState<Exercise | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [generatorFocus, setGeneratorFocus] = useState<any>('habito');
  const [pendingProgramToActivate, setPendingProgramToActivate] = useState<WorkoutProgram | null>(null);

  // Solicitação de ativação transparente com validação de dias disponíveis (R01, R04)
  const handleRequestActivateProgram = (prog: WorkoutProgram) => {
    const userDays = profile.availableDays || [1, 3, 5];
    if (prog.weeklyFrequency !== userDays.length) {
      setPendingProgramToActivate(prog);
    } else {
      activateProgram(prog, userDays);
    }
  };

  // Fecha modal com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectingExercise) setInspectingExercise(null);
        else if (pendingProgramToActivate) setPendingProgramToActivate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectingExercise]);

  // Filtros de Equipamento para o catálogo (A04, A09)
  const equipmentOptions = [
    { id: 'todos', label: 'Todos Equipamentos' },
    { id: 'peso_corporal', label: 'Peso Corporal (Casa)' },
    { id: 'mini_band', label: 'Mini Band (Circular)' },
    { id: 'faixa_longa', label: 'Faixa Longa (Super Band)' },
    { id: 'tubos_elasticos', label: 'Tubos com Pegadores' },
    { id: 'halteres', label: 'Halteres' },
    { id: 'barra', label: 'Barra' },
    { id: 'kettlebell', label: 'Kettlebell' },
    { id: 'maquina', label: 'Máquinas' },
    { id: 'polia', label: 'Polia / Cabo' },
    { id: 'cadeira', label: 'Cadeira / Apoio' },
  ];

  // Filtros de Músculo / Foco para o catálogo
  const muscleOptions = [
    { id: 'todos', label: 'Todos os Músculos' },
    { id: 'Peitoral', label: 'Peitoral' },
    { id: 'Costas', label: 'Costas & Dorsais' },
    { id: 'Quadríceps', label: 'Quadríceps / Pernas' },
    { id: 'Glúteos', label: 'Glúteos' },
    { id: 'Posterior', label: 'Posterior de Coxa' },
    { id: 'Ombros', label: 'Ombros' },
    { id: 'Bíceps', label: 'Bíceps' },
    { id: 'Tríceps', label: 'Tríceps' },
    { id: 'Abdômen', label: 'Abdômen & Core' },
    { id: 'Lombar', label: 'Lombar & Coluna' },
    { id: 'Panturrilhas', label: 'Panturrilhas' },
  ];

  // Filtra programas de longo prazo
  const filteredPrograms = useMemo(() => {
    return programs.filter((prog) => {
      if (programFilter === 'casa') return prog.environment === 'casa' || prog.objective === 'habito';
      if (programFilter === 'postura') return prog.objective === 'postura';
      if (programFilter === 'vitalidade') return prog.objective === 'vitalidade';
      if (programFilter === 'academia') return prog.environment === 'academia';
      return true;
    });
  }, [programs, programFilter]);

  // Filtra fichas individuais de treino
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (planFilter === 'meus') return !plan.isTemplate;
      if (planFilter === 'casa') return plan.category === 'casa';
      if (planFilter === 'express') return plan.estimatedDurationMinutes <= 20;
      if (planFilter === 'mobilidade') return plan.category === 'mobilidade';
      if (planFilter === 'classicas') {
        const t = plan.title.toLowerCase();
        return t.includes('push') || t.includes('pull') || t.includes('legs') || t.includes('upper') || t.includes('lower') || t.includes('abc');
      }
      return true;
    });
  }, [plans, planFilter]);

  // Filtra catálogo de 876 exercícios
  const filteredExercises = useMemo(() => {
    return searchExercises(
      searchQuery,
      selectedEquipment,
      selectedMuscle,
      undefined
    );
  }, [searchQuery, selectedEquipment, selectedMuscle]);

  const paginatedExercises = useMemo(() => {
    return filteredExercises.slice(0, visibleCount);
  }, [filteredExercises, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(filteredExercises.length, prev + 24));
  };

  const handleOpenGeneratorWithFocus = (focusGoal: any) => {
    setGeneratorFocus(focusGoal);
    setIsGeneratorOpen(true);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Banner Principal: Montador Inteligente & Ações */}
      <div className="bg-gradient-to-r from-[#125F55] via-[#166B60] to-[#1E7D70] rounded-3xl p-5 text-white shadow-sm space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D9F277] font-black text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Seleção Personalizada & Progressão Guiada</span>
          </div>
          <h2 className="text-xl font-black text-white leading-snug">
            Monte Treinos Adaptáveis e Programas de Longo Prazo
          </h2>
          <p className="text-xs text-[#FAF7F2]/90 leading-relaxed max-w-lg">
            Rotinas para treinar em casa, cuidar da postura e consolidar hábitos saudáveis, ou mesociclos completos de hipertrofia na academia.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleOpenGeneratorWithFocus('habito')}
            className="flex-1 py-3 px-4 bg-[#D9F277] hover:bg-[#c7e362] text-[#203826] font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Montar com Assistente Inteligente</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenBuilder()}
            className="py-3 px-4 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Ficha Manual</span>
          </button>
        </div>
      </div>

      {/* Navegação Superior Tripla: Programas · Fichas · Exercícios */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-[#C9DBD3] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('programs')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'programs'
              ? 'bg-[#125F55] text-white shadow-xs'
              : 'text-[#5B7170] hover:text-[#152A29]'
          }`}
        >
          Programas ({programs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-[#125F55] text-white shadow-xs'
              : 'text-[#5B7170] hover:text-[#152A29]'
          }`}
        >
          Fichas & Modelos ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'exercises'
              ? 'bg-[#125F55] text-white shadow-xs'
              : 'text-[#5B7170] hover:text-[#152A29]'
          }`}
        >
          Catálogo ({allExercises.length})
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 1: PROGRAMAS DE LONGO PRAZO & HÁBITOS                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          {/* Filtros de Categoria de Programas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'todos', label: 'Todos os Programas' },
              { id: 'casa', label: 'Casa & Hábitos' },
              { id: 'postura', label: 'Coluna Sem Dor' },
              { id: 'vitalidade', label: 'Vitalidade (8 Semanas)' },
              { id: 'academia', label: 'Academia & Força' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setProgramFilter(f.id as any)}
                className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  programFilter === f.id
                    ? 'bg-[#125F55] text-white shadow-xs font-bold'
                    : 'bg-white border border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Programas de Longo Prazo */}
          <div className="space-y-4">
            {filteredPrograms.map((prog) => {
              const isActive = activeProgram?.id === prog.id;

              return (
                <div
                  key={prog.id}
                  className={`bg-white rounded-3xl border p-5 shadow-xs space-y-4 transition-all ${
                    isActive
                      ? 'border-[#125F55] ring-2 ring-[#125F55]/15'
                      : 'border-[#C9DBD3] hover:border-[#125F55]/60'
                  }`}
                >
                  {/* Cabeçalho do Programa */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isActive && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#125F55] bg-[#D9F277]/50 px-2.5 py-0.5 rounded-full border border-[#D9F277]">
                            ✓ Programa Ativo na sua Rotina
                          </span>
                        )}
                        <span className="text-xs text-[#5B7170] font-medium">
                          {prog.environment === 'casa' ? 'Em Casa (Sem Máquinas)' : 'Academia / Pesos'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-[#152A29]">
                        {prog.title}
                      </h3>
                      <p className="text-xs text-[#5B7170] leading-relaxed">
                        {prog.description}
                      </p>
                    </div>
                  </div>

                  {/* Metadados Limpos (Zero-Pill com separador ·) */}
                  <div className="flex items-center gap-2 text-xs text-[#125F55] font-semibold pt-1">
                    <span>{prog.durationWeeks} semanas de evolução</span>
                    <span aria-hidden="true" className="text-[#C9DBD3]">·</span>
                    <span>{prog.weeklyFrequency} treinos semanais</span>
                    <span aria-hidden="true" className="text-[#C9DBD3]">·</span>
                    <span>{prog.routines.length} fichas articuladas</span>
                  </div>

                  {/* Âncora do Hábito sugerida */}
                  {prog.habitAnchor && (
                    <div className="text-[11px] text-[#5B7170] bg-[#F5F8F5] p-2.5 rounded-xl border border-[#C9DBD3]/50 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#125F55] shrink-0" />
                      <span>
                        <strong>Âncora de rotina recomendada:</strong> {prog.habitAnchor}
                      </span>
                    </div>
                  )}

                  {/* Fases do Mesociclo */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#125F55] block">
                      Fases do Programa:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {prog.phases.map((ph, idx) => (
                        <div
                          key={idx}
                          className="bg-[#F5F8F5] p-2.5 rounded-xl border border-[#C9DBD3]/60 text-xs space-y-0.5"
                        >
                          <p className="font-bold text-[#152A29]">{ph.name}</p>
                          <p className="text-[11px] text-[#5B7170] line-clamp-2">{ph.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fichas Integradas (Rotinas A, B, C...) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#125F55] block">
                      Conjunto de Treinos Incluídos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {prog.routines.map((routine) => (
                        <div
                          key={routine.id}
                          className="p-3 rounded-2xl bg-white border border-[#C9DBD3] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[#152A29] truncate">{routine.title}</p>
                            <p className="text-[11px] text-[#5B7170]">
                              {routine.exercises.length} movimentos · ~{routine.estimatedDurationMinutes} min
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onStartWorkout(routine)}
                            className="p-2 rounded-xl bg-[#EAF3EF] hover:bg-[#125F55] hover:text-white text-[#125F55] transition-all cursor-pointer shrink-0"
                            title="Iniciar esta ficha agora"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações do Card de Programa */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#C9DBD3]/40">
                    <button
                      type="button"
                      onClick={() => handleRequestActivateProgram(prog)}
                      className={`w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#EAF3EF] text-[#125F55] border border-[#125F55]'
                          : 'bg-[#125F55] hover:bg-[#0C5148] text-white shadow-xs'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{isActive ? '✓ Sincronizado na sua Agenda' : 'Ativar como meu Programa'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenGeneratorWithFocus(prog.objective)}
                      className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-[#F5F8F5] text-[#125F55] border border-[#C9DBD3] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                      <span>Personalizar no Assistente</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 2: FICHAS & MODELOS INDIVIDUAIS                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Filtros de Fichas */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'todos', label: 'Todas as Fichas' },
              { id: 'classicas', label: 'Divisões Clássicas (ABC / Upper)' },
              { id: 'casa', label: 'Em Casa / Sem Pesos' },
              { id: 'express', label: 'Express (15-20 min)' },
              { id: 'mobilidade', label: 'Recuperação Ativa' },
              { id: 'meus', label: 'Criados por Mim' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPlanFilter(f.id as any)}
                className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  planFilter === f.id
                    ? 'bg-[#125F55] text-white shadow-xs font-bold'
                    : 'bg-white border border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Fichas */}
          <div className="space-y-3">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border border-[#C9DBD3] p-4 shadow-xs space-y-3 hover:border-[#125F55]/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#152A29]">{plan.title}</h4>
                      {plan.isTemplate && (
                        <span className="text-[10px] font-bold text-[#125F55] bg-[#EAF3EF] px-2 py-0.5 rounded-md">
                          Modelo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5B7170] line-clamp-2">{plan.description}</p>
                  </div>
                  <span className="text-xs text-[#5B7170] flex items-center gap-1 shrink-0 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#125F55]" />
                    {plan.estimatedDurationMinutes} min
                  </span>
                </div>

                {/* Resumo de Exercícios da Ficha */}
                <div className="bg-[#F5F8F5] p-3 rounded-2xl text-xs text-[#152A29] space-y-1">
                  {plan.exercises.slice(0, 3).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span className="truncate max-w-[220px] font-medium">{it.exerciseName}</span>
                      <span className="text-[#5B7170] tabular-nums">
                        {it.targetSets}x {it.targetReps > 0 ? `${it.targetReps} reps` : `${it.targetDurationSeconds}s`}
                      </span>
                    </div>
                  ))}
                  {plan.exercises.length > 3 && (
                    <p className="text-[10px] text-[#5B7170] pt-0.5">
                      + {plan.exercises.length - 3} outros movimentos na rotina
                    </p>
                  )}
                </div>

                {/* Ações do Card da Ficha */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenBuilder(plan.id)}
                      className="px-3 py-1.5 rounded-xl border border-[#C9DBD3] text-[#125F55] text-xs font-semibold hover:bg-[#EAF3EF] cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicatePlan(plan.id)}
                      className="p-2 rounded-xl border border-[#C9DBD3] text-[#5B7170] hover:text-[#125F55] hover:bg-[#EAF3EF] cursor-pointer"
                      title="Duplicar este treino"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!plan.isTemplate && (
                      <button
                        type="button"
                        onClick={() => deletePlan(plan.id)}
                        className="p-2 rounded-xl border border-[#C9DBD3] text-[#B13D39] hover:bg-red-50 cursor-pointer"
                        title="Excluir treino"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenGeneratorWithFocus('habito')}
                      className="px-3 py-2 rounded-xl bg-white border border-[#C9DBD3] text-[#125F55] text-xs font-bold hover:bg-[#F5F8F5] cursor-pointer"
                    >
                      Personalizar
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartWorkout(plan)}
                      className="px-4 py-2 rounded-xl bg-[#125F55] text-white text-xs font-black flex items-center gap-1.5 hover:bg-[#0C5148] active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 3: CATÁLOGO COMPLETO DE 876 EXERCÍCIOS                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'exercises' && (
        <div className="space-y-4">
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#5B7170] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(24);
              }}
              placeholder="Buscar em 876 exercícios por nome, músculo..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-[#C9DBD3] text-xs text-[#152A29] placeholder-[#5B7170] focus:outline-none focus:border-[#125F55] shadow-xs"
            />
          </div>

          {/* Filtros de Equipamento */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5B7170]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#125F55]" />
              <span>Equipamento Disponível:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {equipmentOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedEquipment(opt.id);
                    setVisibleCount(24);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedEquipment === opt.id
                      ? 'bg-[#125F55] text-white shadow-xs font-bold'
                      : 'bg-white border border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros de Músculo / Região */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5B7170]">
              <Dumbbell className="w-3.5 h-3.5 text-[#125F55]" />
              <span>Músculo ou Região:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {muscleOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedMuscle(opt.id);
                    setVisibleCount(24);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    selectedMuscle === opt.id
                      ? 'bg-[#203826] text-[#D9F277] shadow-xs font-bold'
                      : 'bg-white border border-[#C9DBD3] text-[#5B7170] hover:border-[#125F55]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contador de Resultados */}
          <div className="flex items-center justify-between text-xs text-[#5B7170] px-1 pt-1">
            <span>
              Encontrados: <strong>{filteredExercises.length}</strong> exercícios
            </span>
            <span>
              Exibindo {Math.min(visibleCount, filteredExercises.length)} de {filteredExercises.length}
            </span>
          </div>

          {/* Grade de Exercícios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginatedExercises.map((ex) => {
              const pr = personalRecords.find((p) => p.exerciseId === ex.id);

              return (
                <div
                  key={ex.id}
                  onClick={() => setInspectingExercise(ex)}
                  className="bg-white rounded-2xl border border-[#C9DBD3] overflow-hidden shadow-xs hover:border-[#125F55] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <ExerciseIllustration
                    movementPattern={ex.movement_pattern}
                    modality={ex.modality}
                    images={ex.images}
                    exerciseName={ex.name_pt}
                    className="w-full h-32"
                  />
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-bold text-[#152A29] leading-snug">
                          {ex.name_pt}
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#5B7170] mt-1 line-clamp-1">
                        {ex.target_muscle} · {ex.equipment.join(', ')}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#C9DBD3]/40 flex items-center justify-between text-[11px]">
                      {pr ? (
                        <span className="font-semibold text-[#125F55] flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-[#125F55]" />
                          Recorde: {pr.bestReps > 0 ? `${pr.bestReps} reps` : `${pr.bestDurationSeconds}s`}
                        </span>
                      ) : (
                        <span className="text-[#5B7170]">{ex.difficulty_candidate || 'Iniciante'}</span>
                      )}
                      <span className="text-[#125F55] font-bold flex items-center gap-0.5">
                        Ver detalhes <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botão Carregar Mais */}
          {visibleCount < filteredExercises.length && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                className="w-full py-3.5 rounded-2xl bg-white border border-[#C9DBD3] text-[#125F55] font-bold text-xs hover:bg-[#EAF3EF] transition-colors cursor-pointer shadow-xs"
              >
                Carregar mais exercícios (+24 de {filteredExercises.length - visibleCount} restantes)
              </button>
            </div>
          )}

          {filteredExercises.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-[#C9DBD3] text-center text-[#5B7170] text-sm">
              Nenhum exercício encontrado com a combinação atual de filtros.
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL DE DETALHES DO EXERCÍCIO (INSPEÇÃO COM ESC & FECHAR)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {inspectingExercise && (
        <div
          onClick={() => setInspectingExercise(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-exercise-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-[#C9DBD3] text-[#152A29] relative overflow-hidden cursor-default animate-in fade-in slide-in-from-bottom duration-200"
          >
            {/* Botão de Fechar Superior Flutuante & Destacado */}
            <button
              type="button"
              onClick={() => setInspectingExercise(null)}
              className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full bg-white/95 hover:bg-[#FAF7F2] text-[#152A29] border border-[#C9DBD3] shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:shadow-lg"
              title="Fechar (ou clique fora)"
              aria-label="Fechar detalhes do exercício"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Conteúdo com rolagem suave */}
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="relative rounded-2xl overflow-hidden">
                <ExerciseIllustration
                  movementPattern={inspectingExercise.movement_pattern}
                  modality={inspectingExercise.modality}
                  images={inspectingExercise.images}
                  exerciseName={inspectingExercise.name_pt}
                  className="w-full h-52 sm:h-56"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#125F55]">
                    {inspectingExercise.target_muscle}
                  </span>
                  {inspectingExercise.name_en && (
                    <span className="text-[10px] text-[#5B7170]">
                      ({inspectingExercise.name_en})
                    </span>
                  )}
                </div>
                <h3 id="modal-exercise-title" className="text-xl font-black text-[#152A29] mt-0.5">
                  {inspectingExercise.name_pt}
                </h3>
              </div>

              {/* Músculos Ativados */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#5B7170] uppercase tracking-wider block">
                  Músculos Trabalhados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(inspectingExercise.primary_muscles || [inspectingExercise.target_muscle || 'Corpo']).map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-[#EAF3EF] text-[#125F55] text-xs font-semibold">
                      {m}
                    </span>
                  ))}
                  {(inspectingExercise.secondary_muscles || []).map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded-lg bg-[#F5F8F5] border border-[#C9DBD3] text-[#5B7170] text-[11px]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Passo a Passo em PT-BR */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#5B7170] uppercase tracking-wider block">
                  Passo a Passo de Execução
                </span>
                <div className="space-y-2.5 bg-[#F5F8F5] p-3.5 rounded-2xl border border-[#C9DBD3]/50">
                  {(inspectingExercise.steps_pt && inspectingExercise.steps_pt.length > 0
                    ? inspectingExercise.steps_pt
                    : [inspectingExercise.instructions_pt]
                  ).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-[#152A29]">
                      <span className="w-5 h-5 rounded-full bg-[#125F55] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-normal">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cautelas e Segurança */}
              {inspectingExercise.caution_pt && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-[#91610D] flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Atenção Postural: </span>
                    {inspectingExercise.caution_pt}
                  </div>
                </div>
              )}

              {/* Recorde Pessoal Atual */}
              {personalRecords.find((p) => p.exerciseId === inspectingExercise.id) && (
                <div className="bg-[#D9F277]/40 border border-[#D9F277] p-3.5 rounded-2xl flex items-center justify-between text-xs text-[#203826] font-semibold">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Trophy className="w-4 h-4 text-[#125F55]" />
                    Seu Recorde Pessoal:
                  </span>
                  <span className="text-base font-black tabular-nums text-[#125F55]">
                    {personalRecords.find((p) => p.exerciseId === inspectingExercise.id)?.bestReps || 0} repetições
                  </span>
                </div>
              )}
            </div>

            {/* Barra Inferior com Ações & Botão de Fechar */}
            <div className="p-4 bg-white border-t border-[#C9DBD3] flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => setInspectingExercise(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#F5F8F5] hover:bg-[#E5ECE9] text-[#5B7170] hover:text-[#152A29] text-xs font-bold border border-[#C9DBD3] cursor-pointer transition-colors text-center order-2 sm:order-1"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectingExercise(null);
                  onOpenBuilder();
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#125F55] text-white text-xs font-bold hover:bg-[#0C5148] active:scale-[0.98] cursor-pointer transition-all shadow-xs text-center order-1 sm:order-2"
              >
                Criar Treino com este Exercício
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO GERADOR INTELIGENTE DE TREINO */}
      <SmartWorkoutGeneratorModal
        isOpen={isGeneratorOpen}
        initialFocus={generatorFocus}
        onClose={() => setIsGeneratorOpen(false)}
        onStartGeneratedWorkout={(plan) => {
          onStartWorkout(plan);
        }}
        onEditInBuilder={(plan) => {
          savePlan({
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
          }).then((newId) => {
            onOpenBuilder(newId);
          });
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

      {/* MODAL DE ADAPTAÇÃO TRANSPARENTE DE PROGRAMA (R01, R04) */}
      {pendingProgramToActivate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-[#C9DBD3] shadow-xl text-[#152A29]">
            <div className="flex items-center justify-between pb-2 border-b border-[#C9DBD3]">
              <div className="flex items-center gap-2 text-[#125F55]">
                <Calendar className="w-5 h-5" />
                <h3 className="text-base font-bold">Adaptação de Programa</h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingProgramToActivate(null)}
                className="p-1 rounded-full text-[#5B7170] hover:bg-slate-100 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5B7170] leading-relaxed">
              O programa <strong>{pendingProgramToActivate.title}</strong> sugere{' '}
              <strong>{pendingProgramToActivate.weeklyFrequency} dias por semana</strong>, mas sua meta
              atual definida no perfil é de <strong>{(profile.availableDays || []).length} dias</strong>.
              Como prefere organizar sua rotina?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  const userDays = profile.availableDays || [1, 3, 5];
                  await activateProgram(pendingProgramToActivate, userDays);
                  setPendingProgramToActivate(null);
                }}
                className="w-full p-3 rounded-2xl bg-[#125F55] text-white font-bold text-xs hover:bg-[#0C5148] transition-all cursor-pointer shadow-xs text-left flex flex-col gap-0.5"
              >
                <span>(Recomendado) Adaptar aos meus {(profile.availableDays || []).length} dias</span>
                <span className="text-[10px] font-normal text-white/80">
                  Mantém sua meta semanal intacta e distribui os treinos nos seus dias de preferência.
                </span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const newDays =
                    pendingProgramToActivate.weeklyFrequency === 3
                      ? [1, 3, 5]
                      : pendingProgramToActivate.weeklyFrequency === 4
                      ? [1, 2, 4, 5]
                      : [1, 3, 5];
                  await updateUserProfile({ availableDays: newDays });
                  await activateProgram(pendingProgramToActivate, newDays);
                  setPendingProgramToActivate(null);
                }}
                className="w-full p-3 rounded-2xl bg-[#EAF3EF] text-[#125F55] font-bold text-xs hover:bg-[#D9F277] hover:text-[#203826] transition-all cursor-pointer border border-[#C9DBD3] text-left flex flex-col gap-0.5"
              >
                <span>Atualizar minha meta para {pendingProgramToActivate.weeklyFrequency} dias</span>
                <span className="text-[10px] font-normal text-[#5B7170]">
                  Assume a frequência sugerida pelo programa na sua agenda semanal.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPendingProgramToActivate(null)}
                className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-[#5B7170] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Manter programa atual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
