
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, CalendarTask, CalendarAlerts } from './types';
import { Layout } from './components/Layout';
import { MonthView } from './components/MonthView';
import { GoogleService } from './services/googleService';
import { THAI_MONTHS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<{year: number, month: number, day: number} | null>(null);
  const [taskInput, setTaskInput] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [alerts, setAlerts] = useState<CalendarAlerts>({ oneDayBefore: false, twoHoursBefore: false });
  
  // Notification State
  const [activeNotification, setActiveNotification] = useState<{ message: string; title: string } | null>(null);
  const [triggeredAlerts] = useState(new Set<string>()); // Prevent duplicate alerts in same session

  // Initial Sync
  useEffect(() => {
    const savedUser = localStorage.getItem('calendar_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      loadTasks(parsed.email);
    }
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Background check for alerts
  useEffect(() => {
    const checkAlerts = () => {
      const now = new Date();
      tasks.forEach(task => {
        const taskDateTime = new Date(`${task.date}T${task.time || '00:00'}:00`);
        const diffMs = taskDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        const alertId = `${task.id}-${now.getHours()}-${now.getMinutes()}`;
        if (triggeredAlerts.has(alertId)) return;

        // 1. Precise time alert (When the time is reached)
        // Check if we are within 1 minute of the task time
        if (Math.abs(diffHours) < 0.008) { // Approx within 30 seconds
          triggerAlarm(`แจ้งเตือนกิจกรรม`, task.content);
          triggeredAlerts.add(alertId);
        }

        // 2. Scheduled pre-alerts
        if (task.alerts) {
          if (task.alerts.oneDayBefore && diffHours > 23.98 && diffHours < 24.02) {
            triggerAlarm(`แจ้งเตือนล่วงหน้า 1 วัน`, task.content);
            triggeredAlerts.add(alertId);
          }
          if (task.alerts.twoHoursBefore && diffHours > 1.98 && diffHours < 2.02) {
            triggerAlarm(`แจ้งเตือนล่วงหน้า 2 ชั่วโมง`, task.content);
            triggeredAlerts.add(alertId);
          }
        }
      });
    };

    const interval = setInterval(checkAlerts, 10000); // Check every 10 seconds for higher precision
    return () => clearInterval(interval);
  }, [tasks, triggeredAlerts]);

  const triggerAlarm = (title: string, message: string) => {
    // Vibration API
    if ('vibrate' in navigator) {
      // Sophisticated vibration pattern: Long - Pause - Double Short
      navigator.vibrate([800, 200, 300, 100, 300]);
    }
    
    // Show custom high-end notification popup
    setActiveNotification({ title, message });
    
    // Browser notification as fallback/extra
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }
  };

  const loadTasks = async (email: string) => {
    setIsLoading(true);
    try {
      const data = await GoogleService.fetchSheetData('Data!A:E');
      const userTasks: CalendarTask[] = data
        .filter((row: any) => row[0] === email)
        .map((row: any, idx: number) => ({
          id: `task-${idx}-${Date.now()}`,
          email: row[0],
          date: row[1],
          content: row[2],
          isCompleted: row[3] === 'TRUE',
          isHoliday: row[4] === 'TRUE',
          time: row[5] || '09:00',
          alerts: row[6] ? JSON.parse(row[6]) : { oneDayBefore: false, twoHoursBefore: false }
        }));
      setTasks(userTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const mockUser: UserProfile = {
      email: 'customer@example.com',
      name: 'ท่านเจ้าของตารางเวลา',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      role: UserRole.CUSTOMER,
      usageDaysLeft: 999
    };
    setUser(mockUser);
    localStorage.setItem('calendar_user', JSON.stringify(mockUser));
    loadTasks(mockUser.email);
  };

  const handleLogout = () => {
    setUser(null);
    setTasks([]);
    localStorage.removeItem('calendar_user');
  };

  const openTaskModal = (year: number, month: number, day: number) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    
    setSelectedDate({ year, month, day });
    setTaskInput('');
    setTaskTime(`${hh}:${mm}`);
    setAlerts({ oneDayBefore: false, twoHoursBefore: false });
    setShowModal(true);
  };

  const handleAddTask = async () => {
    if (!taskInput.trim() || !selectedDate || !user) return;

    const dateStr = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`;
    const dayOfWeek = new Date(selectedDate.year, selectedDate.month, selectedDate.day).getDay();
    
    const existingStatus = tasks.find(t => t.date === dateStr && t.content === '__STATUS_MARKER__');
    const isHoliday = existingStatus ? existingStatus.isHoliday : (dayOfWeek === 0 || dayOfWeek === 6);

    const newTask: CalendarTask = {
      id: `task-${Date.now()}`,
      email: user.email,
      date: dateStr,
      time: taskTime,
      content: taskInput,
      isCompleted: false,
      isHoliday: isHoliday,
      alerts: alerts
    };

    setTasks(prev => [...prev, newTask]);
    setShowModal(false);
    await GoogleService.saveCalendarTask(newTask);
  };

  const handleToggleStatus = async (dateStr: string, currentIsRed: boolean) => {
    if (!user) return;
    const updatedTasks = tasks.filter(t => !(t.date === dateStr && t.content === '__STATUS_MARKER__'));
    const finalTasks = updatedTasks.map(t => t.date === dateStr ? { ...t, isHoliday: !currentIsRed } : t);

    const statusMarker: CalendarTask = {
      id: `status-${dateStr}-${Date.now()}`,
      email: user.email,
      date: dateStr,
      content: '__STATUS_MARKER__',
      isCompleted: false,
      isHoliday: !currentIsRed
    };

    setTasks([...finalTasks, statusMarker]);
    await GoogleService.saveCalendarTask(statusMarker);
  };

  const handleDeleteTask = async (task: CalendarTask) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    await GoogleService.deleteCalendarTask(task.date, task.content, task.email);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent)] pointer-events-none"></div>
        <div className="bg-white/95 backdrop-blur-3xl p-12 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] max-w-sm w-full border border-white/20 text-center animate-in fade-in zoom-in duration-1000">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-600 to-teal-400 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-white shadow-2xl rotate-6 transform hover:rotate-0 transition-all duration-700">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">Prestige</h1>
          <p className="text-slate-500 mb-12 leading-relaxed font-bold uppercase tracking-[0.3em] text-[9px]">Exclusive Personal Cloud Calendar</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-slate-900 text-white font-black py-5 px-8 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 group"
          >
            <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="G" className="w-6 h-6 bg-white rounded-full p-0.5 group-hover:rotate-12 transition-transform" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  return (
    <Layout user={user} onLogout={handleLogout}>
      {/* Real-time Floating Alert Popup */}
      {activeNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 animate-in slide-in-from-top-20 duration-500">
          <div className="bg-slate-900 border border-emerald-500/30 text-white p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center gap-5 backdrop-blur-2xl">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
            <div className="flex-1">
              <h4 className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mb-1">{activeNotification.title}</h4>
              <p className="font-bold text-lg leading-tight">{activeNotification.message}</p>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pb-32 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-16 mt-8 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-8 border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            Private Cloud Enabled
          </div>
          <h2 className="text-6xl font-black text-slate-900 tracking-tighter sm:text-7xl mb-6">Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 italic">Schedule</span></h2>
          <p className="text-slate-400 max-w-lg font-bold leading-relaxed uppercase tracking-widest text-[10px]">High-End Task Management & Real-time Alarm Sync</p>
        </div>

        <div className="flex flex-col space-y-20">
          <section className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <MonthView 
              month={currentMonth} 
              year={currentYear} 
              tasks={tasks}
              size="large"
              onDateClick={openTaskModal}
              onToggleStatus={handleToggleStatus}
              onDeleteTask={handleDeleteTask}
            />
          </section>

          <div className="flex flex-wrap gap-10 justify-center">
            {Array.from({ length: 11 }).map((_, i) => {
              const monthIndex = i + 1;
              const displayMonth = (currentMonth + monthIndex) % 12;
              const displayYear = currentYear + Math.floor((currentMonth + monthIndex) / 12);
              
              return (
                <MonthView 
                  key={`${displayYear}-${displayMonth}`}
                  month={displayMonth} 
                  year={displayYear} 
                  tasks={tasks}
                  size="small"
                  onDateClick={openTaskModal}
                  onToggleStatus={handleToggleStatus}
                  onDeleteTask={handleDeleteTask}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Luxury Task Modal with Alarm Settings */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-700" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] w-full max-w-md border border-slate-100 relative z-10 animate-in zoom-in slide-in-from-bottom-40 duration-500 overflow-hidden">
            <div className="bg-slate-900 p-12 text-white relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(16,185,129,0.25),transparent)]"></div>
              <h3 className="text-4xl font-black mb-2 tracking-tighter">New Event</h3>
              <p className="text-emerald-400 font-black tracking-[0.3em] uppercase text-[9px] opacity-80">วันที่ {selectedDate.day} {THAI_MONTHS[selectedDate.month]} {selectedDate.year + 543}</p>
            </div>
            
            <div className="p-12 space-y-10">
              <div className="group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-focus-within:text-emerald-600 transition-colors">Description</label>
                <textarea 
                  autoFocus
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="รายละเอียดตารางงาน..."
                  className="w-full border-b-2 border-slate-100 py-4 focus:border-emerald-500 outline-none transition-all resize-none h-28 text-slate-800 font-bold leading-relaxed placeholder:text-slate-200 text-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-focus-within:text-emerald-600 transition-colors">Set Time</label>
                  <input 
                    type="time" 
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full border-b-2 border-slate-100 py-4 focus:border-emerald-500 outline-none font-black text-slate-800 transition-all text-xl"
                  />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Alarm Settings</label>
                   <div className="space-y-5">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">24H Before</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={alerts.oneDayBefore}
                            onChange={() => setAlerts(p => ({...p, oneDayBefore: !p.oneDayBefore}))}
                          />
                          <div className="w-12 h-6 bg-slate-100 rounded-full transition-all duration-300 peer-checked:bg-emerald-500"></div>
                          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-6 shadow-sm"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">2H Before</span>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={alerts.twoHoursBefore}
                            onChange={() => setAlerts(p => ({...p, twoHoursBefore: !p.twoHoursBefore}))}
                          />
                          <div className="w-12 h-6 bg-slate-100 rounded-full transition-all duration-300 peer-checked:bg-emerald-500"></div>
                          <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-6 shadow-sm"></div>
                        </div>
                      </label>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="p-12 pt-0 flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => setShowModal(false)}
                className="order-2 sm:order-1 flex-1 px-8 py-5 border-2 border-slate-50 rounded-[2rem] text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-95"
              >
                Discard
              </button>
              <button 
                onClick={handleAddTask}
                disabled={!taskInput.trim()}
                className="order-1 sm:order-2 flex-[2] px-8 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-200 active:scale-95 disabled:opacity-30 disabled:shadow-none"
              >
                Encrypt & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="bg-white p-16 rounded-[5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center gap-12 animate-in zoom-in duration-500 border border-white/20">
              <div className="relative">
                <div className="w-32 h-32 border-[10px] border-emerald-50 rounded-full"></div>
                <div className="w-32 h-32 border-[10px] border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="font-black text-slate-900 tracking-tighter text-2xl mb-2 italic">SECURE SYNC</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Linking with Prestige Database</p>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
