import { authService } from '../services/authService.js';
import { oauthService } from '../services/oauthService.js';
import { modal } from './modal.js';

const createInput = (config) => {
  const wrapper = document.createElement('label');
  wrapper.textContent = config.label;
  const input = document.createElement(config.tag || 'input');
  Object.entries(config.attrs || {}).forEach(([key, value]) => input.setAttribute(key, value));
  wrapper.appendChild(input);
  return { wrapper, input };
};

const strengthLabel = (score) => {
  if (score >= 4) return '强';
  if (score >= 3) return '良';
  if (score >= 2) return '一般';
  return '弱';
};

const createOAuthButtons = (onSuccess) => {
  const container = document.createElement('div');
  container.className = 'oauth-buttons';

  const providers = oauthService.getProviders();

  providers.forEach(provider => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn oauth-btn oauth-${provider.id}`;
    btn.textContent = `${provider.icon || ''} 使用 ${provider.name} 登录`;
    btn.addEventListener('click', async () => {
      try {
        btn.disabled = true;
        btn.textContent = '登录中...';
        await oauthService.authorize(provider.id);
        onSuccess?.();
        modal.close();
      } catch (err) {
        console.error('OAuth login failed:', err);
        btn.textContent = `${provider.icon || ''} 使用 ${provider.name} 登录`;
      } finally {
        btn.disabled = false;
      }
    });
    container.appendChild(btn);
  });

  const divider = document.createElement('div');
  divider.className = 'auth-divider';
  const span = document.createElement('span');
  span.textContent = '或';
  divider.appendChild(span);
  container.appendChild(divider);

  return container;
};

const renderForgotForm = () => {
  const form = document.createElement('form');
  form.className = 'auth-form';
  const title = document.createElement('h3');
  title.textContent = '找回密码';
  form.appendChild(title);
  const emailField = createInput({
    label: '注册邮箱',
    attrs: { type: 'email', name: 'email', required: true },
  });
  form.appendChild(emailField.wrapper);
  const info = document.createElement('p');
  info.className = 'muted';
  info.textContent = '我们会发送重置链接（占位逻辑）。';
  form.appendChild(info);
  const errorBox = document.createElement('p');
  errorBox.className = 'error-box';
  form.appendChild(errorBox);
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn primary';
  submitBtn.textContent = '发送重置请求';
  form.appendChild(submitBtn);

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    submitBtn.disabled = true;
    errorBox.textContent = '';
    try {
      authService.requestPasswordReset(emailField.input.value);
      errorBox.textContent = '已发送重置链接（示意）';
    } catch (err) {
      errorBox.textContent = err.message || '提交失败';
    } finally {
      submitBtn.disabled = false;
    }
  });

  return form;
};

const renderForm = ({ type, onSuccess }) => {
  const form = document.createElement('form');
  form.className = 'auth-form';

  const title = document.createElement('h3');
  title.textContent = type === 'login' ? '登录' : '注册';
  form.appendChild(title);

  // 添加 OAuth 登录按钮
  if (type === 'login') {
    const oauthButtons = createOAuthButtons(onSuccess);
    form.appendChild(oauthButtons);
  }

  const emailField = createInput({
    label: '邮箱',
    attrs: { type: 'email', name: 'email', required: true, placeholder: 'you@example.com' },
  });
  form.appendChild(emailField.wrapper);

  let nicknameField;
  if (type === 'register') {
    nicknameField = createInput({
      label: '昵称',
      attrs: { name: 'nickname', required: true, minlength: 2 },
    });
    form.appendChild(nicknameField.wrapper);
  }

  const passwordField = createInput({
    label: '密码',
    attrs: { type: 'password', name: 'password', required: true, minlength: 6 },
  });
  form.appendChild(passwordField.wrapper);

  const hint = document.createElement('p');
  hint.className = 'muted';
  hint.textContent = '密码需 ≥6 位，含字母与数字。';
  form.appendChild(hint);

  let strengthBar;
  if (type === 'register') {
    strengthBar = document.createElement('div');
    strengthBar.className = 'strength-meter';
    strengthBar.innerHTML = '<span data-strength>强度：--</span>';
    form.appendChild(strengthBar);
    passwordField.input.addEventListener('input', () => {
      const val = passwordField.input.value || '';
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[a-z]/.test(val)) score++;
      if (/\d/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      strengthBar.dataset.score = score;
      strengthBar.querySelector('[data-strength]').textContent = `强度：${strengthLabel(score)}`;
    });
  }

  const errorBox = document.createElement('p');
  errorBox.className = 'error-box';
  form.appendChild(errorBox);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn primary';
  submitBtn.textContent = type === 'login' ? '登录' : '注册';
  form.appendChild(submitBtn);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'btn ghost';
  toggle.textContent = type === 'login' ? '没有账号？注册' : '已有账号？登录';
  toggle.addEventListener('click', () => {
    modal.open(() => renderForm({ type: type === 'login' ? 'register' : 'login', onSuccess }));
  });
  form.appendChild(toggle);

  const forgot = document.createElement('button');
  forgot.type = 'button';
  forgot.className = 'link-like';
  forgot.textContent = '忘记密码？';
  forgot.addEventListener('click', () => {
    modal.open(() => renderForgotForm());
  });
  form.appendChild(forgot);

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    errorBox.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = '处理中...';
    try {
      const payload = {
        email: emailField.input.value,
        password: passwordField.input.value,
      };
      if (type === 'register') {
        payload.nickname = nicknameField.input.value;
        await authService.register(payload);
      } else {
        await authService.login(payload);
      }
      onSuccess?.();
      modal.close();
    } catch (err) {
      errorBox.textContent = err.message || '操作失败';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = type === 'login' ? '登录' : '注册';
    }
  });

  return form;
};

export const authUI = {
  mount(container, onSuccess) {
    container.innerHTML = '';
    container.appendChild(renderForm({ type: 'register', onSuccess }));
  },
  open(onSuccess) {
    modal.open(() => renderForm({ type: 'login', onSuccess }));
  },
};
