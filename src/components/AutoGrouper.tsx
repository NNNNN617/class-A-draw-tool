import React, { useState, useEffect } from 'react';
import { Student, GroupSettings, GroupItem } from '../types';
import { COLOR_PALETTES, GROUP_NAME_PRESETS } from '../utils/presets';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Users, Shuffle, Crown, Copy, Check, 
  Settings, Maximize2, Minimize2, ArrowRightLeft,
  Sparkles, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AutoGrouperProps {
  students: Student[];
}

export const AutoGrouper: React.FC<AutoGrouperProps> = ({ students }) => {
  const activeStudents = students.filter(s => !s.isAbsent);

  const [settings, setSettings] = useState<GroupSettings>({
    mode: 'byGroupSize',
    groupSize: 4,
    groupCount: 4,
    balanceRemainder: true,
    namingStyle: 'animal',
  });

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Helper to calculate resulting group count and distribution
  const calculateDistribution = () => {
    const total = activeStudents.length;
    if (total === 0) return { groupCount: 0, previewText: '無應到學生' };

    if (settings.mode === 'byGroupSize') {
      const size = Math.max(1, settings.groupSize);
      if (settings.balanceRemainder) {
        // Distribute remainder evenly
        const calculatedGroupCount = Math.max(1, Math.round(total / size));
        const baseSize = Math.floor(total / calculatedGroupCount);
        const remainder = total % calculatedGroupCount;
        return {
          groupCount: calculatedGroupCount,
          previewText: remainder === 0
            ? `共 ${calculatedGroupCount} 組，每組剛好 ${baseSize} 人`
            : `共 ${calculatedGroupCount} 組（其中 ${remainder} 組 ${baseSize + 1} 人，${calculatedGroupCount - remainder} 組 ${baseSize} 人）`,
        };
      } else {
        const calculatedGroupCount = Math.ceil(total / size);
        const remainder = total % size;
        return {
          groupCount: calculatedGroupCount,
          previewText: remainder === 0
            ? `共 ${calculatedGroupCount} 組，每組 ${size} 人`
            : `共 ${calculatedGroupCount} 組（前 ${calculatedGroupCount - 1} 組 ${size} 人，最後 1 組 ${remainder} 人）`,
        };
      }
    } else {
      const count = Math.max(1, Math.min(settings.groupCount, total));
      const baseSize = Math.floor(total / count);
      const remainder = total % count;
      return {
        groupCount: count,
        previewText: remainder === 0
          ? `共 ${count} 組，每組 ${baseSize} 人`
          : `共 ${count} 組（其中 ${remainder} 組 ${baseSize + 1} 人，${count - remainder} 組 ${baseSize} 人）`,
      };
    }
  };

  // Perform grouping logic
  const handleGenerateGroups = () => {
    if (activeStudents.length === 0) return;

    soundManager.playCardShuffle();
    setIsShuffling(true);

    // Shuffle students array using Fisher-Yates
    const shuffled = [...activeStudents];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const { groupCount } = calculateDistribution();
    const actualGroupCount = Math.max(1, groupCount);

    const nameList = GROUP_NAME_PRESETS[settings.namingStyle] || GROUP_NAME_PRESETS.animal;

    const newGroups: GroupItem[] = Array.from({ length: actualGroupCount }, (_, i) => {
      const palette = COLOR_PALETTES[i % COLOR_PALETTES.length];
      const customName = nameList[i] || `第 ${i + 1} 組`;
      return {
        id: `group-${i + 1}`,
        name: customName,
        badge: `G${i + 1}`,
        colorTheme: palette,
        members: [],
      };
    });

    // Distribute members into groups
    shuffled.forEach((student, idx) => {
      const targetGroupIdx = idx % actualGroupCount;
      newGroups[targetGroupIdx].members.push(student);
    });

    setTimeout(() => {
      setGroups(newGroups);
      setIsShuffling(false);
      soundManager.playTick(800, 0.08);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }, 450);
  };

  // Initial auto group on mount or roster change
  useEffect(() => {
    if (groups.length === 0 && activeStudents.length > 0) {
      handleGenerateGroups();
    }
  }, [activeStudents.length]);

  // Pick random leader for each group
  const handleAssignLeaders = () => {
    soundManager.playClick();
    setGroups(prev =>
      prev.map(group => {
        if (group.members.length === 0) return group;
        const randomMember = group.members[Math.floor(Math.random() * group.members.length)];
        return {
          ...group,
          leaderId: randomMember.id,
        };
      })
    );
  };

  // Move a member to another group (manual adjustment)
  const handleMoveMember = (studentId: string, fromGroupId: string, toGroupId: string) => {
    if (fromGroupId === toGroupId) return;
    soundManager.playClick();

    setGroups(prev => {
      let movedStudent: Student | null = null;
      const updated = prev.map(group => {
        if (group.id === fromGroupId) {
          const found = group.members.find(m => m.id === studentId);
          if (found) movedStudent = found;
          return {
            ...group,
            members: group.members.filter(m => m.id !== studentId),
            leaderId: group.leaderId === studentId ? undefined : group.leaderId,
          };
        }
        return group;
      });

      if (!movedStudent) return prev;

      return updated.map(group => {
        if (group.id === toGroupId && movedStudent) {
          return {
            ...group,
            members: [...group.members, movedStudent],
          };
        }
        return group;
      });
    });
  };

  // Set specific member as leader
  const handleSetLeader = (groupId: string, memberId: string) => {
    soundManager.playClick();
    setGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? { ...group, leaderId: group.leaderId === memberId ? undefined : memberId }
          : group
      )
    );
  };

  // Copy formatted group result to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;
    soundManager.playClick();

    const text = groups
      .map(group => {
        const memberNames = group.members
          .map(m => (m.id === group.leaderId ? `👑 ${m.name}(組長)` : m.name))
          .join('、');
        return `【${group.name}】(${group.members.length}人)\n${memberNames}\n`;
      })
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { previewText } = calculateDistribution();

  return (
    <div
      className={`space-y-6 ${
        isProjectorMode ? 'fixed inset-0 z-50 bg-slate-900 p-6 overflow-y-auto' : ''
      }`}
      id="auto-grouper-container"
    >
      {/* Configuration Header Card */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          isProjectorMode
            ? 'bg-slate-800/95 border-slate-700 text-white'
            : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
                自動分組設定
              </h2>
              <p className={`text-xs ${isProjectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                目前參與分組人數：<strong className="text-blue-500 font-bold">{activeStudents.length}</strong> 人
                <span className="ml-2 font-medium">（{previewText}）</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-projector-mode"
              type="button"
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isProjectorMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isProjectorMode ? '退出投影模式' : '大螢幕投影模式'}</span>
            </button>
          </div>
        </div>

        {/* Grouping Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 items-end">
          {/* Group Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              分組方式
            </label>
            <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
              <button
                id="btn-mode-by-size"
                type="button"
                onClick={() => setSettings({ ...settings, mode: 'byGroupSize' })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  settings.mode === 'byGroupSize'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                每組幾人
              </button>
              <button
                id="btn-mode-by-count"
                type="button"
                onClick={() => setSettings({ ...settings, mode: 'byGroupCount' })}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  settings.mode === 'byGroupCount'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                分成幾組
              </button>
            </div>
          </div>

          {/* Size or Count Value Control */}
          {settings.mode === 'byGroupSize' ? (
            <div>
              <label htmlFor="input-group-size" className="block text-xs font-semibold text-slate-500 mb-1.5">
                每組人數（人/組）
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-group-size"
                  type="number"
                  min={2}
                  max={Math.max(2, activeStudents.length)}
                  value={settings.groupSize}
                  onChange={e =>
                    setSettings({ ...settings, groupSize: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                />
                <div className="flex gap-1">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSettings({ ...settings, groupSize: num })}
                      className={`px-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        settings.groupSize === num
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="input-group-count" className="block text-xs font-semibold text-slate-500 mb-1.5">
                預計組數（總共分幾組）
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-group-count"
                  type="number"
                  min={2}
                  max={Math.max(2, activeStudents.length)}
                  value={settings.groupCount}
                  onChange={e =>
                    setSettings({ ...settings, groupCount: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                />
                <div className="flex gap-1">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSettings({ ...settings, groupCount: num })}
                      className={`px-2 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        settings.groupCount === num
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Naming Style */}
          <div>
            <label htmlFor="select-naming-style" className="block text-xs font-semibold text-slate-500 mb-1.5">
              隊名風格
            </label>
            <select
              id="select-naming-style"
              value={settings.namingStyle}
              onChange={e =>
                setSettings({ ...settings, namingStyle: e.target.value as GroupSettings['namingStyle'] })
              }
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
            >
              <option value="animal">神獸隊伍 🦅🐯🐉</option>
              <option value="element">元素戰隊 🔥💧⚡</option>
              <option value="gemstone">寶石之光 💎🔷🔮</option>
              <option value="number">簡約數字 (第 1 組...)</option>
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              id="btn-trigger-grouping"
              type="button"
              disabled={isShuffling || activeStudents.length === 0}
              onClick={handleGenerateGroups}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              {isShuffling ? '打散分組中...' : '重新隨機分組'}
            </button>
          </div>
        </div>
      </div>

      {/* Visualized Results Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
            分組結果展示
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
            共 {groups.length} 組
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-assign-leaders"
            type="button"
            onClick={handleAssignLeaders}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            一鍵選出組長
          </button>
          <button
            id="btn-copy-groups"
            type="button"
            onClick={handleCopyGroups}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                已複製分組名單！
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                複製分組名單
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Group Cards Grid */}
      <AnimatePresence mode="wait">
        {isShuffling ? (
          <motion.div
            key="shuffling-placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20 bg-white/70 rounded-3xl border border-slate-200"
          >
            <Sparkles className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800">正在洗牌分配組員...</p>
          </motion.div>
        ) : (
          <motion.div
            key="groups-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {groups.map((group, groupIndex) => (
              <div
                key={group.id}
                id={`group-card-${group.id}`}
                className={`flex flex-col rounded-2xl border-2 transition-all overflow-hidden ${
                  group.colorTheme.border
                } ${isProjectorMode ? 'bg-slate-800 shadow-md' : 'bg-white shadow-xs hover:shadow-md'}`}
              >
                {/* Group Card Header */}
                <div
                  className={`px-4 py-3 text-white flex items-center justify-between ${group.colorTheme.headerBg}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-bold shrink-0">
                      {groupIndex + 1}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base truncate">{group.name}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/20 text-white/90">
                    {group.members.length} 人
                  </span>
                </div>

                {/* Member List */}
                <div className="p-3.5 space-y-2 flex-1">
                  {group.members.map((member, mIdx) => {
                    const isLeader = group.leaderId === member.id;
                    return (
                      <div
                        key={member.id}
                        id={`member-item-${member.id}`}
                        className={`group flex items-center justify-between p-2 rounded-xl border transition-all ${
                          isLeader
                            ? 'bg-amber-50/90 border-amber-200 text-amber-900 shadow-2xs font-semibold'
                            : isProjectorMode
                            ? 'bg-slate-700/60 border-slate-600 text-slate-200'
                            : 'bg-slate-50/80 border-slate-100 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-mono opacity-70 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 shrink-0">
                            {member.studentNo || String(mIdx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm font-semibold truncate">{member.name}</span>
                          {isLeader && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                              <Crown className="w-2.5 h-2.5 text-amber-700" />
                              組長
                            </span>
                          )}
                        </div>

                        {/* Adjust / Move member controls */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Crown Toggle */}
                          <button
                            type="button"
                            onClick={() => handleSetLeader(group.id, member.id)}
                            title={isLeader ? '取消組長' : '設為組長'}
                            className="p-1 rounded-md text-amber-600 hover:bg-amber-100 cursor-pointer"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick move dropdown */}
                          <select
                            aria-label="換組"
                            value={group.id}
                            onChange={e => handleMoveMember(member.id, group.id, e.target.value)}
                            className="text-[10px] bg-white border border-slate-200 text-slate-600 rounded px-1 py-0.5 cursor-pointer"
                          >
                            {groups.map((g, gIdx) => (
                              <option key={g.id} value={g.id}>
                                移至第 {gIdx + 1} 組
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {group.members.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">尚無組員</div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
