/**
 * AnalyticsView.js - analytics 视图
 */

export const AnalyticsView = {
  template: () => `
    <section class="panel" id="analytics">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">数据洞察</p>
              <h2>数据分析与可视化</h2>
              <p>多维度图表展示训练、营养、体重数据，帮助你更好地了解自己的健身进展。</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <button class="btn primary" id="health-report-btn">生成健康报告</button>
              <button class="btn ghost" id="export-data-btn">导出数据</button>
            </div>
          </div>

          <!-- 图表网格 -->
          <div class="analytics-grid">
            <!-- 体重趋势图 -->
            <div class="chart-card glass">
              <h3>体重趋势</h3>
              <p class="muted">查看体重变化趋势，了解减脂/增肌效果</p>
              <canvas id="weight-trend-chart"></canvas>
            </div>

            <!-- 训练分布图 -->
            <div class="chart-card glass">
              <h3>训练分布</h3>
              <p class="muted">各部位训练次数占比</p>
              <canvas id="workout-distribution-chart"></canvas>
            </div>

            <!-- 营养摄入图 -->
            <div class="chart-card glass">
              <h3>营养摄入</h3>
              <p class="muted">蛋白质、碳水、脂肪每日摄入量</p>
              <canvas id="nutrition-chart"></canvas>
            </div>

            <!-- 健康评估雷达图 -->
            <div class="chart-card glass">
              <h3>健康评估</h3>
              <p class="muted">力量、耐力、柔韧性等多维度评估</p>
              <canvas id="fitness-radar-chart"></canvas>
            </div>

            <!-- 活动热力图 -->
            <div class="chart-card glass full-width">
              <h3>活动热力图</h3>
              <p class="muted">过去12周的训练活跃度（类似GitHub贡献图）</p>
              <div id="activity-heatmap"></div>
            </div>
          </div>

          <!-- 时间对比 -->
          <div class="time-comparison-section">
            <h3>时间对比分析</h3>
            <p class="muted">对比不同时间段的训练数据，了解进步趋势</p>

            <div class="comparison-period-selector">
              <button class="period-btn active" data-comparison-period="week">周对比</button>
              <button class="period-btn" data-comparison-period="month">月对比</button>
              <button class="period-btn" data-comparison-period="year">年对比</button>
            </div>

            <div id="comparison-stats" class="comparison-stats">
              <!-- 对比统计将由 timeComparison.js 渲染 -->
            </div>

            <div class="chart-card glass">
              <h3>数据对比图表</h3>
              <canvas id="comparison-chart"></canvas>
            </div>
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { analyticsModule } = await import('../modules/analytics.js');
    analyticsModule.init();
    console.log('AnalyticsView mounted');
  },

  unmount: () => {
    console.log('AnalyticsView unmounted');
  }
};

export default AnalyticsView;
