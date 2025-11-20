/**
 * WorkoutsView.js - workouts 视图
 */

export const WorkoutsView = {
  template: () => `
    <section class="panel" id="workouts">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">教学内容</p>
              <h2>训练课程库</h2>
              <p>用户共创课程库，分享你的训练经验。</p>
              <button class="btn primary" id="create-workout-btn" style="margin-top: 10px;">➕ 发布新课程</button>
            </div>
            <div class="filters">
              <input type="search" id="filter-search" placeholder="搜索课程或动作" />
              <select id="filter-source">
                <option value="all">全部课程</option>
                <option value="official">官方课程</option>
                <option value="user">用户创建</option>
                <option value="mine">我的课程</option>
              </select>
              <select id="filter-muscle">
                <option value="all">部位</option>
                <option value="chest">胸部</option>
                <option value="back">背部</option>
                <option value="legs">下肢</option>
                <option value="core">核心</option>
                <option value="full">全身</option>
              </select>
              <select id="filter-level">
                <option value="all">难度</option>
                <option value="easy">入门</option>
                <option value="medium">中级</option>
                <option value="hard">高阶</option>
              </select>
              <select id="filter-equipment">
                <option value="all">器械</option>
                <option value="bodyweight">自重</option>
                <option value="dumbbell">哑铃</option>
                <option value="barbell">杠铃</option>
                <option value="machine">器械</option>
              </select>
              <select id="filter-duration">
                <option value="all">时长</option>
                <option value="short">15-20min</option>
                <option value="medium">20-35min</option>
                <option value="long">35min+</option>
              </select>
              <select id="sort-select">
                <option value="latest">最新发布</option>
                <option value="popular">最多浏览</option>
                <option value="mostLiked">最多点赞</option>
                <option value="mostFavorited">最多收藏</option>
              </select>
            </div>
          </div>
          <div class="workout-grid" id="workout-grid"></div>
          <div class="plan-builder">
            <div>
              <h3>周计划生成器</h3>
              <p>选择训练目标与周频次，系统会为每一天匹配课程。</p>
              <form id="plan-form" class="plan-form">
                <label>训练目标
                  <select name="planGoal">
                    <option value="fat_loss">减脂</option>
                    <option value="muscle_gain">增肌</option>
                    <option value="keep_fit">综合提升</option>
                  </select>
                </label>
                <label>每周天数
                  <select name="planDays">
                    <option value="3">3 天</option>
                    <option value="4">4 天</option>
                    <option value="5">5 天</option>
                  </select>
                </label>
                <label>强度偏好
                  <select name="planIntensity">
                    <option value="easy">入门</option>
                    <option value="medium">中级</option>
                    <option value="hard">高阶</option>
                  </select>
                </label>
                <button class="btn primary" type="submit">生成周计划</button>
              </form>
            </div>
            <div class="plan-result" id="plan-result">
              <p class="muted">提交后显示你的专属安排，可随时调整。</p>
            </div>
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { workoutModule } = await import('../modules/workouts.js');
    workoutModule.init();
    console.log('WorkoutsView mounted');
  },

  unmount: () => {
    console.log('WorkoutsView unmounted');
  }
};

export default WorkoutsView;
