/**
 * RoadmapView.js - roadmap 视图
 */

export const RoadmapView = {
  template: () => `
    <section class="panel" id="roadmap">
        <div class="container">
          <h2>项目 Roadmap</h2>
          <p>TODO 列表，按阶段推进。</p>
          <ol class="todo-list" id="todo-list"></ol>
        </div>
      </section>
  `,

  mount: async () => {
    // 无需加载模块
    console.log('RoadmapView mounted');
  },

  unmount: () => {
    console.log('RoadmapView unmounted');
  }
};

export default RoadmapView;
