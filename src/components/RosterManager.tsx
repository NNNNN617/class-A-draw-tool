import React, { useState } from 'react';
import { Student } from '../types';
import { DEFAULT_CLASS_30, THEMED_ROSTER_HEROES, CLASS_ROSTER_64, parseRosterInput, RAW_ROSTER_64 } from '../utils/presets';
import { 
  Users, UserPlus, Trash2, RotateCcw, 
  Upload, UserCheck, UserX, AlertCircle, Check, Sparkles
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onClose?: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
}) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [batchText, setBatchText] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Stats
  const totalCount = students.length;
  const presentCount = students.filter(s => !s.isAbsent).length;
  const absentCount = students.filter(s => s.isAbsent).length;

  // Add single student
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStudentName.trim();
    if (!trimmed) return;

    soundManager.playClick();
    const newStudent: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      studentNo: String(students.length + 1).padStart(2, '0'),
      isAbsent: false,
      drawnCount: 0,
    };
    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
  };

  // Toggle absent
  const handleToggleAbsent = (id: string) => {
    soundManager.playClick();
    onUpdateStudents(
      students.map(s => (s.id === id ? { ...s, isAbsent: !s.isAbsent } : s))
    );
  };

  // Delete student
  const handleDelete = (id: string) => {
    soundManager.playClick();
    onUpdateStudents(students.filter(s => s.id !== id));
  };

  // Batch import
  const handleBatchImport = () => {
    if (!batchText.trim()) return;
    soundManager.playClick();
    const imported = parseRosterInput(batchText);
    if (imported.length === 0) return;

    onUpdateStudents(imported);
    setBatchText('');
    setShowBatchModal(false);
  };

  // Load preset
  const handleLoadPreset = (preset: Student[]) => {
    soundManager.playClick();
    onUpdateStudents(preset);
  };

  // Reset draw counts
  const handleResetDrawCounts = () => {
    soundManager.playClick();
    onUpdateStudents(students.map(s => ({ ...s, drawnCount: 0, lastDrawnAt: undefined })));
  };

  // Copy names to clipboard
  const handleCopyNames = () => {
    const text = students.map(s => `${s.studentNo ? s.studentNo + ' ' : ''}${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Filtered
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.studentNo && s.studentNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6" id="roster-manager-container">
      {/* Overview & Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">學生名冊管理</h2>
              <p className="text-xs text-slate-500">
                共 {totalCount} 名學生 ‧ <span className="text-emerald-600 font-medium">應到 {presentCount} 人</span>
                {absentCount > 0 && <span className="text-rose-500 font-medium ml-1">‧ 請假 {absentCount} 人</span>}
              </p>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-load-class-64"
              onClick={() => handleLoadPreset(CLASS_ROSTER_64)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              載入本班名冊 (64人)
            </button>
            <button
              id="btn-load-class-30"
              onClick={() => handleLoadPreset(DEFAULT_CLASS_30)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              預設 30 人
            </button>
            <button
              id="btn-load-heroes"
              onClick={() => handleLoadPreset(THEMED_ROSTER_HEROES)}
              className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
            >
              三國名將 20 人
            </button>
            <button
              id="btn-batch-import"
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              批次貼上名單
            </button>
            <button
              id="btn-reset-stats"
              onClick={handleResetDrawCounts}
              title="將所有學生被抽中的次數歸零"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              歸零抽中次數
            </button>
          </div>
        </div>

        {/* Add single & search bar */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <form onSubmit={handleAddStudent} className="flex gap-2">
            <input
              id="input-new-student-name"
              type="text"
              placeholder="新增學生姓名 (按 Enter 加入)..."
              value={newStudentName}
              onChange={e => setNewStudentName(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <button
              id="btn-add-single-student"
              type="submit"
              disabled={!newStudentName.trim()}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              加入
            </button>
          </form>

          <div className="flex gap-2">
            <input
              id="input-search-student"
              type="text"
              placeholder="搜尋姓名或座號..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <button
              id="btn-copy-roster"
              onClick={handleCopyNames}
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">已複製</span>
                </>
              ) : (
                '複製名單'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Student List Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-700">
            學生清單 ({filteredStudents.length}/{totalCount})
            <span className="text-xs text-slate-400 ml-2 font-normal">
              點擊「出缺席」可標註請假，請假者不會被抽出或加入分組
            </span>
          </div>
          {totalCount > 0 && (
            <button
              id="btn-clear-all-students"
              onClick={() => {
                if (window.confirm('確定要清空所有學生名冊嗎？')) {
                  onUpdateStudents([]);
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors cursor-pointer"
            >
              清空名單
            </button>
          )}
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">目前沒有相符的學生</p>
            <p className="text-xs text-slate-400 mt-1">您可以手動新增、載入預設名單，或點擊上方「批次貼上名單」</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {filteredStudents.map((student, idx) => (
              <div
                key={student.id}
                id={`student-card-${student.id}`}
                className={`relative group p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                  student.isAbsent
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-center shrink-0">
                    {student.studentNo || String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${student.isAbsent ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {student.name}
                    </p>
                    {student.drawnCount > 0 && (
                      <span className="inline-block text-[10px] text-blue-600 font-medium">
                        已抽中 {student.drawnCount} 次
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                  <button
                    id={`btn-toggle-absent-${student.id}`}
                    type="button"
                    onClick={() => handleToggleAbsent(student.id)}
                    title={student.isAbsent ? '改為出席' : '標記為請假/缺席'}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      student.isAbsent 
                        ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' 
                        : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {student.isAbsent ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    id={`btn-delete-student-${student.id}`}
                    type="button"
                    onClick={() => handleDelete(student.id)}
                    title="移除此學生"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">批次匯入學生名冊</h3>
              <button
                type="button"
                onClick={() => setBatchText(RAW_ROSTER_64)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                帶入 64 人清單
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              支援從 Excel、Word 或各類試算表直接貼上。支援每行「學號 姓名」（例如 <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">D1387525 蘇盷蓉</code>）或純姓名。
            </p>
            <textarea
              id="textarea-batch-names"
              rows={8}
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              placeholder="D1387525 蘇盷蓉&#10;D1420473 黃子芸&#10;D1420490 張季茹&#10;..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono leading-relaxed"
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                id="btn-cancel-batch"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                id="btn-confirm-batch"
                onClick={handleBatchImport}
                disabled={!batchText.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                確認匯入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
