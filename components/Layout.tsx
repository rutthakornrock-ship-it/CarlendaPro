
import React from 'react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-200 text-xl transform -rotate-3">
              C
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter hidden sm:block">CALENDAR <span className="text-emerald-600">PRO</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Cloud Edition</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-4 group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user.name}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{user.role}</p>
                </div>
                <div className="relative">
                  <img 
                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                    alt="Profile" 
                    className="w-11 h-11 rounded-2xl border-2 border-white shadow-xl group-hover:scale-105 transition-transform duration-300 object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Log out"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 sm:py-10">
        {children}
      </main>
      
      <footer className="bg-white border-t border-slate-100 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-slate-200 rounded-lg"></div>
            <span className="font-black text-slate-300 tracking-tighter">LUXURY CALENDAR</span>
          </div>
          <p className="text-slate-400 text-xs font-medium max-w-sm leading-relaxed">
            ระบบจัดการปฏิทินระดับพรีเมียม ซิงค์ข้อมูลอัตโนมัติผ่าน Google Sheets และ Google Drive เพื่อความปลอดภัยสูงสุดของข้อมูลคุณ
          </p>
          <div className="flex gap-4 mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path></svg>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Action Marker / Status bar padding */}
      <div className="h-16 block sm:hidden"></div>
    </div>
  );
};
