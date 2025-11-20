import { storage } from '../services/storage.js';
import { modal } from './modal.js';

const NUTRITION_KEY = 'nutrition';

const templates = [
  { label: '鸡胸 + 糙米', meal: 'lunch', calories: 520, protein: 45, carbs: 50, fat: 12 },
  { label: '牛油果酸奶碗', meal: 'breakfast', calories: 360, protein: 20, carbs: 30, fat: 18 },
  { label: '训练后蛋白瓶', meal: 'snack', calories: 220, protein: 30, carbs: 12, fat: 5 },
];

export const nutritionModule = (() => {
  const form = document.getElementById('nutrition-form');
  const logContainer = document.getElementById('nutrition-log');
  const templateWrapper = document.getElementById('nutrition-templates');
  const summaryBox = document.getElementById('macro-summary');
  const scanBtn = document.getElementById('scan-btn');

  const renderLog = () => {
    if (!logContainer) return;
    const logs = storage.get(NUTRITION_KEY, []);
    logContainer.innerHTML = '';
    logs.slice(-5).reverse().forEach((item) => {
      const row = document.createElement('div');
      row.className = 'log-item';
      row.innerHTML = `
        <button class="delete-btn" data-id="${item.id}" aria-label="删除此记录" title="删除">×</button>
        <div>
          <strong>${item.mealLabel}</strong>
          <p>${item.note || '无备注'}</p>
        </div>
        <div>
          ${item.calories} kcal
          <p class="muted">P${item.protein || 0} / C${item.carbs || 0} / F${item.fat || 0}</p>
        </div>
      `;
      logContainer.appendChild(row);
    });

    // 为删除按钮添加事件监听
    logContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const itemData = logs.find(log => log.id === id);
        showDeleteConfirmation(id, itemData);
      });
    });

    renderSummary(logs);
  };

  const showDeleteConfirmation = (id, itemData) => {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'delete-confirmation';
    confirmDialog.innerHTML = `
      <div class="delete-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
        </svg>
      </div>
      <h3>确认删除</h3>
      <p class="delete-item-info">${itemData.mealLabel} - ${itemData.calories} kcal</p>
      <p class="delete-warning">删除后无法恢复，确定要删除这条营养记录吗？</p>
      <div class="delete-actions">
        <button class="btn ghost" data-close>取消</button>
        <button class="btn danger" id="confirm-delete-btn">确定删除</button>
      </div>
    `;

    // 绑定确认删除事件
    const confirmBtn = confirmDialog.querySelector('#confirm-delete-btn');
    confirmBtn.addEventListener('click', () => {
      deleteEntry(id);
      modal.close();
    });

    modal.open(() => confirmDialog);
  };

  const renderSummary = (logs) => {
    if (!summaryBox) return;
    const total = logs.reduce(
      (acc, cur) => {
        acc.calories += cur.calories || 0;
        acc.protein += cur.protein || 0;
        acc.carbs += cur.carbs || 0;
        acc.fat += cur.fat || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    summaryBox.innerHTML = `
      <h4>今日统计</h4>
      <p>${total.calories} kcal</p>
      <p class="muted">蛋白 ${total.protein}g · 碳水 ${total.carbs}g · 脂肪 ${total.fat}g</p>
    `;
  };

  const addEntry = (entry) => {
    const logs = storage.get(NUTRITION_KEY, []);
    logs.push(entry);
    storage.set(NUTRITION_KEY, logs);
    renderLog();
  };

  const deleteEntry = (id) => {
    const logs = storage.get(NUTRITION_KEY, []);
    const filtered = logs.filter(item => item.id !== id);
    storage.set(NUTRITION_KEY, filtered);
    renderLog();
  };

  const renderTemplates = () => {
    if (!templateWrapper) return;
    templateWrapper.innerHTML = '';
    templates.forEach((tpl) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn ghost';
      btn.textContent = tpl.label;
      btn.addEventListener('click', () => {
        addEntry({
          id: crypto.randomUUID(),
          meal: tpl.meal,
          mealLabel: tpl.label,
          calories: tpl.calories,
          protein: tpl.protein,
          carbs: tpl.carbs,
          fat: tpl.fat,
          note: '模板录入',
          createdAt: new Date().toISOString(),
        });
      });
      templateWrapper.appendChild(btn);
    });
  };

  const init = () => {
    if (!form) return;
    renderTemplates();
    renderLog();
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const entry = {
        id: crypto.randomUUID(),
        meal: data.meal,
        mealLabel: form.elements.meal.options[form.elements.meal.selectedIndex].textContent,
        calories: Number(data.calories),
        protein: Number(data.protein || 0),
        carbs: Number(data.carbs || 0),
        fat: Number(data.fat || 0),
        note: data.note,
        createdAt: new Date().toISOString(),
      };
      addEntry(entry);
      form.reset();
    });
    scanBtn?.addEventListener('click', () => {
      const div = document.createElement('div');
      div.innerHTML = '<h3>扫码录入</h3><p>接入摄像头或条码 API 后，可自动读取营养信息。</p>';
      modal.open(() => div);
    });
  };

  return { init };
})();
