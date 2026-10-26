import React from 'react';
import { CalendarDay, WorkoutSession } from '../../types';
import { Check, Heart } from 'lucide-react';

interface WeekPathProps {
  calendar: CalendarDay[];
  sessions: WorkoutSession[];
  todayDayOfWeek: number;
  todayStr: string;
  onNavigateCalendar: () => void;
}

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const WeekPath: React.FC<WeekPathProps> = ({
  calendar,
  sessions,
  todayDayOfWeek,
  todayStr,
  onNavigateCalendar,
}) => {
  // Gera os 7 dias da semana atual
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - todayDayOfWeek);

  return (
    <div
      onClick={onNavigateCalendar}
      role="button"
      tabIndex={0}
      title="Ver calendário completo da semana"
      aria-label="Calendário semanal. Toque para ver detalhes."
      className="bg-white border border-[#E4DDD3] rounded-2xl p-3 shadow-2xs hover:border-[#1B4332]/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-1">
        {DAY_LABELS.map((label, dayIdx) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + dayIdx);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayNum = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${dayNum}`;

          const isToday = dayIdx === todayDayOfWeek;
          const daySchedule =
            calendar.find((c) => c.dateStr === dateStr) ||
            calendar.find((c) => c.dayOfWeek === dayIdx);

          const hasCompletedSession =
            daySchedule?.isCompleted ||
            sessions.some((s) => {
              if (s.date === dateStr) return true;
              if (s.completedAt) {
                const sDate = new Date(s.completedAt);
                const sDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
                return sDateStr === dateStr;
              }
              return false;
            });

          const isRest = daySchedule?.activityType === 'rest';

          return (
            <div
              key={dayIdx}
              className={`flex-1 flex flex-col items-center gap-1.5 py-1 rounded-xl transition-all ${
                isToday ? 'bg-[#E8EFE9]/80 font-bold' : ''
              }`}
            >
              <span
                className={`text-[10px] ${
                  isToday ? 'text-[#1B4332] font-black' : 'text-[#5D6E65]'
                }`}
              >
                {label}
              </span>

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-all ${
                  hasCompletedSession
                    ? 'bg-[#1B4332] text-white shadow-2xs'
                    : isToday
                    ? 'bg-white border-2 border-[#1B4332] text-[#1B4332]'
                    : isRest
                    ? 'bg-[#FDF3F0] border border-[#E07A5F]/40 text-[#E07A5F]'
                    : 'bg-[#F5F3EF] border border-[#E4DDD3] text-[#5D6E65]/60'
                }`}
              >
                {hasCompletedSession ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isRest ? (
                  <Heart className="w-3 h-3 fill-[#E07A5F]/30" />
                ) : (
                  <span className="text-[10px]">{d.getDate()}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
