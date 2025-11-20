/**
 * CustomSelect.js - 自定义下拉菜单组件
 * 用于替代原生 select 元素，提供更现代的 UI
 */

export class CustomSelect {
    constructor(selectElement) {
        this.select = selectElement;
        this.options = this.getOptions();
        this.container = null;
        this.trigger = null;
        this.dropdown = null;
        this.isOpen = false;

        this.init();
    }

    getOptions() {
        return Array.from(this.select.options).map(option => ({
            value: option.value,
            label: option.textContent,
            display: option.dataset.display || option.textContent,
            selected: option.selected
        }));
    }

    init() {
        // 隐藏原生 select
        this.select.style.display = 'none';

        // 创建自定义 UI
        this.createUI();

        // 绑定事件
        this.bindEvents();

        // 监听原生 select 变化（例如通过 JS 修改）
        this.select.addEventListener('change', () => {
            this.updateSelected();
        });
    }

    createUI() {
        // 容器
        this.container = document.createElement('div');
        this.container.className = 'custom-select-container';

        // 触发器（显示当前选中值）
        this.trigger = document.createElement('div');
        this.trigger.className = 'custom-select-trigger';
        this.updateTriggerText();

        // 下拉列表
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'custom-select-dropdown';

        this.options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'custom-select-option';
            item.textContent = option.label; // 下拉列表中显示完整 label
            item.dataset.value = option.value;

            if (option.selected) {
                item.classList.add('selected');
            }

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectValue(option.value);
            });

            this.dropdown.appendChild(item);
        });

        this.container.appendChild(this.trigger);
        this.container.appendChild(this.dropdown);

        // 插入到原生 select 后面
        this.select.parentNode.insertBefore(this.container, this.select.nextSibling);
    }

    updateTriggerText() {
        const selectedOption = this.options.find(opt => opt.value === this.select.value) || this.options[0];
        // 触发器显示 display 值（如果有）或 label
        this.trigger.textContent = selectedOption.display || selectedOption.label;

        if (this.select.value === '') {
            this.trigger.classList.add('placeholder');
        } else {
            this.trigger.classList.remove('placeholder');
        }
    }

    updateSelected() {
        // 更新内部状态
        this.options = this.getOptions();
        this.updateTriggerText();

        // 更新下拉列表的高亮状态
        const items = this.dropdown.querySelectorAll('.custom-select-option');
        items.forEach(item => {
            if (item.dataset.value === this.select.value) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    selectValue(value) {
        if (this.select.value === value) {
            this.close();
            return;
        }

        this.select.value = value;
        // 触发原生 change 事件
        this.select.dispatchEvent(new Event('change'));
        this.close();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.container.classList.add('open');
        this.isOpen = true;

        // 点击外部关闭
        document.addEventListener('click', this.handleOutsideClick);
    }

    close() {
        this.container.classList.remove('open');
        this.isOpen = false;

        document.removeEventListener('click', this.handleOutsideClick);
    }

    handleOutsideClick = (e) => {
        if (!this.container.contains(e.target)) {
            this.close();
        }
    };

    bindEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
    }
}
