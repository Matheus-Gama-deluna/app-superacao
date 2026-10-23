import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { CalendarDay, ActivityType } from '../types';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Dumbbell,
  Heart,
  Sparkles,
  Footprints,
  Edit2,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

interface CalendarViewProps {
  onStartPlanById: (planId: string, scheduledDayId?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onStartPlanById }) => {
  const { calendar, plans, updateCalendarDay, toggleCalendarDayCompleted } = useWorkout();
  const [editingDay, setEditingDay] = useState<CalendarDay | null>(null);

  const daysLabels = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDate = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDate}`;

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const activityBadges: Record<ActivityType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    strength: { label: 'Treino de Força', icon: Dumbbell, color: '#125F55', bg: '#EAF3EF' },
    active_recovery: { label: 'Recuperação Ativa (Mobilidade)', icon: Sparkles, color: '#203826', bg: '#D9F277' },
    rest: { label: 'Descanso Total', icon: Heart, color: '#246747', bg: '#EAF3EF' },
    walk: { label: 'Caminhada & Respiração', icon: Footprints, color: '#125F55', bg: '#F5F8F5' },
    unassigned: { label: 'Livre / Não definido', icon: Circle, color: '#5B7170', bg: '#F5F8F5' },
  };

  const handleSaveDayEdit = async (
    type: ActivityType,
    selectedPlanId?: string,
    notes?: string
  ) => {
    if (!editingDay) return;
    const plan = plans.find((p) => p.id === selectedPlanId);
    await updateCalendarDay(
      editingDay.id,
      type,
      selectedPlanId,
      type === 'rest'
        ? 'Descanso Total (Recuperação)'
        : type === 'active_recovery'
        ? 'Recuperação Ativa: Alongamento & Mobilidade'
        : plan?.title || 'Treino Personalizado'
    );
    setEditingDay(null);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header da Agenda */}
      <div className="bg-white rounded-3xl p-5 border border-[#C9DBD3] shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#125F55] uppercase tracking-wider">
          <CalendarIcon className="w-4 h-4" />
          <span>Planejamento Sustentável</span>
        </div>
        <h2 className="text-xl font-bold text-[#152A29]">Sua Agenda Semanal</h2>
        <p className="text-xs text-[#5B7170] leading-relaxed">
          Alterne dias de treino de força com <strong>Recuperação Ativa (alongamento/mobilidade)</strong> ou <strong>Descanso Total</strong>. Reagende quando a vida real exigir, sem cobranças.
        </p>
      </div>

      {/* Cartão Informativo sobre Recuperação Ativa */}
      <div className="bg-[#EAF3EF] border border-[#C9DBD3] p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-[#125F55]">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Dica do Hábito:</strong> Nos dias sem treino de força, a Recuperação Ativa (5 a 8 minutos de mobilidade) mantém seu corpo flexível e a rotina viva sem cansar os músculos.
        </p>
      </div>

      {/* Lista dos 7 Dias da Semana */}
      <div className="space-y-2.5">
        {calendar.map((day) => {
          const cfg = activityBadges[day.activityType];
          const Icon = cfg.icon;

          return (
            <div
              key={day.id}
              className={`p-4 rounded-2xl border transition-all ${
                day.isCompleted
                  ? 'bg-white border-[#246747]/40 shadow-xs'
                  : 'bg-white border-[#C9DBD3] hover:border-[#125F55]/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#152A29]">
                      {daysLabels[day.dayOfWeek]}
                      {day.dateStr && (
                        <span className="text-[11px] font-normal text-[#5B7170] ml-1.5">
                          ({formatDateLabel(day.dateStr)})
                        </span>
                      )}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#152A29]">
                    {day.planTitle || cfg.label}
                  </h4>
                </div>

                {/* Botão de Marcar como Feito (somente para treinos e recuperação ativa) */}
                {day.activityType !== 'rest' && day.activityType !== 'unassigned' ? (
                  <button
                    onClick={() => toggleCalendarDayCompleted(day.id)}
                    className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                      day.isCompleted
                        ? 'text-[#246747] bg-emerald-50'
                        : 'text-[#5B7170] hover:text-[#125F55]'
                    }`}
                    title={day.isCompleted ? 'Desmarcar' : 'Marcar como concluído'}
                    aria-label={day.isCompleted ? 'Desmarcar' : 'Marcar como concluído'}
                  >
                    {day.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 fill-emerald-100" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                ) : (
                  <div className="p-1.5 text-[11px] font-medium text-[#5B7170] bg-[#F5F8F5] px-2 py-0.5 rounded-lg border border-[#C9DBD3]/50">
                    Descanso
                  </div>
                )}
              </div>

              {/* Ações do dia */}
              <div className="mt-3 pt-2.5 border-t border-[#C9DBD3]/40 flex items-center justify-between text-xs">
                <button
                  onClick={() => setEditingDay(day)}
                  className="text-[#5B7170] hover:text-[#125F55] font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ajustar atividade</span>
                </button>

                {day.activityType === 'strength' && day.planId && (
                  <button
                    onClick={() => onStartPlanById(day.planId!, day.id)}
                    className="text-[#125F55] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Iniciar treino</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE EDIÇÃO DE ATIVIDADE DO DIA */}
      {editingDay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-[#C9DBD3] text-[#152A29] space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-[#152A29]">
              Planejar {daysLabels[editingDay.dayOfWeek]}
            </h3>

            {/* Opções de Atividade */}
            <div className="space-y-2">
              {[
                { type: 'strength' as ActivityType, label: 'Treino de Força', desc: 'Exercícios para pernas, braços ou core' },
                { type: 'active_recovery' as ActivityType, label: 'Recuperação Ativa', desc: 'Mobilidade suave & alongamento (5-10 min)' },
                { type: 'walk' as ActivityType, label: 'Caminhada & Respiração', desc: 'Movimento ao ar livre ou esteira leve' },
                { type: 'rest' as ActivityType, label: 'Descanso Total', desc: 'Recuperação plena sem atividade' },
              ].map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleSaveDayEdit(opt.type, opt.type === 'strength' ? plans[0]?.id : undefined)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    editingDay.activityType === opt.type
                      ? 'border-[#125F55] bg-[#EAF3EF]'
                      : 'border-[#C9DBD3] bg-white hover:border-[#125F55]/60'
                  }`}
                >
                  <div className="font-bold text-xs text-[#152A29]">{opt.label}</div>
                  <div className="text-[11px] text-[#5B7170] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setEditingDay(null)}
              className="w-full py-2.5 rounded-xl border border-[#C9DBD3] text-xs font-semibold text-[#5B7170] hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
