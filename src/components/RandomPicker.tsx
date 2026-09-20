import React, { useState, useEffect, useRef } from 'react';
import { Student, DrawSettings, DrawHistoryItem } from '../types';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Sparkles, RotateCcw, Volume2, VolumeX, 
  History, CheckCircle2, User, 
  Settings2, Flame, Award, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RandomPickerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  drawSettings: DrawSettings;
  onUpdateSettings: (settings: DrawSettings) => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onUpdateStudents,
  drawSettings,
  onUpdateSettings,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplayStudent, setCurrentDisplayStudent] = useState<Student | null>(null);
  const [winner, setWinner] = useState<Student | null>(null);
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [drawnStudentIds, setDrawnStudentIds] = useState<Set<string>>(new Set());

  const animationFrameRef = useRef<number | null>(null);

  // Present/Active students
  const activeStudents = students.filter(s => !s.isAbsent);

  // Eligible pool depends on whether repeat is allowed
  const eligibleStudents = drawSettings.allowRepeat
    ? activeStudents
    : activeStudents.filter(s => !drawnStudentIds.has(s.id));

  // Reset drawn pool
  const handleResetPool = () => {
    soundManager.playClick();
    setDrawnStudentIds(new Set());
    setWinner(null);
  };

  // Reset history
  const handleClearHistory = () => {
    soundManager.playClick();
    setHistory([]);
  };

  // Toggle sound
  const handleToggleSound = () => {
    const next = !drawSettings.soundEnabled;
    soundManager.setMuted(!next);
    onUpdateSettings({ ...drawSettings, soundEnabled: next });
    if (next) soundManager.playTick(700);
  };

  // Toggle allowRepeat
  const handleToggleRepeat = (allow: boolean) => {
    soundManager.playClick();
    onUpdateSettings({ ...drawSettings, allowRepeat: allow });
  };

  // Start the Draw Animation
  const startDraw = () => {
    if (isDrawing || eligibleStudents.length === 0) return;

    setIsDrawing(true);
    setWinner(null);

    // Pick a winner randomly from eligible pool
    const selectedWinner = eligibleStudents[Math.floor(Math.random() * eligibleStudents.length)];

    const startTime = performance.now();
    const duration = drawSettings.duration * 1000;
    let lastTickTime = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Deceleration curve: easeOutCubic
      // Tick interval expands from 40ms to ~350ms as it decelerates
      const currentTickInterval = 35 + Math.pow(progress, 3) * 320;

      if (now - lastTickTime > currentTickInterval && progress < 0.98) {
        lastTickTime = now;

        // Pick random student to display on reel
        const randomCandidate = activeStudents[Math.floor(Math.random() * activeStudents.length)];
        setCurrentDisplayStudent(randomCandidate);

        // Sound feedback
        const pitch = 500 + (1 - progress) * 300;
        soundManager.playTick(pitch, 0.035);

        // Near end tension
        if (progress > 0.75 && progress < 0.95) {
          soundManager.playTensionPulse(progress);
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished! Reveal winner
        setCurrentDisplayStudent(selectedWinner);
        setWinner(selectedWinner);
        setIsDrawing(false);

        // Sound Fanfare
        soundManager.playFanfare();

        // Confetti Fireworks
        if (drawSettings.revealCelebration) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
          });
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
            });
          }, 250);
        }

        // Update drawn stats
        setDrawnStudentIds(prev => new Set(prev).add(selectedWinner.id));
        setHistory(prev => [
          {
            id: `hist-${Date.now()}`,
            studentId: selectedWinner.id,
            studentName: selectedWinner.name,
            timestamp: Date.now(),
          },
          ...prev,
        ]);

        // Update student drawn count
        onUpdateStudents(
          students.map(s =>
            s.id === selectedWinner.id
              ? { ...s, drawnCount: s.drawnCount + 1, lastDrawnAt: Date.now() }
              : s
          )
        );
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const isPoolExhausted = !drawSettings.allowRepeat && eligibleStudents.length === 0;

  return (
    <div className="space-y-6" id="random-picker-section">
      {/* Settings & Rules Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode Switch for Repeat */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              id="btn-mode-no-repeat"
              type="button"
              onClick={() => handleToggleRepeat(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !drawSettings.allowRepeat
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取（抽過即排除）
            </button>
            <button
              id="btn-mode-allow-repeat"
              type="button"
              onClick={() => handleToggleRepeat(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                drawSettings.allowRepeat
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              允許重複抽取
            </button>
          </div>

          <div className="hidden sm:block text-xs text-slate-500">
            {!drawSettings.allowRepeat ? (
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200/60">
                每位學生輪流抽中，不重複
              </span>
            ) : (
              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-medium border border-indigo-200/60">
                每次抽取全班機率均等
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          {/* Duration Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <Settings2 className="w-3.5 h-3.5 text-slate-400" />
            <span>速度：</span>
            <select
              id="select-draw-duration"
              value={drawSettings.duration}
              onChange={e => onUpdateSettings({ ...drawSettings, duration: Number(e.target.value) })}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value={1.5}>極速 (1.5s)</option>
              <option value={3}>經典 (3s)</option>
              <option value={4.5}>刺激懸念 (4.5s)</option>
            </select>
          </div>

          {/* Sound Mute Toggle */}
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={handleToggleSound}
            title={drawSettings.soundEnabled ? '關閉音效' : '開啟音效'}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              drawSettings.soundEnabled
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {drawSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{drawSettings.soundEnabled ? '音效開啟' : '靜音中'}</span>
          </button>

          {/* History Button */}
          <button
            id="btn-open-history"
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">抽取紀錄 ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Main Drawing Stage */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/70 rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center">
        {/* Pool Counter Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            候選池學生：<strong className="text-slate-900 font-bold">{eligibleStudents.length}</strong> / 應到 {activeStudents.length} 人
          </div>

          {!drawSettings.allowRepeat && drawnStudentIds.size > 0 && (
            <button
              id="btn-reset-pool"
              type="button"
              onClick={handleResetPool}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-colors border border-blue-200/70 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              重置抽取池 ({drawnStudentIds.size} 人已抽)
            </button>
          )}
        </div>

        {/* The Rolling Screen / Winner Display */}
        <div className="max-w-xl mx-auto my-4 sm:my-8">
          <div className="relative min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-md">
            {/* Background glowing rings */}
            <div className="absolute inset-0 bg-radial from-blue-50/50 via-transparent to-transparent pointer-events-none rounded-3xl" />

            <AnimatePresence mode="wait">
              {winner ? (
                /* Winner Reveal View */
                <motion.div
                  key="winner-view"
                  initial={{ scale: 0.8, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="flex flex-col items-center z-10 space-y-3"
                  id="winner-display-card"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-300 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    恭喜幸運抽中！
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight py-1">
                    {winner.name}
                  </h1>

                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
                    {winner.studentNo && (
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-mono font-semibold">
                        {/[a-zA-Z]/.test(winner.studentNo) || winner.studentNo.length > 4 ? '學號' : '座號'}：{winner.studentNo}
                      </span>
                    )}
                    <span>累計被抽中：{winner.drawnCount} 次</span>
                  </div>
                </motion.div>
              ) : isDrawing ? (
                /* In Progress Rolling View */
                <motion.div
                  key="rolling-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center z-10 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    抽籤進行中...
                  </div>

                  <motion.div
                    key={currentDisplayStudent?.name || 'rolling'}
                    initial={{ y: -20, opacity: 0.4 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.08 }}
                    className="text-4xl sm:text-6xl font-black text-blue-600 tracking-tight"
                  >
                    {currentDisplayStudent ? currentDisplayStudent.name : '準備中...'}
                  </motion.div>

                  <p className="text-xs text-slate-400 font-mono">
                    {currentDisplayStudent?.studentNo 
                      ? `${/[a-zA-Z]/.test(currentDisplayStudent.studentNo) || currentDisplayStudent.studentNo.length > 4 ? '學號' : '座號'}：${currentDisplayStudent.studentNo}` 
                      : ''}
                  </p>
                </motion.div>
              ) : isPoolExhausted ? (
                /* Pool Exhausted */
                <div className="flex flex-col items-center z-10 space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">全班學生均已抽取完畢！</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    當前開啟了「不重複抽取」模式，所有應到學生都已被抽中一次。您可以點擊下方按鈕重置抽籤池進行下一輪。
                  </p>
                  <button
                    id="btn-pool-exhausted-reset"
                    type="button"
                    onClick={handleResetPool}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新裝滿抽籤池
                  </button>
                </div>
              ) : (
                /* Idle Stage View */
                <div className="flex flex-col items-center z-10 space-y-2 py-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs mb-1">
                    <Sparkles className="w-7 h-7 animate-bounce" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                    點擊按鈕，隨機抽出一名學生
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    目前候選池共有 <span className="font-bold text-blue-600">{eligibleStudents.length}</span> 位學生待抽
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="btn-start-draw"
            type="button"
            disabled={isDrawing || eligibleStudents.length === 0}
            onClick={startDraw}
            className={`w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              isDrawing
                ? 'bg-slate-400 cursor-not-allowed opacity-80'
                : eligibleStudents.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 hover:shadow-lg shadow-blue-500/20'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {isDrawing ? '抽籤中...' : winner ? '再抽下一位！' : '開始隨機抽籤'}
          </button>

          {winner && !isDrawing && (
            <button
              id="btn-clear-winner-display"
              type="button"
              onClick={() => setWinner(null)}
              className="px-4 py-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              收起結果卡片
            </button>
          )}
        </div>
      </div>

      {/* Candidate Pool Status Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              學生抽籤狀態池
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {drawSettings.allowRepeat
                ? '當前允許重複：全體學生皆可隨機抽中'
                : `不重複抽取：已抽出 ${drawnStudentIds.size} 人，剩餘 ${eligibleStudents.length} 人`}
            </p>
          </div>

          {!drawSettings.allowRepeat && drawnStudentIds.size > 0 && (
            <button
              id="btn-reset-pool-secondary"
              onClick={handleResetPool}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              重設候選池
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
          {activeStudents.map(student => {
            const isDrawn = drawnStudentIds.has(student.id);
            const isCurrentWinner = winner?.id === student.id;

            return (
              <div
                key={student.id}
                id={`pool-student-${student.id}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  isCurrentWinner
                    ? 'bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-xs scale-105'
                    : isDrawn && !drawSettings.allowRepeat
                    ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-400">{student.studentNo}</span>
                <span>{student.name}</span>
                {student.drawnCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-600">
                    {student.drawnCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Draw History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">抽籤紀錄歷程</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">共 {history.length} 次</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  尚無抽籤紀錄
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-5 text-center">#{history.length - idx}</span>
                      <span className="font-bold text-slate-800 text-sm">{item.studentName}</span>
                    </div>
                    <span className="text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-100">
              {history.length > 0 && (
                <button
                  id="btn-clear-history"
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                >
                  清空紀錄
                </button>
              )}
              <button
                id="btn-close-history"
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="ml-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
