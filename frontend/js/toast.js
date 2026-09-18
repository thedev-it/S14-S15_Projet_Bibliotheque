const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
    }
  },

  show(message, type = "info", duration = 4000) {
    this.init();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    `;

    // Gestion du bouton de fermeture
    toast.querySelector(".toast-close").addEventListener("click", () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Animation d'entrée
    setTimeout(() => toast.classList.add("show"), 10);

    // Suppression automatique
    setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  },

  dismiss(toast) {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => {
      if (toast.parentElement) {
        toast.remove();
      }
    });
  },

  // Helpers rapides
  success(message) {
    this.show(message, "success");
  },
  error(message) {
    this.show(message, "error");
  },
  info(message) {
    this.show(message, "info");
  },
  warning(message) {
    this.show(message, "warning");
  },
};
