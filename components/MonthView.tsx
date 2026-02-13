
import React from 'react';
import { THAI_DAYS, THAI_MONTHS } from '../constants';
import { CalendarTask } from '../types';

interface MonthViewProps {
  month: number;
  year: number;
  tasks: CalendarTask[];
  size?: 'large' | 'medium' | 'small';
  onDateClick: (year: number, month: number, day: number) => void;
  onToggleStatus: (dateStr: string, currentStatus: boolean) => void;
  onDeleteTask: (task: CalendarTask) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ 
  month, 
  year, 
  tasks, 
  size = 'small',
  onDateClick,
  onToggleStatus,
  onDeleteTask
}) => {
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const firstDay = (new Date(year, month, 1).getDay());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthTasks = tasks.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthTasks.filter(t => t.date === dateStr);
  };

  const isWeekend = (day: number) => {
    const dayOfWeek = new Date(year, month, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isDayRed = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = getTasksForDay(day);
    const statusTask = dayTasks.find(t => t.content === '__STATUS_MARKER__');
    if (statusTask) return statusTask.isHoliday;
    return isWeekend(day);
  };

  const isToday = (day: number) => {
    return day === todayDay && month === todayMonth && year === todayYear;
  };

  const containerClass = size === 'large' 
    ? 'w-full max-w-5xl mx-auto mb-12' 
    : 'w-full sm:w-[48%] lg:w-[31%] xl:w-[23%] mb-8';

  return (
    <div className={`${containerClass} bg-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.08)] border border-slate-50 overflow-hidden flex flex-col transition-all duration-700 hover:shadow-[0_40px_90px_rgba(0,0,0,0.12)] hover:-translate-y-3 group/month relative`}>
      <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover/month:bg-emerald-500/25 transition-all duration-1000"></div>
        <h2 className="text-3xl font-black tracking-tighter drop-shadow-lg uppercase italic">{THAI_MONTHS[month]} <span className="text-emerald-400 not-italic ml-2">{year + 543}</span></h2>
      </div>
      
      <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
        {THAI_DAYS.map(day => (
          <div key={day} className={`py-5 text-center text-[10px] font-black uppercase tracking-[0.25em] ${day === 'อา.' || day === 'ส.' ? 'text-rose-400' : 'text-slate-300'}`}>
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 bg-slate-100/20 gap-[1px] flex-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white/30 min-h-[90px] sm:min-h-[110px]"></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = getTasksForDay(day).filter(t => t.content !== '__STATUS_MARKER__');
          const redStatus = isDayRed(day);
          const currentDayIsToday = isToday(day);
          
          return (
            <div 
              key={day} 
              onClick={() => onDateClick(year, month, day)}
              className={`
                bg-white min-h-[110px] sm:min-h-[130px] p-4 flex flex-col relative cursor-pointer transition-all duration-500 group/day
                hover:bg-slate-50/80
                ${redStatus ? 'bg-rose-50/10' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`
                  text-lg font-black transition-all duration-300 relative z-10
                  ${currentDayIsToday ? 'text-white' : redStatus ? 'text-rose-500' : 'text-slate-900'}
                  group-hover/day:scale-125
                `}>
                  {day}
                  {currentDayIsToday && (
                    <div className="absolute -inset-2 bg-emerald-600 rounded-full -z-10 shadow-lg shadow-emerald-200"></div>
                  )}
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(dateStr, redStatus);
                  }}
                  className={`
                    w-6 h-6 rounded-full border-[4px] transition-all duration-700 shadow-md
                    ${redStatus 
                      ? 'bg-rose-500 border-rose-100 ring-4 ring-rose-500/10' 
                      : 'bg-emerald-500 border-emerald-100 ring-4 ring-emerald-500/10'}
                    hover:scale-125 active:scale-90
                  `}
                />
              </div>
              
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[70px] sm:max-h-[90px] no-scrollbar">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`
                      text-[9px] leading-tight px-3 py-2 rounded-2xl flex flex-col gap-1.5 group/task
                      backdrop-blur-xl shadow-sm border border-black/5 transition-all hover:translate-x-1
                      ${redStatus ? 'bg-rose-100/50 text-rose-900' : 'bg-emerald-100/50 text-emerald-900'}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate flex-1 font-black uppercase tracking-wider">{task.content}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                        className="ml-2 opacity-0 group-hover/task:opacity-100 text-slate-300 hover:text-rose-600 transition-all p-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between opacity-60">
                      <span className="text-[7px] font-black">{task.time}</span>
                      {(task.alerts?.oneDayBefore || task.alerts?.twoHoursBefore) && (
                        <svg className="w-2.5 h-2.5 text-emerald-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
