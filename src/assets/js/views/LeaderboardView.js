/**
 * LeaderboardView.js - leaderboard 视图
 */

export const LeaderboardView = {
  template: () => `
    <section class="panel" id="leaderboard">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">竞技排名</p>
              <h2>排行榜</h2>
              <p>查看各项数据排名，挑战更高位置。</p>
            </div>
          </div>

          <div class="leaderboard-tabs">
            <button class="tab-btn active" data-leaderboard-tab="workouts">训练次数</button>
            <button class="tab-btn" data-leaderboard-tab="streak">连续天数</button>
            <button class="tab-btn" data-leaderboard-tab="calories">消耗卡路里</button>
            <button class="tab-btn" data-leaderboard-tab="completion">完成率</button>
          </div>

          <div class="leaderboard-period">
            <button class="period-btn active" data-period="week">本周</button>
            <button class="period-btn" data-period="month">本月</button>
            <button class="period-btn" data-period="year">今年</button>
          </div>

          <div id="leaderboard-container" class="leaderboard-container">
            <!-- 排行榜将由 leaderboard.js 渲染 -->
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { leaderboardModule } = await import('../modules/leaderboard.js');
    leaderboardModule.init();
    console.log('LeaderboardView mounted');
  },

  unmount: () => {
    console.log('LeaderboardView unmounted');
  }
};

export default LeaderboardView;
