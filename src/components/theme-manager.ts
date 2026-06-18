export type Theme = "dark" | "light";

export class ThemeManager {
  private currentTheme: Theme = "dark";
  private buttonEl: HTMLElement;
  private listeners: Array<(theme: Theme) => void> = [];

  constructor() {
    const btn = document.getElementById("btn-theme");
    if (!btn) throw new Error("Theme button not found");
    this.buttonEl = btn;
    btn.addEventListener("click", () => this.toggle());
  }

  getTheme(): Theme {
    return this.currentTheme;
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    document.body.classList.toggle("light-theme", theme === "light");
    this.buttonEl.textContent = theme === "dark" ? "☾" : "☀";
    this.buttonEl.title = theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  }

  toggle(): Theme {
    const next: Theme = this.currentTheme === "dark" ? "light" : "dark";
    this.setTheme(next);
    this.listeners.forEach((fn) => fn(next));
    return next;
  }

  onChange(fn: (theme: Theme) => void): void {
    this.listeners.push(fn);
  }
}
