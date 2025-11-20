/**
 * CalendarView.js - calendar 视图
 */

export const CalendarView = {
  template: () => `
    <section class="panel" id="calendar">
        <div class="container calendar-container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">日程管理</p>
              <h2>训练日历</h2>
              <p>查看训练计划，导出到你的日历应用。</p>
            </div>
          </div>

          <div id="calendar-view">
            <!-- 日历将由 calendarModule.js 渲染 -->
          </div>

          <div style="margin-top: 40px;">
            <h3>📆 本周训练安排</h3>
            <div id="week-workouts">
              <!-- 本周训练将由 calendarModule.js 渲染 -->
            </div>
          </div>
        </div>
      </section>
  `,

  mount: async () => {
    const { calendarModule } = await import('../modules/calendarModule.js');
    calendarModule.init();
    console.log('CalendarView mounted');
  },

  unmount: () => {
    console.log('CalendarView unmounted');
  }
};

export default CalendarView;
