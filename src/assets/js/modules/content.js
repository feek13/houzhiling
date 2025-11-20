const faqItems = [
  {
    question: '训练前需要热身多久？',
    answer: '建议至少 5-10 分钟，包含关节活动与轻度有氧，帮助提升体温与心率。',
  },
  {
    question: '什么时候补充蛋白质效果更好？',
    answer: '力量训练前后 30 分钟内补充优质蛋白可以帮助修复肌肉，同时注意全天均衡摄入。',
  },
  {
    question: '如何避免训练受伤？',
    answer: '遵循循序渐进原则，保持动作标准，训练前后做好热身与放松，如有慢性伤病请咨询医生。',
  },
];

const messages = [
  { title: '系统提醒', content: '周计划已生成，周三为休息日。' },
  { title: '营养建议', content: '今日蛋白摄入偏低，可适当补充一份蛋白奶昔。' },
];

export const contentModule = (() => {
  const faqList = document.getElementById('faq-list');
  const coachForm = document.getElementById('coach-form');
  const coachFeedback = document.getElementById('coach-feedback');
  const aiInput = document.getElementById('ai-input');
  const aiOutput = document.getElementById('ai-output');
  const aiBtn = document.getElementById('ai-generate');
  const messageCenter = document.getElementById('message-center');

  const renderFAQ = () => {
    if (!faqList) return;
    faqList.innerHTML = faqItems
      .map(
        (item, index) => `
        <div class="accordion-item">
          <button class="accordion-trigger" data-index="${index}">${item.question}</button>
          <div class="accordion-panel">${item.answer}</div>
        </div>
      `
      )
      .join('');
    faqList.addEventListener('click', (evt) => {
      if (evt.target.classList.contains('accordion-trigger')) {
        const panel = evt.target.nextElementSibling;
        panel.classList.toggle('open');
      }
    });
  };

  const renderMessages = () => {
    if (!messageCenter) return;
    messageCenter.innerHTML = messages
      .map(
        (item) => `
        <li>
          <strong>${item.title}</strong>
          <p>${item.content}</p>
        </li>
      `
      )
      .join('');
  };

  const generateAI = () => {
    const question = aiInput.value.trim();
    if (!question) {
      aiOutput.textContent = '请输入问题，例如“想增肌每周练几次？”';
      return;
    }
    const part1 = question.includes('增肌')
      ? '每周 4-5 次力量训练，并保证足够蛋白与睡眠。'
      : '维持力量与心肺的均衡训练。';
    const part2 = question.includes('减脂')
      ? '结合 HIIT 和中低强度有氧，控制热量赤字。'
      : '保持每周至少 150 分钟中等强度运动。';
    const suggestion = `根据 ACSM 指南：${part1}${part2}`;
    aiOutput.textContent = suggestion;
  };

  const init = () => {
    renderFAQ();
    renderMessages();
    coachForm?.addEventListener('submit', (evt) => {
      evt.preventDefault();
      coachFeedback.textContent = '收到预约，我们会在 24 小时内联系你。';
      coachForm.reset();
    });
    aiBtn?.addEventListener('click', generateAI);
  };

  return { init };
})();
