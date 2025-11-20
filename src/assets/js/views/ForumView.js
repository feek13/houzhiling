/**
 * ForumView.js - forum 视图
 */

export const ForumView = {
  template: () => `
    <section class="panel" id="forum">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">社区交流</p>
              <h2>健身论坛</h2>
              <p>分享经验、提出问题、互相帮助，一起进步。</p>
            </div>
            <button class="btn primary" id="new-topic-btn">发布主题</button>
          </div>

          <!-- 分类标签 -->
          <div class="forum-tabs">
            <button class="tab-btn active" data-forum-category="all">全部</button>
            <button class="tab-btn" data-forum-category="training">💪 训练技巧</button>
            <button class="tab-btn" data-forum-category="nutrition">🥗 营养饮食</button>
            <button class="tab-btn" data-forum-category="equipment">🏋️ 器械装备</button>
            <button class="tab-btn" data-forum-category="recovery">😴 恢复休息</button>
            <button class="tab-btn" data-forum-category="motivation">🔥 动力分享</button>
            <button class="tab-btn" data-forum-category="qa">❓ 问答求助</button>
          </div>

          <!-- 搜索和排序 -->
          <div class="forum-search-bar">
            <input
              type="search"
              id="forum-search"
              placeholder="搜索主题或内容..."
            />
            <div class="forum-sort-tabs">
              <button class="tab-btn active" data-forum-sort="latest">最新</button>
              <button class="tab-btn" data-forum-sort="hot">最热</button>
              <button class="tab-btn" data-forum-sort="replies">回复最多</button>
            </div>
          </div>

          <!-- 主题列表 -->
          <div id="forum-container" class="forum-container">
            <!-- 论坛内容将由 forum.js 渲染 -->
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { forumModule } = await import('../modules/forum.js');
    forumModule.init();
    console.log('ForumView mounted');
  },

  unmount: () => {
    console.log('ForumView unmounted');
  }
};

export default ForumView;
