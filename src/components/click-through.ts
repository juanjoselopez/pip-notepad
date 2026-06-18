export class ClickThrough {
  private active: boolean = false;
  private buttonEl: HTMLElement;
  private listeners: Array<(active: boolean) => void> = [];
  private overlay: HTMLElement | null;

  constructor() {
    const btn = document.getElementById("btn-clickthrough");
    if (!btn) throw new Error("Click-through button not found");
    this.buttonEl = btn;
    this.overlay = document.getElementById("click-through-overlay");

    btn.addEventListener("click", () => this.toggle());

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (this.active) this.toggle();
      }
    });
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
    this.buttonEl.classList.toggle("active", active);
    document.getElementById("app")?.classList.toggle("click-through", active);
    const indicator = document.getElementById("ct-indicator");
    if (indicator) {
      indicator.classList.toggle("active", active);
    }
    this.buttonEl.title = active ? "Desactivar modo click-through" : "Activar modo click-through";
    if (this.overlay) {
      this.overlay.classList.toggle("hidden", !active);
    }
  }

  toggle(): boolean {
    this.setActive(!this.active);
    this.listeners.forEach((fn) => fn(this.active));
    return this.active;
  }

  onChange(fn: (active: boolean) => void): void {
    this.listeners.push(fn);
  }
}
