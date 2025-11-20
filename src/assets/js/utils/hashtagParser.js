/**
 * Hashtag Parser Utility
 *
 * 用于解析和处理帖子中的话题标签 (#标签)
 */

export const hashtagParser = (() => {
  /**
   * 从文本中提取所有话题标签
   * @param {string} text - 要解析的文本
   * @returns {Array<string>} 话题标签数组（包含#符号）
   */
  const extractHashtags = (text) => {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // 匹配 #标签 模式
    // 支持中文、英文、数字，但不包括标点符号
    const hashtagRegex = /#[\u4e00-\u9fa5a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);

    if (!matches) {
      return [];
    }

    // 去重并返回
    return [...new Set(matches)];
  };

  /**
   * 将文本中的话题标签转换为可点击的链接
   * @param {string} text - 要处理的文本
   * @param {Function} onTagClick - 点击标签的回调函数（可选）
   * @returns {string} HTML字符串
   */
  const convertHashtagsToLinks = (text, onTagClick = null) => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // 先转义HTML特殊字符
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    // 转义文本
    const escapedText = escapeHtml(text);

    // 替换话题标签为链接
    const hashtagRegex = /#([\u4e00-\u9fa5a-zA-Z0-9_]+)/g;

    return escapedText.replace(hashtagRegex, (match, tag) => {
      const fullTag = `#${tag}`;
      const dataAttr = onTagClick ? `data-hashtag="${fullTag}"` : '';
      const href = `/social/community?tag=${encodeURIComponent(fullTag)}`;

      return `<a href="${href}" class="hashtag" ${dataAttr}>${fullTag}</a>`;
    });
  };

  /**
   * 验证话题标签格式
   * @param {string} tag - 话题标签
   * @returns {boolean} 是否有效
   */
  const isValidHashtag = (tag) => {
    if (!tag || typeof tag !== 'string') {
      return false;
    }

    // 确保以#开头
    if (!tag.startsWith('#')) {
      return false;
    }

    // 验证格式：#后面至少有一个字符
    const hashtagRegex = /^#[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
    return hashtagRegex.test(tag);
  };

  /**
   * 规范化话题标签（确保有#前缀）
   * @param {string} tag - 话题标签
   * @returns {string} 规范化后的标签
   */
  const normalizeHashtag = (tag) => {
    if (!tag || typeof tag !== 'string') {
      return '';
    }

    const trimmed = tag.trim();
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  };

  /**
   * 高亮显示文本中的话题标签
   * @param {string} text - 要处理的文本
   * @param {string} highlightClass - 高亮CSS类名
   * @returns {string} HTML字符串
   */
  const highlightHashtags = (text, highlightClass = 'hashtag-highlight') => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    const hashtagRegex = /#([\u4e00-\u9fa5a-zA-Z0-9_]+)/g;

    return text.replace(hashtagRegex, (match) => {
      return `<span class="${highlightClass}">${match}</span>`;
    });
  };

  /**
   * 从文本中移除所有话题标签
   * @param {string} text - 要处理的文本
   * @returns {string} 移除标签后的文本
   */
  const removeHashtags = (text) => {
    if (!text || typeof text !== 'string') {
      return text;
    }

    const hashtagRegex = /#[\u4e00-\u9fa5a-zA-Z0-9_]+/g;
    return text.replace(hashtagRegex, '').trim();
  };

  /**
   * 获取话题标签的显示名称（不含#）
   * @param {string} tag - 话题标签
   * @returns {string} 显示名称
   */
  const getTagName = (tag) => {
    if (!tag || typeof tag !== 'string') {
      return '';
    }

    return tag.startsWith('#') ? tag.substring(1) : tag;
  };

  /**
   * 将话题标签数组转换为显示文本
   * @param {Array<string>} tags - 话题标签数组
   * @param {string} separator - 分隔符
   * @returns {string} 显示文本
   */
  const tagsToString = (tags, separator = ' ') => {
    if (!Array.isArray(tags)) {
      return '';
    }

    return tags
      .filter(tag => isValidHashtag(tag))
      .join(separator);
  };

  /**
   * 建议话题标签（基于已有标签的相似度）
   * @param {string} input - 用户输入
   * @param {Array<string>} existingTags - 已存在的标签
   * @param {number} limit - 返回数量
   * @returns {Array<string>} 建议的标签
   */
  const suggestHashtags = (input, existingTags, limit = 5) => {
    if (!input || typeof input !== 'string' || !Array.isArray(existingTags)) {
      return [];
    }

    // 移除#前缀进行匹配
    const normalizedInput = input.replace(/^#/, '').toLowerCase();

    if (normalizedInput.length === 0) {
      return [];
    }

    // 过滤匹配的标签
    const matches = existingTags.filter(tag => {
      const tagName = getTagName(tag).toLowerCase();
      return tagName.includes(normalizedInput);
    });

    // 按相似度排序（前缀匹配优先）
    matches.sort((a, b) => {
      const aName = getTagName(a).toLowerCase();
      const bName = getTagName(b).toLowerCase();

      const aStartsWith = aName.startsWith(normalizedInput);
      const bStartsWith = bName.startsWith(normalizedInput);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      return aName.length - bName.length;
    });

    return matches.slice(0, limit);
  };

  /**
   * 统计文本中的话题标签数量
   * @param {string} text - 要分析的文本
   * @returns {number} 标签数量
   */
  const countHashtags = (text) => {
    return extractHashtags(text).length;
  };

  /**
   * 检查文本中是否包含某个话题标签
   * @param {string} text - 要检查的文本
   * @param {string} tag - 话题标签
   * @returns {boolean} 是否包含
   */
  const hasHashtag = (text, tag) => {
    const normalizedTag = normalizeHashtag(tag);
    const tags = extractHashtags(text);
    return tags.includes(normalizedTag);
  };

  return {
    extractHashtags,
    convertHashtagsToLinks,
    isValidHashtag,
    normalizeHashtag,
    highlightHashtags,
    removeHashtags,
    getTagName,
    tagsToString,
    suggestHashtags,
    countHashtags,
    hasHashtag
  };
})();
