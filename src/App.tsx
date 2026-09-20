import { useState, useEffect } from 'react';
import { Student, DrawSettings } from './types';
import { CLASS_ROSTER_64, DEFAULT_CLASS_30 } from './utils/presets';
import { Header, ActiveTab } from './components/Header';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouper } from './components/AutoGrouper';
import { RosterManager } from './components/RosterManager';
import { soundManager } from './utils/audio';

const STORAGE_KEYS = {
  STUDENTS: 'classroom_app_students_v3',
  DRAW_SETTINGS: 'classroom_app_draw_settings_v2',
};

export default function App() {
  // Load students from localStorage or fallback to 64-student imported roster
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return CLASS_ROSTER_64;
  });

  // Load draw settings
  const [drawSettings, setDrawSettings] = useState<DrawSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAW_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      allowRepeat: false, // 預設不重複抽取，老師可在畫面即時切換
      soundEnabled: true,
      duration: 3,
      revealCelebration: true,
    };
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('draw');

  // Sync students to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Sync drawSettings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAW_SETTINGS, JSON.stringify(drawSettings));
    } catch {
      // ignore
    }
    soundManager.setMuted(!drawSettings.soundEnabled);
  }, [drawSettings]);

  const handleToggleSound = () => {
    const next = !drawSettings.soundEnabled;
    soundManager.setMuted(!next);
    setDrawSettings(prev => ({ ...prev, soundEnabled: next }));
    if (next) soundManager.playClick();
  };

  const presentCount = students.filter(s => !s.isAbsent).length;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalStudents={students.length}
        presentStudents={presentCount}
        soundEnabled={drawSettings.soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'draw' && (
          <RandomPicker
            students={students}
            onUpdateStudents={setStudents}
            drawSettings={drawSettings}
            onUpdateSettings={setDrawSettings}
          />
        )}

        {activeTab === 'group' && <AutoGrouper students={students} />}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        課堂教學輔助工具 ‧ 支援隨機抽籤（動畫與音效）、重複抽取設定及自動視覺化分組
      </footer>
    </div>
  );
}
