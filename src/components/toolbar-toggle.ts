export class ToolbarToggle {
  private collapsed = false;

  constructor() {
    const btn = document.getElementById("btn-toggle-toolbar");
    if (!btn) return;

    btn.addEventListener("click", () => this.toggle(btn));

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        this.toggle(btn);
      }
    });
  }

  private toggle(btn: HTMLElement): void {
    this.collapsed = !this.collapsed;
    document.getElementById("app")?.classList.toggle("toolbar-collapsed", this.collapsed);
    btn.textContent = this.collapsed ? "▲" : "▼";
    btn.title = this.collapsed ? "Mostrar barra de herramientas" : "Ocultar barra de herramientas";
  }

  isCollapsed(): boolean {
    return this.collapsed;
  }

  expand(): void {
    if (!this.collapsed) return;
    this.collapsed = false;
    document.getElementById("app")?.classList.remove("toolbar-collapsed");
    const btn = document.getElementById("btn-toggle-toolbar");
    if (btn) {
      btn.textContent = "▼";
      btn.title = "Ocultar barra de herramientas";
    }
  }
}
