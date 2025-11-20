/**
 * FriendsView.js - friends 视图
 */

export const FriendsView = {
  template: () => `
    <section class="panel" id="friends">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">社交互动</p>
              <h2>好友系统</h2>
              <p>添加健身伙伴，互相鼓励，一起进步。</p>
            </div>
          </div>

          <div class="friend-tabs">
            <button class="tab-btn active" data-friend-tab="my-friends">我的好友</button>
            <button class="tab-btn" data-friend-tab="discover">发现好友</button>
            <button class="tab-btn" data-friend-tab="recommended">推荐好友</button>
          </div>

          <div class="friend-search-bar">
            <input
              type="search"
              id="friend-search"
              placeholder="搜索用户（昵称或邮箱）..."
            />
          </div>

          <div id="friends-container" class="friends-container">
            <!-- 好友列表将由 friends.js 渲染 -->
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { friendsModule } = await import('../modules/friends.js');
    friendsModule.init();
    console.log('FriendsView mounted');
  },

  unmount: () => {
    console.log('FriendsView unmounted');
  }
};

export default FriendsView;
