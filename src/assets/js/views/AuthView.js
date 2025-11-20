/**
 * AuthView.js - 登录/注册视图
 */

export const AuthView = {
  template: () => `
    <section class="panel" id="auth">
      <div class="container two-column">
        <div>
          <h2>基础登录注册</h2>
          <p>
            轻量身份模块，包含邮箱/手机号注册、密码强度检测与会话保持。
          </p>
          <ul class="checklist">
            <li>本地存储用户档案并模拟会话</li>
            <li>密码强度提示、重复邮箱检测</li>
            <li>提供"忘记密码"流程占位（未来接邮件）</li>
          </ul>
        </div>
        <div class="auth-card" id="auth-panel"></div>
      </div>
    </section>
  `,

  mount: async () => {
    // 懒加载auth模块
    const { authUI } = await import('../modules/authUI.js');
    const { Router } = await import('../router.js');
    const container = document.getElementById('auth-panel');
    if (container) {
      // 成功后跳转到首页
      const handleAuthSuccess = () => {
        Router.push('/');
      };
      authUI.mount(container, handleAuthSuccess);
    }
    console.log('AuthView mounted');
  },

  unmount: () => {
    // 清理auth相关的事件监听器
    console.log('AuthView unmounted');
  }
};

export default AuthView;
