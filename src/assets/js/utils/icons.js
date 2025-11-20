/**
 * icons.js - SVG 图标库
 * 提供统一的 SVG 图标管理
 */

export const icons = {
  // 完成训练 - 哑铃图标 (Duotone Style)
  dumbbell: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 5C6.5 3.34315 7.84315 2 9.5 2C11.1569 2 12.5 3.34315 12.5 5V19C12.5 20.6569 11.1569 22 9.5 22C7.84315 22 6.5 20.6569 6.5 19V5Z" fill="currentColor" fill-opacity="0.2"/>
      <path d="M11.5 5C11.5 3.34315 12.8431 2 14.5 2C16.1569 2 17.5 3.34315 17.5 5V19C17.5 20.6569 16.1569 22 14.5 22C12.8431 22 11.5 20.6569 11.5 19V5Z" fill="currentColor" fill-opacity="0.2"/>
      <path d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V9C22 10.1046 21.1046 11 20 11H4C2.89543 11 2 10.1046 2 9V7Z" fill="currentColor"/>
      <path d="M2 13C2 11.8954 2.89543 11 4 11H20C21.1046 11 22 11.8954 22 13V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V13Z" fill="currentColor"/>
      <path d="M5 10H19" stroke="white" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round"/>
      <path d="M5 14H19" stroke="white" stroke-opacity="0.3" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 连续签到 - 火焰图标 (Gradient/Duotone Style)
  flame: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fill-opacity="0.1"/>
      <path d="M13.5 3.5C13.5 3.5 16.5 7 16.5 11C16.5 14.5 14 16.5 12 16.5C10 16.5 8.5 14.5 8.5 12.5C8.5 11.5 9 10 9 10C7 11 6 13 6 15C6 17.5 8 19.5 10.5 19.5C13 19.5 16 18 17 15.5C18 13 17.5 11 17.5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 16.5C13.1046 16.5 14 15.6046 14 14.5C14 13.3954 13.1046 12.5 12 12.5C10.8954 12.5 10 13.3954 10 14.5C10 15.6046 10.8954 16.5 12 16.5Z" fill="currentColor"/>
    </svg>
  `,

  // 营养记录 - 苹果图标 (Modern Outline/Fill)
  apple: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" fill="currentColor" fill-opacity="0.1"/>
      <path d="M15.5 6.5C15.5 6.5 14 5.5 12 5.5C10 5.5 8.5 6.5 8.5 6.5C6.5 7.5 5.5 10 5.5 12.5C5.5 16 8 18.5 10 18.5C11 18.5 11.5 18 12 18C12.5 18 13 18.5 14 18.5C16 18.5 18.5 16 18.5 12.5C18.5 10 17.5 7.5 15.5 6.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 5.5V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 3C13 3 14.5 3.5 15 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,

  // 消耗卡路里 - 闪电图标 (Dynamic)
  bolt: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `,

  // 获得徽章 - 奖牌图标 (Detailed)
  medal: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" fill-opacity="0.1"/>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
      <path d="M12 6V9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 15V18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M15 12H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M6 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M7.8 7.8L9.9 9.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M14.1 14.1L16.2 16.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16.2 7.8L14.1 9.9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M9.9 14.1L7.8 16.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `,

  // 健身好友 - 用户组图标 (Clean)
  users: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
};

/**
 * 获取 SVG 图标的 HTML 字符串
 * @param {string} iconName - 图标名称
 * @param {string} className - 可选的 CSS 类名
 * @returns {string} SVG HTML 字符串
 */
export const getIcon = (iconName, className = '') => {
  const svg = icons[iconName];
  if (!svg) {
    console.warn(`Icon "${iconName}" not found`);
    return '';
  }

  // 如果需要添加类名，在 SVG 标签中插入
  if (className) {
    return svg.replace('<svg', `<svg class="${className}"`);
  }

  return svg;
};

/**
 * 创建 SVG 图标的 DOM 元素（安全方法）
 * @param {string} iconName - 图标名称
 * @param {string} className - 可选的 CSS 类名
 * @returns {HTMLElement} SVG DOM 元素
 */
export const createIcon = (iconName, className = '') => {
  const svgString = icons[iconName];
  if (!svgString) {
    console.warn(`Icon "${iconName}" not found`);
    return document.createElement('div');
  }

  // 使用 DOMParser 安全地解析 SVG
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.documentElement;

  // 添加类名
  if (className) {
    svgElement.classList.add(className);
  }

  return svgElement;
};
