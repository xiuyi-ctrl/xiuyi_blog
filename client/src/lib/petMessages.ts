export const PET_NAME = '猫猫';

export function timeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h <= 7) return '早上好呀～一日之计在于晨，要元气满满哦！';
  if (h >= 8 && h <= 11) return '上午好！今天也要加油鸭～';
  if (h === 12 || h === 13) return '中午啦，该吃午饭了，记得好好吃饭！';
  if (h >= 14 && h <= 17) return '午后容易犯困，来杯咖啡提提神吧～';
  if (h >= 18 && h <= 19) return '傍晚好，忙碌一天辛苦啦！';
  if (h >= 20 && h <= 21) return '晚上好，今天过得怎么样呢？';
  if (h >= 22 && h <= 23) return '已经很晚啦，早点休息，晚安～';
  return '这么晚还不睡吗？当心熬夜秃头哦！';
}

export const PET_IDLE_TIPS = [
  '欢迎来到秀一的博客～',
  '要不要看看最新的文章呢？',
  '累了吗？休息一下，我陪着你～',
  '这里的音乐超好听，去听听吧！',
  '在角落静静地看着你，也很幸福呢。',
  '鼠标滑到我身上可以呼出菜单哦～',
  '点一下我可以互动！',
];

export const PET_CLICK_TIPS = [
  '嘿嘿，干嘛戳我～',
  '痒痒的啦！',
  '再戳我就生气啦！（并没有）',
  '找我有什么事嘛？',
];

export const PET_PAT_TIPS = [
  '被摸头了，有点害羞呢…',
  '嗯嗯，乖～',
];

export const PET_HIDE_TIPS = ['那我先睡啦，点旁边的休息条就能叫醒我～'];

export const PET_SUMMON_TIPS = ['想我了吗？我回来啦～'];

export const PET_RESET_TIPS = ['已经把我放回原来的位置啦～'];

export function randomOf(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
