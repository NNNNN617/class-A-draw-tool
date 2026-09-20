export interface Student {
  id: string;
  name: string;
  studentNo?: string;
  isAbsent?: boolean;
  drawnCount: number;
  lastDrawnAt?: number;
}

export interface DrawSettings {
  allowRepeat: boolean; // 是否允許重複抽取
  soundEnabled: boolean;
  duration: number; // 抽籤動畫秒數，例如 3 秒或 4 秒
  revealCelebration: boolean; // 是否施放彩帶慶祝
}

export type GroupMode = 'byGroupSize' | 'byGroupCount';

export interface GroupSettings {
  mode: GroupMode;
  groupSize: number; // 每組幾人
  groupCount: number; // 分成幾組
  balanceRemainder: boolean; // 多出的人數平均分配到各組
  namingStyle: 'number' | 'animal' | 'gemstone' | 'element'; // 視覺化趣味組名
}

export interface GroupItem {
  id: string;
  name: string;
  badge: string;
  colorTheme: {
    bg: string;
    border: string;
    headerBg: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
  };
  members: Student[];
  leaderId?: string;
}

export interface DrawHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: number;
}
