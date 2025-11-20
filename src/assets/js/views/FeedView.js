/**
 * FeedView.js - activity-feed 视图
 */

export const FeedView = {
  template: () => `
    <section class="panel" id="activity-feed">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">社交动态</p>
              <h2>活动动态流</h2>
              <p>查看好友的训练动态，互相点赞鼓励</p>
            </div>
          </div>

          <div class="post-activity-form">
            <textarea id="activity-post-input" placeholder="分享你的训练心得或日常动态..." rows="3"></textarea>
            <div class="post-actions">
              <button id="post-activity-btn" class="btn btn-primary">发布动态</button>
            </div>
          </div>

          <div class="activity-filters">
            <button class="activity-filter-btn active" data-activity-filter="all">全部</button>
            <button class="activity-filter-btn" data-activity-filter="workout">训练</button>
            <button class="activity-filter-btn" data-activity-filter="nutrition">营养</button>
            <button class="activity-filter-btn" data-activity-filter="checkin">打卡</button>
            <button class="activity-filter-btn" data-activity-filter="forum">论坛</button>
          </div>

          <div id="activity-feed-container" class="activity-feed-container">
            <!-- 活动流将由 activityFeed.js 渲染 -->
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { activityFeedModule } = await import('../modules/activityFeed.js');
    activityFeedModule.init();
    console.log('FeedView mounted');
  },

  unmount: () => {
    console.log('FeedView unmounted');
  }
};

export default FeedView;
