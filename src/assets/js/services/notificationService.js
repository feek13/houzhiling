/**
 * Custom Notification Service
 * Provides beautiful UI alternatives to alert(), confirm(), and other native dialogs
 *
 * Usage:
 * - notificationService.alert({ title, message, type })
 * - notificationService.confirm({ title, message, onConfirm, onCancel })
 * - notificationService.toast({ message, type, duration })
 * - notificationService.success(message)
 * - notificationService.error(message)
 * - notificationService.warning(message)
 * - notificationService.info(message)
 */

export const notificationService = (() => {
  let modalContainer = null;
  let toastContainer = null;

  /**
   * Initialize containers
   */
  const init = () => {
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'notification-modal-container';
      modalContainer.className = 'notification-modal-container';
      document.body.appendChild(modalContainer);
    }

    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'notification-toast-container';
      toastContainer.className = 'notification-toast-container';
      document.body.appendChild(toastContainer);
    }
  };

  /**
   * Get icon SVG element for notification type
   */
  const createIcon = (type) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', `notification-icon notification-icon-${type}`);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    const paths = {
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      question: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    path.setAttribute('d', paths[type] || paths.info);
    svg.appendChild(path);

    return svg;
  };

  /**
   * Create modal backdrop
   */
  const createBackdrop = (onClick) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'notification-backdrop';
    if (onClick) {
      backdrop.addEventListener('click', onClick);
    }
    return backdrop;
  };

  /**
   * Show alert dialog
   */
  const alert = ({
    title = '提示',
    message,
    type = 'info',
    confirmText = '确定',
    onClose = null
  }) => {
    init();

    return new Promise((resolve) => {
      const backdrop = createBackdrop(() => {
        closeModal();
        if (onClose) onClose();
        resolve();
      });

      const modal = document.createElement('div');
      modal.className = 'notification-modal notification-modal-enter';

      const content = document.createElement('div');
      content.className = 'notification-modal-content';

      // Header
      const header = document.createElement('div');
      header.className = 'notification-modal-header';
      header.appendChild(createIcon(type));

      const titleEl = document.createElement('h3');
      titleEl.className = 'notification-modal-title';
      titleEl.textContent = title;
      header.appendChild(titleEl);

      // Body
      const body = document.createElement('div');
      body.className = 'notification-modal-body';

      const messageEl = document.createElement('p');
      messageEl.className = 'notification-modal-message';
      messageEl.textContent = message;
      body.appendChild(messageEl);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'notification-modal-footer';

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'notification-btn notification-btn-primary';
      confirmBtn.textContent = confirmText;
      confirmBtn.setAttribute('data-action', 'confirm');
      footer.appendChild(confirmBtn);

      content.appendChild(header);
      content.appendChild(body);
      content.appendChild(footer);
      modal.appendChild(content);

      const closeModal = () => {
        modal.classList.remove('notification-modal-enter');
        modal.classList.add('notification-modal-exit');
        backdrop.classList.add('notification-backdrop-exit');

        setTimeout(() => {
          modalContainer.innerHTML = '';
        }, 300);
      };

      confirmBtn.addEventListener('click', () => {
        closeModal();
        if (onClose) onClose();
        resolve();
      });

      modalContainer.appendChild(backdrop);
      modalContainer.appendChild(modal);

      // Trigger animation
      setTimeout(() => {
        modal.classList.add('notification-modal-enter-active');
      }, 10);
    });
  };

  /**
   * Show confirm dialog
   */
  const confirm = ({
    title = '确认',
    message,
    confirmText = '确定',
    cancelText = '取消',
    type = 'question',
    onConfirm = null,
    onCancel = null
  }) => {
    init();

    return new Promise((resolve) => {
      const backdrop = createBackdrop(() => {
        closeModal();
        if (onCancel) onCancel();
        resolve(false);
      });

      const modal = document.createElement('div');
      modal.className = 'notification-modal notification-modal-enter';

      const content = document.createElement('div');
      content.className = 'notification-modal-content';

      // Header
      const header = document.createElement('div');
      header.className = 'notification-modal-header';
      header.appendChild(createIcon(type));

      const titleEl = document.createElement('h3');
      titleEl.className = 'notification-modal-title';
      titleEl.textContent = title;
      header.appendChild(titleEl);

      // Body
      const body = document.createElement('div');
      body.className = 'notification-modal-body';

      const messageEl = document.createElement('p');
      messageEl.className = 'notification-modal-message';
      messageEl.textContent = message;
      body.appendChild(messageEl);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'notification-modal-footer';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'notification-btn notification-btn-secondary';
      cancelBtn.textContent = cancelText;
      cancelBtn.setAttribute('data-action', 'cancel');

      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'notification-btn notification-btn-primary';
      confirmBtn.textContent = confirmText;
      confirmBtn.setAttribute('data-action', 'confirm');

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      content.appendChild(header);
      content.appendChild(body);
      content.appendChild(footer);
      modal.appendChild(content);

      const closeModal = () => {
        modal.classList.remove('notification-modal-enter');
        modal.classList.add('notification-modal-exit');
        backdrop.classList.add('notification-backdrop-exit');

        setTimeout(() => {
          modalContainer.innerHTML = '';
        }, 300);
      };

      confirmBtn.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
        resolve(true);
      });

      cancelBtn.addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
        resolve(false);
      });

      modalContainer.appendChild(backdrop);
      modalContainer.appendChild(modal);

      // Trigger animation
      setTimeout(() => {
        modal.classList.add('notification-modal-enter-active');
      }, 10);
    });
  };

  /**
   * Show toast notification
   */
  const toast = ({
    message,
    type = 'info',
    duration = 3000
  }) => {
    init();

    const toast = document.createElement('div');
    toast.className = `notification-toast notification-toast-${type} notification-toast-enter`;

    toast.appendChild(createIcon(type));

    const messageEl = document.createElement('span');
    messageEl.className = 'notification-toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    toastContainer.appendChild(toast);

    // Trigger enter animation
    setTimeout(() => {
      toast.classList.add('notification-toast-enter-active');
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('notification-toast-enter-active');
      toast.classList.add('notification-toast-exit');

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);

    return toast;
  };

  /**
   * Shorthand methods
   */
  const success = (message, options = {}) => {
    if (typeof options === 'object' && !options.useModal) {
      return toast({ message, type: 'success', ...options });
    }
    return alert({ title: '成功', message, type: 'success', ...options });
  };

  const error = (message, options = {}) => {
    if (typeof options === 'object' && !options.useModal) {
      return toast({ message, type: 'error', ...options });
    }
    return alert({ title: '错误', message, type: 'error', ...options });
  };

  const warning = (message, options = {}) => {
    if (typeof options === 'object' && !options.useModal) {
      return toast({ message, type: 'warning', ...options });
    }
    return alert({ title: '警告', message, type: 'warning', ...options });
  };

  const info = (message, options = {}) => {
    if (typeof options === 'object' && !options.useModal) {
      return toast({ message, type: 'info', ...options });
    }
    return alert({ title: '提示', message, type: 'info', ...options });
  };

  return {
    init,
    alert,
    confirm,
    toast,
    success,
    error,
    warning,
    info
  };
})();
