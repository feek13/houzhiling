/**
 * HealthView.js - profile 视图
 */

export const HealthView = {
  template: () => `
    <section class="panel" id="profile">
        <div class="container two-column">
          <div class="profile-card" data-guard="profile">
            <div class="guard-message" hidden>
              <p>需要登录后才能编辑资料。</p>
              <button class="btn primary" data-open="auth-modal">立即登录</button>
            </div>
            <form id="profile-form">
              <div class="form-row">
                <label>昵称<input name="nickname" required /></label>
                <label>性别
                  <select name="gender">
                    <option value="">选择</option>
                    <option value="female">女</option>
                    <option value="male">男</option>
                    <option value="other">其他</option>
                  </select>
                </label>
              </div>
              <div class="form-row">
                <label>年龄
                  <input type="number" name="age" min="10" max="80" />
                </label>
                <label>训练偏好
                  <select name="preference">
                    <option value="">选择</option>
                    <option value="hiit">HIIT</option>
                    <option value="strength">力量训练</option>
                    <option value="cardio">心肺</option>
                    <option value="mobility">灵活性</option>
                  </select>
                </label>
              </div>
              <div class="form-row">
                <label>身高 (cm)
                  <input type="number" name="height" min="100" max="250" required />
                </label>
                <label>体重 (kg)
                  <input type="number" name="weight" min="30" max="200" required />
                </label>
              </div>
              <div class="form-row">
                <label>目标体重 (kg)
                  <input type="number" name="targetWeight" />
                </label>
                <label>本周目标 (kg)
                  <input type="number" name="weeklyTarget" step="0.1" />
                </label>
              </div>
              <div class="form-row">
                <label>训练目标
                  <select name="goal">
                    <option value="fat_loss">减脂</option>
                    <option value="muscle_gain">增肌</option>
                    <option value="keep_fit">保持健康</option>
                  </select>
                </label>
                <label>每周频次
                  <input type="number" name="frequency" min="1" max="7" />
                </label>
              </div>
              <label>个人简介
                <textarea name="bio" rows="2" placeholder="描述你的训练喜好"></textarea>
              </label>
              <label>患病史 / 注意事项
                <textarea name="medicalHistory" rows="2" placeholder="例如心率异常、关节损伤等"></textarea>
              </label>
              <button class="btn primary" type="submit">保存资料</button>
            </form>
          </div>
          <div class="profile-summary">
            <h2>身体指标 & BMI</h2>
            <p>实时计算 BMI、体脂率，并输出健康提醒。</p>
            <div class="bmi-display">
              <div>
                <p>BMI</p>
                <strong data-bind="bmiValue">--</strong>
              </div>
              <div>
                <p>判定</p>
                <strong data-bind="bmiStatus">--</strong>
              </div>
              <div>
                <p>体脂率</p>
                <strong data-bind="bodyFat">--</strong>
              </div>
            </div>
            <div class="history-card">
              <header>
                <h3>历史记录</h3>
                <span class="muted">自动保存最近测量</span>
              </header>
              <canvas id="bmi-chart" height="140"></canvas>
              <ul id="history-list" class="history-list"></ul>
            </div>
            <div class="reminder-card">
              <h3>提醒与建议</h3>
              <p data-bind="reminder">填写资料后即可获得个性化提示。</p>
            </div>
            <ul class="bmi-range">
              <li><span>偏瘦</span><span>&lt; 18.5</span></li>
              <li><span>正常</span><span>18.5 - 23.9</span></li>
              <li><span>超重</span><span>24 - 27.9</span></li>
              <li><span>肥胖</span><span>&ge; 28</span></li>
            </ul>
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { profileModule } = await import('../modules/profile.js');
    profileModule.init();
    console.log('HealthView mounted');
  },

  unmount: () => {
    console.log('HealthView unmounted');
  }
};

export default HealthView;
