/**
 * NutritionView.js - nutrition 视图
 */

export const NutritionView = {
  template: () => `
    <section class="panel" id="nutrition">
        <div class="container two-column">
          <div>
            <h2>营养与日志</h2>
            <p>记录热量 + 宏量素、使用模板快速录入，并预留扫码入口。</p>
            <ul class="checklist">
              <li>每日热量 & 宏量素分布</li>
              <li>自定义菜谱模板和提醒</li>
              <li>扫码/穿戴数据接入占位</li>
            </ul>
          </div>
          <div class="log-card">
            <form id="nutrition-form">
              <label>餐次
                <select name="meal">
                  <option value="breakfast">早餐</option>
                  <option value="lunch">午餐</option>
                  <option value="dinner">晚餐</option>
                  <option value="snack">加餐</option>
                </select>
              </label>
              <div class="form-row">
                <label>热量 (kcal)
                  <input type="number" name="calories" min="0" required />
                </label>
                <label>蛋白 (g)
                  <input type="number" name="protein" min="0" />
                </label>
              </div>
              <div class="form-row">
                <label>碳水 (g)
                  <input type="number" name="carbs" min="0" />
                </label>
                <label>脂肪 (g)
                  <input type="number" name="fat" min="0" />
                </label>
              </div>
              <label>备注
                <textarea name="note" rows="2"></textarea>
              </label>
              <button class="btn primary" type="submit">记录营养</button>
            </form>
            <div class="nutrition-templates">
              <p class="muted">快速录入</p>
              <div class="template-buttons" id="nutrition-templates"></div>
            </div>
            <button class="btn ghost" id="scan-btn">扫码录入（占位）</button>
            <div class="macro-summary" id="macro-summary"></div>
            <div id="nutrition-log" class="nutrition-log"></div>
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { nutritionModule } = await import('../modules/nutrition.js');
    nutritionModule.init();
    console.log('NutritionView mounted');
  },

  unmount: () => {
    console.log('NutritionView unmounted');
  }
};

export default NutritionView;
