/**
 * courseCreator.js - 课程创建模块
 * 提供课程创建表单和模板功能
 */

import { workoutService } from '../services/workoutService.js';
import { authService } from '../services/authService.js';
import { modal } from './modal.js';
import { notificationService } from '../services/notificationService.js';
import { CustomSelect } from '../components/CustomSelect.js';

export const courseCreator = (() => {
  // ... (templates array remains unchanged)
  const templates = [
    {
      name: '胸部增肌训练',
      title: '胸肌雕刻：卧推进阶',
      description: '针对胸大肌的全方位训练，包含平板、上斜、下斜多角度刺激，适合有一定基础的训练者。',
      muscleKey: 'chest',
      muscle: '胸部',
      levelKey: 'medium',
      level: '中级',
      equipmentKey: 'barbell',
      equipment: '杠铃',
      durationKey: 'medium',
      duration: '30分钟',
      goalFocus: 'muscle_gain',
      steps: [
        '热身：5分钟动态拉伸和轻重量飞鸟',
        '平板杠铃卧推：4组 × 8-10次',
        '上斜哑铃卧推：3组 × 10-12次',
        '龙门架夹胸：3组 × 12-15次',
        '俯卧撑（负重/标准）：3组 × 力竭',
        '拉伸放松：5分钟胸部和肩部拉伸'
      ],
      risks: '注意保护肩关节，避免过度后伸；保持核心稳定，避免腰部过度拱起。',
      tags: ['增肌', '胸部', '杠铃']
    },
    {
      name: '背部力量训练',
      title: '背阔肌强化：引体向上专项',
      description: '以引体向上为核心的背部训练计划，增强背阔肌力量和厚度，打造V型身材。',
      muscleKey: 'back',
      muscle: '背部',
      levelKey: 'hard',
      level: '高阶',
      equipmentKey: 'bodyweight',
      equipment: '自重',
      durationKey: 'medium',
      duration: '35分钟',
      goalFocus: 'muscle_gain',
      steps: [
        '热身：5分钟肩部环绕和悬吊放松',
        '正握引体向上：5组 × 最大次数',
        '反握引体向上：3组 × 最大次数',
        '澳式引体（低杠）：3组 × 12-15次',
        '悬垂举腿（核心辅助）：3组 × 10次',
        '背部拉伸和筋膜放松：5分钟'
      ],
      risks: '初学者建议使用弹力带辅助；避免耸肩，保持肩胛骨下沉和后缩。',
      tags: ['力量', '背部', '自重']
    },
    {
      name: '下肢综合训练',
      title: '腿部爆发力：深蹲冲刺',
      description: '结合深蹲和爆发性动作的下肢训练，提升腿部力量和运动表现。',
      muscleKey: 'legs',
      muscle: '下肢',
      levelKey: 'medium',
      level: '中级',
      equipmentKey: 'barbell',
      equipment: '杠铃',
      durationKey: 'long',
      duration: '40分钟',
      goalFocus: 'muscle_gain',
      steps: [
        '热身：10分钟动态拉伸和空蹲',
        '杠铃深蹲：4组 × 6-8次（大重量）',
        '保加利亚分腿蹲：3组 × 每侧10次',
        '箱式跳跃：3组 × 8次',
        '单腿硬拉：3组 × 每侧12次',
        '腿部拉伸和泡沫轴放松：10分钟'
      ],
      risks: '深蹲时保持膝盖与脚尖方向一致；爆发性动作注意落地缓冲。',
      tags: ['力量', '下肢', '爆发力']
    },
    {
      name: '核心稳定性训练',
      title: '腹肌雕刻：平板支撑进阶',
      description: '全方位核心训练，包含静态和动态动作，增强核心稳定性和腹肌线条。',
      muscleKey: 'core',
      muscle: '核心',
      levelKey: 'easy',
      level: '入门',
      equipmentKey: 'bodyweight',
      equipment: '自重',
      durationKey: 'short',
      duration: '20分钟',
      goalFocus: 'keep_fit',
      steps: [
        '热身：3分钟猫式和鸟狗式',
        '标准平板支撑：3组 × 45-60秒',
        '侧平板支撑：3组 × 每侧30秒',
        '俄罗斯转体：3组 × 20次',
        '卷腹：3组 × 15-20次',
        '死虫式：3组 × 每侧10次',
        '拉伸：3分钟躯干拉伸'
      ],
      risks: '平板支撑时避免塌腰或臀部过高；保持呼吸顺畅。',
      tags: ['核心', '自重', '入门']
    },
    {
      name: '全身减脂训练',
      title: 'HIIT燃脂：波比跳挑战',
      description: '高强度间歇训练，快速燃烧卡路里，提升心肺功能和全身代谢。',
      muscleKey: 'full',
      muscle: '全身',
      levelKey: 'medium',
      level: '中级',
      equipmentKey: 'bodyweight',
      equipment: '自重',
      durationKey: 'short',
      duration: '20分钟',
      goalFocus: 'fat_loss',
      steps: [
        '热身：5分钟开合跳和原地高抬腿',
        '波比跳：30秒 × 4组（组间休息30秒）',
        '登山跑：30秒 × 4组（组间休息30秒）',
        '深蹲跳：30秒 × 4组（组间休息30秒）',
        '平板开合跳：30秒 × 4组（组间休息30秒）',
        '拉伸放松：5分钟全身拉伸'
      ],
      risks: '注意心率监控，如有不适立即停止；初学者可降低强度或延长休息时间。',
      tags: ['减脂', 'HIIT', '全身']
    },
    {
      name: '哑铃入门训练',
      title: '哑铃基础：全身协调',
      description: '适合初学者的哑铃训练计划，覆盖全身主要肌群，建立基础力量。',
      muscleKey: 'full',
      muscle: '全身',
      levelKey: 'easy',
      level: '入门',
      equipmentKey: 'dumbbell',
      equipment: '哑铃',
      durationKey: 'medium',
      duration: '30分钟',
      goalFocus: 'keep_fit',
      steps: [
        '热身：5分钟关节活动和轻重量练习',
        '哑铃深蹲：3组 × 12次',
        '哑铃卧推：3组 × 10次',
        '哑铃划船：3组 × 每侧12次',
        '哑铃肩推：3组 × 10次',
        '哑铃弯举：3组 × 12次',
        '拉伸：5分钟全身拉伸'
      ],
      risks: '选择合适重量，宁轻勿重；保持动作规范，避免代偿。',
      tags: ['入门', '哑铃', '全身']
    }
  ];

  // ... (createLabel, getTemplates remain unchanged)
  const createLabel = (text, required, htmlFor) => {
    const label = document.createElement('label');
    if (htmlFor) label.htmlFor = htmlFor;
    label.textContent = text;

    if (required) {
      const span = document.createElement('span');
      span.className = 'required';
      span.textContent = ' *';
      label.appendChild(span);
    }

    return label;
  };

  const getTemplates = () => templates;

  /**
   * 创建表单元素
   */
  const createForm = () => {
    const container = document.createElement('div');
    container.className = 'course-creator';

    // 标题
    const header = document.createElement('div');
    header.className = 'course-creator-header';
    const title = document.createElement('h2');
    title.textContent = '发布新课程';
    header.appendChild(title);
    container.appendChild(header);

    // 模板选择区域
    const templateSection = document.createElement('div');
    templateSection.className = 'template-section';

    const templateLabel = document.createElement('label');
    templateLabel.textContent = '📋 快速开始：选择模板';
    templateSection.appendChild(templateLabel);

    const templateSelect = document.createElement('select');
    templateSelect.id = 'template-select';
    templateSelect.className = 'form-control';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '自定义课程（不使用模板）';
    templateSelect.appendChild(defaultOption);

    templates.forEach((template, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = template.name;
      templateSelect.appendChild(option);
    });

    templateSection.appendChild(templateSelect);

    const templateHint = document.createElement('p');
    templateHint.className = 'form-hint';
    templateHint.textContent = '选择模板后可以修改所有字段';
    templateSection.appendChild(templateHint);

    container.appendChild(templateSection);

    // 表单
    const form = document.createElement('form');
    form.id = 'course-form';
    form.className = 'course-form';

    // 课程标题
    const titleGroup = createFormGroup(
      'title',
      '课程标题',
      'text',
      '例如：胸肌雕刻：卧推进阶',
      true,
      '3-50个字符'
    );
    form.appendChild(titleGroup);

    // 课程描述
    const descGroup = createFormGroup(
      'description',
      '课程描述',
      'textarea',
      '描述课程目标、适用人群等...',
      true,
      '10-500个字符'
    );
    form.appendChild(descGroup);

    // 训练部位
    const muscleGroup = createSelectGroup(
      'muscle',
      '训练部位',
      [
        { value: '', label: '请选择训练部位' },
        { value: 'chest', label: '胸部', display: '胸部' },
        { value: 'back', label: '背部', display: '背部' },
        { value: 'legs', label: '下肢', display: '下肢' },
        { value: 'core', label: '核心', display: '核心' },
        { value: 'full', label: '全身', display: '全身' }
      ],
      true
    );
    form.appendChild(muscleGroup);

    // 难度等级
    const levelGroup = createSelectGroup(
      'level',
      '难度等级',
      [
        { value: '', label: '请选择难度等级' },
        { value: 'easy', label: '入门', display: '入门' },
        { value: 'medium', label: '中级', display: '中级' },
        { value: 'hard', label: '高阶', display: '高阶' }
      ],
      true
    );
    form.appendChild(levelGroup);

    // 器械类型
    const equipmentGroup = createSelectGroup(
      'equipment',
      '器械类型',
      [
        { value: '', label: '请选择器械类型' },
        { value: 'bodyweight', label: '自重', display: '自重' },
        { value: 'dumbbell', label: '哑铃', display: '哑铃' },
        { value: 'barbell', label: '杠铃', display: '杠铃' },
        { value: 'machine', label: '器械', display: '器械' }
      ],
      true
    );
    form.appendChild(equipmentGroup);

    // 训练时长
    const durationGroup = createSelectGroup(
      'duration',
      '训练时长',
      [
        { value: '', label: '请选择训练时长' },
        { value: 'short', label: '15-20分钟', display: '15-20分钟' },
        { value: 'medium', label: '25-35分钟', display: '30分钟' },
        { value: 'long', label: '35分钟以上', display: '40分钟' }
      ],
      true
    );
    form.appendChild(durationGroup);

    // 训练目标
    const goalGroup = createSelectGroup(
      'goal',
      '训练目标',
      [
        { value: '', label: '请选择训练目标' },
        { value: 'fat_loss', label: '减脂', display: '减脂' },
        { value: 'muscle_gain', label: '增肌', display: '增肌' },
        { value: 'keep_fit', label: '综合提升', display: '综合提升' }
      ],
      true
    );
    form.appendChild(goalGroup);

    // 训练步骤
    const stepsGroup = document.createElement('div');
    stepsGroup.className = 'form-group';

    const stepsLabel = createLabel('训练步骤', true, 'steps');
    stepsGroup.appendChild(stepsLabel);

    const stepsHint = document.createElement('p');
    stepsHint.className = 'form-hint';
    stepsHint.textContent = '每行一个步骤，至少2个步骤';
    stepsGroup.appendChild(stepsHint);

    const stepsTextarea = document.createElement('textarea');
    stepsTextarea.id = 'steps';
    stepsTextarea.name = 'steps';
    stepsTextarea.className = 'form-control';
    stepsTextarea.rows = 8;
    stepsTextarea.placeholder = '例如：\n1. 热身：5分钟动态拉伸\n2. 深蹲：4组 × 10次\n3. 卧推：4组 × 8次\n...';
    stepsTextarea.required = true;
    stepsGroup.appendChild(stepsTextarea);

    form.appendChild(stepsGroup);

    // 风险提示（可选）
    const risksGroup = createFormGroup(
      'risks',
      '风险提示（可选）',
      'textarea',
      '例如：注意保护膝盖，避免过度负重...',
      false
    );
    form.appendChild(risksGroup);

    // 标签（可选）
    const tagsGroup = createFormGroup(
      'tags',
      '标签（可选）',
      'text',
      '用逗号分隔，例如：增肌,胸部,杠铃',
      false,
      '便于搜索和分类'
    );
    form.appendChild(tagsGroup);

    // 按钮组
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'form-buttons';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn primary';
    submitBtn.textContent = '✓ 发布课程';
    buttonGroup.appendChild(submitBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn secondary';
    cancelBtn.textContent = '✕ 取消';
    cancelBtn.addEventListener('click', () => modal.close());
    buttonGroup.appendChild(cancelBtn);

    form.appendChild(buttonGroup);

    container.appendChild(form);

    // 初始化自定义下拉菜单
    // 注意：必须在元素添加到 DOM 后初始化，或者直接初始化
    // 这里我们直接初始化，因为 CustomSelect 会修改 DOM
    new CustomSelect(templateSelect);

    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
      new CustomSelect(select);
    });

    // 绑定事件
    bindFormEvents(container);

    return container;
  };

  // ... (createFormGroup, createSelectGroup, bindFormEvents remain unchanged)
  const createFormGroup = (name, label, type, placeholder, required, hint) => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = createLabel(label, required, name);
    group.appendChild(labelEl);

    if (hint) {
      const hintEl = document.createElement('p');
      hintEl.className = 'form-hint';
      hintEl.textContent = hint;
      group.appendChild(hintEl);
    }

    let input;
    if (type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 4;
    } else {
      input = document.createElement('input');
      input.type = type;
    }

    input.id = name;
    input.name = name;
    input.className = 'form-control';
    input.placeholder = placeholder;
    if (required) input.required = true;

    group.appendChild(input);

    return group;
  };

  const createSelectGroup = (name, label, options, required) => {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = createLabel(label, required, name);
    group.appendChild(labelEl);

    const select = document.createElement('select');
    select.id = name;
    select.name = name;
    select.className = 'form-control';
    if (required) select.required = true;

    // 存储显示值到dataset
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.display) {
        option.dataset.display = opt.display;
      }
      select.appendChild(option);
    });

    group.appendChild(select);

    return group;
  };

  const bindFormEvents = (container) => {
    const form = container.querySelector('#course-form');
    const templateSelect = container.querySelector('#template-select');

    // 模板选择
    templateSelect?.addEventListener('change', (e) => {
      const index = e.target.value;
      if (index !== '') {
        applyTemplate(form, templates[index]);
      }
    });

    // 表单提交
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(form);
    });
  };

  /**
   * 应用模板到表单
   */
  const applyTemplate = (form, template) => {
    form.querySelector('#title').value = template.title;
    form.querySelector('#description').value = template.description;

    // 设置下拉框
    // 注意：CustomSelect 监听了 change 事件，所以直接修改 value 并触发 change 事件即可同步 UI
    const setSelectValue = (id, value) => {
      const select = form.querySelector(`#${id}`);
      if (select) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      }
    };

    setSelectValue('muscle', template.muscleKey);
    setSelectValue('level', template.levelKey);
    setSelectValue('equipment', template.equipmentKey);
    setSelectValue('duration', template.durationKey);
    setSelectValue('goal', template.goalFocus);

    // 设置步骤
    form.querySelector('#steps').value = template.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join('\n');

    // 设置风险提示
    if (template.risks) {
      form.querySelector('#risks').value = template.risks;
    }

    // 设置标签
    if (template.tags) {
      form.querySelector('#tags').value = template.tags.join(', ');
    }
  };

  // ... (handleSubmit, open remain unchanged)
  const handleSubmit = (form) => {
    try {
      const formData = new FormData(form);

      // 解析步骤
      const stepsText = formData.get('steps').trim();
      const steps = stepsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // 移除序号（1. 2. 等）
          return line.replace(/^\d+\.\s*/, '');
        });

      // 解析标签
      const tagsText = formData.get('tags') || '';
      const tags = tagsText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // 获取选中选项的显示文本
      const muscleSelect = form.querySelector('#muscle');
      const levelSelect = form.querySelector('#level');
      const equipmentSelect = form.querySelector('#equipment');
      const durationSelect = form.querySelector('#duration');

      const muscleOption = muscleSelect.options[muscleSelect.selectedIndex];
      const levelOption = levelSelect.options[levelSelect.selectedIndex];
      const equipmentOption = equipmentSelect.options[equipmentSelect.selectedIndex];
      const durationOption = durationSelect.options[durationSelect.selectedIndex];

      // 构建课程数据
      const courseData = {
        title: formData.get('title').trim(),
        description: formData.get('description').trim(),
        muscleKey: formData.get('muscle'),
        muscle: muscleOption.dataset.display || muscleOption.textContent,
        levelKey: formData.get('level'),
        level: levelOption.dataset.display || levelOption.textContent,
        equipmentKey: formData.get('equipment'),
        equipment: equipmentOption.dataset.display || equipmentOption.textContent,
        durationKey: formData.get('duration'),
        duration: durationOption.dataset.display || durationOption.textContent,
        goalFocus: formData.get('goal'),
        steps: steps,
        risks: formData.get('risks')?.trim() || '',
        tags: tags,
        status: 'published'
      };

      // 调用服务创建课程
      const workout = workoutService.createWorkout(courseData);

      // 关闭模态框
      modal.close();

      // 显示成功消息
      notificationService.alert({
        title: '发布成功',
        message: `课程 "${workout.title}" 已成功发布！\n\n您可以在"我的课程"中查看和管理。`,
        type: 'success'
      });

    } catch (error) {
      notificationService.error(`发布失败：${error.message}`);
      console.error('课程创建失败:', error);
    }
  };

  const open = () => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      notificationService.warning('请先登录后再发布课程');
      return;
    }

    modal.open(createForm);
  };

  return {
    open,
    getTemplates
  };
})();
