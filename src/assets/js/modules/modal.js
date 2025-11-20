export const modal = (() => {
  const modalEl = document.getElementById('auth-modal');
  if (!modalEl) return {};

  const open = (content) => {
    const mount = modalEl.querySelector('#auth-modal-content');
    if (mount && typeof content === 'function') {
      mount.innerHTML = '';
      mount.appendChild(content());
    } else if (mount && content instanceof HTMLElement) {
      mount.innerHTML = '';
      mount.appendChild(content);
    }
    modalEl.setAttribute('aria-hidden', 'false');
  };

  const close = () => modalEl.setAttribute('aria-hidden', 'true');

  modalEl.addEventListener('click', (evt) => {
    if (evt.target.dataset.close !== undefined || evt.target === modalEl) {
      close();
    }
  });

  return { open, close };
})();
