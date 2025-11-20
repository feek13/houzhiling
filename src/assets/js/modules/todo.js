import { roadmapItems } from '../data/todos.js';

const statusLabels = {
  done: '已完成',
  progress: '进行中',
  pending: '待规划',
};

export const todoModule = (() => {
  const list = document.getElementById('todo-list');

  const render = () => {
    if (!list) return;
    list.innerHTML = '';
    roadmapItems.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'todo-item';

      const tasks = (item.tasks || [])
        .map(
          (task) => `
            <li class="task-item">
              <span class="task-status ${task.done ? 'completed' : ''}"></span>
              <span>${task.label}</span>
            </li>
          `
        )
        .join('');

      li.innerHTML = `
        <header>
          <h3>${item.title}</h3>
          <span class="badge ${item.status === 'done' ? 'done' : ''}">${
            statusLabels[item.status]
          }</span>
        </header>
        <p>${item.description}</p>
        <ul class="task-list">${tasks}</ul>
      `;
      list.appendChild(li);
    });
  };

  return { render };
})();
