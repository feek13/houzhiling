/**
 * 数据导出工具
 */

import { storage } from '../services/storage.js';
import { modal } from '../modules/modal.js';
import { notificationService } from '../services/notificationService.js';

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  let csv = headers.join(',') + '\n';
  data.forEach(row => {
    const values = headers.map(h => {
      let val = row[h];
      if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
      return val ?? '';
    });
    csv += values.join(',') + '\n';
  });
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};

const exportToJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
};

export const exporter = {
  openExportModal: () => {
    const modalContent = `
      <div class="export-modal">
        <h2>导出数据</h2>
        <p>选择要导出的数据类型和格式</p>
        <div class="export-options">
          <button class="btn primary" onclick="window.exporterActions.exportAllData('json')">导出全部数据 (JSON)</button>
          <button class="btn primary" onclick="window.exporterActions.exportAllData('csv')">导出全部数据 (CSV)</button>
          <button class="btn ghost" onclick="window.exporterActions.exportWorkouts()">导出训练记录</button>
          <button class="btn ghost" onclick="window.exporterActions.exportNutrition()">导出营养记录</button>
          <button class="btn ghost" onclick="window.exporterActions.exportMetrics()">导出体重记录</button>
        </div>
      </div>
    `;
    modal.open(modalContent);
  }
};

window.exporterActions = {
  exportAllData: (format) => {
    const allData = {
      users: storage.get('users', []),
      workouts: storage.get('workouts', []),
      nutrition: storage.get('nutrition_log', []),
      metrics: storage.get('metrics_history', []),
      friends: storage.get('user_friends', []),
      forumTopics: storage.get('forum_topics', []),
      userPoints: storage.get('user_points', {})
    };
    if (format === 'json') {
      exportToJSON(allData, `fitspark-backup-${Date.now()}.json`);
    } else {
      notificationService.warning('CSV格式仅支持单个数据表导出，请使用JSON导出全部数据');
    }
    modal.close();
  },
  exportWorkouts: () => {
    const workouts = storage.get('workouts', []);
    exportToJSON(workouts, `workouts-${Date.now()}.json`);
    modal.close();
  },
  exportNutrition: () => {
    const nutrition = storage.get('nutrition_log', []);
    exportToJSON(nutrition, `nutrition-${Date.now()}.json`);
    modal.close();
  },
  exportMetrics: () => {
    const metrics = storage.get('metrics_history', []);
    exportToJSON(metrics, `metrics-${Date.now()}.json`);
    modal.close();
  }
};
