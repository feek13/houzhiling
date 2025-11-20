import { authService } from '../services/authService.js';

const bmiStatus = (bmi) => {
  if (!bmi) return '--';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
};

const calcBodyFat = (bmi, age, gender) => {
  if (!bmi || !age || !gender) return null;
  const base = 1.2 * bmi + 0.23 * age - 5.4;
  return +(gender === 'female' ? base : base - 10.8).toFixed(1);
};

const reminderText = ({ bmi, targetWeight, weight, weeklyTarget }) => {
  if (!bmi || !weight) return '填写资料后即可获得个性化提示。';
  if (bmi >= 28) return 'BMI 偏高，建议增加低冲击有氧与饮食控制，关注血压血糖。';
  if (bmi < 18.5) return 'BMI 偏低，建议增加蛋白质摄入与力量训练，确保摄入足够热量。';
  if (targetWeight) {
    const diff = +(weight - targetWeight).toFixed(1);
    if (Math.abs(diff) < 0.5) return '已接近目标体重，保持当前节奏并注意恢复。';
    const pace = weeklyTarget ? `${weeklyTarget}kg/周` : '合理的周度计划';
    return diff > 0
      ? `距离目标还需减 ${diff}kg，建议按照 ${pace} 控制节奏。`
      : `距离目标还需增 ${Math.abs(diff)}kg，注意蛋白补给与训练强度。`;
  }
  return '状态稳定，可根据课程计划安排训练与营养。';
};

export const profileModule = (() => {
  const form = document.getElementById('profile-form');
  const bmiValueNodes = document.querySelectorAll('[data-bind="bmiValue"]');
  const bmiStatusNodes = document.querySelectorAll('[data-bind="bmiStatus"]');
  const bodyFatNodes = document.querySelectorAll('[data-bind="bodyFat"]');
  const reminderNode = document.querySelector('[data-bind="reminder"]');
  const guardWrapper = document.querySelector('[data-guard="profile"]');
  const historyList = document.getElementById('history-list');
  const chartCanvas = document.getElementById('bmi-chart');

  let chartInstance = null;

  const updateMetrics = ({ height, weight, age, gender, targetWeight, weeklyTarget }) => {
    let bmi = null;
    if (!height || !weight) {
      bmiValueNodes.forEach((node) => (node.textContent = '--'));
      bmiStatusNodes.forEach((node) => (node.textContent = '--'));
      bodyFatNodes.forEach((node) => (node.textContent = '--'));
      reminderNode.textContent = '填写资料后即可获得个性化提示。';
      return null;
    }
    bmi = +(weight / Math.pow(height / 100, 2)).toFixed(2);
    bmiValueNodes.forEach((node) => (node.textContent = bmi));
    const status = bmiStatus(bmi);
    bmiStatusNodes.forEach((node) => (node.textContent = status));
    const fat = calcBodyFat(bmi, age, gender);
    bodyFatNodes.forEach((node) => (node.textContent = fat ? `${fat}%` : '--'));
    reminderNode.textContent = reminderText({ bmi, targetWeight, weight, weeklyTarget });
    return bmi;
  };

  const renderHistory = (history = []) => {
    if (!historyList) return;
    historyList.innerHTML = '';
    history
      .slice()
      .reverse()
      .forEach((item) => {
        const li = document.createElement('li');
        const date = new Date(item.date).toLocaleDateString();
        li.textContent = `${date} · ${item.weight}kg / BMI ${item.bmi}`;
        historyList.appendChild(li);
      });

    if (!chartCanvas) return;
    const labels = history.map((item) => new Date(item.date).toLocaleDateString());
    const data = history.map((item) => item.bmi);
    if (chartInstance) chartInstance.destroy();
    if (labels.length === 0) return;
    chartInstance = new Chart(chartCanvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'BMI',
            data,
            borderColor: '#33e0a1',
            backgroundColor: 'rgba(51, 224, 161, 0.2)',
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
      },
    });
  };

  const toggleGuard = (isAuthed) => {
    if (!guardWrapper || !form) return;
    const guard = guardWrapper.querySelector('.guard-message');
    const fields = form.querySelectorAll('input, select, textarea, button');
    fields.forEach((field) => (field.disabled = !isAuthed));
    guard.hidden = !!isAuthed;
  };

  const fillForm = (profile) => {
    if (!profile || !form) return;
    Object.entries(profile).forEach(([key, value]) => {
      if (form.elements[key]) {
        form.elements[key].value = value ?? '';
      }
    });
    updateMetrics(profile);
  };

  const init = () => {
    if (!form) return;
    const user = authService.currentUser();
    toggleGuard(!!user);
    if (user?.profile) {
      fillForm(user.profile);
      renderHistory(user.metricsHistory);
    }

    form.addEventListener('input', () => {
      const height = Number(form.elements.height.value);
      const weight = Number(form.elements.weight.value);
      const age = Number(form.elements.age.value);
      const gender = form.elements.gender.value;
      const targetWeight = Number(form.elements.targetWeight.value);
      const weeklyTarget = Number(form.elements.weeklyTarget.value);
      updateMetrics({ height, weight, age, gender, targetWeight, weeklyTarget });
    });

    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const formData = Object.fromEntries(new FormData(form));
      formData.height = Number(formData.height);
      formData.weight = Number(formData.weight);
      formData.targetWeight = formData.targetWeight ? Number(formData.targetWeight) : null;
      formData.weeklyTarget = formData.weeklyTarget ? Number(formData.weeklyTarget) : null;
      formData.age = formData.age ? Number(formData.age) : null;
      formData.frequency = formData.frequency ? Number(formData.frequency) : null;
      authService.updateProfile(authService.currentUser()?.id, formData);
      const userAfter = authService.currentUser();
      if (userAfter?.metricsHistory) renderHistory(userAfter.metricsHistory);
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = '资料已保存（本地）';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    });
  };

  return { init, fillForm, renderHistory };
})();
