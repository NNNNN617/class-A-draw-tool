import { Student } from '../types';

export const RAW_ROSTER_64 = `D1387525 蘇盷蓉
D1420473 黃子芸
D1420490 張季茹
D1420515 莫筑晴
D1420532 陳慕希
D1420562 蘇芯怡
D1420589 黃星瑜
D1420603 李舒涵
D1420620 張漢羽
D1429682 松尾和磨
D1430017 與那嶺藍
D1430123 菅原倖夏
D1445977 張儷馨
D1445994 吳淳琳
D1446018 許嫚妘
D1446035 吳佳芯
D1446065 康庭瑀
D1446082 陳以芊
D1446124 林珈妤
D1446171 鄭芷盈
D1446230 蔡芷妍
D1446260 曾苡瑄
D1446287 張祐寧
D1446301 李宜蓁
D1446328 李妤肜
D1446375 張佳騏
D1446392 盧紋庭
D1446418 黃佳芊
D1446465 黃思睿
D1446482 葉又慈
D1446506 李佳臻
D1446523 張庭瑜
D1446553 林品妤
D1446570 梁睿桐
D1446597 林瑀宸
D1446612 袁育祥
D1446639 翁湘羚
D1446669 曾宇婕
D1446686 陳韻茹
D1446701 張以姍
D1446728 葉柏澤
D1446758 程品瑜
D1446775 陳宣錞
D1446792 陳宥蓁
D1465899 林泑
D1469111 佐藤由美
D1477422 吳珊
D1481787 黃嘉萍
D1483922 張翌恩
D1483936 紀馨喬
D1483952 黃郡玟
D1483966 陳薇予
D1483979 尤瑞德
D1483983 蔡依臻
D1483996 楊昕恩
D1490417 呂學禹
D1490434 楊子靚
D1496708 阮娥媚
D1496814 妮塔
D1575803 莊侑軒
D1576720 洪筠淇
D1577157 林昀青
D1582257 顏尹柔
D1597732 韓綺璇`;

export function parseRosterInput(input: string): Student[] {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result: Student[] = [];

  lines.forEach((line, index) => {
    // Check if comma-separated on a single line
    if (line.includes(',') || line.includes('，') || line.includes('、')) {
      const parts = line.split(/[,，、]+/).map(p => p.trim()).filter(Boolean);
      parts.forEach((p, pIdx) => {
        result.push({
          id: `std-p-${Date.now()}-${result.length + 1}-${Math.random().toString(36).substring(2, 5)}`,
          name: p,
          studentNo: String(result.length + 1).padStart(2, '0'),
          isAbsent: false,
          drawnCount: 0,
        });
      });
      return;
    }

    // Space or tab separated e.g. "D1387525 蘇盷蓉" or "1 蘇盷蓉"
    const tokens = line.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      // First token is likely student ID / no, rest is name
      const studentNo = tokens[0];
      const name = tokens.slice(1).join(' ');
      result.push({
        id: `std-import-${index + 1}-${studentNo}`,
        name,
        studentNo,
        isAbsent: false,
        drawnCount: 0,
      });
    } else if (tokens.length === 1) {
      result.push({
        id: `std-import-${index + 1}`,
        name: tokens[0],
        studentNo: String(index + 1).padStart(2, '0'),
        isAbsent: false,
        drawnCount: 0,
      });
    }
  });

  return result;
}

export const CLASS_ROSTER_64: Student[] = parseRosterInput(RAW_ROSTER_64);

export const DEFAULT_CLASS_30: Student[] = [
  '陳冠宇', '林子軒', '黃柏翰', '張宇翔', '李承翰',
  '王品叡', '吳品潔', '劉芷晴', '蔡依庭', '楊舒涵',
  '許家豪', '鄭凱文', '謝秉宏', '郭育銘', '洪偉哲',
  '曾品綸', '邱品萱', '廖子涵', '賴以柔', '周柏廷',
  '徐晨恩', '蘇宥廷', '葉欣穎', '莊子瑤', '江宥丞',
  '何敏慧', '羅子晴', '高嘉駿', '潘冠廷', '彭昱潔'
].map((name, idx) => ({
  id: `std-${idx + 1}`,
  name,
  studentNo: String(idx + 1).padStart(2, '0'),
  isAbsent: false,
  drawnCount: 0,
}));

export const THEMED_ROSTER_HEROES: Student[] = [
  '劉備', '關羽', '張飛', '諸葛亮', '趙雲',
  '曹操', '司馬懿', '張遼', '郭嘉', '夏侯惇',
  '孫權', '周瑜', '陸遜', '魯肅', '甘寧',
  '呂布', '貂蟬', '孫尚香', '甄姬', '大喬'
].map((name, idx) => ({
  id: `hero-${idx + 1}`,
  name,
  studentNo: String(idx + 1).padStart(2, '0'),
  isAbsent: false,
  drawnCount: 0,
}));

export const COLOR_PALETTES = [
  {
    name: 'indigo',
    bg: 'bg-indigo-50/80',
    border: 'border-indigo-200',
    headerBg: 'bg-indigo-600',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    accent: 'text-indigo-600',
  },
  {
    name: 'emerald',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-200',
    headerBg: 'bg-emerald-600',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    accent: 'text-emerald-600',
  },
  {
    name: 'amber',
    bg: 'bg-amber-50/80',
    border: 'border-amber-200',
    headerBg: 'bg-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    accent: 'text-amber-600',
  },
  {
    name: 'rose',
    bg: 'bg-rose-50/80',
    border: 'border-rose-200',
    headerBg: 'bg-rose-500',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    accent: 'text-rose-600',
  },
  {
    name: 'sky',
    bg: 'bg-sky-50/80',
    border: 'border-sky-200',
    headerBg: 'bg-sky-600',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    accent: 'text-sky-600',
  },
  {
    name: 'purple',
    bg: 'bg-purple-50/80',
    border: 'border-purple-200',
    headerBg: 'bg-purple-600',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    accent: 'text-purple-600',
  },
  {
    name: 'teal',
    bg: 'bg-teal-50/80',
    border: 'border-teal-200',
    headerBg: 'bg-teal-600',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    accent: 'text-teal-600',
  },
  {
    name: 'orange',
    bg: 'bg-orange-50/80',
    border: 'border-orange-200',
    headerBg: 'bg-orange-500',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    accent: 'text-orange-600',
  },
  {
    name: 'violet',
    bg: 'bg-violet-50/80',
    border: 'border-violet-200',
    headerBg: 'bg-violet-600',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-800',
    accent: 'text-violet-600',
  },
  {
    name: 'cyan',
    bg: 'bg-cyan-50/80',
    border: 'border-cyan-200',
    headerBg: 'bg-cyan-600',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    accent: 'text-cyan-600',
  },
];

export const GROUP_NAME_PRESETS = {
  number: Array.from({ length: 32 }, (_, i) => `第 ${i + 1} 組`),
  animal: [
    '雄鷹隊 🦅', '猛虎隊 🐯', '青龍隊 🐉', '靈狐隊 🦊', '黑豹隊 🐆', '白鯨隊 🐋',
    '獵隼隊 🦅', '戰熊隊 🐻', '赤兔隊 🐎', '金獅隊 🦁', '玄武隊 🐢', '朱雀隊 🦚',
    '火鳳隊 🐦', '靈鹿隊 🦌', '蒼狼隊 🐺', '巨鯨隊 🐳', '雪豹隊 🐆', '天馬隊 🦄',
    '金雕隊 🦅', '幻蝶隊 🦋', '企鵝隊 🐧', '海豚隊 🐬', '考拉隊 🐨', '北極熊隊 🐻‍❄️'
  ],
  gemstone: [
    '紅寶石組 💎', '藍寶石組 🔷', '祖母綠組 ❇️', '紫水晶組 🔮', '琥珀石組 🔶', '青金石組 💠',
    '瑪瑙石組 🪨', '鑽石組 ✨', '碧璽組 🟢', '月光石組 🌙', '珍珠組 🦪', '綠松石組 🩵',
    '黃玉組 🟡', '曜石組 🖤', '橄欖石組 🫒', '石榴石組 🔴', '尖晶石組 💠', '海藍寶組 🌊'
  ],
  element: [
    '烈火隊 🔥', '急流隊 💧', '疾風隊 🌪️', '磐石隊 🪨', '雷霆隊 ⚡', '森林隊 🌿',
    '極光隊 🌌', '星辰隊 ⭐', '寒冰隊 ❄️', '熔岩隊 🌋', '朝陽隊 ☀️', '新月隊 🌙',
    '幻影隊 🌫️', '鋼鐵隊 🛡️', '流金隊 ✨', '碧空隊 ☁️', '深淵隊 🌊', '引力隊 🪐'
  ]
};
