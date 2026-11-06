import React from 'react';
import { CalendarDay, WorkoutSession } from '../../types';
import { Check, Heart } from 'lucide-react';
import { MONDAY_FIRST_DAYS, getWeekDatesMondayFirst } from '../../lib/dateUtils';

interface WeekPathProps {
  calendar: CalendarDay[];
  sessions: WorkoutSession[];
  todayDayOfWeek: number;
  todayStr: string;
  onNavigateCalendar: () => void;
}

const MONDAY_LABELS_1LETTER = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export const WeekPath: React.FC<WeekPathProps> = ({
  calendar,
  sessions,
  todayDayOfWeek,
  todayStr,
  onNavigateCalendar,
}) => {
  const weekDates = getWeekDatesMondayFirst();

  return (
    <div
      onClick={onNavigateCalendar}
      role="button"
      tabIndex={0}
      title="Ver calendário completo da semana"
      aria-label="Calendário semanal de Segunda a Domingo. Toque para ver detalhes."
      className="bg-white border border-[#E4DDD3] rounded-2xl p-2 sm:p-3 shadow-2xs hover:border-[#1B4332]/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-1">
        {MONDAY_FIRST_DAYS.map((dow, idx) => {
          const dateStr = weekDates[dow];
          const isToday = dow === todayDayOfWeek;
          const dayNum = dateStr.split('-')[2];

          const daySchedule =
            calendar.find((c) => c.dateStr === dateStr) ||
            calendar.find((c) => c.dayOfWeek === dow);

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
              key={dow}
              className={`flex-1 flex flex-col items-center gap-1 py-0.5 sm:py-1 rounded-xl transition-all ${
                isToday ? 'bg-[#E8EFE9]/80 font-bold' : ''
              }`}
            >
              <span
                className={`text-[10px] ${
                  isToday ? 'text-[#1B4332] font-black' : 'text-[#5D6E65]'
                }`}
              >
                {MONDAY_LABELS_1LETTER[idx]}
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
                  <span className="text-[10px]">{Number(dayNum)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
