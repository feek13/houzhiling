/**
 * ProfileView.js - user-profile 视图
 */

export const ProfileView = {
  template: () => `
    <section class="panel" id="user-profile">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">我的账户</p>
              <h2>个人资料</h2>
              <p>查看你的训练数据、成就和账户设置。</p>
            </div>
          </div>
          <div id="user-profile-container"></div>
        </div>
      </section>
  `,

  mount: async () => {
    const { userProfileModule } = await import('../modules/userProfile.js');
    userProfileModule.init();
    console.log('ProfileView mounted');
  },

  unmount: () => {
    console.log('ProfileView unmounted');
  }
};

export default ProfileView;
