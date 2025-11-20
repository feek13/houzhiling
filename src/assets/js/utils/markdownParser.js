/**
 * markdownParser.js - 轻量级Markdown解析器
 *
 * 功能：
 * - 支持粗体 (**text** 或 __text__)
 * - 支持斜体 (*text* 或 _text_)
 * - 支持代码块 (`code` 或 ```code```)
 * - XSS防护
 */

export const markdownParser = (() => {
  /**
   * HTML转义函数
   */
  const escapeHtml = (str) => {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  /**
   * 解析Markdown文本为HTML
   * @param {string} text - 原始文本
   * @returns {string} HTML字符串
   */
  const parse = (text) => {
    if (!text || typeof text !== 'string') return '';

    // 先转义HTML
    let html = escapeHtml(text);

    // 1. 处理代码块 (```code```)
    html = html.replace(/```([^`]+)```/g, '<code class="code-block">$1</code>');

    // 2. 处理行内代码 (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>');

    // 3. 处理粗体 (**text** 或 __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // 4. 处理斜体 (*text* 或 _text_)
    // 注意：必须在粗体之后处理，避免冲突
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // 5. 处理换行
    html = html.replace(/\n/g, '<br>');

    return html;
  };

  /**
   * 检查文本中是否包含Markdown语法
   * @param {string} text - 原始文本
   * @returns {boolean}
   */
  const hasMarkdown = (text) => {
    if (!text || typeof text !== 'string') return false;

    const patterns = [
      /\*\*[^*]+\*\*/,  // 粗体 **
      /__[^_]+__/,      // 粗体 __
      /\*[^*]+\*/,      // 斜体 *
      /_[^_]+_/,        // 斜体 _
      /`[^`]+`/,        // 代码 `
      /```[^`]+```/     // 代码块 ```
    ];

    return patterns.some(pattern => pattern.test(text));
  };

  /**
   * 移除Markdown语法，返回纯文本
   * @param {string} text - Markdown文本
   * @returns {string} 纯文本
   */
  const stripMarkdown = (text) => {
    if (!text || typeof text !== 'string') return '';

    let plain = text;

    // 移除代码块
    plain = plain.replace(/```([^`]+)```/g, '$1');

    // 移除行内代码
    plain = plain.replace(/`([^`]+)`/g, '$1');

    // 移除粗体
    plain = plain.replace(/\*\*([^*]+)\*\*/g, '$1');
    plain = plain.replace(/__([^_]+)__/g, '$1');

    // 移除斜体
    plain = plain.replace(/\*([^*]+)\*/g, '$1');
    plain = plain.replace(/_([^_]+)_/g, '$1');

    return plain;
  };

  /**
   * 组合解析：Markdown + Hashtags
   * @param {string} text - 原始文本
   * @param {Function} hashtagConverter - hashtag转换函数
   * @returns {string} HTML字符串
   */
  const parseWithHashtags = (text, hashtagConverter) => {
    if (!text || typeof text !== 'string') return '';

    // 先解析Markdown
    let html = parse(text);

    // 再处理hashtags（如果提供了转换函数）
    if (hashtagConverter && typeof hashtagConverter === 'function') {
      // 注意：hashtag转换应该在Markdown之后，避免破坏HTML标签
      // 我们需要临时提取HTML标签，处理hashtag，然后再恢复
      const tagPlaceholders = [];

      // 提取HTML标签
      html = html.replace(/<[^>]+>/g, (match) => {
        const index = tagPlaceholders.length;
        tagPlaceholders.push(match);
        return `__TAG_${index}__`;
      });

      // 处理hashtags
      html = hashtagConverter(html);

      // 恢复HTML标签
      html = html.replace(/__TAG_(\d+)__/g, (match, index) => {
        return tagPlaceholders[parseInt(index)];
      });
    }

    return html;
  };

  // 公共API
  return {
    parse,
    hasMarkdown,
    stripMarkdown,
    parseWithHashtags
  };
})();

export default markdownParser;
