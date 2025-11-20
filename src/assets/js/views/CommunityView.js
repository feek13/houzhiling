/**
 * CommunityView.js - 社区Feed视图
 *
 * 替代ForumView，实现社交媒体风格的社区功能
 */

export const CommunityView = {
  template: () => `
    <section class="panel community-view" id="community">
      <div class="container">
        <div id="community-container" class="community-wrapper">
          <!-- 社区内容将由 community.js 模块渲染 -->
        </div>
      </div>
    </section>
  `,

  mount: async () => {
    const { community } = await import('../modules/community.js');
    const { autoMigrate } = await import('../utils/dataMigration.js');

    // 自动执行数据迁移（如果需要）
    autoMigrate();

    // 初始化社区模块
    const container = document.querySelector('#community-container');
    if (container) {
      community.init(container);
    }

    console.log('CommunityView mounted');
  },

  unmount: () => {
    // 清理社区模块
    import('../modules/community.js').then(({ community }) => {
      community.destroy();
    });

    console.log('CommunityView unmounted');
  }
};

export default CommunityView;
