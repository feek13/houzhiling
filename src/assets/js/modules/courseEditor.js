/**
 * courseEditor.js - 课程编辑模块
 * 提供课程编辑表单功能
 */

import { workoutService } from '../services/workoutService.js';
import { authService } from '../services/authService.js';
import { modal } from './modal.js';
import { notificationService } from '../services/notificationService.js';
import { CustomSelect } from '../components/CustomSelect.js';

export const courseEditor = (() => {
  let currentWorkout = null; // 当前正在编辑的课程

  /**
   * 创建标签元素
   */
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

  /**
   * 创建表单组
   */
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

  /**
   * 创建下拉选择组
   */
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

  /**
   * 创建编辑表单
   */
  const createForm = (workout) => {
    currentWorkout = workout;

    const container = document.createElement('div');
    container.className = 'course-creator';

    // 标题
    const header = document.createElement('div');
    header.className = 'course-creator-header';
    const title = document.createElement('h2');
    title.textContent = '编辑课程';
    header.appendChild(title);
    container.appendChild(header);

    // 表单
    const form = document.createElement('form');
    form.id = 'course-edit-form';
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
    submitBtn.textContent = '✓ 保存修改';
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
    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
      new CustomSelect(select);
    });

    // 填充表单数据
    populateForm(form, workout);

    // 绑定表单提交事件
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(form);
    });

    return container;
  };

  /**
   * 填充表单数据
   */
  const populateForm = (form, workout) => {
    // 基本字段
    form.querySelector('#title').value = workout.title || '';
    form.querySelector('#description').value = workout.description || '';

    // 设置下拉框
    const setSelectValue = (id, value) => {
      const select = form.querySelector(`#${id}`);
      if (select && value) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      }
    };

    setSelectValue('muscle', workout.muscleKey);
    setSelectValue('level', workout.levelKey);
    setSelectValue('equipment', workout.equipmentKey);
    setSelectValue('duration', workout.durationKey);
    setSelectValue('goal', workout.goalFocus);

    // 设置步骤
    if (workout.steps && Array.isArray(workout.steps)) {
      form.querySelector('#steps').value = workout.steps
        .map((step, i) => `${i + 1}. ${step}`)
        .join('\n');
    }

    // 设置风险提示
    if (workout.risks) {
      form.querySelector('#risks').value = workout.risks;
    }

    // 设置标签
    if (workout.tags && Array.isArray(workout.tags)) {
      form.querySelector('#tags').value = workout.tags.join(', ');
    }
  };

  /**
   * 处理表单提交
   */
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

      // 构建更新数据
      const updateData = {
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
        tags: tags
      };

      // 调用服务更新课程
      const updatedWorkout = workoutService.updateWorkout(currentWorkout.id, updateData);

      // 关闭模态框
      modal.close();

      // 显示成功消息
      notificationService.alert({
        title: '保存成功',
        message: `课程 "${updatedWorkout.title}" 已成功更新！`,
        type: 'success'
      });

    } catch (error) {
      notificationService.error(`保存失败：${error.message}`);
      console.error('课程更新失败:', error);
    }
  };

  /**
   * 打开编辑器
   */
  const open = (workout) => {
    const currentUser = authService.currentUser();
    if (!currentUser) {
      notificationService.warning('请先登录');
      return;
    }

    // 检查权限
    if (!workoutService.canEdit(workout)) {
      notificationService.error('您没有权限编辑此课程');
      return;
    }

    modal.open(() => createForm(workout));
  };

  return {
    open
  };
})();
