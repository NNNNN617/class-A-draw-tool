import React from 'react';
import { Sparkles, Users, UserCheck, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { soundManager } from '../utils/audio';

export type ActiveTab = 'draw' | 'group' | 'roster';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  totalStudents: number;
  presentStudents: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  totalStudents,
  presentStudents,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                課堂隨機抽籤與分組
                <span className="hidden md:inline-block text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  教學輔助工具
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                動畫音效隨機抽籤 ‧ 視覺化多組別自動分組
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/70" aria-label="分頁導航">
            <button
              id="tab-btn-draw"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSelectTab('draw');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>隨機抽籤</span>
            </button>

            <button
              id="tab-btn-group"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSelectTab('group');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'group'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>自動分組</span>
            </button>

            <button
              id="tab-btn-roster"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onSelectTab('roster');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">名單管理</span>
              <span className="sm:hidden">名單</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-mono">
                {totalStudents}
              </span>
            </button>
          </nav>

          {/* Quick Roster Status & Sound */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>應到：<strong className="text-slate-800">{presentStudents}</strong>/{totalStudents} 人</span>
            </div>

            <button
              id="btn-header-toggle-sound"
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? '音效開啟中（點擊靜音）' : '已靜音（點擊開啟）'}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
